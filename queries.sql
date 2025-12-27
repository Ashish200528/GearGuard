-- =============================================
-- 0. CLEANUP (Wipe everything for a clean slate)
-- =============================================
DROP TABLE IF EXISTS maintenance_parts CASCADE;
DROP TABLE IF EXISTS preventive_schedules CASCADE;
DROP TABLE IF EXISTS maintenance_attachments CASCADE;
DROP TABLE IF EXISTS maintenance_request_activities CASCADE;
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS maintenance_stages CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS maintenance_team_members_rel CASCADE;
DROP TABLE IF EXISTS maintenance_teams CASCADE;
DROP TABLE IF EXISTS work_centers CASCADE;
DROP TABLE IF EXISTS equipment_categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

DROP TYPE IF EXISTS maintenance_request_type;
DROP TYPE IF EXISTS kanban_state;
DROP TYPE IF EXISTS priority_level;
DROP TYPE IF EXISTS user_role;

-- =============================================
-- 1. ENUMS & CONSTANTS
-- =============================================
CREATE TYPE maintenance_request_type AS ENUM ('corrective', 'preventive');
CREATE TYPE kanban_state AS ENUM ('normal', 'blocked', 'done');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE user_role AS ENUM ('admin', 'technician', 'employee'); 
-- 'admin' = System/Manager, 'technician' = Maintenance Person, 'employee' = End User

-- =============================================
-- 2. CORE TABLES
-- =============================================

CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,    -- Used for Login
  password_hash VARCHAR(255) NOT NULL,   -- Store hashed password here
  role user_role DEFAULT 'employee',     -- Controls permissions
  company_id INTEGER REFERENCES companies(id), -- Optional: if multi-tenant
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
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
    cost_per_hour NUMERIC(12,2) DEFAULT 0,
    capacity_efficiency NUMERIC(5,2) DEFAULT 100,
    oee_target NUMERIC(5,2) DEFAULT 80,
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
    
    -- Status & Health
    is_scrapped BOOLEAN DEFAULT FALSE,
    scrap_date DATE,
    health_percentage INTEGER DEFAULT 100, -- ⚠️ KEY FOR DASHBOARD (Set < 30 for "Critical")

    purchase_date DATE,
    warranty_expiry_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure serial numbers are unique (if they exist)
CREATE UNIQUE INDEX ux_equipment_serial_not_null ON equipment(serial_number) WHERE serial_number IS NOT NULL;

CREATE TABLE maintenance_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sequence INTEGER NOT NULL DEFAULT 10, -- Used to order Kanban columns
    is_scrap BOOLEAN DEFAULT FALSE,       -- Marks the end of lifecycle
    is_closed BOOLEAN DEFAULT FALSE,      -- Hides from "Open Requests"
    company_id INTEGER REFERENCES companies(id),
    UNIQUE (company_id, name)
);

CREATE TABLE maintenance_requests (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT now(),

    request_type maintenance_request_type NOT NULL,
    
    -- The Target (Must be Equipment OR Work Center)
    equipment_id INTEGER REFERENCES equipment(id) ON DELETE SET NULL,
    work_center_id INTEGER REFERENCES work_centers(id) ON DELETE SET NULL,

    -- Who fixes it? (Auto-filled by trigger)
    maintenance_team_id INTEGER REFERENCES maintenance_teams(id) ON DELETE SET NULL,
    technician_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Planning
    scheduled_date TIMESTAMP WITH TIME ZONE,        
    duration_hours NUMERIC(8,2),                   
    priority priority_level DEFAULT 'low',

    -- Flow
    stage_id INTEGER REFERENCES maintenance_stages(id),
    kanban_state kanban_state DEFAULT 'normal', -- Green/Red indicator
    
    company_id INTEGER REFERENCES companies(id) NOT NULL,
    created_by INTEGER REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT maintenance_request_target_ck CHECK (equipment_id IS NOT NULL OR work_center_id IS NOT NULL)
);

