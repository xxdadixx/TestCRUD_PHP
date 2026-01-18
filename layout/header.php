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

    <!-- Global Base URL -->
    <script>
        window.APP_BASE_URL = "<?= $BASE_URL ?>";
    </script>
</head>

<body class="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition min-h-screen flex flex-col">
    <main class="flex-grow">
        <div class="container mx-auto mt-10 px-4 lg:px-6">
            <div class="flex justify-end mb-4">
                <button id="toggleDark" aria-label="Switch to Dark Mode">
                    
                </button>
            </div>