DROP TABLE IF EXISTS PATIENT;
DROP TABLE IF EXISTS ROOM;
DROP TABLE IF EXISTS DOCTOR;
DROP TABLE IF EXISTS NURSE;
DROP TABLE IF EXISTS DEPARTMENT;

-- DEPARTMENT
CREATE TABLE DEPARTMENT (
    department_id INT PRIMARY KEY,
    department_name VARCHAR(20),
    department_location INT,
    beds_total INT,
    number_of_patients INT
);

-- DOCTOR
CREATE TABLE DOCTOR (
    doctor_id INT PRIMARY KEY,
    department_id INT,
    first_name VARCHAR(20),
    last_name VARCHAR(20),
    contact_num INT,
    shift_start DATETIME,
    shift_end DATETIME,
    is_on_shift BOOLEAN,
    license_num INT,
    FOREIGN KEY (department_id)
        REFERENCES DEPARTMENT(department_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- NURSE
CREATE TABLE NURSE (
    nurse_id INT PRIMARY KEY,
    department_id INT,
    first_name VARCHAR(20),
    last_name VARCHAR(20),
    contact_num INT,
    shift_start DATETIME,
    shift_end DATETIME,
    is_on_shift BOOLEAN,
    license_num INT,
    FOREIGN KEY (department_id)
        REFERENCES DEPARTMENT(department_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ROOM
CREATE TABLE ROOM (
    room_num INT PRIMARY KEY,
    department_id INT NOT NULL,
    room_type VARCHAR(10),
    beds_count INT,
    is_filled BOOLEAN,
    last_cleaned DATETIME,
    FOREIGN KEY (department_id)
        REFERENCES DEPARTMENT(department_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- PATIENT
CREATE TABLE PATIENT (
    patient_id INT PRIMARY KEY,
    room_num INT,
    first_name VARCHAR(20),
    last_name VARCHAR(20),
    contact_info INT,
    gender VARCHAR(10),
    DOB DATETIME,
    illness VARCHAR(100),
    time_admitted DATETIME,
    status VARCHAR(10),
    insurance VARCHAR(20),
    insurance_num INT,
    height DECIMAL(3,2),
    weight DECIMAL(5,2),
    FOREIGN KEY (room_num)
        REFERENCES ROOM(room_num)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);