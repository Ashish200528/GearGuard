import os
import datetime
from flask import Flask, request, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy import text, func
from sqlalchemy.dialects.postgresql import ENUM
import jwt
from functools import wraps

# ==========================================
# 1. CONFIGURATION
# ==========================================
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database Config - Credentials: postgres/root, DB: GearGuard
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://postgres:root@localhost:5432/GearGuard')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'super-secret-key-change-this'

db = SQLAlchemy(app)

# ==========================================
# 2. DATABASE MODELS
# ==========================================

# Enums
request_type_enum = ENUM('corrective', 'preventive', name='maintenance_request_type', create_type=False)
kanban_state_enum = ENUM('normal', 'blocked', 'done', name='kanban_state', create_type=False)
priority_enum = ENUM('low', 'medium', 'high', 'critical', name='priority_level', create_type=False)
role_enum = ENUM('admin', 'technician', 'employee', name='user_role', create_type=False)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(role_enum, default='employee')
    company_id = db.Column(db.Integer)

class MaintenanceStage(db.Model):
    __tablename__ = 'maintenance_stages'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    sequence = db.Column(db.Integer, default=10)
    is_closed = db.Column(db.Boolean, default=False)
    is_scrap = db.Column(db.Boolean, default=False)
    company_id = db.Column(db.Integer) # Added to match SQL

class Equipment(db.Model):
    __tablename__ = 'equipment'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    serial_number = db.Column(db.String(150))
    category_id = db.Column(db.Integer)
    maintenance_team_id = db.Column(db.Integer)
    technician_user_id = db.Column(db.Integer)
    health_percentage = db.Column(db.Integer, default=100)
    location = db.Column(db.String(255))
    
    # Added fields to match SQL
    company_id = db.Column(db.Integer)
    department_id = db.Column(db.Integer)
    employee_id = db.Column(db.Integer)
    
    # Relationships
    requests = db.relationship('MaintenanceRequest', backref='equipment', lazy=True)

class MaintenanceRequest(db.Model):
    __tablename__ = 'maintenance_requests'
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    request_type = db.Column(request_type_enum, nullable=False)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'))
    maintenance_team_id = db.Column(db.Integer)
    technician_user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    stage_id = db.Column(db.Integer, db.ForeignKey('maintenance_stages.id'))
    priority = db.Column(priority_enum, default='low')
    kanban_state = db.Column(kanban_state_enum, default='normal')
    scheduled_date = db.Column(db.DateTime)
    duration_hours = db.Column(db.Numeric(8, 2))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Added fields causing the specific error
    company_id = db.Column(db.Integer)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))

    # Relationships
    stage = db.relationship('MaintenanceStage')
    # Explicitly specify foreign_keys to avoid ambiguity
    technician = db.relationship('User', foreign_keys=[technician_user_id])
    creator = db.relationship('User', foreign_keys=[created_by])

