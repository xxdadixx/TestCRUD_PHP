<?php
require __DIR__ . "/../../config/database.php";
require __DIR__ . "/../../validators/CustomerValidator.php";

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid request data"
    ]);
    exit;
}

// Validate
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
       GENERATE CUSTOMER CODE
    ========================= */
    $year = date('Y');

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

        $updateSeq = $pdo->prepare("
            UPDATE customer_sequences
            SET last_number = ?
            WHERE year = ?
        ");
        $updateSeq->execute([$next, $year]);
    } else {
        $next = 1;

        $insertSeq = $pdo->prepare("
            INSERT INTO customer_sequences (year, last_number)
            VALUES (?, ?)
        ");
        $insertSeq->execute([$year, $next]);
    }

    $customerCode = sprintf("CUS-%s-%04d", $year, $next);

    /* =========================
       INSERT CUSTOMER
    ========================= */
    $stmt = $pdo->prepare("
        INSERT INTO customer
        (customer_code, first_name, last_name, gender, date_of_birth, national_id, status_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $customerCode,
        $data['first_name'],
        $data['last_name'],
        $data['gender'] ?? 'Unspecified',
        $data['date_of_birth'],
        $data['national_id'],
        $data['status_id']
    ]);

    $newCustomerId = $pdo->lastInsertId();

    $pdo->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Customer added successfully",
        "customer_code" => $customerCode,
        "customer_id" => $newCustomerId // 🔥 ส่ง ID กลับไปให้ JS ใช้
    ]);
    exit;

} catch (Exception $e) {

    $pdo->rollBack();

    echo json_encode([
        "status" => "error",
        "message" => "Failed to add customer",
        "debug" => $e->getMessage()
    ]);
    exit;
}
