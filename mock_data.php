<?php
// mock_data.php
require_once 'config/database.php';

// ตั้งค่าจำนวนที่ต้องการ
$LIMIT = 500; 
$photosDir = "photos/";

// ชุดข้อมูลสำหรับสุ่ม (ชื่อ-นามสกุล ตาม RegExp)
$firstNames = ['Somchai', 'Somsak', 'Manee', 'Mana', 'Chujai', 'Piti', 'Veera', 'Suda', 'Nadech', 'Yaya', 'Mario', 'Davika', 'Bambam', 'Lisa', 'Ten', 'Jackson', 'Mark', 'Jeno', 'Jaemin', 'Renjun'];
$lastNames = ['Jaidee', 'Meechai', 'Rakchat', 'Srimuang', 'Wongamat', 'Horvejkul', 'Manoban', 'Lee', 'Wang', 'Tuan', 'Na Ranong', 'Kittiporn', 'Suwannarat', 'Charoenpura', 'Kukimiya', 'Hoone', 'Potter', 'Stark', 'Rogers', 'Romanoff'];
$genders = ['Male', 'Female', 'Unspecified'];

// ตรวจสอบโฟลเดอร์รูป
if (!file_exists($photosDir)) mkdir($photosDir, 0777, true);

echo "<h2>🚀 Starting Mock Data Generation ($LIMIT records)...</h2><hr>";

try {
    // 0. สร้างตารางถ้ายังไม่มี (ป้องกัน Error Table doesn't exist)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS customer_status (
            status_id INT PRIMARY KEY AUTO_INCREMENT,
            status_name VARCHAR(50) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // เช็คว่ามี Status หรือยัง ถ้าไม่มีให้เพิ่ม
    $stmtStatus = $pdo->query("SELECT COUNT(*) FROM customer_status");
    if ($stmtStatus->fetchColumn() == 0) {
        $pdo->exec("INSERT INTO customer_status (status_id, status_name) VALUES (1, 'Active'), (2, 'Inactive')");
        echo "<p>✅ Created default statuses.</p>";
    }

    // สร้างตาราง Customer (ถ้ายังไม่มี)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS customer (
            customer_id INT PRIMARY KEY AUTO_INCREMENT,
            customer_code VARCHAR(20),
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            gender VARCHAR(20),
            date_of_birth DATE,
            national_id VARCHAR(20),
            status_id INT,
            photo VARCHAR(255),
            create_at DATETIME,
            update_at DATETIME
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $pdo->beginTransaction();

    // เตรียม SQL Insert
    $sql = "INSERT INTO customer 
            (customer_code, first_name, last_name, gender, date_of_birth, national_id, status_id, photo, create_at, update_at) 
            VALUES 
            (:code, :fname, :lname, :gender, :dob, :nid, :status, :photo, NOW(), NOW())";
    
    $stmt = $pdo->prepare($sql);

    for ($i = 1; $i <= $LIMIT; $i++) {
        // 1. สุ่มข้อมูลพื้นฐาน
        $fname = $firstNames[array_rand($firstNames)] . " " . chr(rand(65, 90)); // เติมตัวย่อให้ไม่ซ้ำ
        $lname = $lastNames[array_rand($lastNames)];
        $gender = $genders[array_rand($genders)];
        
        // 2. สุ่มวันเกิด (18 - 60 ปี)
        $timestamp = mt_rand(strtotime('-60 years'), strtotime('-18 years'));
        $dob = date("Y-m-d", $timestamp);

        // 3. สุ่มเลขบัตรประชาชน (13 หลัก)
        $nid = "";
        for($j=0; $j<13; $j++) $nid .= rand(0,9);

        // 4. Generate รหัสลูกค้า
        $code = "MOCK-" . str_pad($i, 4, '0', STR_PAD_LEFT);

        // 5. 🔥 สร้างรูปภาพจำลอง (Mock Image)
        // สร้างรูปสีพื้นๆ พร้อมตัวอักษรชื่อย่อ
        $photoName = "mock_user_{$i}.png"; // ใช้ PNG เพราะสร้างง่าย
        $photoPath = $photosDir . $photoName;
        
        // ถ้ายังไม่มีรูป ให้สร้างใหม่ (ใช้ GD Library)
        if (!file_exists($photoPath)) {
            $im = @imagecreate(200, 200) or die("GD Library missing");
            // สุ่มสีพื้นหลัง
            $bg = imagecolorallocate($im, rand(50, 200), rand(50, 200), rand(50, 200));
            // สีตัวอักษร (ขาว)
            $text_color = imagecolorallocate($im, 255, 255, 255);
            // เขียนตัวเลขลงไป
            imagestring($im, 5, 80, 90, "#$i", $text_color);
            imagepng($im, $photoPath);
            imagedestroy($im);
        }

        // 6. Execute
        $stmt->execute([
            ':code' => $code,
            ':fname' => $fname,
            ':lname' => $lname,
            ':gender' => $gender,
            ':dob' => $dob,
            ':nid' => $nid,
            ':status' => rand(1, 2), // 1=Active, 2=Inactive
            ':photo' => $photoName
        ]);
    }

    $pdo->commit();
    echo "<h3 style='color: green;'>✅ Success! $LIMIT records created.</h3>";
    echo "<a href='index.php'>Go to Home</a>";

} catch (Exception $e) {
    $pdo->rollBack();
    echo "<h3 style='color: red;'>❌ Error: " . $e->getMessage() . "</h3>";
}
?>