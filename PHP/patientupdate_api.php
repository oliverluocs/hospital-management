<?php
header('Content-Type: application/json');

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

if (empty($data["patient_id"])) {
    http_response_code(400);
    echo json_encode(["error" => "patient_id is required"]);
    exit;
}

$conn->begin_transaction();

try {
    $oldRoom = null;
    $check = $conn->prepare("SELECT room_num FROM PATIENT WHERE patient_id = ?");
    $check->bind_param("i", $data["patient_id"]);
    $check->execute();
    $result = $check->get_result();

    if (!$result || $result->num_rows === 0) {
        throw new Exception("Patient not found");
    }

    $row = $result->fetch_assoc();
    $oldRoom = $row["room_num"];
    $check->close();

    $update = $conn->prepare("
        UPDATE PATIENT
        SET illness = ?, status = ?, room_num = ?
        WHERE patient_id = ?
    ");
    $update->bind_param(
        "sssi",
        $data["illness"],
        $data["status"],
        $data["room_num"],
        $data["patient_id"]
    );

    if (!$update->execute()) {
        throw new Exception($update->error);
    }
    $update->close();

    if ($oldRoom !== $data["room_num"]) {
        if (!empty($oldRoom)) {
            $dec = $conn->prepare("UPDATE ROOM SET occupied = GREATEST(occupied - 1, 0) WHERE room_num = ?");
            $dec->bind_param("s", $oldRoom);
            if (!$dec->execute()) {
                throw new Exception($dec->error);
            }
            $dec->close();
        }

        if (!empty($data["room_num"])) {
            $inc = $conn->prepare("UPDATE ROOM SET occupied = occupied + 1 WHERE room_num = ?");
            $inc->bind_param("s", $data["room_num"]);
            if (!$inc->execute()) {
                throw new Exception($inc->error);
            }
            $inc->close();
        }
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