<?php
require __DIR__ . "/../../config/database.php";
require __DIR__ . "/../../validators/CustomerValidator.php";

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

// Validate (update mode)
$error = CustomerValidator::validate($data, true);
if ($error) {
    echo json_encode(["status" => "error", "message" => $error]);
    exit;
}

$stmt = $pdo->prepare("
    UPDATE customer
    SET first_name = ?, last_name = ?, gender = ?,
        date_of_birth = ?, national_id = ?, status_id = ?,
        update_at = NOW()
    WHERE customer_id = ?
");

$stmt->execute([
    $data['first_name'],
    $data['last_name'],
    $data['gender'],
    $data['date_of_birth'],
    $data['national_id'],
    $data['status_id'],
    $data['customer_id']
]);

echo json_encode([
    "status" => "success",
    "message" => "Customer updated successfully"
]);
