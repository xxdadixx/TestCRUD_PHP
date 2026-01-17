<?php
/* =========================
   TABLE SORT HELPER
========================= */

$sort  = $_GET['sort']  ?? null;
$order = $_GET['order'] ?? null;

$defaultSort  = 'customer_id';
$defaultOrder = 'ASC';

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

$isSorted = false;

/* cancel sort */
if (isset($_GET['cancel'])) {
    $sort = null;
    $order = null;
    $isSorted = false;
}

/* validate sort & order */

if (in_array($sort, $allowedSort, true)) {

    // normalize order
    $order = strtoupper($order ?? 'ASC');

    // validate order
    if (!in_array($order, ['ASC', 'DESC'], true)) {
        $order = 'ASC';
    }

    $isSorted = true;
} else {

    // fallback to default
    $sort  = $defaultSort;
    $order = $defaultOrder;

    $isSorted = false;
}

/* =========================
   HELPER FUNCTIONS
========================= */

function sortLink(string $column, string $label): string
{
    $currentSort  = $_GET['sort']  ?? null;
    $currentOrder = $_GET['order'] ?? null;
    $page   = $_GET['page']   ?? 1;
    $search = $_GET['search'] ?? '';

    // DEFAULT LINK (no sort yet)
    $nextSort  = $column;
    $nextOrder = 'ASC';
    $icon = '';

    // SAME COLUMN → toggle
    if ($currentSort === $column) {

        // ASC → DESC
        if ($currentOrder === 'ASC') {
            $nextOrder = 'DESC';
            $icon = '▲';
        }
        // DESC → RESET (remove sort)
        elseif ($currentOrder === 'DESC') {
            return "<a href='?" . http_build_query([
                'page'   => $page,
                'search' => $search
            ]) . "'>$label ▼</a>";
        }
    }

    $query = [
        'sort'   => $nextSort,
        'order'  => $nextOrder,
        'page'   => $page,
        'search' => $search
    ];

    return "<a href='?" . http_build_query($query) . "'>$label $icon</a>";
}

function sortClass(string $column): string
{
    global $sort, $isSorted;

    return ($isSorted && $sort === $column)
        ? 'bg-blue-100 dark:bg-blue-900'
        : '';
}
