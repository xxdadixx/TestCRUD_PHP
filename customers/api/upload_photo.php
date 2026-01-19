<?php
require_once "../../config/database.php";

header("Content-Type: application/json");

if (!isset($_FILES['photo']) || !isset($_POST['customer_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing photo or customer ID']);
    exit;
}

$customerId = $_POST['customer_id'];
$file = $_FILES['photo'];

// สร้างโฟลเดอร์ถ้ายังไม่มี
$targetDir = "../../photos/";
if (!file_exists($targetDir)) { mkdir($targetDir, 0777, true); }

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$newFilename = "cus_" . $customerId . "_" . time() . "." . $ext;
$targetFile = $targetDir . $newFilename;

if (move_uploaded_file($file['tmp_name'], $targetFile)) {
    try {
        $pdo->beginTransaction(); // ✅ เริ่ม

        $stmt = $pdo->prepare("UPDATE customer SET photo = :photo WHERE customer_id = :id");
        $stmt->execute([':photo' => $newFilename, ':id' => $customerId]);

        $pdo->commit(); // ✅ ยืนยันการอัปเดตชื่อรูป
        echo json_encode(['status' => 'success', 'message' => 'Photo uploaded']);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to move uploaded file']);
}