CREATE TABLE maintenance_request_activities (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    actor_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- 'created', 'stage_changed', etc.
    note TEXT,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 3. TRIGGERS (The "Magic" logic)
-- =============================================

-- A. Update 'updated_at' timestamp automatically
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
  -- 1. Auto-Assign Team & Technician from Equipment
  IF NEW.equipment_id IS NOT NULL AND (NEW.maintenance_team_id IS NULL OR NEW.technician_user_id IS NULL) THEN
    SELECT maintenance_team_id, technician_user_id, company_id INTO equip_rec FROM equipment WHERE id = NEW.equipment_id;
    IF FOUND THEN
      IF NEW.maintenance_team_id IS NULL THEN NEW.maintenance_team_id := equip_rec.maintenance_team_id; END IF;
      IF NEW.technician_user_id IS NULL THEN NEW.technician_user_id := equip_rec.technician_user_id; END IF;
      IF NEW.company_id IS NULL THEN NEW.company_id := equip_rec.company_id; END IF;
    END IF;
  END IF;

  -- 2. Set Default Stage (First stage by sequence) if NULL
  IF NEW.stage_id IS NULL THEN
     SELECT id INTO default_stage FROM maintenance_stages WHERE company_id = NEW.company_id ORDER BY sequence ASC LIMIT 1;
     NEW.stage_id := default_stage;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_maintenance_defaults
BEFORE INSERT OR UPDATE ON maintenance_requests
FOR EACH ROW EXECUTE FUNCTION maintenance_requests_defaults();

-- C. Activity Logger (Simplified for Hackathon)
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

CREATE TRIGGER trg_log_activity
AFTER INSERT OR UPDATE ON maintenance_requests
FOR EACH ROW EXECUTE FUNCTION log_activity();


-- =============================================
-- 4. SEED DATA (Run this to be "Demo Ready")
-- =============================================

-- 1. Company
INSERT INTO companies (name) VALUES ('My Company (San Francisco)');

-- 2. Users (Passwords are '123456' - HASH THESE IN REAL APP)
-- User 1: Admin
INSERT INTO users (name, email, password_hash, role, company_id) 
VALUES ('Mitchell Admin', 'admin@test.com', '123456', 'admin', 1);

-- User 2: Maintenance Technician
INSERT INTO users (name, email, password_hash, role, company_id) 
VALUES ('Tejas Modi', 'tech@test.com', '123456', 'technician', 1);

-- User 3: End User (Employee)
INSERT INTO users (name, email, password_hash, role, company_id) 
VALUES ('John Employee', 'user@test.com', '123456', 'employee', 1);

-- 3. Stages
INSERT INTO maintenance_stages (name, sequence, is_scrap, is_closed, company_id) VALUES 
('New Request', 10, false, false, 1),
('In Progress', 20, false, false, 1),
('Repaired', 30, false, true, 1),
('Scrap', 100, true, true, 1);

-- 4. Teams
INSERT INTO maintenance_teams (name, company_id) VALUES ('Internal Maintenance', 1);

-- 5. Categories
INSERT INTO equipment_categories (name, company_id) VALUES ('Computers', 1), ('Drills', 1);

-- 6. Equipment (One Healthy, One Critical for Demo)
INSERT INTO equipment (name, serial_number, category_id, maintenance_team_id, technician_user_id, company_id, health_percentage) 
VALUES 
('Acer Laptop', 'LP/203/1928', 1, 1, 2, 1, 95),       -- Healthy
('CNC Machine X1', 'CNC/999/BAD', 2, 1, 2, 1, 25);   -- Critical (< 30%)


-- Add Department table (optional, or just use a string for now)
CREATE TABLE departments (id SERIAL PRIMARY KEY, name VARCHAR(100));

-- Add fields to equipment
ALTER TABLE equipment 
ADD COLUMN employee_id INTEGER REFERENCES users(id), -- The "Used By" field
ADD COLUMN department_id INTEGER REFERENCES departments(id);

ALTER TABLE work_centers 
ADD COLUMN tag VARCHAR(255),
ADD COLUMN alternative_work_center_id INTEGER REFERENCES work_centers(id); 
-- OR create a many-to-many table if one center has multiple alternatives.

ALTER TABLE maintenance_requests 
ADD COLUMN instruction TEXT; -- To store the specific repair instructions

CREATE TABLE maintenance_worksheets (
    id SERIAL PRIMARY KEY, 
    request_id INTEGER REFERENCES maintenance_requests(id),
    name VARCHAR(255),
    is_completed BOOLEAN DEFAULT FALSE
);

-- 1. Add the missing column
ALTER TABLE departments 
ADD COLUMN company_id INTEGER REFERENCES companies(id);