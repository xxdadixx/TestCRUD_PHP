<?php
// 1. เปิดแสดง Error แบบเต็มสูบ
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 2. เรียกไฟล์แบบ Path ชัดเจน (ใช้ __DIR__ ป้องกัน Path เพี้ยน)
require_once __DIR__ . "/../config/database.php";
require_once __DIR__ . "/../layout/header.php";

// ลองเช็คไฟล์นี้ว่ามีอยู่จริงไหมก่อนเรียก
$formatePath = __DIR__ . "/api/formate.php";
if (file_exists($formatePath)) {
    require_once $formatePath;
} else {
    echo "หาไฟล์ formate.php ไม่เจอที่: " . $formatePath;
    exit;
}
?>

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
            <input type="text" id="searchInput" placeholder="Search..."
                class="pl-12 pr-12 rounded-full h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 w-12 md:w-40 focus:w-64 md:focus:w-96 cursor-pointer focus:cursor-text transition-all duration-500 ease-in-out"
                onfocus="this.placeholder = 'Type to search...'" onblur="this.placeholder = 'Search...'">
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 delay-100">
                <kbd class="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-[10px] font-sans font-medium text-gray-400 dark:text-gray-500"><span class="text-xs">⌘</span>K</kbd>
            </div>
        </div>

        <?php if (!empty($_GET['search'])): ?>
            <a href="index.php" class="text-sm text-gray-500 hover:text-red-500 whitespace-nowrap">✕ Clear</a>
        <?php endif; ?>

        <div class="flex items-center gap-3">
            <button onclick="openAddCustomer()"
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-blue-500/30 transition-all whitespace-nowrap flex items-center gap-2">
                <i data-lucide="plus" class="w-4 h-4"></i>
                Add Customer
            </button>
            <button onclick="exportData()"
                class="bg-green-600 text-white rounded-full">
                <i data-lucide="download" class="w-4 h-4"></i>
                Export CSV
            </button>
        </div>

    </div>
</div>

<div class="w-full mt-4 pb-24">
    <div class="aurora-container">
        <div class="aurora-orb"></div>
        <div class="overflow-x-auto rounded-xl shadow bg-white dark:bg-gray-800 overflow-x-auto custom-scrollbar">
            <table id="customerTable" class="w-full text-left border-collapse">
                <thead class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <tr class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
                        <th class="p-3 text-center w-16 text-gray-500 font-semibold">
                            No.
                        </th>
                        <th class="p-3 text-left w-20 sortable group" data-column="customer_id">
                            <div class="flex items-center gap-1 cursor-pointer">
                                ID <span class="sort-icon"></span>
                            </div>
                        </th>
                        <th class="p-3 text-left w-[140px] sortable group" data-column="customer_code">
                            <div class="flex items-center gap-1 cursor-pointer">Code <span class="sort-icon"></span></div>
                        </th>
                        <th class="p-3 text-left w-[220px] sortable group" data-column="first_name">
                            <div class="flex items-center gap-1 cursor-pointer">Name <span class="sort-icon"></span></div>
                        </th>
                        <th class="p-3 text-left w-24 sortable group" data-column="gender">
                            <div class="flex items-center gap-1 cursor-pointer">Gender <span class="sort-icon"></span></div>
                        </th>
                        <th class="p-3 text-left w-32 sortable group" data-column="date_of_birth">
                            <div class="flex items-center gap-1 cursor-pointer">DOB <span class="sort-icon"></span></div>
                        </th>
                        <th class="p-3 text-left w-[160px]">National ID</th>
                        <th class="p-3 text-center w-28 sortable group" data-column="status_name">
                            <div class="flex items-center justify-center gap-1 cursor-pointer">Status <span class="sort-icon"></span></div>
                        </th>
                        <th class="p-3 text-left w-36 sortable group" data-column="create_at">
                            <div class="flex items-center gap-1 cursor-pointer">Created <span class="sort-icon"></span></div>
                        </th>
                        <th class="p-3 text-left w-36 sortable group" data-column="update_at">
                            <div class="flex items-center gap-1 cursor-pointer">Updated <span class="sort-icon"></span></div>
                        </th>
                        <th class="p-3 text-center w-24 sticky right-0 bg-gray-50 dark:bg-gray-700 shadow-l z-10">Action</th>
                    </tr>
                </thead>
                <tbody id="tableBody"></tbody>
            </table>
        </div>
    </div>
    <div id="pagination" class="flex justify-center mt-4 mb-4"></div>
</div>

<script>
    lucide.createIcons();
</script>

<script type="module" src="<?= $BASE_URL ?>/assets/js/customer.js?v=<?= time() ?>"></script>

<?php require "../layout/footer.php"; ?>