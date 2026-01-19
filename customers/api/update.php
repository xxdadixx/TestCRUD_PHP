<?php
require __DIR__ . "/../../config/database.php";
require __DIR__ . "/../../validators/CustomerValidator.php";

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) { echo json_encode(["status" => "error", "message" => "Invalid request data"]); exit; }
if (empty($data['customer_id'])) { echo json_encode(["status" => "error", "message" => "Customer ID is required"]); exit; }

$error = CustomerValidator::validate($data, true);
if ($error) { echo json_encode(["status" => "error", "message" => $error]); exit; }

try {
    // ✅ 1. เริ่มระบบ Transaction
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        UPDATE customer
        SET 
            first_name = :fname,
            last_name = :lname,
            gender = :gender,
            date_of_birth = :dob,
            national_id = :nid,
            status_id = :status,
            update_at = NOW()
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

    // ✅ 2. ยืนยันการบันทึก (สำคัญมาก!)
    $pdo->commit();

    echo json_encode(["status" => "success", "message" => "Customer updated successfully"]);

} catch (Exception $e) {
    // ❌ 3. ถ้าพัง ให้ยกเลิกทั้งหมด
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}