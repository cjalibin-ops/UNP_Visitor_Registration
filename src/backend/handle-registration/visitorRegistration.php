<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// Use an explicit production allowlist. During local development, Live Server
// may change ports, so localhost and 127.0.0.1 are allowed on any port.
$configuredOrigins = getenv('VISITOR_ALLOWED_ORIGINS');
$allowedOrigins = $configuredOrigins !== false && trim($configuredOrigins) !== ''
    ? array_filter(array_map('trim', explode(',', $configuredOrigins)))
    : [];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin !== '') {
    $isLocalDevelopmentOrigin = preg_match(
        '/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/D',
        $origin
    ) === 1;
    $originAllowed = in_array($origin, $allowedOrigins, true) ||
        ($allowedOrigins === [] && $isLocalDevelopmentOrigin);

    if (!$originAllowed) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Origin not allowed']);
        exit;
    }

    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 600');
    header('Vary: Origin');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST, OPTIONS');
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

function respond(array $payload, int $statusCode = 200): never
{
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

function stringLength(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function requiredString(array $request, string $field, int $maxLength): string
{
    $value = $request[$field] ?? null;

    if (!is_string($value)) {
        respond(['status' => 'error', 'message' => "{$field} is required."], 422);
    }

    $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');

    if ($value === '' || stringLength($value) > $maxLength || preg_match('/[\x00-\x1F\x7F]/', $value)) {
        respond(['status' => 'error', 'message' => "Invalid {$field}."], 422);
    }

    return $value;
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 10000) {
    respond(['status' => 'error', 'message' => 'Request is too large.'], 413);
}

$rawBody = file_get_contents('php://input');
$request = json_decode($rawBody ?: '', true);

if (!is_array($request) || json_last_error() !== JSON_ERROR_NONE) {
    respond(['status' => 'error', 'message' => 'Request body must be valid JSON.'], 400);
}

$action = $request['action'] ?? null;
if (!is_string($action)) {
    respond(['status' => 'error', 'message' => 'Invalid action.'], 400);
}

$dbHost = getenv('VISITOR_DB_HOST') ?: '127.0.0.1';
$dbName = getenv('VISITOR_DB_NAME') ?: 'visitor_managements';
$dbUser = getenv('VISITOR_DB_USER') ?: 'root';
$dbPassword = getenv('VISITOR_DB_PASSWORD') ?: '';

try {
    $pdo = new PDO(
        "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",
        $dbUser,
        $dbPassword,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    switch ($action) {
        case 'insert':
            $lastName = requiredString($request, 'lastName', 100);
            $firstName = requiredString($request, 'firstName', 100);
            $middleName = $request['middleName'] ?? null;
            $phoneNumber = requiredString($request, 'phoneNumber', 20);
            $province = requiredString($request, 'province', 150);
            $municipality = requiredString($request, 'municipality', 150);
            $barangay = requiredString($request, 'barangay', 150);

            if (!preg_match('/^[A-Za-z]+(?: [A-Za-z]+)*$/D', $lastName) || stringLength(str_replace(' ', '', $lastName)) < 2) {
                respond(['status' => 'error', 'message' => 'Invalid lastName.'], 422);
            }

            if (!preg_match('/^[A-Za-z]+(?: [A-Za-z]+)*$/D', $firstName) || stringLength(str_replace(' ', '', $firstName)) < 2) {
                respond(['status' => 'error', 'message' => 'Invalid firstName.'], 422);
            }

            if ($middleName !== null && $middleName !== '') {
                if (!is_string($middleName) || !preg_match('/^[A-Za-z]\.?$/D', trim($middleName))) {
                    respond(['status' => 'error', 'message' => 'Invalid middleName.'], 422);
                }
                $middleName = trim($middleName);
            } else {
                $middleName = null;
            }

            if (!preg_match('/^\+639\d{9}$/D', $phoneNumber)) {
                respond(['status' => 'error', 'message' => 'Invalid phoneNumber.'], 422);
            }

            // Every value is bound to a parameter. No user input is concatenated into SQL.
            $check = $pdo->prepare(
                'SELECT 1
                 FROM visitor_register
                 WHERE LOWER(TRIM(lastName)) = LOWER(TRIM(:last_name))
                   AND LOWER(TRIM(firstName)) = LOWER(TRIM(:first_name))
                   AND TRIM(phoneNumber) = TRIM(:phone_number)
                 LIMIT 1'
            );
            $check->execute([
                ':last_name' => $lastName,
                ':first_name' => $firstName,
                ':phone_number' => $phoneNumber,
            ]);

            if ($check->fetchColumn() !== false) {
                respond(['status' => 'warning', 'message' => 'This visitor is already registered.']);
            }

            $insert = $pdo->prepare(
                'INSERT INTO visitor_register
                    (lastName, firstName, middleName, phoneNumber, province, municipality, barangay, register_date)
                 VALUES
                    (:last_name, :first_name, :middle_name, :phone_number, :province, :municipality, :barangay, NOW())'
            );
            $insert->execute([
                ':last_name' => $lastName,
                ':first_name' => $firstName,
                ':middle_name' => $middleName,
                ':phone_number' => $phoneNumber,
                ':province' => $province,
                ':municipality' => $municipality,
                ':barangay' => $barangay,
            ]);

            respond(['status' => 'success', 'message' => 'Visitor registered successfully!'], 201);

        case 'count':
            $count = $pdo->query('SELECT COUNT(*) FROM visitor_register')->fetchColumn();
            respond(['status' => 'success', 'count' => (int) $count]);

        default:
            respond(['status' => 'error', 'message' => 'Invalid action.'], 400);
    }
} catch (PDOException $exception) {
    error_log('Visitor registration database error: ' . $exception->getMessage());
    respond(['status' => 'error', 'message' => 'A database error occurred.'], 500);
} catch (Throwable $exception) {
    error_log('Visitor registration server error: ' . $exception->getMessage());
    respond(['status' => 'error', 'message' => 'An internal server error occurred.'], 500);
}
