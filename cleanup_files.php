<?php
// cleanup_files.php
require "config/database.php";

echo "<h2>Cleaning up unused photos...</h2>";

// 1. ดึงรายชื่อรูปที่ใช้งานจริงจาก Database
$stmt = $pdo->query("SELECT photo FROM customer WHERE photo IS NOT NULL AND photo != ''");
$dbPhotos = $stmt->fetchAll(PDO::FETCH_COLUMN);

// 2. ดึงรายชื่อไฟล์ทั้งหมดในโฟลเดอร์ photos
$folder = "photos/";
$files = scandir($folder);
$deletedCount = 0;

foreach ($files as $file) {
    if ($file === '.' || $file === '..') continue; // ข้าม . และ ..

    // ถ้าไฟล์ในโฟลเดอร์ ไม่มีชื่ออยู่ใน Database -> ลบทิ้งเลย
    if (!in_array($file, $dbPhotos)) {
        if (unlink($folder . $file)) {
            echo "Deleted junk file: $file <br>";
            $deletedCount++;
        }
    }
}

echo "<hr><h3>Cleanup Complete! Deleted $deletedCount files.</h3>";