<?php
require __DIR__ . "/../../config/database.php";
require __DIR__ . "/table_sort.php";
require __DIR__ . "/formate.php";

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
    'customer_id',
    'customer_code',
    'first_name',
    'last_name',
    'gender',
    'date_of_birth',
    'national_id',
    'status_name',
    'create_at',
    'update_at'
];

if (!in_array($sort, $allowedSort, true)) {
    $sort = 'customer_id';
}

if (!in_array($order, ['ASC', 'DESC'], true)) {
    $order = 'ASC';
}

/* =========================
   1. BUILD SEARCH LOGIC (WHERE)
   สร้างเงื่อนไข WHERE ให้เสร็จ "ก่อน" จะเอาไปใช้ใน SQL
========================= */
$whereSql = '';
$params = [];

if ($search !== '') {
    // แยกคำค้นหาด้วยช่องว่าง (รองรับการพิมพ์ "Male Somchai")
    $keywords = preg_split('/\s+/', $search, -1, PREG_SPLIT_NO_EMPTY);
    
    $conditions = [];
    
    foreach ($keywords as $index => $keyword) {
        $paramKey = ":kw{$index}";
        
        // ค้นหาคำนี้ในทุกคอลัมน์
        $conditions[] = "
            CONCAT_WS(' ',
                c.customer_id,
                c.customer_code,
                c.first_name,
                c.last_name,
                c.gender,
                c.date_of_birth,
                c.national_id,
                s.status_name,
                DATE_FORMAT(c.create_at, '%Y-%m-%d'),
                DATE_FORMAT(c.update_at, '%Y-%m-%d')
            ) LIKE $paramKey
        ";
        
        $params[$paramKey] = "%{$keyword}%";
    }

    if (!empty($conditions)) {
        // ใช้ AND เพื่อบอกว่าต้องเจอ "ครบทุกคำ"
        $whereSql = "WHERE " . implode(' AND ', $conditions);
    }
}

/* =========================
   2. MAIN QUERY (Data)
   เอา $whereSql มาใส่ตรงนี้
========================= */
$sql = "
    SELECT
        c.*, s.status_name
    FROM customer c
    JOIN customer_status s ON c.status_id = s.status_id
    $whereSql 
    ORDER BY $sort $order
    LIMIT :limit OFFSET :offset
";

$stmt = $pdo->prepare($sql);

/* bind search params */
foreach ($params as $k => $v) {
    $stmt->bindValue($k, $v);
}

/* bind limit / offset */
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

/* =========================
   3. COUNT QUERY (Pagination)
   🔴 จุดสำคัญ: ต้องใส่ $whereSql ตรงนี้ด้วย!
   และต้อง bind params ชุดเดียวกัน
========================= */
$countSql = "
    SELECT COUNT(*)
    FROM customer c
    JOIN customer_status s ON c.status_id = s.status_id
    $whereSql
";

$countStmt = $pdo->prepare($countSql);

// Bind params ชุดเดิม (search keywords)
foreach ($params as $k => $v) {
    $countStmt->bindValue($k, $v);
}

$countStmt->execute();
$totalRows = $countStmt->fetchColumn();
$totalPages = (int)ceil($totalRows / $limit);

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
   RESPONSE
========================= */
header('Content-Type: application/json');
echo json_encode([
    'customers'  => $customers,
    'page'       => $page,
    'totalPages' => $totalPages,
    'totalRows'  => $totalRows // ส่งกลับไปเผื่อ debug หรือแสดงผล
]);