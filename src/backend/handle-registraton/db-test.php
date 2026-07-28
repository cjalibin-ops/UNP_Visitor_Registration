<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "visitor_managements";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Database connection failed");
}
?>