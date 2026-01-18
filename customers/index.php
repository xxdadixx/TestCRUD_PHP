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
                pl-12 pr-12 rounded-full h-12
                
                /* 🔥 เพิ่ม h-12 เพื่อให้สูงเท่ากับความกว้าง (48px) เป็นวงกลมเป๊ะ */
                /* 🔥 เปลี่ยน pl-10 เป็น pl-12 ให้พ้นระยะไอคอน */

                /* Colors & Borders */
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                text-gray-700 dark:text-gray-200
                shadow-sm
                placeholder-gray-400
                
                /* Focus State */
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                
                /* Animation Magic */
                w-12 md:w-40               
                focus:w-64 md:focus:w-96   
                cursor-pointer focus:cursor-text
                transition-all duration-500 ease-in-out
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
                <thead class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <tr class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">

                        <th class="p-3 text-center w-16">No.</th>

                        <th class="p-3 text-center w-20 sortable group" data-column="customer_id">
                            <div class="flex items-center justify-center gap-1 cursor-pointer">
                                ID <span class="sort-icon"></span>
                            </div>
                        </th>

                        <th class="p-3 text-left w-[140px] sortable group" data-column="customer_code">
                            <div class="flex items-center gap-1 cursor-pointer">
                                Code <span class="sort-icon"></span>
                            </div>
                        </th>

                        <th class="p-3 text-left w-[220px] sortable group" data-column="first_name">
                            <div class="flex items-center gap-1 cursor-pointer">
                                Name <span class="sort-icon"></span>
                            </div>
                        </th>

                        <th class="p-3 text-left w-24 sortable group" data-column="gender">
                            <div class="flex items-center gap-1 cursor-pointer">
                                Gender <span class="sort-icon"></span>
                            </div>
                        </th>

                        <th class="p-3 text-left w-32 sortable group" data-column="date_of_birth">
                            <div class="flex items-center gap-1 cursor-pointer">
                                DOB <span class="sort-icon"></span>
                            </div>
                        </th>

                        <th class="p-3 text-left w-[160px]">National ID</th>

                        <th class="p-3 text-center w-28 sortable group" data-column="status_name">
                            <div class="flex items-center justify-center gap-1 cursor-pointer">
                                Status <span class="sort-icon"></span>
                            </div>
                        </th>

                        <th class="p-3 text-left w-36 sortable group" data-column="create_at">
                            <div class="flex items-center gap-1 cursor-pointer">
                                Created <span class="sort-icon"></span>
                            </div>
                        </th>

                        <th class="p-3 text-left w-36 sortable group" data-column="update_at">
                            <div class="flex items-center gap-1 cursor-pointer">
                                Updated <span class="sort-icon"></span>
                            </div>
                        </th>

                        <th class="p-3 text-center w-24 sticky right-0 bg-gray-50 dark:bg-gray-700 shadow-l z-10">
                            Action
                        </th>
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