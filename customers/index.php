<?php
require "../config/database.php";
require "../layout/header.php";
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

?>

<link rel="stylesheet" href="<?= $BASE_URL ?>/assets/css/table.css">

<div class="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
    <div>
        <h1 class="text-4xl font-bold tracking-tight mb-1">
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Customer List
            </span>
        </h1>
        <p class="mt-1 text-lg text-gray-500 dark:text-gray-400 font-normal">
            Manage your customers and organize data efficiently.
        </p>
    </div>

    <div class="flex gap-3 w-full lg:w-auto items-center justify-end">
        <div class="relative group">
            <div class="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none">
                <i data-lucide="search" class="h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors"></i>
            </div>

            <input
                type="text"
                id="searchInput"
                placeholder="Search..."
                class="
                /* Layout & Spacing */
                pl-10 pr-12 py-2 rounded-full
                
                /* Colors & Borders */
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                text-gray-700 dark:text-gray-200
                shadow-sm
                placeholder-gray-400
                
                /* Focus State */
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                
                /* ✨ Animation Magic ✨ */
                w-12 md:w-40               /* ปกติ: กว้างแค่นี้ (หุบ) */
                focus:w-64 md:focus:w-96   /* ตอนกด: ยืดออก (ขยาย) */
                cursor-pointer focus:cursor-text /* ให้รู้ว่ากดได้ */
                transition-all duration-500 ease-in-out /* อนิเมชั่นนุ่มๆ */
            "
                onfocus="this.placeholder = 'Type to search customer...'"
                onblur="this.placeholder = 'Search...'">

            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 delay-100">
                <kbd class="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-[10px] font-sans font-medium text-gray-400 dark:text-gray-500">
                    <span class="text-xs">⌘</span>K
                </kbd>
            </div>
        </div>

        <?php if (!empty($_GET['search'])): ?>
            <a href="index.php" class="text-sm text-gray-500 hover:text-red-500 whitespace-nowrap">
                ✕ Clear
            </a>
        <?php endif; ?>

        <button onclick="openAddCustomer()"
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-blue-500/30 transition-all whitespace-nowrap">
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
                    <tr class="whitespace-nowrap border-t border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition">
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
<script src="<?= $BASE_URL ?>/assets/js/customer.js?v=2"></script>
<script>
    lucide.createIcons();
</script>


<?php require "../layout/footer.php"; ?>