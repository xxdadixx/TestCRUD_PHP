<?php
require __DIR__ . "/../../config/database.php";

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['customer_id'])) {
    echo json_encode(["status" => "error", "message" => "Customer ID is required"]);
    exit;
}

try {
    $pdo->beginTransaction();

    // ✅ 1. หาชื่อรูปก่อนลบ (ต้องทำก่อน DELETE ไม่งั้นหาไม่เจอ)
    $stmtGet = $pdo->prepare("SELECT photo FROM customer WHERE customer_id = ?");
    $stmtGet->execute([$data['customer_id']]);
    $photoToDelete = $stmtGet->fetchColumn();

    // 2. ลบข้อมูลใน DB
    $stmt = $pdo->prepare("DELETE FROM customer WHERE customer_id = ?");
    $stmt->execute([$data['customer_id']]);

    if ($stmt->rowCount() > 0) {
        $pdo->commit(); // ยืนยันการลบใน DB ก่อน

        // ✅ 3. ถ้าลบใน DB สำเร็จ -> ค่อยไปลบไฟล์รูปจริงทิ้ง
        if ($photoToDelete) {
            $filePath = "../../photos/" . $photoToDelete;
            if (file_exists($filePath)) {
                unlink($filePath); // 🔥 คำสั่งลบไฟล์
            }
        }

        echo json_encode(["status" => "success", "message" => "Customer deleted successfully"]);
    } else {
        $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => "Customer not found or already deleted"]);
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}