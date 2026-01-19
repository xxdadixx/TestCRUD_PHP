<?php
require "../config/database.php";
require "../layout/header.php";

$id = $_GET['id'] ?? null;

$stmt = $pdo->prepare("SELECT * FROM customer WHERE customer_id = ?");
$stmt->execute([$id]);
$customer = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$customer) {
    echo "<div class='container mx-auto mt-10 text-center text-red-500'>Customer not found</div>";
    require "../layout/footer.php";
    exit;
}
?>

<div class="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
    <h1 class="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Edit Customer</h1>

    <form id="editForm" class="space-y-6">
        <input type="hidden" id="customer_id" value="<?= $customer['customer_id'] ?>">

        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Code</label>
            <input id="customer_code" class="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-500 cursor-not-allowed"
                value="<?= htmlspecialchars($customer['customer_code']) ?>" disabled>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                <input id="first_name" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value="<?= htmlspecialchars($customer['first_name']) ?>" placeholder="First Name">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                <input id="last_name" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value="<?= htmlspecialchars($customer['last_name']) ?>" placeholder="Last Name">
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                <select id="gender" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <?php foreach (['Male', 'Female', 'Unspecified'] as $g): ?>
                        <option value="<?= $g ?>" <?= $customer['gender'] === $g ? 'selected' : '' ?>><?= $g ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                <input id="date_of_birth" type="date" max="<?= date('Y-m-d') ?>"
                    value="<?= $customer['date_of_birth'] ?>"
                    class="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">National ID</label>
                <input id="national_id" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    value="<?= $customer['national_id'] ?>" placeholder="x-xxxx-xxxxx-xx-x" maxlength="17" oninput="formatNationalId(this)">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select id="status_id" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <?php
                    $statuses = $pdo->query("SELECT * FROM customer_status")->fetchAll();
                    foreach ($statuses as $s):
                    ?>
                        <option value="<?= $s['status_id'] ?>" <?= $customer['status_id'] == $s['status_id'] ? 'selected' : '' ?>>
                            <?= $s['status_name'] ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>

        <div class="flex items-center gap-4 pt-4">
            <button type="button" onclick="confirmUpdate()"
                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-lg shadow-blue-500/30">
                Save Changes
            </button>
            <a href="index.php" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium">Cancel</a>
        </div>
    </form>
</div>

<script src="<?= $BASE_URL ?>/assets/js/api.js"></script>
<script src="<?= $BASE_URL ?>/assets/js/customer.js"></script>

<script>
    async function confirmUpdate() {
        const data = {
            customer_id: document.getElementById("customer_id").value,
            first_name: document.getElementById("first_name").value.trim(),
            last_name: document.getElementById("last_name").value.trim(),
            gender: document.getElementById("gender").value,
            date_of_birth: document.getElementById("date_of_birth").value,
            national_id: document.getElementById("national_id").value.replace(/-/g, ""),
            status_id: document.getElementById("status_id").value,
        };

        if (!data.first_name || !data.last_name) {
            Swal.fire("Error", "Name is required", "error");
            return;
        }

        try {
            const res = await fetch(API.customer.update, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (result.status === 'success') {
                Swal.fire({
                    title: "Success",
                    text: "Customer updated successfully",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = "index.php"; // เด้งกลับหน้าแรก
                });
            } else {
                Swal.fire("Error", result.message, "error");
            }
        } catch (err) {
            Swal.fire("Error", "Cannot connect to server", "error");
        }
    }
</script>

<?php require "../layout/footer.php"; ?>