<?php
function formatNationalId($id)
{
    if (strlen($id) !== 13) return $id;

    return preg_replace(
        '/^(\d)(\d{4})(\d{5})(\d{2})(\d)$/',
        '$1-$2-$3-$4-$5',
        $id
    );
}
?>

<?php
require "../config/database.php";
require "../layout/header.php";

$customers = $pdo->query("
    SELECT 
        c.*,
        s.status_name
    FROM customer c
    JOIN customer_status s ON c.status_id = s.status_id
")->fetchAll(PDO::FETCH_ASSOC);
?>

<div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Customer List</h1>

    <button onclick="openAddCustomer()"
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
        + Add Customer
    </button>
</div>

<div class="rounded-xl shadow overflow-hidden
            bg-white dark:bg-gray-800">
    <table class="w-full">
        <thead class="bg-gray-200 dark:bg-gray-700">
            <tr class="border-t border-gray-200 dark:border-gray-700
           hover:bg-blue-50 dark:hover:bg-gray-700 transition">
                <th class="p-3 text-left">No.</th>
                <th class="p-3 text-left">ID</th>
                <th class="p-3 text-left">Code</th>
                <th class="p-3 text-left">Name</th>
                <th class="p-3 text-left">Gender</th>
                <th class="p-3 text-left">Date of Birth</th>
                <th class="p-3 text-left">National ID</th>
                <th class="p-3 text-left">Status</th>
                <th class="p-3 text-left">Created</th>
                <th class="p-3 text-left">Updated</th>
                <th class="p-3 text-center">Actions</th>
            </tr>
        </thead>
        <tbody>
            <?php $i = 1; ?>
            <?php foreach ($customers as $c): ?>
                <tr class="border-t border-gray-200 dark:border-gray-700
           hover:bg-blue-50 dark:hover:bg-gray-700 transition">
                    <td class="p-3"><?= $i++ ?></td>
                    <td class="p-3"><?= htmlspecialchars($c['customer_id']) ?></td>
                    <td class="p-3"><?= htmlspecialchars($c['customer_code']) ?></td>
                    <td class="p-3">
                        <?= htmlspecialchars($c['first_name']) ?>
                        <?= htmlspecialchars($c['last_name']) ?>
                    </td>
                    <td class="p-3"><?= htmlspecialchars($c['gender']) ?></td>
                    <td class="p-3"><?= htmlspecialchars($c['date_of_birth']) ?></td>
                    <td class="p-3 font-mono">
                        <?= formatNationalId(htmlspecialchars($c['national_id'])) ?>
                    </td>
                    <td class="p-3">
                        <?php
                        $status = $c['status_name'];

                        $statusClass = match ($status) {
                            'Active' => 'bg-green-100 text-green-800',
                            'Inactive' => 'bg-yellow-100 text-yellow-800',
                            default => 'bg-gray-100 text-gray-800'
                        };
                        ?>

                        <span class="px-3 py-1 rounded-full text-sm font-semibold <?= $statusClass ?>">
                            <?= htmlspecialchars($status) ?>
                        </span>
                    </td>
                    <td class="p-3"><?= htmlspecialchars($c['create_at']) ?></td>
                    <td class="p-3"><?= htmlspecialchars($c['update_at']) ?></td>
                    <td class="p-3 text-center space-x-3">
                        <button
                            onclick="openEditCustomer(<?= $c['customer_id'] ?>)"
                            class="text-blue-600 hover:underline">
                            Edit
                        </button>

                        <button onclick="confirmDelete(<?= $c['customer_id'] ?>)"
                            class="text-red-600 hover:underline">
                            Delete
                        </button>
                    </td>
                </tr>
            <?php endforeach; ?>

            <?php if (count($customers) === 0): ?>
                <tr>
                    <td colspan="11" class="p-4 text-center text-gray-500">
                        No customers found
                    </td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>
</div>

<script src="<?= $BASE_URL ?>/assets/js/api.js"></script>
<script src="<?= $BASE_URL ?>/assets/js/customer.js"></script>

<?php require "../layout/footer.php"; ?>