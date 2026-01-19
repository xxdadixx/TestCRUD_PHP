<?php
// 🔥 เรียกใช้ไฟล์ Config และ Validator ให้ถูกต้อง
require __DIR__ . "/../../config/database.php";
require __DIR__ . "/../../validators/CustomerValidator.php";

header('Content-Type: application/json');

// รับค่า JSON
$data = json_decode(file_get_contents("php://input"), true);

// 1. ตรวจสอบว่ามีข้อมูลส่งมาไหม
if (!$data) {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid request data"
    ]);
    exit;
}

// 2. ✅ เรียกใช้ Validator ของคุณ (ที่ผมเผลอลบไป)
$error = CustomerValidator::validate($data);
if ($error) {
    echo json_encode([
        "status" => "error",
        "message" => $error
    ]);
    exit;
}

try {
    $pdo->beginTransaction();

    /* =========================
       3. ✅ GEN CODE: สร้างรหัสลูกค้า (CUS-YYYY-XXXX)
    ========================= */
    $year = date('Y');

    // ล็อคตาราง Sequence เพื่อกันเลขชนกัน (FOR UPDATE)
    $seqStmt = $pdo->prepare("
        SELECT last_number
        FROM customer_sequences
        WHERE year = ?
        FOR UPDATE
    ");
    $seqStmt->execute([$year]);
    $row = $seqStmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $next = $row['last_number'] + 1;
        $updateSeq = $pdo->prepare("UPDATE customer_sequences SET last_number = ? WHERE year = ?");
        $updateSeq->execute([$next, $year]);
    } else {
        $next = 1;
        $insertSeq = $pdo->prepare("INSERT INTO customer_sequences (year, last_number) VALUES (?, ?)");
        $insertSeq->execute([$year, $next]);
    }

    $customerCode = sprintf("CUS-%s-%04d", $year, $next);

    /* =========================
       4. INSERT ข้อมูลลูกค้า
    ========================= */
    $stmt = $pdo->prepare("
        INSERT INTO customer
        (customer_code, first_name, last_name, gender, date_of_birth, national_id, status_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $customerCode, // ใช้ Code ที่ Gen มาใหม่
        $data['first_name'],
        $data['last_name'],
        $data['gender'] ?? 'Unspecified',
        $data['date_of_birth'],
        $data['national_id'],
        $data['status_id']
    ]);

    // 🔥 5. พระเอกของเรา: ดึง ID ล่าสุดออกมาส่งกลับไปให้ JS
    $newCustomerId = $pdo->lastInsertId();

    $pdo->commit();

    // ส่ง Response กลับไป (ต้องมี customer_id ไม่งั้นอัปรูปไม่ได้)
    echo json_encode([
        "status" => "success",
        "message" => "Customer added successfully",
        "customer_code" => $customerCode,
        "customer_id" => $newCustomerId // ✅ สำคัญมาก!
    ]);
    exit;

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    echo json_encode([
        "status" => "error",
        "message" => "Failed to add customer",
        "debug" => $e->getMessage()
    ]);
    exit;
}