-- Load DEPARTMENT
LOAD DATA LOCAL INFILE 'department.csv'
INTO TABLE DEPARTMENT
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS (department_id, department_name, department_location, beds_total);

-- Load DOCTOR
LOAD DATA LOCAL INFILE 'doctor.csv'
INTO TABLE DOCTOR
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS (doctor_id, department_id, first_name, last_name, contact_num, shift_start, shift_end, is_on_shift, license_num);

-- Load NURSE
LOAD DATA LOCAL INFILE 'nurse.csv'
INTO TABLE NURSE
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS (nurse_id, department_id, first_name, last_name, contact_num, shift_start, shift_end, is_on_shift, license_num);

-- Load ROOM
LOAD DATA LOCAL INFILE 'room.csv'
INTO TABLE ROOM
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS (room_num, department_id, room_type, beds_count, occupied, last_cleaned);

-- Load PATIENT
LOAD DATA LOCAL INFILE 'patient.csv'
INTO TABLE PATIENT
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS (patient_id, room_num, first_name, last_name, contact_info, gender, DOB, illness, time_admitted, status, insurance, insurance_num, height, weight);

-- Load IS_TREATING
LOAD DATA LOCAL INFILE 'is_treating.csv'
INTO TABLE IS_TREATING
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS (doctor_id, patient_id);