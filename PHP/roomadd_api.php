<?php
header("Content-Type: application/json");

error_reporting(0);
ini_set('display_errors', 0);

$conn = new mysqli("localhost", "oluo", "vz9Kh6Qj", "oluo_1");

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

$conn->begin_transaction();
try {
    $existing = null;
    $check = $conn->prepare("SELECT department_id, beds_count FROM ROOM WHERE room_num = ?");
    $check->bind_param("s", $data["room_num"]);
    $check->execute();
    $result = $check->get_result();
    if ($result && $result->num_rows > 0) {
        $existing = $result->fetch_assoc();
    }
    $check->close();

    $stmt = $conn->prepare("
      INSERT INTO ROOM
      (room_num, department_id, room_type, beds_count, occupied, last_cleaned)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        department_id = VALUES(department_id),
        room_type = VALUES(room_type),
        beds_count = VALUES(beds_count),
        occupied = VALUES(occupied),
        last_cleaned = VALUES(last_cleaned)
    ");

    if (!$stmt) {
        throw new Exception($conn->error);
    }

    $stmt->bind_param(
        "sssiss",
        $data["room_num"],
        $data["department_id"],
        $data["room_type"],
        $data["beds_count"],
        $data["occupied"],
        $data["last_cleaned"]
    );

    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    $stmt->close();

    if ($existing) {
        $oldDept = $existing["department_id"];
        $oldBeds = (int)$existing["beds_count"];
        $newDept = $data["department_id"];
        $newBeds = (int)$data["beds_count"];

        if ($oldDept === $newDept) {
            $diff = $newBeds - $oldBeds;
            if ($diff !== 0) {
                $updateDept = $conn->prepare("UPDATE DEPARTMENT SET beds_total = beds_total + ? WHERE department_id = ?");
                $updateDept->bind_param("is", $diff, $newDept);
                if (!$updateDept->execute()) {
                    throw new Exception($updateDept->error);
                }
                $updateDept->close();
            }
        } else {
            $subtractOld = $conn->prepare("UPDATE DEPARTMENT SET beds_total = beds_total - ? WHERE department_id = ?");
            $subtractOld->bind_param("is", $oldBeds, $oldDept);
            if (!$subtractOld->execute()) {
                throw new Exception($subtractOld->error);
            }
            $subtractOld->close();

            $addNew = $conn->prepare("UPDATE DEPARTMENT SET beds_total = beds_total + ? WHERE department_id = ?");
            $addNew->bind_param("is", $newBeds, $newDept);
            if (!$addNew->execute()) {
                throw new Exception($addNew->error);
            }
            $addNew->close();
        }
    } else {
        $updateDept = $conn->prepare("UPDATE DEPARTMENT SET beds_total = beds_total + ? WHERE department_id = ?");
        $updateDept->bind_param("is", $data["beds_count"], $data["department_id"]);
        if (!$updateDept->execute()) {
            throw new Exception($updateDept->error);
        }
        $updateDept->close();
    }

    $conn->commit();
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

$conn->close();
?>