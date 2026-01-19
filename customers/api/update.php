<?php
// 🔥 เรียกใช้ Config และ Validator
require __DIR__ . "/../../config/database.php";
require __DIR__ . "/../../validators/CustomerValidator.php";

header('Content-Type: application/json');

// รับค่า JSON
$data = json_decode(file_get_contents("php://input"), true);

// 1. เช็คว่ามีข้อมูลส่งมาไหม
if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid request data"]);
    exit;
}

// 2. เช็คว่ามี ID ส่งมาไหม (สำคัญสำหรับ Update)
if (empty($data['customer_id'])) {
    echo json_encode(["status" => "error", "message" => "Customer ID is required"]);
    exit;
}

// 3. ✅ เรียก Validator (ส่ง true เพื่อบอกว่าเป็น Update Mode)
// Update Mode จะข้ามการเช็ค customer_code (เพราะแก้ไขไม่ได้) และอนุญาตบางเงื่อนไข
$error = CustomerValidator::validate($data, true);
if ($error) {
    echo json_encode(["status" => "error", "message" => $error]);
    exit;
}

try {
    // 4. ทำการ Update
    $stmt = $pdo->prepare("
        UPDATE customer
        SET 
            first_name = :fname,
            last_name = :lname,
            gender = :gender,
            date_of_birth = :dob,
            national_id = :nid,
            status_id = :status,
            update_at = NOW() -- อัปเดตเวลาล่าสุด
        WHERE customer_id = :id
    ");

    $stmt->execute([
        ':fname'  => $data['first_name'],
        ':lname'  => $data['last_name'],
        ':gender' => $data['gender'],
        ':dob'    => $data['date_of_birth'],
        ':nid'    => $data['national_id'],
        ':status' => $data['status_id'],
        ':id'     => $data['customer_id']
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["status" => "success", "message" => "Customer updated successfully"]);
    } else {
        // กรณีค่าเหมือนเดิมเป๊ะ หรือหา ID ไม่เจอ
        echo json_encode(["status" => "success", "message" => "No changes made or ID not found"]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}