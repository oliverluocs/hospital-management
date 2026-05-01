<?php
// include database connection
require_once "db_connect.php";

// query to get all doctors
$result = $conn->query("SELECT * FROM DOCTOR");

// build an array from the query results
$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

// return the data as JSON
echo json_encode($data);
?>