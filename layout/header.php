<?php
$scriptName = $_SERVER['SCRIPT_NAME'];
$baseDir = dirname($scriptName);

if (str_ends_with($baseDir, '/customers')) {
    $baseDir = str_replace('/customers', '', $baseDir);
}

$BASE_URL = $baseDir === '/' ? '' : $baseDir;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer CRUD</title>

    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
                    },
                    colors: {
                        'apple-gray': '#f5f5f7',
                        'apple-dark': '#1c1c1e',
                        'apple-blue': '#0071e3',
                    }
                }
            }
        }
    </script>

    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link rel="stylesheet" href="<?= $BASE_URL ?>/assets/css/swal-dark.css">
    <link rel="stylesheet" href="<?= $BASE_URL ?>/assets/css/table.css?v=<?= time() ?>">
    <script src="<?= $BASE_URL ?>/assets/js/theme.js"></script>

    <script>
        window.APP_BASE_URL = "<?= $BASE_URL ?>";
    </script>
    
    <style>
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .dark ::-webkit-scrollbar-thumb { background: #4b5563; }
        ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
    </style>
</head>

<body class="bg-[#f5f5f7] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-300 min-h-screen flex flex-col font-sans antialiased">

    <nav class="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-gray-800/50
                bg-white/70 dark:bg-[#1c1c1e]/70 backdrop-blur-xl transition-all duration-300">
        <div class="w-full px-4 lg:px-8">
            <div class="flex justify-between items-center h-14">
                <div class="flex-shrink-0 flex items-center">
                    <a href="<?= $BASE_URL ?>/index.php" class="flex items-center gap-2 group">
                        <div class="bg-black dark:bg-white text-white dark:text-black p-1.5 rounded-lg group-hover:scale-105 transition-transform">
                            <i data-lucide="layout-grid" class="w-5 h-5"></i>
                        </div>
                        <span class="font-semibold text-lg tracking-tight group-hover:opacity-80 transition-opacity">
                            My App
                        </span>
                    </a>
                </div>

                <div class="hidden md:flex space-x-1">
                    <a href="<?= $BASE_URL ?>/index.php" class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all">Home</a>
                    <a href="<?= $BASE_URL ?>/customers/index.php" class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all">Customers</a>
                </div>

                <div class="flex items-center gap-2">
                    <button id="toggleDark" class="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors">
                        <i data-lucide="moon" class="w-5 h-5"></i>
                    </button>
                    <button id="mobile-menu-btn" class="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <i data-lucide="menu" class="w-6 h-6"></i>
                    </button>
                </div>
            </div>
        </div>

        <div id="mobile-menu" class="hidden md:hidden border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl">
            <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <a href="<?= $BASE_URL ?>/index.php" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Home</a>
                <a href="<?= $BASE_URL ?>/customers/index.php" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Customers</a>
            </div>
        </div>
    </nav>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const btn = document.getElementById('mobile-menu-btn');
            const menu = document.getElementById('mobile-menu');
            if (btn && menu) btn.addEventListener('click', () => menu.classList.toggle('hidden'));
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    </script>

    <div class="w-full max-w-full px-4 lg:px-8 pb-12 pt-6">