<?php
$conn = new mysqli("localhost", "oluo", "vz9Kh6Qj", "oluo_1");

$sql = "
SELECT 
    p.patient_id,
    p.first_name,
    p.last_name,
    p.contact_info,
    p.gender,
    p.DOB,
    p.illness,
    p.time_admitted,
    p.status,
    p.insurance,
    p.insurance_num,
    p.height,
    p.weight,
    p.room_num,

    r.department_id,
    r.room_type

FROM PATIENT p
LEFT JOIN ROOM r
ON p.room_num = r.room_num
";

$result = $conn->query($sql);

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
?>