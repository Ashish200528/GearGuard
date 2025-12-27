-- =============================================
-- PART 0: CLEAN SLATE (Drop Everything First)
-- =============================================
DROP TABLE IF EXISTS maintenance_worksheets CASCADE;
DROP TABLE IF EXISTS maintenance_request_activities CASCADE;
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS maintenance_stages CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS maintenance_team_members_rel CASCADE;
DROP TABLE IF EXISTS maintenance_teams CASCADE;
DROP TABLE IF EXISTS work_centers CASCADE;
DROP TABLE IF EXISTS equipment_categories CASCADE;
DROP TABLE IF EXISTS departments CASCADE; 
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

DROP TYPE IF EXISTS maintenance_request_type CASCADE;
DROP TYPE IF EXISTS kanban_state CASCADE;
DROP TYPE IF EXISTS priority_level CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- =============================================
-- PART 1: SCHEMA & TABLES
-- =============================================

CREATE TYPE maintenance_request_type AS ENUM ('corrective', 'preventive');
CREATE TYPE kanban_state AS ENUM ('normal', 'blocked', 'done');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE user_role AS ENUM ('admin', 'technician', 'employee'); 

CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role DEFAULT 'employee',
  company_id INTEGER REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE departments (
    id SERIAL PRIMARY KEY, 
    name VARCHAR(100),
    company_id INTEGER REFERENCES companies(id)
);

CREATE TABLE equipment_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    responsible_user_id INTEGER REFERENCES users(id),
    company_id INTEGER REFERENCES companies(id) NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE work_centers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    tag VARCHAR(255), -- Added for UI
    alternative_work_center_id INTEGER REFERENCES work_centers(id), -- Added for UI
    cost_per_hour NUMERIC(12,2) DEFAULT 0,
    capacity_efficiency NUMERIC(5,2) DEFAULT 100, -- Added for Dashboard
    oee_target NUMERIC(5,2) DEFAULT 80,           -- Added for Dashboard
    company_id INTEGER REFERENCES companies(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (company_id, name)
);

CREATE TABLE maintenance_teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    company_id INTEGER REFERENCES companies(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (company_id, name)
);

CREATE TABLE maintenance_team_members_rel (
    team_id INTEGER REFERENCES maintenance_teams(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, user_id)
);

CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(150),
    category_id INTEGER REFERENCES equipment_categories(id),
    work_center_id INTEGER REFERENCES work_centers(id),
    location VARCHAR(255),
    company_id INTEGER REFERENCES companies(id) NOT NULL,
    
    -- Assign defaults for auto-routing
    maintenance_team_id INTEGER REFERENCES maintenance_teams(id),
    technician_user_id INTEGER REFERENCES users(id),
    
    -- User & Dept (Added for UI)
    employee_id INTEGER REFERENCES users(id), 
    department_id INTEGER REFERENCES departments(id),

    -- Health (Added for Dashboard "Critical Equipment")
    health_percentage INTEGER DEFAULT 100, 
    
    is_scrapped BOOLEAN DEFAULT FALSE,
    scrap_date DATE,
    purchase_date DATE,
    warranty_expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE maintenance_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sequence INTEGER NOT NULL DEFAULT 10,
    is_scrap BOOLEAN DEFAULT FALSE,
    is_closed BOOLEAN DEFAULT FALSE,
    company_id INTEGER REFERENCES companies(id),
    UNIQUE (company_id, name)
);

CREATE TABLE maintenance_requests (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    instruction TEXT, -- Added for UI (Separate tab)
    request_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    request_type maintenance_request_type NOT NULL,
    
    -- Target
    equipment_id INTEGER REFERENCES equipment(id) ON DELETE SET NULL,
    work_center_id INTEGER REFERENCES work_centers(id) ON DELETE SET NULL,

    -- Assignment (Filled by Trigger)
    maintenance_team_id INTEGER REFERENCES maintenance_teams(id) ON DELETE SET NULL,
    technician_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Planning
    scheduled_date TIMESTAMP WITH TIME ZONE,            
    duration_hours NUMERIC(8,2),                    
    priority priority_level DEFAULT 'low',

    -- Flow
    stage_id INTEGER REFERENCES maintenance_stages(id),
    kanban_state kanban_state DEFAULT 'normal',
    
    company_id INTEGER REFERENCES companies(id) NOT NULL,
    created_by INTEGER REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT maintenance_request_target_ck CHECK (equipment_id IS NOT NULL OR work_center_id IS NOT NULL)
);

