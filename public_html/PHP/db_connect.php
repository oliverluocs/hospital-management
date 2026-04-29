<?php
$conn = new mysqli("localhost", "oluo", "vz9Kh6Qj", "oluo_1");  // USE THIS FOR BETAWEB
// $conn = new mysqli("localhost", "root", ";6jo%£-]AA117Z!", "hospital_management");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>