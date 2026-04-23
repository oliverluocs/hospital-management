DROP TABLE IF EXISTS IS_TREATING;
DROP TABLE IF EXISTS PATIENT;
DROP TABLE IF EXISTS ROOM;
DROP TABLE IF EXISTS DOCTOR;
DROP TABLE IF EXISTS NURSE;
DROP TABLE IF EXISTS DEPARTMENT;

-- DEPARTMENT
CREATE TABLE DEPARTMENT (
    department_id VARCHAR(20) PRIMARY KEY,
    department_name VARCHAR(20),
    department_location VARCHAR(100),
    beds_total INT
);

-- DOCTOR
CREATE TABLE DOCTOR (
    doctor_id VARCHAR(20) PRIMARY KEY,
    department_id VARCHAR(20),
    first_name VARCHAR(20),
    last_name VARCHAR(20),
    contact_num VARCHAR(20),
    shift_start DATETIME,
    shift_end DATETIME,
    is_on_shift BOOLEAN,
    license_num VARCHAR(20),
    FOREIGN KEY (department_id)
        REFERENCES DEPARTMENT(department_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- NURSE
CREATE TABLE NURSE (
    nurse_id VARCHAR(20) PRIMARY KEY,
    department_id VARCHAR(20),
    first_name VARCHAR(20),
    last_name VARCHAR(20),
    contact_num VARCHAR(20),
    shift_start DATETIME,
    shift_end DATETIME,
    is_on_shift BOOLEAN,
    license_num VARCHAR(20),
    FOREIGN KEY (department_id)
        REFERENCES DEPARTMENT(department_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ROOM
CREATE TABLE ROOM (
    room_num VARCHAR(20) PRIMARY KEY,
    department_id VARCHAR(20) NOT NULL,
    room_type VARCHAR(10),
    beds_count INT,
    occupied INT,
    last_cleaned DATETIME,
    FOREIGN KEY (department_id)
        REFERENCES DEPARTMENT(department_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- PATIENT
CREATE TABLE PATIENT (
    patient_id INT PRIMARY KEY,
    room_num VARCHAR(20),
    first_name VARCHAR(20),
    last_name VARCHAR(20),
    contact_info VARCHAR(20),
    gender VARCHAR(10),
    DOB DATETIME,
    illness VARCHAR(100),
    time_admitted DATETIME,
    status VARCHAR(10),
    insurance VARCHAR(20),
    insurance_num VARCHAR(20),
    height DECIMAL(3,2),
    weight DECIMAL(5,2),
    FOREIGN KEY (room_num)
        REFERENCES ROOM(room_num)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- IS_TREATING
CREATE TABLE IS_TREATING (
    doctor_id VARCHAR(20),
    patient_id INT,
    PRIMARY KEY (doctor_id, patient_id),
    FOREIGN KEY (doctor_id)
        REFERENCES DOCTOR(doctor_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (patient_id)
        REFERENCES PATIENT(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);