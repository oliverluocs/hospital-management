<?php
// start session to store login state
session_start();
// set response header to indicate JSON content
header("Content-Type: application/json");

// include database connection
require_once "db_connect.php";

// get the request body as JSON
$data = json_decode(file_get_contents("php://input"), true);

// validate that we got valid JSON
if (!$data) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid request body"]);
    exit;
}

// extract and trim the login credentials
$userId = trim($data["userId"] ?? "");
$password = trim($data["password"] ?? "");
$role = trim($data["role"] ?? "");

// validate that all fields are provided
if ($userId === "" || $password === "" || $role === "") {
    http_response_code(400);
    echo json_encode(["error" => "User ID, password, and role are required"]);
    exit;
}

// query to find a matching user
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

// bind the three string parameters
$stmt->bind_param("sss", $userId, $password, $role);
$stmt->execute();
$result = $stmt->get_result();

// if exactly one match found, login successful
if ($result && $result->num_rows === 1) {
    $user = $result->fetch_assoc();

    // store user info in session
    $_SESSION["user_id"] = $user["user_id"];
    $_SESSION["role"] = $user["role"];

    // return success with user info
    echo json_encode([
        "success" => true,
        "user_id" => $user["user_id"],
        "role" => $user["role"]
    ]);
} else {
    // no match found, return unauthorized
    http_response_code(401);
    echo json_encode(["error" => "Invalid credentials or role"]);
}

$stmt->close();
$conn->close();
?>