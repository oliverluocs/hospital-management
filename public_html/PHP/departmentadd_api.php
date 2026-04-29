<?php
header("Content-Type: application/json");

error_reporting(0);
ini_set('display_errors', 0);

require_once "db_connect.php";

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => $conn->connect_error]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid JSON"]);
    exit;
}

$mode = $data["mode"] ?? "add";

if ($mode === "add") {
    $check = $conn->prepare("SELECT department_id FROM DEPARTMENT WHERE department_id = ?");
    $check->bind_param("s", $data["department_id"]);
    $check->execute();
    $result = $check->get_result();

    if ($result && $result->num_rows > 0) {
        http_response_code(409);
        echo json_encode([
            "error" => "Department ID already exists. Use the Edit button if you want to update this department."
        ]);
        exit;
    }

    $check->close();
}

$stmt = $conn->prepare("
    INSERT INTO DEPARTMENT
    (department_id, department_name, department_location, beds_total)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      department_name = VALUES(department_name),
      department_location = VALUES(department_location),
      beds_total = VALUES(beds_total)
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => $conn->error]);
    exit;
}

$stmt->bind_param(
    "sssi",
    $data["department_id"],
    $data["department_name"],
    $data["department_location"],
    $data["beds_total"]
);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(500);
    echo json_encode(["error" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>