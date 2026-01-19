<?php
require __DIR__ . "/../../config/database.php";

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

// ✅ เช็คก่อนว่าส่ง ID มาไหม
if (empty($data['customer_id'])) {
    echo json_encode(["status" => "error", "message" => "Customer ID is required"]);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM customer WHERE customer_id = ?");
    $stmt->execute([$data['customer_id']]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["status" => "success", "message" => "Customer deleted successfully"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Customer not found or already deleted"]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}