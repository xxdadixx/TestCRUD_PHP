<?php
require_once "../../config/database.php";

header("Content-Type: application/json");

// 1. เช็คว่ามีไฟล์รูปและ ID ส่งมาไหม
if (!isset($_FILES['photo']) || !isset($_POST['customer_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing photo or customer ID']);
    exit;
}

$customerId = $_POST['customer_id'];
$file = $_FILES['photo'];

// 2. ตรวจสอบ Error ของการอัปโหลด
if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['status' => 'error', 'message' => 'Upload error code: ' . $file['error']]);
    exit;
}

// 3. ตั้งชื่อไฟล์ใหม่ (กันชื่อซ้ำ)
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$newFilename = "cus_" . $customerId . "_" . time() . "." . $ext;
$targetDir = "../../photos/";
$targetFile = $targetDir . $newFilename;

// สร้างโฟลเดอร์ถ้ายังไม่มี
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0777, true);
}

// 4. ย้ายไฟล์ไปยังโฟลเดอร์ photos
if (move_uploaded_file($file['tmp_name'], $targetFile)) {
    try {
        // 5. อัปเดตชื่อรูปลง Database
        $stmt = $pdo->prepare("UPDATE customer SET photo = :photo WHERE customer_id = :id");
        $stmt->execute([
            ':photo' => $newFilename,
            ':id' => $customerId
        ]);

        echo json_encode(['status' => 'success', 'message' => 'Photo uploaded']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to move uploaded file. Check folder permissions.']);
}