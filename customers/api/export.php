<?php
// customers/api/export.php
require_once "../../config/database.php";

// 1. ตั้งค่า Header ให้ Browser รู้ว่าเป็นไฟล์ CSV
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename=customers_export_' . date('Y-m-d_H-i') . '.csv');

// 2. สร้าง Output Stream
$output = fopen('php://output', 'w');

// 🔥 แก้ภาษาต่างดาวใน Excel (BOM for UTF-8)
fputs($output, "\xEF\xBB\xBF");

// 3. เขียนหัวตาราง (Column Headers)
fputcsv($output, ['ID', 'Customer Code', 'First Name', 'Last Name', 'Gender', 'Birth Date', 'National ID', 'Status', 'Created At']);

// 4. รับค่า Filter (เพื่อให้ข้อมูลตรงกับที่เห็นในหน้าเว็บ)
$search = $_GET['search'] ?? '';
$sort = $_GET['sort'] ?? 'customer_id';
$order = $_GET['order'] ?? 'ASC';

// Whitelist Sort Columns (กัน SQL Injection)
$allowed_sort = ['customer_id', 'customer_code', 'first_name', 'last_name', 'gender', 'date_of_birth', 'status_id', 'create_at'];
if (!in_array($sort, $allowed_sort)) $sort = 'customer_id';
$order = ($order === 'DESC') ? 'DESC' : 'ASC';

// 5. Query ข้อมูล (ไม่ต้องมี LIMIT/Pagination เพราะเอาทั้งหมด)
try {
    $sql = "SELECT c.*, s.status_name 
            FROM customer c
            LEFT JOIN customer_status s ON c.status_id = s.status_id
            WHERE (c.first_name LIKE :s 
                OR c.last_name LIKE :s 
                OR c.customer_code LIKE :s 
                OR c.national_id LIKE :s)
            ORDER BY $sort $order";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':s' => "%$search%"]);

    // 6. วนลูปเขียนข้อมูลลงไฟล์
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, [
            $row['customer_id'],
            $row['customer_code'],
            $row['first_name'],
            $row['last_name'],
            $row['gender'],
            $row['date_of_birth'],
            "'" . $row['national_id'], // ใส่ ' นำหน้าเพื่อให้ Excel มองเป็น Text (เลขจะได้ไม่เพี้ยน)
            $row['status_name'],
            $row['create_at']
        ]);
    }

} catch (PDOException $e) {
    // ถ้า Error ให้เขียนลงไฟล์แทน
    fputcsv($output, ['Error', $e->getMessage()]);
}

fclose($output);
exit;