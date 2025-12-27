# GearGuard - Maintenance Management System

A full-stack maintenance management system with **Flask backend** and **Next.js frontend** for tracking equipment, managing maintenance requests, and organizing maintenance teams.

## ✅ Project Status

**✔️ Backend:** Flask REST API with PostgreSQL ([app.py](app.py))  
**✔️ Frontend:** Next.js/React with TypeScript  
**✔️ Database:** Complete schema with seed data ([queries.sql](queries.sql))  
**✔️ Integration:** Frontend connected to backend via API client ([lib/api.ts](src/lib/api.ts))  
**✔️ Testing:** Backend endpoint tests and end-user flow tests included

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+

### Step 1: Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE GearGuard;"

# Run schema (creates tables + seed data)
psql -U postgres -d GearGuard -f queries.sql

# Optional: Add additional test users
psql -U postgres -d GearGuard -f add_test_users.sql
```

**Important:** Update the PostgreSQL password in [app.py](app.py) (line 18) to match your local setup.

### Step 2: Start Backend (Terminal 1)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Test database connection (optional)
python test_connection.py

# Start Flask server
python app.py
```
✅ Backend running at: **http://localhost:5000**

### Step 3: Start Frontend (Terminal 2)

```bash
# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```
✅ Frontend running at: **http://localhost:3000**

## 🔐 Authentication & Test Accounts

### Demo Credentials

**Admin Account:**
- Email: `admin@test.com`
- Password: `123456`
- Admin Code: `ADMIN-2025`

**Technician Account:**
- Email: `tech@test.com`
- Password: `123456`
- Admin Code: `TECH-2025`

**Employee Account:**
- Email: `user@test.com`
- Password: `123456`

### Database Seed Users (Alternative)
| Email | Password | Role |
|-------|----------|------|
| admin@odoo.com | hash123 | Admin |
| marc@odoo.com | hash123 | Employee |
| joel@odoo.com | hash123 | Technician |

## ✨ Features

## ✨ Features

### Authentication System
- **Login & Signup** with role-based access control
- **Three User Roles:** Admin, Technician, Employee
- **Admin Secret Code** verification for privileged roles
- **Email-based** role detection
- Context-based state management

### Core Functionality

🎯 **Dashboard**
- Real-time analytics and KPIs
- Critical equipment alerts
- Open maintenance request metrics
- Technician workload tracking
- Recent activity feed

🔧 **Equipment Management**
- Complete CRUD operations
- Equipment health tracking (percentage-based)
- Category and team assignment
- Advanced filtering by health status
- Critical equipment highlighting

📋 **Maintenance Requests (Kanban Board)**
- Drag-and-drop workflow management
- Multi-stage pipeline (New Request → In Progress → Repaired → Scrap)
- Priority-based color coding
- Equipment and team assignment
- Scheduled date tracking

📅 **Calendar View**
- Monthly calendar with navigation
- Visual indicators for scheduled maintenance
- Click to view day details
- Priority-based task indicators
- Task count badges

👥 **Team Management**
- Organize maintenance teams
- Team member assignment
- Performance tracking

📊 **Reporting & Analytics**
- Performance metrics
- Completion rate tracking
- Request distribution analysis

### Design Features
- 🎨 Modern corporate color scheme
- 📱 Fully responsive layout
- ✨ Smooth animations and transitions
- 🎭 Premium shadows and gradients
- 📝 Consistent typography (Inter font)

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** React Icons
- **State Management:** React Context API
- **Testing:** Jest + React Testing Library

### Backend
- **Framework:** Flask (Python)
- **Database:** PostgreSQL
- **ORM:** psycopg2
- **CORS:** flask-cors

### Testing
- Python test files for backend endpoints
- Jest configuration for frontend testing
- End-user flow testing

## 📁 Project Structure

```
GearGuard/
├── Backend (Python/Flask)
│   ├── app.py                     # Flask REST API server
│   ├── requirements.txt           # Python dependencies
│   ├── test_connection.py         # Database connection test
│   ├── test_equipment_crud.py     # Equipment endpoint tests
│   ├── test_teams_crud.py         # Teams endpoint tests
│   └── test_enduser_flow.py       # End-user flow tests
│
├── Database (PostgreSQL)
│   ├── queries.sql                # Schema + seed data
│   └── add_test_users.sql         # Additional test users
│
├── Frontend (Next.js/React)
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx         # Main layout with sidebar
│   │   ├── context/
│   │   │   ├── AuthContext.tsx    # Authentication state
│   │   │   └── AppContext.tsx     # Application state
│   │   ├── lib/
│   │   │   ├── api.ts             # Backend API client
│   │   │   └── auth.ts            # Auth utilities & secret codes
│   │   ├── pages/
│   │   │   ├── index.tsx          # Landing page
│   │   │   ├── login.tsx          # Login page
│   │   │   ├── signup.tsx         # Signup with role selection
│   │   │   ├── dashboard.tsx      # Main dashboard
│   │   │   ├── equipment.tsx      # Equipment management
│   │   │   ├── maintenance.tsx    # Kanban board
│   │   │   ├── calendar.tsx       # Calendar view
│   │   │   ├── teams.tsx          # Team management
│   │   │   └── reporting.tsx      # Analytics
│   │   ├── styles/
│   │   │   └── globals.css        # Global styles + Tailwind
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript interfaces
│   │   └── __tests__/
│   │       └── properties.test.ts # Component tests
│   │
│   ├── public/                    # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   ├── jest.config.js
│   └── jest.setup.js
└── README.md
```