-- Added for "Worksheet" Smart Button
CREATE TABLE maintenance_worksheets (
    id SERIAL PRIMARY KEY, 
    request_id INTEGER REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    name VARCHAR(255),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE maintenance_request_activities (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    actor_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL, 
    note TEXT,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- PART 2: TRIGGERS & FUNCTIONS
-- =============================================

-- A. Update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_equipment_updated BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_requests_updated BEFORE UPDATE ON maintenance_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- B. Auto-Fill Team/Technician & Default Stage
CREATE OR REPLACE FUNCTION maintenance_requests_defaults() RETURNS TRIGGER AS $$
DECLARE
  equip_rec RECORD;
  default_stage INTEGER;
BEGIN
  -- 1. Auto-Assign from Equipment
  IF NEW.equipment_id IS NOT NULL AND (NEW.maintenance_team_id IS NULL OR NEW.technician_user_id IS NULL) THEN
    SELECT maintenance_team_id, technician_user_id, company_id INTO equip_rec FROM equipment WHERE id = NEW.equipment_id;
    IF FOUND THEN
      IF NEW.maintenance_team_id IS NULL THEN NEW.maintenance_team_id := equip_rec.maintenance_team_id; END IF;
      IF NEW.technician_user_id IS NULL THEN NEW.technician_user_id := equip_rec.technician_user_id; END IF;
      IF NEW.company_id IS NULL THEN NEW.company_id := equip_rec.company_id; END IF;
    END IF;
  END IF;

  -- 2. Set Default Stage
  IF NEW.stage_id IS NULL THEN
     SELECT id INTO default_stage FROM maintenance_stages WHERE company_id = NEW.company_id ORDER BY sequence ASC LIMIT 1;
     NEW.stage_id := default_stage;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_maintenance_defaults BEFORE INSERT OR UPDATE ON maintenance_requests FOR EACH ROW EXECUTE FUNCTION maintenance_requests_defaults();

-- C. Activity Logger
CREATE OR REPLACE FUNCTION log_activity() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO maintenance_request_activities(request_id, actor_id, action, new_value)
    VALUES (NEW.id, NEW.created_by, 'created', row_to_json(NEW)::jsonb);
  ELSIF TG_OP = 'UPDATE' AND OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    INSERT INTO maintenance_request_activities(request_id, actor_id, action, old_value, new_value)
    VALUES (NEW.id, NEW.created_by, 'stage_changed', jsonb_build_object('stage', OLD.stage_id), jsonb_build_object('stage', NEW.stage_id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_activity AFTER INSERT OR UPDATE ON maintenance_requests FOR EACH ROW EXECUTE FUNCTION log_activity();

-- =============================================
-- PART 3: MASSIVE DATA POPULATION (ODOO THEME)
-- =============================================

-- 1. Company
INSERT INTO companies (name) VALUES ('Odoo'); -- ID: 1

-- 2. Users
INSERT INTO users (name, email, password_hash, role, company_id) VALUES 
('Mitchell Admin', 'admin@odoo.com', 'hash123', 'admin', 1),       -- ID: 1
('Marc Demo', 'marc@odoo.com', 'hash123', 'employee', 1),         -- ID: 2
('Joel Willis', 'joel@odoo.com', 'hash123', 'technician', 1);     -- ID: 3



-- 2. Now run the data insertion again
INSERT INTO departments (name, company_id) VALUES 
('Administration', 1),
('Production', 1);

-- 4. Maintenance Team
INSERT INTO maintenance_teams (name, company_id) VALUES ('Internal Support', 1); -- ID: 1
INSERT INTO maintenance_team_members_rel (team_id, user_id) VALUES (1, 3); 

-- 5. Categories & Work Centers
INSERT INTO equipment_categories (name, company_id, responsible_user_id) VALUES 
('Electronics', 1, 3),        -- ID: 1
('Furniture', 1, 3),          -- ID: 2
('Facilities & HVAC', 1, 3);  -- ID: 3

INSERT INTO work_centers (name, code, company_id, tag, oee_target) VALUES 
('Main Office', 'HQ-01', 1, 'Standard Assembly', 85.0); -- ID: 1

-- 1. DROP the problematic tables completely to clear old structure and data
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS maintenance_stages CASCADE;

-- 2. RECREATE 'departments' with the correct columns (including company_id)
CREATE TABLE departments (
    id SERIAL PRIMARY KEY, 
    name VARCHAR(100),
    company_id INTEGER REFERENCES companies(id)
);

-- 3. RECREATE 'maintenance_stages'
CREATE TABLE maintenance_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sequence INTEGER NOT NULL DEFAULT 10,
    is_scrap BOOLEAN DEFAULT FALSE,
    is_closed BOOLEAN DEFAULT FALSE,
    company_id INTEGER REFERENCES companies(id),
    UNIQUE (company_id, name)
);

-- 4. INSERT the data (Now it will work because tables are fresh)
INSERT INTO departments (name, company_id) VALUES 
('Administration', 1),
('Production', 1);

INSERT INTO maintenance_stages (name, sequence, company_id, is_closed) VALUES 
('New Request', 10, 1, FALSE),
('In Progress', 20, 1, FALSE),
('Repaired', 30, 1, TRUE);

-- 7. EQUIPMENT (Big List)
-- Updated with department_id, employee_id, and health_percentage
INSERT INTO equipment 
(name, serial_number, category_id, work_center_id, location, company_id, maintenance_team_id, technician_user_id, department_id, employee_id, health_percentage) 
VALUES 
-- --- ELECTRONICS (Category 1) ---
('Dell Laptop Latitude', 'DELL-001', 1, 1, 'Desk 1', 1, 1, 3, 1, 1, 95),
('Office Printer HP', 'PRT-99', 1, 1, 'Corridor', 1, 1, 3, 1, 2, 88),
('Coffee Maker', 'COF-01', 1, 1, 'Kitchen', 1, 1, 3, 1, 2, 100),
('Samsung Monitor 27"', 'MON-SAM-01', 1, 1, 'Desk 2', 1, 1, 3, 2, 2, 98),
('Samsung Monitor 27"', 'MON-SAM-02', 1, 1, 'Desk 3', 1, 1, 3, 2, 2, 98),
('Cisco Network Switch', 'CISCO-SW-X', 1, 1, 'Server Room', 1, 1, 3, 1, 1, 60),

-- --- FURNITURE (Category 2) ---
('Reception Desk', 'DSK-A', 2, 1, 'Lobby', 1, 1, 3, 1, 2, 100),
('Herman Miller Chair', 'HM-AER-01', 2, 1, 'Manager Office', 1, 1, 3, 1, 1, 90),

-- --- FACILITIES (Category 3) ---
('Trane AC Unit (Roof)', 'HVAC-R-01', 3, 1, 'Roof Access', 1, 1, 3, 2, NULL, 75),
('Main Elevator', 'ELV-OTIS-1', 3, 1, 'Lobby Hall', 1, 1, 3, 2, NULL, 20), -- ⚠️ CRITICAL (For Dashboard)
('Water Dispenser', 'H2O-COOL', 3, 1, 'Kitchen', 1, 1, 3, 2, NULL, 100);

-- 8. REQUESTS
INSERT INTO maintenance_requests 
(subject, description, instruction, request_type, equipment_id, priority, company_id, created_by) 
VALUES 
-- Existing Tickets
('Paper Jam', 'Printer is stuck.', 'Check tray 2 rollers.', 'corrective', (SELECT id FROM equipment WHERE name LIKE 'Office Printer%' LIMIT 1), 'medium', 1, 2),
('Elevator Jerking Motion', 'Elevator shakes when stopping.', 'Inspect guide rails immediately.', 'corrective', (SELECT id FROM equipment WHERE name LIKE 'Main Elevator%' LIMIT 1), 'critical', 1, 1),
('AC Filter Cleaning', 'Quarterly filter replacement.', 'Use filter type X-200.', 'preventive', (SELECT id FROM equipment WHERE name LIKE 'Trane AC%' LIMIT 1), 'low', 1, 3);

-- 9. WORKSHEETS (Sample)
INSERT INTO maintenance_worksheets (request_id, name, is_completed) VALUES
((SELECT id FROM maintenance_requests WHERE subject LIKE 'AC Filter%' LIMIT 1), 'Remove Old Filter', FALSE),
((SELECT id FROM maintenance_requests WHERE subject LIKE 'AC Filter%' LIMIT 1), 'Clean Vents', FALSE),
((SELECT id FROM maintenance_requests WHERE subject LIKE 'AC Filter%' LIMIT 1), 'Insert New Filter', FALSE);

-- =============================================
-- PART 4: VERIFICATION
-- =============================================
SELECT count(*) as equipment_count FROM equipment;
SELECT count(*) as critical_items FROM equipment WHERE health_percentage < 30;