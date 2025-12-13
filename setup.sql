-- HEALOTAC Database Setup Script
-- Run this script in your local PostgreSQL database to reset the application data while PRESERVING users.
-- Command: psql -U <username> -d <dbname> -f setup.sql

-- 1. Clean up application tables (Cascade ensures dependent tables are dropped)
-- NOTE: We are NOT dropping the 'users' table to preserve your existing accounts.
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS cadets CASCADE;

-- 2. Create 'users' table (Only if it doesn't exist)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Create 'cadets' table
CREATE TABLE cadets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_foreign BOOLEAN DEFAULT FALSE NOT NULL,
    country VARCHAR(100),
    battalion VARCHAR(100) NOT NULL,
    company VARCHAR(50) NOT NULL,
    join_date TIMESTAMP NOT NULL,
    academy_number INTEGER,
    
    -- Demographics
    height INTEGER,
    weight DECIMAL(5, 2),
    initial_weight DECIMAL(5, 2),
    current_weight DECIMAL(5, 2),
    age INTEGER,
    course VARCHAR(100),
    sex VARCHAR(10),
    nok_contact VARCHAR(20),
    relegated VARCHAR(1) DEFAULT 'N' NOT NULL,
    
    -- Health Parameters
    blood_group VARCHAR(10),
    bmi VARCHAR(20),
    body_fat VARCHAR(20),
    calcaneal_bone_density VARCHAR(20),
    bp VARCHAR(20),
    pulse VARCHAR(20),
    so2 VARCHAR(20),
    bca_fat VARCHAR(20),
    ecg VARCHAR(20),
    temp VARCHAR(20),
    smm_kg VARCHAR(20),
    
    -- Vaccination Status
    covid_dose_1 BOOLEAN DEFAULT FALSE NOT NULL,
    covid_dose_2 BOOLEAN DEFAULT FALSE NOT NULL,
    covid_dose_3 BOOLEAN DEFAULT FALSE NOT NULL,
    hepatitis_b_dose_1 BOOLEAN DEFAULT FALSE NOT NULL,
    hepatitis_b_dose_2 BOOLEAN DEFAULT FALSE NOT NULL,
    tetanus_toxoid BOOLEAN DEFAULT FALSE NOT NULL,
    chicken_pox_dose_1 BOOLEAN DEFAULT FALSE NOT NULL,
    chicken_pox_dose_2 BOOLEAN DEFAULT FALSE NOT NULL,
    chicken_pox_suffered BOOLEAN DEFAULT FALSE NOT NULL,
    yellow_fever BOOLEAN DEFAULT FALSE NOT NULL,
    past_medical_history TEXT,
    
    -- Tests
    endurance_test VARCHAR(50),
    agility_test VARCHAR(50),
    speed_test VARCHAR(50),
    ppt VARCHAR(50),
    ipet VARCHAR(50),
    bpet VARCHAR(50),
    swm VARCHAR(50),
    vertical_jump VARCHAR(50),
    ball_throw VARCHAR(50),
    lower_back_strength VARCHAR(50),
    shoulder_dynamometer_left VARCHAR(50),
    shoulder_dynamometer_right VARCHAR(50),
    hand_grip_dynamometer_left VARCHAR(50),
    hand_grip_dynamometer_right VARCHAR(50),
    overall_assessment VARCHAR(100),
    
    -- Female Specific
    menstrual_frequency VARCHAR(20),
    menstrual_days INTEGER,
    last_menstrual_date TEXT,
    menstrual_aids TEXT,
    sexually_active VARCHAR(10),
    marital_status VARCHAR(20),
    pregnancy_history TEXT,
    contraceptive_history TEXT,
    surgery_history TEXT,
    medical_condition TEXT,
    hemoglobin_level DECIMAL(4, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Create 'medical_records' table
CREATE TABLE medical_records (
    id SERIAL PRIMARY KEY,
    cadet_id INTEGER NOT NULL REFERENCES cadets(id) ON DELETE CASCADE,
    date_of_reporting TIMESTAMP NOT NULL,
    medical_problem TEXT NOT NULL,
    diagnosis TEXT,
    medical_status VARCHAR(20) DEFAULT 'Active' NOT NULL,
    attend_c INTEGER DEFAULT 0 NOT NULL,
    mi_detained INTEGER DEFAULT 0 NOT NULL,
    ex_ppg INTEGER DEFAULT 0 NOT NULL,
    attend_b INTEGER DEFAULT 0 NOT NULL,
    physiotherapy INTEGER DEFAULT 0 NOT NULL,
    total_training_days_missed INTEGER DEFAULT 0 NOT NULL,
    monitoring_case BOOLEAN DEFAULT FALSE NOT NULL,
    admitted_in_mh VARCHAR(10),
    contact_no VARCHAR(20),
    remarks TEXT,
    commandant_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Create 'attendance' table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    cadet_id INTEGER NOT NULL REFERENCES cadets(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    morning BOOLEAN DEFAULT FALSE NOT NULL,
    evening BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Insert Users (Preserve existing if conflict)
INSERT INTO users (username, password, email, role) VALUES
('rmo', '$2b$12$kgpPGWU2CLPyGxbOpesDFORRf89NZNTJ2pZgQol.340So.jcHFXaa', 'rmo@example.com', 'admin'),
('na', '$2b$12$nLFP2/i0bpiS78z4NcX8iO/YADF9bJ4bQLrOP2vVMAdazJ0IyIk8W', 'na@example.com', 'user'),
('Comdt', '$2b$10$4dahJdZq7a9SJrK1GRJFfOwr5pr6pkrozdXwnyDpiySNB.0EMmvVG', 'comdt@example.com', 'admin'),
('Dcci', '$2b$10$JiSxghX0sYGdlThju13X5e7MLnKefIGyOcxKkm8Ds3Y4aYBRH6oHK', 'dcci@example.com', 'admin'),
('Brig', '$2b$10$a0X3ITeuoHrbt05mR2MpveBSafkHDDQS8DuoLqhKXa/BloNqiDoEG', 'brig@example.com', 'admin'),
('Cors', '$2b$10$02Rkqbr0wlBx8mU2DZU3T.VA0lQXVXPVwUFIh5Aa97RfY7Wg3H3Qa', 'cors@example.com', 'admin'),
('Cos', '$2b$10$r/DLYmJcXZdKBKwe7fogwu0CU1Wg6VTLA6ZoSuSN6tBs/hry31Myy', 'cos@example.com', 'admin'),
('Coco', '$2b$10$NDIEwwGt.kj3AVd0T0ltxu/LtO04TJ95ASCQWazuYG5y4HDTLAXge', 'coco@example.com', 'admin'),
('Lmo', '$2b$10$zjAcWbNdUNEstNxZEv1mVu9WCyOWXQ9YelKqGcKXTx6XnxF9BarDW', 'lmo@example.com', 'admin'),
('Rmo', '$2b$10$ZHVoHlh4/mmkf8yBaRw91OZBBG6wIm0jkUXDptGVNPZkOwWBeIZY6', 'rmo@example.com', 'admin'),
('Na', '$2b$10$NaTcVDGRV74yyjup.XjohOrvLrHY0TPMrdZ9lm2th2m4oQQ2CcbKO', 'na@example.com', 'user'),
('admin', '$2b$10$8.b8mxiRsiorOsVt/MDdlu3Be9.XjPfLzWGRU.cw17qDyb5je9a5y', 'admin@healotac.com', 'super_admin')
ON CONFLICT (username) DO NOTHING;

-- Data reset complete. Users preserved/restored. Application data wiped.