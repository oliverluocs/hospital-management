<?php
// set response header to indicate JSON content
header("Content-Type: application/json");

// include database connection
require_once "db_connect.php";

try {
    $summary = [];

    // get total patient count
    $result = $conn->query("SELECT COUNT(*) AS total FROM PATIENT");
    $summary["total_patients"] = $result->fetch_assoc()["total"];

    // get total occupied beds
    $result = $conn->query("
        SELECT COALESCE(SUM(occupied), 0) AS total
        FROM ROOM
    ");
    $summary["beds_filled"] = $result->fetch_assoc()["total"];

    // get total available beds
    $result = $conn->query("
        SELECT COALESCE(SUM(beds_count - occupied), 0) AS total
        FROM ROOM
    ");
    $summary["beds_available"] = $result->fetch_assoc()["total"];

    // get total doctor count
    $result = $conn->query("SELECT COUNT(*) AS total FROM DOCTOR");
    $summary["total_doctors"] = $result->fetch_assoc()["total"];

    // query to get per-department stats
    // left join to include departments with no patients or rooms
    // ** COALESCE = returns the first non-null value from a provided list of arguments
    $departmentQuery = "
        SELECT 
            d.department_name,
            COALESCE(patient_stats.patient_count, 0) AS patient_count,
            COALESCE(room_stats.open_beds, 0) AS open_beds
        FROM DEPARTMENT d
        LEFT JOIN (
            SELECT 
                r.department_id,
                COUNT(p.patient_id) AS patient_count
            FROM ROOM r
            LEFT JOIN PATIENT p
                ON r.room_num = p.room_num
            GROUP BY r.department_id
        ) patient_stats
            ON d.department_id = patient_stats.department_id
        LEFT JOIN (
            SELECT 
                department_id,
                SUM(beds_count - occupied) AS open_beds
            FROM ROOM
            GROUP BY department_id
        ) room_stats
            ON d.department_id = room_stats.department_id
        ORDER BY d.department_name
    ";

    $departmentResult = $conn->query($departmentQuery);

    $departments = [];

    // build department array from query results
    while ($row = $departmentResult->fetch_assoc()) {
        $departments[] = [
            "department_name" => $row["department_name"],
            "patient_count" => $row["patient_count"],
            "open_beds" => $row["open_beds"]
        ];
    }

    // return success response with summary and department data
    echo json_encode([
        "success" => true,
        "summary" => $summary,
        "departments" => $departments
    ]);
} catch (Exception $e) {
    // return error response
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
?>