<?php
session_start();
header("Content-Type: application/json");

require_once "db_connect.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid request body"]);
    exit;
}

$userId = trim($data["userId"] ?? "");
$password = trim($data["password"] ?? "");
$role = trim($data["role"] ?? "");

if ($userId === "" || $password === "" || $role === "") {
    http_response_code(400);
    echo json_encode(["error" => "User ID, password, and role are required"]);
    exit;
}

$stmt = $conn->prepare("
    SELECT user_id, role
    FROM APP_USER
    WHERE user_id = ? AND password = ? AND role = ?
    LIMIT 1
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => $conn->error]);
    exit;
}

$stmt->bind_param("sss", $userId, $password, $role);
$stmt->execute();
$result = $stmt->get_result();

if ($result && $result->num_rows === 1) {
    $user = $result->fetch_assoc();

    $_SESSION["user_id"] = $user["user_id"];
    $_SESSION["role"] = $user["role"];

    echo json_encode([
        "success" => true,
        "user_id" => $user["user_id"],
        "role" => $user["role"]
    ]);
} else {
    http_response_code(401);
    echo json_encode(["error" => "Invalid credentials or role"]);
}

$stmt->close();
$conn->close();
?>