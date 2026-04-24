<?php
require_once "db_connect.php";

$result = $conn->query("SELECT * FROM DOCTOR");

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
?>