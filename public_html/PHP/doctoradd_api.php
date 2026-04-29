<?php
header("Content-Type: application/json");

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
    $check = $conn->prepare("SELECT doctor_id FROM DOCTOR WHERE doctor_id = ?");
    $check->bind_param("s", $data["doctor_id"]);
    $check->execute();
    $result = $check->get_result();

    if ($result && $result->num_rows > 0) {
        http_response_code(409);
        echo json_encode([
            "error" => "Doctor ID already exists. Use the Edit button if you want to update this doctor."
        ]);
        exit;
    }

    $check->close();
}

$stmt = $conn->prepare("
    INSERT INTO DOCTOR
    (doctor_id, department_id, first_name, last_name, contact_num,
     shift_start, shift_end, is_on_shift, license_num)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      department_id = VALUES(department_id),
      first_name = VALUES(first_name),
      last_name = VALUES(last_name),
      contact_num = VALUES(contact_num),
      shift_start = VALUES(shift_start),
      shift_end = VALUES(shift_end),
      is_on_shift = VALUES(is_on_shift),
      license_num = VALUES(license_num)
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => $conn->error]);
    exit;
}

$stmt->bind_param(
    "sssssssis",
    $data["doctor_id"],
    $data["department_id"],
    $data["first_name"],
    $data["last_name"],
    $data["contact_num"],
    $data["shift_start"],
    $data["shift_end"],
    $data["is_on_shift"],
    $data["license_num"]
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