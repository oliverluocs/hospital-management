<?php
header('Content-Type: application/json');

require_once "db_connect.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $data = json_decode(file_get_contents("php://input"), true);

    $stmt = $conn->prepare("
        INSERT INTO PATIENT
        (patient_id, room_num, first_name, last_name, contact_info, gender, DOB,
         illness, time_admitted, status, insurance, insurance_num, height, weight)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "issssssssssddd",
        $data["patient_id"],
        $data["room_num"],
        $data["first_name"],
        $data["last_name"],
        $data["contact_info"],
        $data["gender"],
        $data["DOB"],
        $data["illness"],
        $data["time_admitted"],
        $data["status"],
        $data["insurance"],
        $data["insurance_num"],
        $data["height"],
        $data["weight"]
    );

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
        exit;
    }

    $inc = $conn->prepare("
        UPDATE ROOM 
        SET occupied = occupied + 1
        WHERE room_num = ?
    ");

    $inc->bind_param("s", $data["room_num"]);
    $inc->execute();

    echo json_encode(["success" => true]);
}
?>