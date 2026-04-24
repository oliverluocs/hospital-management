<?php
require_once "db_connect.php";

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


$result = $conn->query($sql);

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
?>