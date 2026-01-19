<?php
$scriptName = $_SERVER['SCRIPT_NAME'];
$baseDir = dirname($scriptName);

// ถ้าอยู่ใน /customers ให้ตัดออก
if (str_ends_with($baseDir, '/customers')) {
    $baseDir = str_replace('/customers', '', $baseDir);
}

$BASE_URL = $baseDir === '/' ? '' : $baseDir;
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Customer CRUD</title>

    <!-- Tailwind -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Tailwind Config -->
    <script>
        tailwind.config = {
            darkMode: 'class'
        }
    </script>

    <!-- Lucide CDN -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <!-- SweetAlert2 -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <!-- SweetAlert Dark Mode -->
    <link rel="stylesheet" href="<?= $BASE_URL ?>/assets/css/swal-dark.css">

    <!-- Table Sort Highligh -->
    <link rel="stylesheet" href="<?= $BASE_URL ?>/assets/css/table.css">

    <!-- Theme Toggle Script -->
    <script src="<?= $BASE_URL ?>/assets/js/theme.js"></script>

    <!-- Global Base URL -->
    <script>
        window.APP_BASE_URL = "<?= $BASE_URL ?>";
    </script>
</head>

<body class="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition min-h-screen flex flex-col">
    <nav class="bg-white dark:bg-gray-800 shadow p-4 mb-6">
        <div class="container mx-auto flex justify-between items-center">
            <a href="<?= $BASE_URL ?>/index.php" class="text-xl font-bold text-blue-600 dark:text-blue-400">
                My App
            </a>

            <button id="mobile-menu-btn" class="md:hidden p-2 text-gray-600 dark:text-gray-300">
                <i data-lucide="menu"></i>
            </button>

            <div class="hidden md:flex gap-6 items-center">
                <a href="<?= $BASE_URL ?>/index.php" class="hover:text-blue-500 font-medium">Home</a>
                <a href="<?= $BASE_URL ?>/customers/index.php" class="hover:text-blue-500 font-medium">Customers</a>
            </div>
        </div>

        <div id="mobile-menu" class="hidden md:hidden flex-col gap-2 mt-4 pb-2 border-t border-gray-100 dark:border-gray-700 pt-2">
            <a href="<?= $BASE_URL ?>/index.php" class="block py-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">Home</a>
            <a href="<?= $BASE_URL ?>/customers/index.php" class="block py-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">Customers</a>
        </div>
    </nav>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const btn = document.getElementById('mobile-menu-btn');
            const menu = document.getElementById('mobile-menu');
            if (btn && menu) {
                btn.addEventListener('click', () => {
                    menu.classList.toggle('hidden');
                });
            }
        });
    </script>
    <main class="flex-grow">
        <div class="container mx-auto mt-10 px-4 lg:px-6">
            <div class="flex justify-end mb-4">
                <button id="toggleDark" aria-label="Switch to Dark Mode">

                </button>
            </div>