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
   WHERE (Search)
========================= */
$whereSql = '';
$params = [];

if ($search !== '') {
    $whereSql = "
        WHERE
        CONCAT_WS(' ',
            c.customer_id,
            c.customer_code,
            c.first_name,
            c.last_name,
            c.gender,
            c.date_of_birth,
            c.national_id,
            s.status_name,
            c.create_at,
            c.update_at
        ) LIKE :kw
    ";
    $params[':kw'] = "%{$search}%";
}

/* =========================
   QUERY
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

/* bind search */
foreach ($params as $k => $v) {
    $stmt->bindValue($k, $v);
}

/* bind limit / offset */
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

/* =========================
   Pagination
========================= */
$countSql = "
    SELECT COUNT(*)
    FROM customer c
    JOIN customer_status s ON c.status_id = s.status_id
    $whereSql
";
$countStmt = $pdo->prepare($countSql);
foreach ($params as $k => $v) {
    $countStmt->bindValue($k, $v);
}
$countStmt->execute();
$totalRows = $countStmt->fetchColumn();
$totalPages = (int)ceil($totalRows / $limit);

/* =========================
   FORMAT DATA (before send)
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
    'totalPages' => $totalPages
]);
