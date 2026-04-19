Hospital Management Database
CSC 261 Milestone 3
Team 8

Team Members:
Leanna Fowler
Oliver Luo

This folder contains the SQL schema and sample data files for the Hospital Management Database project. The database includes the following relations:

- DEPARTMENT
- DOCTOR
- NURSE
- ROOM
- PATIENT
- IS_TREATING

Data Source:
All data in the CSV files was manually created by the team as dummy sample data for this project. No external dataset was used.

Files Included:
- create.sql
- load.sql
- department.csv
- doctor.csv
- nurse.csv
- room.csv
- patient.csv
- is_treating.csv

How to Load:
1. Create and select a MySQL database.
2. Make sure you are in the SQL folder in the terminal.
3. Run create.sql to create the tables. 
    - "SOURCE create.sql"
4. Run load.sql to load the CSV data into the tables.
    - "SOURCE load.sql"
** Make sure that mysql is launched with '--local-infile=1'

Notes:
- The CSV files must be kept in the same directory as load.sql when loading the data.
- The database models hospital departments, staff, rooms, patients, and doctor-patient treatment relationships.