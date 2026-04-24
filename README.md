### Hospital Management
This project is a hospital management database system designed to help organize and manage important hospital information, including patients, doctors, nurses, rooms, departments, and reports. The goal of the project is to create a structured database along with a web interface that allows authorized users to view, enter, update, and manage data more easily.

The system is intended for different types of users, including administrators, doctors, and nurses. Administrators manage staff, rooms, departments, and reports, while doctors and nurses use the system to look up patient information and update records based on their responsibilities. 

Team 8  
Leanna Fowler  
Oliver Luo  


How to run:
php -S localhost:8000
mysql --local-infile=1 --load-data-local-dir="$PWD" -u USERNAME -p
SOURCE load.sql

Go to browser: "http://localhost:8000/Pages/index.html"