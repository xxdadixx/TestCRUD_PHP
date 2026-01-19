<?php
require __DIR__ . "/../../config/database.php";

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['customer_id'])) {
    echo json_encode(["status" => "error", "message" => "Customer ID is required"]);
    exit;
}

try {
    $pdo->beginTransaction(); // ✅ เริ่ม

    $stmt = $pdo->prepare("DELETE FROM customer WHERE customer_id = ?");
    $stmt->execute([$data['customer_id']]);

    if ($stmt->rowCount() > 0) {
        $pdo->commit(); // ✅ ยืนยันการลบ
        echo json_encode(["status" => "success", "message" => "Customer deleted successfully"]);
    } else {
        $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => "Customer not found or already deleted"]);
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}