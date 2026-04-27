-- Load DEPARTMENT
LOAD DATA LOCAL INFILE '/home/oluo/SQL/department.csv'
INTO TABLE DEPARTMENT
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS (department_id, department_name, department_location, beds_total);

-- Load DOCTOR
LOAD DATA LOCAL INFILE '/home/oluo/SQL/doctor.csv'
INTO TABLE DOCTOR
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS (doctor_id, department_id, first_name, last_name, contact_num, shift_start, shift_end, is_on_shift, license_num);

-- Load NURSE
LOAD DATA LOCAL INFILE '/home/oluo/SQL/nurse.csv'
INTO TABLE NURSE
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS (nurse_id, department_id, first_name, last_name, contact_num, shift_start, shift_end, is_on_shift, license_num);

-- Load ROOM
LOAD DATA LOCAL INFILE '/home/oluo/SQL/room.csv'
INTO TABLE ROOM
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS (room_num, department_id, room_type, beds_count, occupied, last_cleaned);

-- Load PATIENT
LOAD DATA LOCAL INFILE '/home/oluo/SQL/patient.csv'
INTO TABLE PATIENT
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS (patient_id, room_num, first_name, last_name, contact_info, gender, DOB, illness, time_admitted, status, insurance, insurance_num, height, weight);

-- Load IS_TREATING
LOAD DATA LOCAL INFILE '/home/oluo/SQL/is_treating.csv'
INTO TABLE IS_TREATING
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS (doctor_id, patient_id);

-- users
INSERT INTO APP_USER (user_id, password, role) VALUES
('admin01', 'admin261', 'Admin'),
('D101', 'doctor261', 'Doctor'),
('D102', 'doctor262', 'Doctor'),
('N201', 'nurse261', 'Nurse'),
('N202', 'nurse262', 'Nurse');