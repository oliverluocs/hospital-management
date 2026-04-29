<?php
session_start();
header("Content-Type: application/json");

require_once "db_connect.php";

if (!isset($_SESSION["role"]) || $_SESSION["role"] !== "Admin") {
    http_response_code(403);
    echo json_encode(["error" => "Only admins can delete records."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$type = $data["type"] ?? "";
$id = $data["id"] ?? "";

if ($type === "" || $id === "") {
    http_response_code(400);
    echo json_encode(["error" => "Missing delete type or ID."]);
    exit;
}

$conn->begin_transaction();

try {
    if ($type === "patient") {
        $patientId = (int)$id;

        $stmt = $conn->prepare("SELECT room_num FROM PATIENT WHERE patient_id = ?");
        $stmt->bind_param("i", $patientId);
        $stmt->execute();
        $result = $stmt->get_result();

        if (!$result || $result->num_rows === 0) {
            throw new Exception("Patient not found.");
        }

        $patient = $result->fetch_assoc();
        $oldRoom = $patient["room_num"];
        $stmt->close();

        $stmt = $conn->prepare("DELETE FROM IS_TREATING WHERE patient_id = ?");
        $stmt->bind_param("i", $patientId);
        $stmt->execute();
        $stmt->close();

        $stmt = $conn->prepare("DELETE FROM PATIENT WHERE patient_id = ?");
        $stmt->bind_param("i", $patientId);
        $stmt->execute();
        $stmt->close();

        if (!empty($oldRoom)) {
            $stmt = $conn->prepare("
                UPDATE ROOM
                SET occupied = GREATEST(occupied - 1, 0)
                WHERE room_num = ?
            ");
            $stmt->bind_param("s", $oldRoom);
            $stmt->execute();
            $stmt->close();
        }

        $message = "Patient deleted successfully.";
    }

    else if ($type === "doctor") {
        $doctorId = $id;

        $stmt = $conn->prepare("DELETE FROM IS_TREATING WHERE doctor_id = ?");
        $stmt->bind_param("s", $doctorId);
        $stmt->execute();
        $stmt->close();

        $stmt = $conn->prepare("DELETE FROM DOCTOR WHERE doctor_id = ?");
        $stmt->bind_param("s", $doctorId);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            throw new Exception("Doctor not found.");
        }

        $stmt->close();

        $stmt = $conn->prepare("DELETE FROM APP_USER WHERE user_id = ? AND role = 'Doctor'");
        $stmt->bind_param("s", $doctorId);
        $stmt->execute();
        $stmt->close();

        $message = "Doctor deleted successfully.";
    }

    else if ($type === "nurse") {
        $nurseId = $id;

        $stmt = $conn->prepare("DELETE FROM NURSE WHERE nurse_id = ?");
        $stmt->bind_param("s", $nurseId);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            throw new Exception("Nurse not found.");
        }

        $stmt->close();

        $stmt = $conn->prepare("DELETE FROM APP_USER WHERE user_id = ? AND role = 'Nurse'");
        $stmt->bind_param("s", $nurseId);
        $stmt->execute();
        $stmt->close();

        $message = "Nurse deleted successfully.";
    }

    else if ($type === "room") {
        $roomNum = $id;

        $stmt = $conn->prepare("
            SELECT room_num, department_id, beds_count, occupied
            FROM ROOM
            WHERE room_num = ?
        ");
        $stmt->bind_param("s", $roomNum);
        $stmt->execute();
        $result = $stmt->get_result();

        if (!$result || $result->num_rows === 0) {
            throw new Exception("Room not found.");
        }

        $room = $result->fetch_assoc();
        $stmt->close();

        $stmt = $conn->prepare("SELECT COUNT(*) AS total FROM PATIENT WHERE room_num = ?");
        $stmt->bind_param("s", $roomNum);
        $stmt->execute();
        $patientCount = (int)$stmt->get_result()->fetch_assoc()["total"];
        $stmt->close();

        if ($patientCount > 0 || (int)$room["occupied"] > 0) {
            throw new Exception("Cannot delete this room because it is occupied.");
        }

        $stmt = $conn->prepare("DELETE FROM ROOM WHERE room_num = ?");
        $stmt->bind_param("s", $roomNum);
        $stmt->execute();
        $stmt->close();

        $bedsCount = (int)$room["beds_count"];
        $departmentId = $room["department_id"];

        $stmt = $conn->prepare("
            UPDATE DEPARTMENT
            SET beds_total = GREATEST(beds_total - ?, 0)
            WHERE department_id = ?
        ");
        $stmt->bind_param("is", $bedsCount, $departmentId);
        $stmt->execute();
        $stmt->close();

        $message = "Room deleted successfully.";
    }

    else if ($type === "department") {
        $departmentId = $id;

        $stmt = $conn->prepare("
            SELECT
                (SELECT COUNT(*) FROM DOCTOR WHERE department_id = ?) AS doctor_count,
                (SELECT COUNT(*) FROM NURSE WHERE department_id = ?) AS nurse_count,
                (SELECT COUNT(*) FROM ROOM WHERE department_id = ?) AS room_count
        ");
        $stmt->bind_param("sss", $departmentId, $departmentId, $departmentId);
        $stmt->execute();
        $counts = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (
            (int)$counts["doctor_count"] > 0 ||
            (int)$counts["nurse_count"] > 0 ||
            (int)$counts["room_count"] > 0
        ) {
            throw new Exception("Cannot delete this department because doctors, nurses, or rooms are still assigned to it.");
        }

        $stmt = $conn->prepare("DELETE FROM DEPARTMENT WHERE department_id = ?");
        $stmt->bind_param("s", $departmentId);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            throw new Exception("Department not found.");
        }

        $stmt->close();

        $message = "Department deleted successfully.";
    }

    else {
        throw new Exception("Invalid delete type.");
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => $message
    ]);
} catch (Exception $e) {
    $conn->rollback();

    http_response_code(400);
    echo json_encode([
        "error" => $e->getMessage()
    ]);
}

$conn->close();
?>