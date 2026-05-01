<?php
// start session to access session variables
session_start();
// set response header to indicate JSON content
header("Content-Type: application/json");

// clear all session variables
$_SESSION = [];

// if using cookies, delete the session cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// destroy the session
session_destroy();

// return success
echo json_encode(["success" => true]);
?>