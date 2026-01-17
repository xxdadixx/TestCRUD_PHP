<?php
require __DIR__ . "/../../config/database.php";

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['customer_id'])) {
    echo json_encode([
        "status" => "error",
        "message" => "Customer ID is required"
    ]);
    exit;
}

$stmt = $pdo->prepare("DELETE FROM customer WHERE customer_id = ?");
$stmt->execute([$data['customer_id']]);

echo json_encode([
    "status" => "success",
    "message" => "Customer deleted successfully"
]);