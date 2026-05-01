<?php
// database connection settings
// betaweb server credentials
$conn = new mysqli("localhost", "oluo", "vz9Kh6Qj", "oluo_1");

// local development credentials (commented out since betaweb uses oluo_1)
// $conn = new mysqli("localhost", "root", ";6jo%£-]AA117Z!", "hospital_management");

// check for connection errors
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>