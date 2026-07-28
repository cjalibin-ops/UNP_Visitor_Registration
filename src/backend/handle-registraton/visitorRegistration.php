<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle pre-flight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

define('API_KEY', 'a3f9c1d7e2b84a6f9c0d12e3f4567890');
$headers = getallheaders();
$auth = $headers['Authorization'] ?? '';

if ($auth !== 'Bearer ' . API_KEY) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit();
}

$request = json_decode(file_get_contents("php://input"));
$pdo = new PDO("mysql:host=localhost;dbname=visitor_managements;charset=utf8mb4", "root", "");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

switch ($request->action ?? '') {
    case "insert":
        // Check for duplicates
        $check = $pdo->prepare("SELECT register_id FROM visitor_register 
                                WHERE LOWER(TRIM(lastName)) = LOWER(TRIM(?)) 
                                AND LOWER(TRIM(firstName)) = LOWER(TRIM(?)) 
                                AND TRIM(phoneNumber) = TRIM(?) LIMIT 1");
        $check->execute([$request->lastName, $request->firstName, $request->phoneNumber]);
        
        if ($check->rowCount() > 0) {
            echo json_encode(["status" => "warning", "message" => "This visitor is already registered."]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO visitor_register (lastName, firstName, middleName, phoneNumber, province, municipality, barangay, register_date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
            $stmt->execute([$request->lastName, $request->firstName, $request->middleName, $request->phoneNumber, $request->province, $request->municipality, $request->barangay]);
            echo json_encode(["status" => "success", "message" => "Visitor registered successfully!"]);
        }
        break;
        
    default:
        echo json_encode(["status" => "error", "message" => "Invalid action"]);
}