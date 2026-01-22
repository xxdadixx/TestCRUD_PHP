<?php
require_once "../../config/database.php";

header("Content-Type: application/json");

if (!isset($_FILES['photo']) || !isset($_POST['customer_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing photo or customer ID']);
    exit;
}

$customerId = $_POST['customer_id'];
$file = $_FILES['photo'];
$targetDir = "../../photos/";

if (!file_exists($targetDir)) { mkdir($targetDir, 0777, true); }

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$newFilename = "cus_" . $customerId . "_" . time() . "." . $ext;
$targetFile = $targetDir . $newFilename;

// ✅ 1. หาชื่อรูปเก่าเตรียมไว้ก่อน
$stmtGet = $pdo->prepare("SELECT photo FROM customer WHERE customer_id = ?");
$stmtGet->execute([$customerId]);
$oldPhoto = $stmtGet->fetchColumn();

if (move_uploaded_file($file['tmp_name'], $targetFile)) {
    try {
        $pdo->beginTransaction();

        // อัปเดตชื่อรูปใหม่
        $stmt = $pdo->prepare("UPDATE customer SET photo = :photo WHERE customer_id = :id");
        $stmt->execute([':photo' => $newFilename, ':id' => $customerId]);

        $pdo->commit();

        // ✅ 2. ถ้าอัปเดตสำเร็จ -> ลบรูปเก่าทิ้ง (เพื่อไม่ให้รก)
        if ($oldPhoto && $oldPhoto !== $newFilename) {
            $oldFilePath = $targetDir . $oldPhoto;
            if (file_exists($oldFilePath)) {
                unlink($oldFilePath); // 🔥 คำสั่งลบไฟล์
            }
        }

        echo json_encode(['status' => 'success', 'message' => 'Photo uploaded']);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to move uploaded file']);
}