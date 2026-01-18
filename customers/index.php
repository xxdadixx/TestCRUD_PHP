<?php
require "../config/database.php";
require "../layout/header.php";
require "../customers/api/table_sort.php";
require "../customers/api/formate.php";

$columnIndexMap = [
    'customer_id'   => 1,
    'customer_code' => 2,
    'first_name'    => 3,
    'gender'        => 4,
    'date_of_birth' => 5,
    'national_id'   => 6,
    'status_name'   => 7,
    'create_at'     => 8,
    'update_at'     => 9
];

$activeColIndex = $isSorted
    ? ($columnIndexMap[$sort] ?? null)
    : null;

?>

<div class="flex justify-between items-center mb-4">
    <h1 class="text-2xl font-bold">Customer List</h1>

    <div class="flex gap-3 w-full lg:w-auto">
        <!-- Search -->
        <input
            type="text"
            id="searchInput"
            placeholder="Search customer..."
            class="w-full lg:w-64 px-4 py-2 rounded-lg
                    bg-white dark:bg-gray-700
                    border border-gray-300 dark:border-gray-600
                    focus:ring-2 focus:ring-blue-500">

        <!-- Search Icon -->
        <span class="absolute right-3 top-2.5 text-gray-400">
            🔍
        </span>

        <?php if (!empty($_GET['search'])): ?>
            <a href="index.php"
                class="text-sm text-gray-500 hover:text-red-500 ml-3">
                ✕ Clear search
            </a>
        <?php endif; ?>

        <!-- Add -->
        <button onclick="openAddCustomer()"
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            + Add Customer
        </button>
    </div>
</div>

<div class="container mx-auto mt-10 px-4 pb-24">
    <!-- TABLE WRAPPER -->
    <div class="aurora-container">
        <div class="aurora-orb"></div>
        <div class="rounded-xl shadow bg-white dark:bg-gray-800 overflow-x-auto">
            <table class="min-w-full">
                <thead class="bg-gray-200 dark:bg-gray-700">
                    <tr class="border-t border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition">
                        <th class="p-3 text-center">No.</th>
                        <th class="p-3 text-center sortable" data-column="customer_id">
                            ID <span class="sort-icon"></span>
                        </th>
                        <th class="p-3 text-left sortable" data-column="customer_code">
                            Customer Code <span class="sort-icon"></span>
                        </th>
                        <th class="p-3 text-left sortable" data-column="first_name">
                            Name <span class="sort-icon"></span>
                        </th>
                        <th class="p-3 text-left sortable" data-column="gender">
                            Gender <span class="sort-icon"></span>
                        </th>
                        <th class="p-3 text-left sortable" data-column="date_of_birth">
                            Date of Birth <span class="sort-icon"></span>
                        </th>
                        <th class="p-3 text-left">National ID</th>
                        <th class="p-3 text-left sortable" data-column="status_name">
                            Status <span class="sort-icon"></span>
                        </th>
                        <th class="p-3 text-left sortable" data-column="create_at">
                            Created <span class="sort-icon"></span>
                        </th>
                        <th class="p-3 text-left sortable" data-column="update_at">
                            Updated <span class="sort-icon"></span>
                        </th>
                        <th class="p-3 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody id="tableBody">
                </tbody>
            </table>
        </div>
    </div>
    <div id="pagination" class="flex justify-center mt-4 mb-4"></div>
</div>

<script src="<?= $BASE_URL ?>/assets/js/api.js"></script>
<script src="<?= $BASE_URL ?>/assets/js/customer.js"></script>
<script>
    lucide.createIcons();
</script>


<?php require "../layout/footer.php"; ?>