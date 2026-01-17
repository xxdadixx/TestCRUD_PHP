<?php
require "../config/database.php";
require "../layout/header.php";

$id = $_GET['id'] ?? null;

$stmt = $pdo->prepare("
    SELECT c.*, s.status_name
    FROM customer c
    JOIN customer_status s ON c.status_id = s.status_id
    WHERE c.customer_id = ?
");
$stmt->execute([$id]);
$customer = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$customer) {
    echo "<p class='text-red-500'>Customer not found</p>";
    exit;
}
?>

<h1 class="text-2xl font-bold mb-6">Edit Customer</h1>

<form id="editForm" class="bg-white p-6 rounded shadow space-y-4">

    <input type="hidden" id="customer_id" value="<?= $customer['customer_id'] ?>">

    <div>
        <label>Customer Code</label>
        <input class="w-full border p-2 rounded"
               value="<?= htmlspecialchars($customer['customer_code']) ?>" disabled>
    </div>

    <div class="grid grid-cols-2 gap-4">
        <input id="first_name" class="border p-2 rounded"
               value="<?= htmlspecialchars($customer['first_name']) ?>" placeholder="First Name">
        <input id="last_name" class="border p-2 rounded"
               value="<?= htmlspecialchars($customer['last_name']) ?>" placeholder="Last Name">
    </div>

    <select id="gender" class="w-full border p-2 rounded">
        <?php foreach (['Male', 'Female', 'Unspecified'] as $g): ?>
            <option value="<?= $g ?>" <?= $customer['gender'] === $g ? 'selected' : '' ?>>
                <?= $g ?>
            </option>
        <?php endforeach; ?>
    </select>

    <input id="date_of_birth" type="date"
           max="<?= date('Y-m-d') ?>"
           value="<?= $customer['date_of_birth'] ?>"
           class="w-full border p-2 rounded">

    <input id="national_id" class="w-full border p-2 rounded"
           value="<?= $customer['national_id'] ?>" placeholder="National ID">

    <select id="status_id" class="w-full border p-2 rounded">
        <?php
        $statuses = $pdo->query("SELECT * FROM customer_status")->fetchAll();
        foreach ($statuses as $s):
        ?>
            <option value="<?= $s['status_id'] ?>"
                <?= $customer['status_id'] == $s['status_id'] ? 'selected' : '' ?>>
                <?= $s['status_name'] ?>
            </option>
        <?php endforeach; ?>
    </select>

    <button type="button" onclick="confirmUpdate()"
        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
        Save Changes
    </button>

    <a href="index.php" class="ml-3 text-gray-600">Cancel</a>
</form>

<script src="<?= $BASE_URL ?>/assets/js/api.js"></script>
<script src="<?= $BASE_URL ?>/assets/js/customer.js"></script>

<?php require "../layout/footer.php"; ?>
