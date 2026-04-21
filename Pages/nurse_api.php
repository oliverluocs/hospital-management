<?php
$conn = new mysqli("localhost", "oluo", "vz9Kh6Qj", "oluo_1");

$result = $conn->query("SELECT * FROM NURSE");

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
?>