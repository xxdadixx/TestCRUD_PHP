<?php
require __DIR__ . "/../../config/database.php";

header('Content-Type: application/json');

$id = $_GET['id'] ?? null;

if (!$id) {
    echo json_encode(["status" => "error", "message" => "Customer ID required"]);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM customer WHERE customer_id = ?");
$stmt->execute([$id]);
$customer = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$customer) {
    echo json_encode(["status" => "error", "message" => "Customer not found"]);
    exit;
}

echo json_encode([
    "status" => "success",
    "data" => $customer
]);
