-- Quick fix: Add the test users we documented
-- Run this if you want to use admin@test.com credentials

INSERT INTO users (name, email, password_hash, role, company_id) 
VALUES 
  ('Mitchell Admin', 'admin@test.com', '123456', 'admin', 1),
  ('Tejas Modi', 'tech@test.com', '123456', 'technician', 1),
  ('John Employee', 'user@test.com', '123456', 'employee', 1)
ON CONFLICT (email) DO NOTHING;
