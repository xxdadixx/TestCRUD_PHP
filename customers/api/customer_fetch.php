<?php
// ปิด Error Report ชั่วคราวเพื่อให้ JSON ไม่พัง
error_reporting(0);
require __DIR__ . "/../../config/database.php";
require __DIR__ . "/table_sort.php";
require __DIR__ . "/formate.php";

header('Content-Type: application/json');

/* =========================
   INPUT
========================= */
$search = trim($_GET['search'] ?? '');
$page   = max(1, (int)($_GET['page'] ?? 1));
$limit  = 10;
$offset = ($page - 1) * $limit;

$sort  = $_GET['sort']  ?? 'customer_id';
$order = strtoupper($_GET['order'] ?? 'ASC');

$allowedSort = [
    'customer_id', 'customer_code', 'first_name', 'last_name', 
    'gender', 'date_of_birth', 'national_id', 'status_name', 
    'create_at', 'update_at'
];

if (!in_array($sort, $allowedSort, true)) $sort = 'customer_id';
if (!in_array($order, ['ASC', 'DESC'], true)) $order = 'ASC';

/* =========================
   1. BUILD SEARCH LOGIC (WHERE)
========================= */
$whereSql = '';
$params = [];

if ($search !== '') {
    $keywords = preg_split('/\s+/', $search, -1, PREG_SPLIT_NO_EMPTY);
    $conditions = [];
    
    foreach ($keywords as $index => $keyword) {
        $paramKey = ":kw{$index}";
        $conditions[] = "
            CONCAT_WS(' ',
                c.customer_id, c.customer_code, c.first_name, c.last_name,
                c.gender, c.date_of_birth, c.national_id, s.status_name,
                DATE_FORMAT(c.create_at, '%Y-%m-%d'),
                DATE_FORMAT(c.update_at, '%Y-%m-%d')
            ) LIKE $paramKey
        ";
        $params[$paramKey] = "%{$keyword}%";
    }

    if (!empty($conditions)) {
        $whereSql = "WHERE " . implode(' AND ', $conditions);
    }
}

/* =========================
   2. MAIN QUERY (Data)
========================= */
$sql = "
    SELECT c.*, s.status_name
    FROM customer c
    JOIN customer_status s ON c.status_id = s.status_id
    $whereSql 
    ORDER BY $sort $order
    LIMIT :limit OFFSET :offset
";

try {
    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) { $stmt->bindValue($k, $v); }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    /* =========================
       3. COUNT QUERY (Pagination)
       🔥 เช็คจุดนี้: เราใช้ $whereSql ตัวเดียวกับข้างบน
    ========================= */
    $countSql = "
        SELECT COUNT(*)
        FROM customer c
        JOIN customer_status s ON c.status_id = s.status_id
        $whereSql
    ";

    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $k => $v) { $countStmt->bindValue($k, $v); }
    $countStmt->execute();
    $totalRows = $countStmt->fetchColumn();
    $totalPages = (int)ceil($totalRows / $limit);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    exit;
}

/* =========================
   FORMAT DATA
========================= */
$customers = [];
foreach ($rows as $c) {
    $customers[] = [
        'customer_id'   => $c['customer_id'],
        'customer_code' => $c['customer_code'],
        'name'          => $c['first_name'] . ' ' . $c['last_name'],
        'gender'        => $c['gender'],
        'date_of_birth' => $c['date_of_birth'],
        'national_id'   => formatNationalId($c['national_id']),
        'status_name'   => $c['status_name'],
        'create_at'     => $c['create_at'],
        'update_at'     => $c['update_at'],
    ];
}

/* =========================
   RESPONSE WITH DEBUG INFO
========================= */
echo json_encode([
    'customers'  => $customers,
    'page'       => $page,
    'totalPages' => $totalPages,
    
    // 👇 ดูค่าตรงนี้ใน Network Tab ครับ 👇
    'debug_info' => [
        'search_term' => $search,      // คำที่ค้นหา
        'where_sql'   => $whereSql,    // เงื่อนไข SQL (ถ้าค้นหาต้องไม่เป็นค่าว่าง)
        'total_rows'  => $totalRows,   // จำนวนแถวที่นับได้ (ควรเป็น 9)
        'sql_count'   => $countSql     // ดูหน้าตา SQL ที่รันจริง
    ]
]);