<?php
require __DIR__ . "/../../config/database.php";

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

// 1. ตรวจสอบว่ามีไฟล์ส่งมาไหม
if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['status' => 'error', 'message' => 'No file uploaded']);
    exit;
}

$customerId = $_POST['customer_id'] ?? null;
if (!$customerId) {
    echo json_encode(['status' => 'error', 'message' => 'Customer ID is required']);
    exit;
}

// 2. ตรวจสอบชนิดและขนาดไฟล์
$file = $_FILES['photo'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(['status' => 'error', 'message' => 'Allowed: JPG, PNG, WEBP, GIF']);
    exit;
}

if ($file['size'] > 5 * 1024 * 1024) { // 5MB
    echo json_encode(['status' => 'error', 'message' => 'Max file size is 5MB']);
    exit;
}

// 3. เตรียมโฟลเดอร์และชื่อไฟล์
$uploadDir = __DIR__ . "/../../photos/"; // เก็บใน folder photos หน้าบ้าน
if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$newFilename = "cus_{$customerId}_" . time() . "." . $ext;
$destination = $uploadDir . $newFilename;

// 4. บันทึกไฟล์และอัปเดตฐานข้อมูล
if (move_uploaded_file($file['tmp_name'], $destination)) {
    try {
        // ลบรูปเก่า (ถ้ามี)
        $stmt = $pdo->prepare("SELECT photo FROM customer WHERE customer_id = ?");
        $stmt->execute([$customerId]);
        $oldPhoto = $stmt->fetchColumn();
        
        if ($oldPhoto && file_exists($uploadDir . $oldPhoto)) {
            @unlink($uploadDir . $oldPhoto);
        }

        // อัปเดตชื่อรูปใหม่
        $update = $pdo->prepare("UPDATE customer SET photo = ? WHERE customer_id = ?");
        $update->execute([$newFilename, $customerId]);

        echo json_encode([
            'status' => 'success', 
            'message' => 'Photo uploaded', 
            'photo_path' => $newFilename
        ]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to save file']);
}