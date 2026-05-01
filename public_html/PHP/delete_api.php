<?php
// start session to check user role
session_start();
// set response header to indicate JSON content
header("Content-Type: application/json");

// include database connection
require_once "db_connect.php";

// check if user is admin, reject if not
if (!isset($_SESSION["role"]) || $_SESSION["role"] !== "Admin") {
    http_response_code(403);
    echo json_encode(["error" => "Only admins can delete records."]);
    exit;
}

// get delete request body
$data = json_decode(file_get_contents("php://input"), true);

$type = $data["type"] ?? "";    // e.g., "patient", "doctor", "room"
$id = $data["id"] ?? "";    // e.g., "P001", "D001", "R101"

// validate that type and id were provided
if ($type === "" || $id === "") {
    http_response_code(400);
    echo json_encode(["error" => "Missing delete type or ID."]);
    exit;
}

// start a database transaction
// all deletes happen together or none at all
$conn->begin_transaction();

try {
    // delete a patient
    if ($type === "patient") {
        $patientId = (int)$id;  // casting to integer for safety

        // get the patient's current room before deleting
        $stmt = $conn->prepare("SELECT room_num FROM PATIENT WHERE patient_id = ?");
        $stmt->bind_param("i", $patientId); // "i" = integer, $patientId == the value
        $stmt->execute();
        $result = $stmt->get_result();

        if (!$result || $result->num_rows === 0) {
            throw new Exception("Patient not found.");
        }

        $patient = $result->fetch_assoc();
        $oldRoom = $patient["room_num"];
        $stmt->close();

        // delete from IS_TREATING first (doctor assignments) because of foreign key constraints
        $stmt = $conn->prepare("DELETE FROM IS_TREATING WHERE patient_id = ?");
        $stmt->bind_param("i", $patientId);
        $stmt->execute();
        $stmt->close();

        // delete the patient record
        $stmt = $conn->prepare("DELETE FROM PATIENT WHERE patient_id = ?");
        $stmt->bind_param("i", $patientId);
        $stmt->execute();
        $stmt->close();

        // decrement the room occupancy count
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

    // delete a doctor
    else if ($type === "doctor") {
        $doctorId = $id;

        // delete from IS_TREATING first
        $stmt = $conn->prepare("DELETE FROM IS_TREATING WHERE doctor_id = ?");
        $stmt->bind_param("s", $doctorId);
        $stmt->execute();
        $stmt->close();

        // delete from DOCTOR table
        $stmt = $conn->prepare("DELETE FROM DOCTOR WHERE doctor_id = ?");
        $stmt->bind_param("s", $doctorId);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            throw new Exception("Doctor not found.");
        }

        $stmt->close();

        // also delete from APP_USER table
        $stmt = $conn->prepare("DELETE FROM APP_USER WHERE user_id = ? AND role = 'Doctor'");
        $stmt->bind_param("s", $doctorId);
        $stmt->execute();
        $stmt->close();

        $message = "Doctor deleted successfully.";
    }

    // delete a nurse
    else if ($type === "nurse") {
        $nurseId = $id;

        // delete from NURSE table
        $stmt = $conn->prepare("DELETE FROM NURSE WHERE nurse_id = ?");
        $stmt->bind_param("s", $nurseId);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            throw new Exception("Nurse not found.");
        }

        $stmt->close();

        // also delete from APP_USER table
        $stmt = $conn->prepare("DELETE FROM APP_USER WHERE user_id = ? AND role = 'Nurse'");
        $stmt->bind_param("s", $nurseId);
        $stmt->execute();
        $stmt->close();

        $message = "Nurse deleted successfully.";
    }

    // delete a room
    else if ($type === "room") {
        $roomNum = $id;

        // get room details first
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

        // check if any patients are in this room
        $stmt = $conn->prepare("SELECT COUNT(*) AS total FROM PATIENT WHERE room_num = ?");
        $stmt->bind_param("s", $roomNum);
        $stmt->execute();
        $patientCount = (int)$stmt->get_result()->fetch_assoc()["total"];
        $stmt->close();

        // prevent deletion if room is occupied
        if ($patientCount > 0 || (int)$room["occupied"] > 0) {
            throw new Exception("Cannot delete this room because it is occupied.");
        }

        // delete the room
        $stmt = $conn->prepare("DELETE FROM ROOM WHERE room_num = ?");
        $stmt->bind_param("s", $roomNum);
        $stmt->execute();
        $stmt->close();

        // update department bed count
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

    // delete a department
    else if ($type === "department") {
        $departmentId = $id;

        // check if any staff or rooms are assigned to this department
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

        // prevent deletion if department is in use
        if (
            (int)$counts["doctor_count"] > 0 ||
            (int)$counts["nurse_count"] > 0 ||
            (int)$counts["room_count"] > 0
        ) {
            throw new Exception("Cannot delete this department because doctors, nurses, or rooms are still assigned to it.");
        }

        // delete the department
        $stmt = $conn->prepare("DELETE FROM DEPARTMENT WHERE department_id = ?");
        $stmt->bind_param("s", $departmentId);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            throw new Exception("Department not found.");
        }

        $stmt->close();

        $message = "Department deleted successfully.";
    }

    // unknown type provided
    else {
        throw new Exception("Invalid delete type.");
    }

    // all deletes succeeded, commit the transaction
    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => $message
    ]);
} catch (Exception $e) {
    // something failed, undo all changes
    $conn->rollback();

    http_response_code(400);
    echo json_encode([
        "error" => $e->getMessage()
    ]);
}

// close database connection
$conn->close();
?>