# ==========================================
# 3. HELPER FUNCTIONS
# ==========================================

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            token = token.split(" ")[1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def serialize_request(req):
    return {
        'id': req.id,
        'subject': req.subject,
        'description': req.description,
        'type': req.request_type,
        'priority': req.priority,
        'stage_id': req.stage_id,
        'stage_name': req.stage.name if req.stage else 'Unknown',
        'equipment_id': req.equipment_id,
        'equipment_name': req.equipment.name if req.equipment else None,
        'technician_name': req.technician.name if req.technician else 'Unassigned',
        'technician_id': req.technician_user_id,
        'kanban_state': req.kanban_state,
        'scheduled_date': req.scheduled_date.isoformat() if req.scheduled_date else None,
        'created_at': req.created_at.isoformat()
    }

# ==========================================
# 4. API ENDPOINTS
# ==========================================

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return make_response('Could not verify', 401)

    user = User.query.filter_by(email=data['email']).first()

    if user and user.password_hash == data['password']:
        token = jwt.encode({
            'user_id': user.id,
            'role': user.role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")

        return jsonify({'token': token, 'user': {'name': user.name, 'role': user.role, 'id': user.id}})

    return make_response('Could not verify', 401)

@app.route('/api/dashboard/stats', methods=['GET'])
@token_required
def get_dashboard_stats(current_user):
    open_requests = db.session.query(MaintenanceRequest).join(MaintenanceStage)\
        .filter(MaintenanceStage.is_closed == False).count()
    
    critical_equip = Equipment.query.filter(Equipment.health_percentage < 30).count()
    
    overdue = db.session.query(MaintenanceRequest).join(MaintenanceStage)\
        .filter(MaintenanceStage.is_closed == False)\
        .filter(MaintenanceRequest.scheduled_date < datetime.datetime.utcnow()).count()
    
    my_tasks = MaintenanceRequest.query.filter_by(technician_user_id=current_user.id).count()

    return jsonify({
        'total_open_requests': open_requests,
        'critical_equipment': critical_equip,
        'overdue_tasks': overdue,
        'my_pending_tasks': my_tasks
    })

@app.route('/api/maintenance/requests', methods=['GET'])
@token_required
def get_requests(current_user):
    requests = MaintenanceRequest.query.all()
    output = [serialize_request(r) for r in requests]
    return jsonify(output)

@app.route('/api/maintenance/requests', methods=['POST'])
@token_required
def create_request(current_user):
    data = request.get_json()
    
    new_req = MaintenanceRequest(
        subject=data['subject'],
        description=data.get('description'),
        request_type=data['request_type'],
        equipment_id=data.get('equipment_id'),
        priority=data.get('priority', 'low'),
        company_id=1,  # Now valid because we added the column to the model
        created_by=current_user.id # Now valid because we added the column
    )
    
    if data.get('scheduled_date'):
        new_req.scheduled_date = data['scheduled_date']

    db.session.add(new_req)
    db.session.commit()
    
    return jsonify({'message': 'Request created!', 'id': new_req.id}), 201

@app.route('/api/maintenance/requests/<int:id>', methods=['GET'])
@token_required
def get_request_detail(current_user, id):
    req = MaintenanceRequest.query.get_or_404(id)
    return jsonify(serialize_request(req))

@app.route('/api/maintenance/requests/<int:id>', methods=['PUT'])
@token_required
def update_request(current_user, id):
    req = MaintenanceRequest.query.get_or_404(id)
    data = request.get_json()

    if 'stage_id' in data:
        req.stage_id = data['stage_id']
    if 'technician_user_id' in data:
        req.technician_user_id = data['technician_user_id']
    if 'priority' in data:
        req.priority = data['priority']
    if 'kanban_state' in data:
        req.kanban_state = data['kanban_state']

    db.session.commit()
    return jsonify({'message': 'Request updated'})

@app.route('/api/equipment', methods=['GET'])
@token_required
def get_equipment(current_user):
    cat_id = request.args.get('category_id')
    query = Equipment.query
    if cat_id:
        query = query.filter_by(category_id=cat_id)
    
    equips = query.all()
    
    result = []
    for eq in equips:
        result.append({
            'id': eq.id,
            'name': eq.name,
            'serial_number': eq.serial_number,
            'health': eq.health_percentage,
            'location': eq.location,
            'active_requests_count': MaintenanceRequest.query.filter_by(equipment_id=eq.id).count()
        })
    return jsonify(result)

@app.route('/api/equipment/<int:id>', methods=['GET'])
@token_required
def get_equipment_detail(current_user, id):
    eq = Equipment.query.get_or_404(id)
    active_requests_count = db.session.query(MaintenanceRequest).join(MaintenanceStage)\
        .filter(MaintenanceRequest.equipment_id == id)\
        .filter(MaintenanceStage.is_closed == False).count()

    return jsonify({
        'id': eq.id,
        'name': eq.name,
        'serial_number': eq.serial_number,
        'health': eq.health_percentage,
        'location': eq.location,
        'category_id': eq.category_id,
        'maintenance_stats': {
            'active_requests': active_requests_count
        }
    })

@app.route('/api/stages', methods=['GET'])
@token_required
def get_stages(current_user):
    stages = MaintenanceStage.query.order_by(MaintenanceStage.sequence).all()
    return jsonify([{'id': s.id, 'name': s.name, 'sequence': s.sequence} for s in stages])

if __name__ == '__main__':
    app.run(debug=True, port=5000)