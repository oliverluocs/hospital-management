<?php
session_start();
header("Content-Type: application/json");

if (isset($_SESSION["user_id"]) && isset($_SESSION["role"])) {
    echo json_encode([
        "logged_in" => true,
        "user_id" => $_SESSION["user_id"],
        "role" => $_SESSION["role"]
    ]);
} else {
    echo json_encode([
        "logged_in" => false
    ]);
}
?>