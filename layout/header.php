<?php
// layout/header.php
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
    <title>Customer Manager</title>

    <script>
        window.APP_BASE_URL = "<?php echo $BASE_URL; ?>";
    </script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link rel="stylesheet" href="<?= $BASE_URL ?>/assets/css/swal-dark.css">
    <link rel="stylesheet" href="<?= $BASE_URL ?>/assets/css/main.css?v=<?= time() ?>">
    <script src="<?= $BASE_URL ?>/assets/js/theme.js"></script>

    <style>
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 4px;
        }

        .dark ::-webkit-scrollbar-thumb {
            background: #4b5563;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
        }
    </style>
</head>

<body class="bg-[#f5f5f7] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-300 min-h-screen flex flex-col font-sans antialiased">

    <div id="global-loader" class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f5f5f7]/80 dark:bg-[#000]/80 backdrop-blur-md transition-opacity duration-500">
        <div class="relative flex items-center justify-center">
            <i data-lucide="loader-2" class="w-12 h-12 text-gray-400 dark:text-gray-500 animate-spin"></i>
        </div>
        <p class="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide animate-pulse">Loading...</p>
    </div>

    <script>
        window.showLoader = () => {
            const l = document.getElementById('global-loader');
            if (l) l.classList.remove('opacity-0', 'pointer-events-none');
        };
        window.hideLoader = () => {
            const l = document.getElementById('global-loader');
            if (l) l.classList.add('opacity-0', 'pointer-events-none');
        };
        window.addEventListener('load', () => setTimeout(window.hideLoader, 600));
    </script>

    <nav class="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-[#1c1c1e]/70 backdrop-blur-xl transition-all duration-300">
        <div class="w-full px-4 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex-shrink-0 flex items-center">
                    <a href="<?= $BASE_URL ?>/index.php" class="flex items-center gap-3 group">
                        <div class="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg shadow-blue-500/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform duration-300">
                            <i data-lucide="users" class="w-5 h-5"></i>
                        </div>
                        <div class="flex flex-col">
                            <span class="font-bold text-base leading-tight tracking-tight text-gray-900 dark:text-white group-hover:opacity-80 transition-opacity">
                                Customer Manager
                            </span>
                            <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                System Database
                            </span>
                        </div>
                    </a>
                </div>

                <div class="hidden md:flex items-center space-x-1">
                    <a href="<?= $BASE_URL ?>/index.php" class="px-4 py-2 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all">Home</a>
                    <a href="<?= $BASE_URL ?>/customers/index.php" class="px-4 py-2 rounded-full text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">Customers</a>
                </div>

                <div class="flex items-center gap-3">
                    <button id="toggleDark" class="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors">
                        <i data-lucide="moon" class="w-5 h-5"></i>
                    </button>

                    <div class="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                        <div class="text-right">
                            <p class="text-xs font-semibold text-gray-900 dark:text-white">Admin</p>
                            <p class="text-[10px] text-gray-500">Super User</p>
                        </div>
                        <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-white dark:border-gray-600 shadow-sm">
                            <i data-lucide="user" class="w-4 h-4 text-gray-500 dark:text-gray-300"></i>
                        </div>
                    </div>

                    <button id="mobile-menu-btn" class="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <i data-lucide="menu" class="w-6 h-6"></i>
                    </button>
                </div>
            </div>
        </div>

        <div id="mobile-menu" class="hidden md:hidden border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl">
            <div class="px-4 pt-3 pb-4 space-y-2">
                <a href="<?= $BASE_URL ?>/index.php" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Home</a>
                <a href="<?= $BASE_URL ?>/customers/index.php" class="block px-3 py-2 rounded-md text-base font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">Customers</a>
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

    <div class="w-full max-w-full px-4 lg:px-8 pb-12 pt-8">