## 🔒 Authentication System

The application implements role-based authentication with admin secret code verification:

### How It Works

1. **Sign Up Flow:**
   - User enters email (role auto-detected from email pattern)
   - For Admin/Technician roles, admin secret code is required
   - Code is validated before account creation
   - User data stored in PostgreSQL via Flask API

2. **Role Detection:**
   - Emails containing "admin" → Admin role
   - Emails containing "tech" or "maintenance" → Technician role
   - All others → Employee role

3. **Secret Codes:**
   - Admin: `ADMIN-2025`
   - Technician: `TECH-2025`
   - Employee: No code required

⚠️ **Security Note**: This is a demo implementation. In production:
- Use proper password hashing (bcrypt/argon2)
- Implement JWT tokens or session management
- Store secrets server-side only
- Add rate limiting for API endpoints
- Use HTTPS for all communications
- Implement proper CORS policies

## 🗄️ Database Schema

The application uses PostgreSQL with the following schema:

### Key Tables
- **`users`** - User accounts with role-based access
- **`equipment`** - Equipment inventory with health tracking
- **`maintenance_requests`** - Maintenance workflow management
- **`maintenance_stages`** - Kanban board stages
- **`equipment_categories`** - Equipment categorization
- **`maintenance_teams`** - Team management
- **`work_centers`** - Work location tracking

### Data Relationships
- Equipment → Category (many-to-one)
- Equipment → Maintenance Team (many-to-one)
- Maintenance Request → Equipment (many-to-one)
- Maintenance Request → Stage (many-to-one)
- Maintenance Request → User (created by)

## 🧪 Testing

### Backend Tests

Run backend endpoint tests:
```bash
# Test database connection
python test_connection.py

# Test equipment CRUD operations
python test_equipment_crud.py

# Test teams CRUD operations
python test_teams_crud.py

# Test end-user workflows
python test_enduser_flow.py
```

### Frontend Tests

Run Jest tests:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## ⚙️ Configuration & Customization

### Update Database Connection

Edit [app.py](app.py) to match your PostgreSQL setup:
```python
conn = psycopg2.connect(
    host="localhost",
    database="GearGuard",
    user="postgres",
    password="your_password"  # Update this
)
```

### Customize Colors

Edit [tailwind.config.js](tailwind.config.js):
```js
theme: {
  extend: {
    colors: {
      primary: { 
        50: '#f0f9ff',
        // ... your colors
      }
    }
  }
}
```

### Update Admin Codes

Modify [src/lib/auth.ts](src/lib/auth.ts):
```typescript
export const ADMIN_SECRET_CODES = {
  admin: 'YOUR-ADMIN-CODE',
  technician: 'YOUR-TECH-CODE',
}
```

### Backend API Configuration

Update API base URL in [src/lib/api.ts](src/lib/api.ts):
```typescript
const API_BASE_URL = 'http://localhost:5000';  // Change for production
```

## 🚀 Production Deployment

### Build Frontend

```bash
npm run build
npm start
```

### Environment Variables

Create `.env.local` for frontend:
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_ADMIN_CODE=your-secret-code
```

Create environment configuration for backend:
```python
# Use environment variables for sensitive data
import os
DB_PASSWORD = os.getenv('DB_PASSWORD')
SECRET_KEY = os.getenv('SECRET_KEY')
```

### Deployment Checklist

- [ ] Set up production PostgreSQL database
- [ ] Deploy Flask backend (Heroku, AWS, DigitalOcean, etc.)
- [ ] Deploy Next.js frontend (Vercel, Netlify, etc.)
- [ ] Configure environment variables
- [ ] Enable HTTPS
- [ ] Set up proper CORS policies
- [ ] Implement rate limiting
- [ ] Add monitoring and logging
- [ ] Set up database backups
- [ ] Implement proper error handling

## 📋 API Endpoints

The Flask backend provides the following REST API endpoints:

### Authentication
- `POST /api/login` - User login
- `POST /api/signup` - User registration

### Equipment
- `GET /api/equipment` - List all equipment
- `POST /api/equipment` - Create equipment
- `PUT /api/equipment/<id>` - Update equipment
- `DELETE /api/equipment/<id>` - Delete equipment

### Maintenance Requests
- `GET /api/maintenance-requests` - List all requests
- `POST /api/maintenance-requests` - Create request
- `PUT /api/maintenance-requests/<id>` - Update request
- `DELETE /api/maintenance-requests/<id>` - Delete request

### Teams
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create team
- `PUT /api/teams/<id>` - Update team
- `DELETE /api/teams/<id>` - Delete team

### Other
- `GET /api/categories` - List equipment categories
- `GET /api/stages` - List maintenance stages

## 🔧 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in [app.py](app.py)
- Ensure database "GearGuard" exists
- Run `python test_connection.py` to verify connection

### Backend Not Starting
- Install dependencies: `pip install -r requirements.txt`
- Check port 5000 is not in use
- Verify Python version (3.8+)

### Frontend Not Starting
- Install dependencies: `npm install`
- Check port 3000 is not in use
- Verify Node version (16+)
- Clear Next.js cache: `rm -rf .next`

### CORS Issues
- Ensure Flask backend has `flask-cors` installed
- Verify API_BASE_URL in frontend matches backend URL

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 📝 License

This is a demonstration project for educational purposes.

## 🤝 Contributing

This is a learning project. Feel free to fork and modify for your own use.

---

**Built with ❤️ using Next.js, Flask, and PostgreSQL**
