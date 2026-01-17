<?php
require "../../config/database.php";
require "../../customers/api/table_sort.php";
require "../../customers/api/formate.php";

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
$where  = [];
$params = [];

if ($search !== '') {

    /* === Gender (exact) === */
    if (in_array(strtolower($search), ['male', 'female', 'unspecified'])) {
        $where[] = "c.gender = :gender";
        $params[':gender'] = ucfirst(strtolower($search));
    }

    /* === Customer Code (prefix) === */ elseif (str_starts_with(strtoupper($search), 'CUS-')) {
        $where[] = "c.customer_code LIKE :code";
        $params[':code'] = strtoupper($search) . '%';
    }

    /* === National ID (number search) === */ elseif (preg_match('/^\d{3,}/', $search)) {
        $where[] = "c.national_id LIKE :nid";
        $params[':nid'] = "%$search%";
    }

    /* === Name (default) === */ else {
        $where[] = "(c.first_name LIKE :kw OR c.last_name LIKE :kw)";
        $params[':kw'] = "%$search%";
    }
}

$whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';


/* =========================
   QUERY
========================= */
$sql = "
    SELECT SQL_CALC_FOUND_ROWS
        c.*, s.status_name
    FROM customer c
    JOIN customer_status s ON c.status_id = s.status_id
    $whereSQL
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
$totalRows  = $pdo->query("SELECT FOUND_ROWS()")->fetchColumn();
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
