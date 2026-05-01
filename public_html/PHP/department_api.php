<?php
// include database connection
require_once "db_connect.php";

// query to get all departments with patient counts
// left join ensures departments with no rooms or patients are still included
$sql = "
SELECT 
  d.department_id,
  d.department_name,
  d.department_location,
  d.beds_total,
  COUNT(DISTINCT p.patient_id) AS patient_count
FROM DEPARTMENT d
LEFT JOIN ROOM r 
  ON r.department_id = d.department_id
LEFT JOIN PATIENT p 
  ON p.room_num = r.room_num
GROUP BY 
  d.department_id,
  d.department_name,
  d.department_location,
  d.beds_total
";

// execute the query
$result = $conn->query($sql);

// build an array from the query results
$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

// return the data as JSON
echo json_encode($data);
?>