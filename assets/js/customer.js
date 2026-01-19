const nameRegex = /^[A-Za-zก-ฮ\s]{2,50}$/;
const nationalIdRegex = /^\d{13}$/;

/* =========================
   CONFIG
========================= */
const API_URL = "api/customer_fetch.php";
const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("searchInput");

/* =========================
   STATE (DECLARE ONCE)
========================= */
const urlParams = new URLSearchParams(window.location.search);

let currentPage = parseInt(urlParams.get("page")) || 1;
let currentSearch = urlParams.get("search") || "";
let currentSort = urlParams.get("sort") || "";
let currentOrder = urlParams.get("order") || "ASC";
let debounceTimer = null;

// 🎨 Common Input Style (Apple Design)
const inputClass = "w-full px-3 py-2.5 bg-white dark:bg-[#1c1c1e] border border-[#d1d1d6] dark:border-[#424245] rounded-lg text-[#1d1d1f] dark:text-white focus:ring-4 focus:ring-[#0071e3]/10 focus:border-[#0071e3] transition-all outline-none placeholder-gray-400";
const labelClass = "block text-[11px] font-semibold text-[#86868b] dark:text-[#98989d] uppercase tracking-wider mb-1.5";
const disabledClass = "bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#86868b] cursor-not-allowed";

/* =========================
   PAGINATION (FIXED)
========================= */
function renderPagination(page, totalPages) {
    const container = document.getElementById("pagination");
    if (!container) return;
    container.innerHTML = "";

    // ถ้ามีหน้าเดียว หรือไม่มีข้อมูล ไม่ต้องโชว์
    if (totalPages <= 1) return;

    /* --- Helper สร้างปุ่ม --- */
    const createBtn = (label, targetPage, isActive, isDisabled, isIcon = false) => {
        const btn = document.createElement("button");
        if (isIcon) btn.innerHTML = label; else btn.textContent = label;

        // Base Style: ปุ่มสี่เหลี่ยมมนๆ มีขอบบางๆ (Apple Style)
        let cls = "flex items-center justify-center min-w-[36px] h-[36px] rounded-lg text-sm transition-all border duration-200 ";

        if (isActive) {
            // ✅ หน้าปัจจุบัน: สีฟ้า + เงา
            cls += "bg-blue-600 text-white border-blue-600 font-semibold shadow-md transform scale-105 z-10";
        } else if (isDisabled) {
            // 🚫 ปุ่มกดไม่ได้: สีจางๆ
            cls += "bg-transparent text-gray-300 border-transparent cursor-not-allowed dark:text-gray-700";
        } else {
            // ⚪ ปุ่มปกติ: ขาว ขอบเทา -> hover แล้วฟ้า
            cls += "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-blue-600 hover:shadow-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700";
        }

        btn.className = cls;

        if (!isDisabled && !isActive) {
            btn.onclick = () => loadCustomers(targetPage);
        }
        return btn;
    };

    /* --- 1. ปุ่มย้อนกลับ (<) --- */
    container.appendChild(createBtn(`<i data-lucide="chevron-left" class="w-4 h-4"></i>`, page - 1, false, page === 1, true));

    /* --- 2. Logic คำนวณเลขหน้า (Smart Ellipsis) --- */
    const range = [];
    const delta = 1; // จำนวนหน้าซ้าย-ขวา ของหน้าปัจจุบัน
    const left = page - delta;
    const right = page + delta;

    // วนลูปหาหน้าที่ควรแสดง
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= left && i <= right)) {
            range.push(i);
        }
    }

    let l; // เก็บค่ารอบก่อนหน้า
    for (let i of range) {
        if (l) {
            if (i - l === 2) {
                // ถ้าห่างกัน 2 ให้เติมเลขตรงกลาง (เช่น 1 .. 3 -> เติม 2)
                container.appendChild(createBtn(l + 1, l + 1, false, false));
            } else if (i - l !== 1) {
                // ถ้าห่างกันเยอะ ให้เติม ...
                const span = document.createElement("span");
                span.textContent = "•••";
                span.className = "px-2 text-gray-300 dark:text-gray-600 select-none tracking-widest text-xs self-center";
                container.appendChild(span);
            }
        }
        container.appendChild(createBtn(i, i, i === page, false));
        l = i;
    }

    /* --- 3. ปุ่มถัดไป (>) --- */
    container.appendChild(createBtn(`<i data-lucide="chevron-right" class="w-4 h-4"></i>`, page + 1, false, page === totalPages, true));

    // สร้าง Icon ใหม่
    lucide.createIcons();
}

/* =========================
   ADD CUSTOMER (WITH PHOTO)
========================= */
function openAddCustomer() {
    Swal.fire({
        title: "New Customer",
        width: 600,
        ...swalTheme(),
        html: `
            <div class="text-left space-y-5 px-1">
                
                <div class="flex flex-col items-center gap-3">
                    <div class="relative group">
                        <img id="preview_img_add" src="https://cdn-icons-png.flaticon.com/512/847/847969.png" 
                             class="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg">
                        <label for="photo_input_add" 
                               class="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 shadow-sm transition">
                            <i data-lucide="camera" class="w-4 h-4"></i>
                        </label>
                        <input type="file" id="photo_input_add" class="hidden" accept="image/*" onchange="previewImageAdd(this)">
                    </div>
                    <span class="text-xs text-gray-400">Upload profile picture</span>
                </div>

                <div>
                    <label class="${labelClass}">Customer Code</label>
                    <div class="relative">
                        <input id="customer_code" class="${inputClass} ${disabledClass} font-mono text-sm" 
                               value="Auto Generated" disabled>
                        <div class="absolute inset-y-0 right-3 flex items-center">
                            <i data-lucide="lock" class="w-4 h-4 text-gray-400"></i>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="${labelClass}">First Name</label>
                        <input id="first_name" class="${inputClass}" 
                               placeholder="e.g. Somchai" oninput="allowNameOnly(this)">
                    </div>
                    <div>
                        <label class="${labelClass}">Last Name</label>
                        <input id="last_name" class="${inputClass}" 
                               placeholder="e.g. Jaidee" oninput="allowNameOnly(this)">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="${labelClass}">Gender</label>
                        <select id="gender" class="${inputClass} appearance-none">
                            <option value="Unspecified">Unspecified</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div>
                        <label class="${labelClass}">Date of Birth</label>
                        <input id="date_of_birth" type="date" class="${inputClass}" 
                               max="${new Date().toISOString().split("T")[0]}">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="${labelClass}">National ID</label>
                        <input id="national_id" class="${inputClass} font-mono tracking-wide" 
                               placeholder="x-xxxx-xxxxx-xx-x" maxlength="17" inputmode="numeric" oninput="formatNationalId(this)">
                    </div>
                    <div>
                        <label class="${labelClass}">Status</label>
                        <select id="status_id" class="${inputClass} appearance-none">
                            <option value="1">Active</option>
                            <option value="2">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Create Customer",
        cancelButtonText: "Cancel",
        focusConfirm: false,

        preConfirm: () => {
            const data = {
                customer_code: document.getElementById("customer_code").value.trim(),
                first_name: document.getElementById("first_name").value.trim(),
                last_name: document.getElementById("last_name").value.trim(),
                gender: document.getElementById("gender").value,
                date_of_birth: document.getElementById("date_of_birth").value,
                national_id: document.getElementById("national_id").value.trim(),
                status_id: document.getElementById("status_id").value,
            };

            data.first_name = data.first_name.replace(/\s+/g, " ").trim();
            data.last_name = data.last_name.replace(/\s+/g, " ").trim();

            if (!nameRegex.test(data.first_name)) { Swal.showValidationMessage("First name must be 2–50 characters"); return false; }
            if (!nameRegex.test(data.last_name)) { Swal.showValidationMessage("Last name must be 2–50 characters"); return false; }
            if (!data.date_of_birth) { Swal.showValidationMessage("Date of birth is required"); return false; }

            const cleanNationalId = data.national_id.replace(/-/g, "");
            if (!nationalIdRegex.test(cleanNationalId)) { Swal.showValidationMessage("National ID must be 13 digits"); return false; }
            data.national_id = cleanNationalId;

            // ✅ Return data พร้อมกับ File Object (ถ้ามี)
            const fileInput = document.getElementById('photo_input_add');
            return {
                textData: data,
                photoFile: fileInput.files.length > 0 ? fileInput.files[0] : null
            };
        },
        didOpen: () => {
            lucide.createIcons();
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { textData, photoFile } = result.value;

            try {
                // 1. สร้างลูกค้าก่อน (Create Text Data)
                const createRes = await fetch(API.customer.store, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(textData),
                });
                const createResult = await createRes.json();

                if (createResult.status !== "success") {
                    // 🔥 แก้ตรงนี้: ให้โชว์ Debug Message ถ้ามี
                    let errorMsg = createResult.message;
                    if (createResult.debug) {
                        errorMsg += "\n(" + createResult.debug + ")";
                    }
                    throw new Error(errorMsg);
                }

                // 2. ถ้ามีรูป -> อัปโหลดรูปตามไป (Upload Photo)
                if (photoFile && createResult.customer_id) {
                    const formData = new FormData();
                    formData.append('photo', photoFile);
                    formData.append('customer_id', createResult.customer_id); // ใช้ ID ที่เพิ่งได้มา

                    const uploadRes = await fetch(`${window.APP_BASE_URL}/customers/api/upload_photo.php`, {
                        method: 'POST',
                        body: formData
                    });
                    const uploadResult = await uploadRes.json();

                    if (uploadResult.status !== 'success') {
                        // ถ้าอัปรูปไม่ผ่าน ให้เตือนแต่ไม่ถือว่าล้มเหลวทั้งหมด (เพราะสร้าง user ได้แล้ว)
                        Swal.fire("Warning", "Customer created but photo upload failed: " + uploadResult.message, "warning");
                        loadCustomers(currentPage);
                        return;
                    }
                }

                // 3. สำเร็จทุกขั้นตอน
                await Swal.fire({
                    title: "Success",
                    text: "Customer created successfully!",
                    icon: "success",
                    ...swalTheme()
                });
                loadCustomers(currentPage);

            } catch (err) {
                console.error(err); // ดูใน Console F12 ได้ด้วย
                Swal.fire({
                    title: "Error",
                    text: err.message || "Something went wrong",
                    icon: "error",
                    ...swalTheme()
                });
            }
        }
    });
}

// Helper สำหรับ Preview รูปในหน้า Add
function previewImageAdd(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('preview_img_add').src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

/* =========================
   EDIT CUSTOMER (WITH PHOTO UPLOAD)
========================= */
function openEditCustomer(customerId) {
    fetch(API.customer.show + "?id=" + customerId)
        .then(async (res) => {
            if (!res.ok) throw new Error(`HTTP Error! Status: ${res.status}`);
            return res.json();
        })
        .then((res) => {
            if (res.status !== "success") {
                Swal.fire("Error", res.message || "Failed to fetch data", "error");
                return;
            }
            const c = res.data;

            // ตรวจสอบรูปภาพ: ถ้ามีรูปให้ใช้ path จริง, ถ้าไม่มีใช้ Default User Icon
            // หมายเหตุ: APP_BASE_URL มาจาก header.php ที่เราประกาศไว้
            const photoUrl = c.photo
                ? `${window.APP_BASE_URL}/photos/${c.photo}?t=${new Date().getTime()}`
                : "https://cdn-icons-png.flaticon.com/512/847/847969.png";

            Swal.fire({
                title: "Edit Customer",
                width: 600,
                ...swalTheme(),
                html: `
                    <div class="text-left space-y-5 px-1">
                        <input type="hidden" id="customer_id" value="${c.customer_id}">

                        <div class="flex flex-col items-center gap-3">
                            <div class="relative group">
                                <img id="preview_img" src="${photoUrl}" 
                                     class="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg">
                                <label for="photo_input" 
                                       class="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 shadow-sm transition">
                                    <i data-lucide="camera" class="w-4 h-4"></i>
                                </label>
                                <input type="file" id="photo_input" class="hidden" accept="image/*" onchange="previewImage(this)">
                            </div>
                            <span class="text-xs text-gray-400">Click camera icon to change</span>
                        </div>

                        <div>
                            <label class="${labelClass}">Customer Code</label>
                            <input class="${inputClass} ${disabledClass} font-mono text-sm" value="${c.customer_code}" disabled>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="${labelClass}">First Name</label>
                                <input id="first_name" class="${inputClass}" value="${c.first_name}" oninput="allowNameOnly(this)">
                            </div>
                            <div>
                                <label class="${labelClass}">Last Name</label>
                                <input id="last_name" class="${inputClass}" value="${c.last_name}" oninput="allowNameOnly(this)">
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="${labelClass}">Gender</label>
                                <select id="gender" class="${inputClass} appearance-none">
                                    <option value="Unspecified" ${c.gender === "Unspecified" ? "selected" : ""}>Unspecified</option>
                                    <option value="Male" ${c.gender === "Male" ? "selected" : ""}>Male</option>
                                    <option value="Female" ${c.gender === "Female" ? "selected" : ""}>Female</option>
                                </select>
                            </div>
                            <div>
                                <label class="${labelClass}">Date of Birth</label>
                                <input id="date_of_birth" type="date" class="${inputClass}" value="${c.date_of_birth}">
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="${labelClass}">National ID</label>
                                <input id="national_id" class="${inputClass} font-mono" value="${formatNationalIdValue(c.national_id)}" maxlength="17" oninput="formatNationalId(this)">
                            </div>
                            <div>
                                <label class="${labelClass}">Status</label>
                                <select id="status_id" class="${inputClass} appearance-none">
                                    <option value="1" ${c.status_id == 1 ? "selected" : ""}>Active</option>
                                    <option value="2" ${c.status_id == 2 ? "selected" : ""}>Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>`,
                showCancelButton: true, confirmButtonText: "Save Changes", cancelButtonText: "Cancel", focusConfirm: false,

                // 🔥 Logic การบันทึก: อัปโหลดรูปก่อน -> ถ้าผ่านค่อยส่ง Text
                preConfirm: async () => {
                    // 1. เก็บค่า Text
                    const data = {
                        customer_id: c.customer_id,
                        first_name: document.getElementById("first_name").value.trim(),
                        last_name: document.getElementById("last_name").value.trim(),
                        gender: document.getElementById("gender").value,
                        date_of_birth: document.getElementById("date_of_birth").value,
                        national_id: document.getElementById("national_id").value.replace(/-/g, ""),
                        status_id: document.getElementById("status_id").value,
                    };

                    // Validation เบื้องต้น
                    if (!data.first_name || !data.last_name) { Swal.showValidationMessage("Name is required"); return false; }

                    // 2. จัดการรูปภาพ (ถ้ามีการเลือกไฟล์ใหม่)
                    const fileInput = document.getElementById('photo_input');
                    if (fileInput.files.length > 0) {
                        const formData = new FormData();
                        formData.append('photo', fileInput.files[0]);
                        formData.append('customer_id', c.customer_id);

                        try {
                            // ส่งไปที่ upload_photo.php (Hardcode path หรือใส่ใน api.js ก็ได้)
                            const uploadRes = await fetch(`${window.APP_BASE_URL}/customers/api/upload_photo.php`, {
                                method: 'POST',
                                body: formData
                            });
                            const uploadResult = await uploadRes.json();

                            if (uploadResult.status !== 'success') {
                                Swal.showValidationMessage("Photo Upload Failed: " + uploadResult.message);
                                return false;
                            }
                        } catch (err) {
                            Swal.showValidationMessage("Upload Error: " + err.message);
                            return false;
                        }
                    }

                    return data; // ส่งข้อมูล Text ไปให้ .then ข้างล่างจัดการต่อ
                },
                didOpen: () => lucide.createIcons()
            }).then((result) => {
                if (result.isConfirmed) ajaxPost(API.customer.update, result.value);
            });
        })
        .catch(err => {
            console.error(err);
            Swal.fire("Error", "Cannot load customer data", "error");
        });
}

// 🖼️ Helper สำหรับพรีวิวรูปทันทีที่เลือก
function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('preview_img').src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

/* =========================
   VIEW CUSTOMER (READ ONLY) - FINAL COLOR FIX
========================= */
function openViewCustomer(customerId) {
    // 1. ดึงข้อมูล
    fetch(API.customer.show + "?id=" + customerId)
        .then((res) => res.json())
        .then((res) => {
            if (res.status !== "success") {
                Swal.fire("Error", "Cannot fetch data", "error");
                return;
            }
            const c = res.data;

            // 2. เตรียมรูปภาพ
            const photoUrl = c.photo
                ? `${window.APP_BASE_URL}/photos/${c.photo}?t=${new Date().getTime()}`
                : "https://cdn-icons-png.flaticon.com/512/847/847969.png";

            // 3. กำหนดสีของช่อง Status (Active = เขียว, Inactive = เหลือง)
            const statusInputClass = c.status_id == 1
                /* ✅ Active: สีเขียว */
                ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                /* 🟡 Inactive: สีเหลือง */
                : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-500 dark:border-yellow-700";

            // 4. แสดงผล
            Swal.fire({
                title: "Customer Details",
                width: 600,
                ...swalTheme(),
                html: `
                    <div class="text-left space-y-5 px-1">
                        
                        <div class="flex flex-col items-center gap-3">
                            <div class="relative group">
                                <img src="${photoUrl}" 
                                     class="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg">
                            </div>
                        </div>

                        <div>
                            <label class="${labelClass}">Customer Code</label>
                            <input class="${inputClass} ${disabledClass} font-mono text-sm" value="${c.customer_code}" disabled readonly>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="${labelClass}">First Name</label>
                                <input class="${inputClass} ${disabledClass}" value="${c.first_name}" disabled readonly>
                            </div>
                            <div>
                                <label class="${labelClass}">Last Name</label>
                                <input class="${inputClass} ${disabledClass}" value="${c.last_name}" disabled readonly>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="${labelClass}">Gender</label>
                                <input class="${inputClass} ${disabledClass}" value="${c.gender}" disabled readonly>
                            </div>
                            <div>
                                <label class="${labelClass}">Date of Birth</label>
                                <input class="${inputClass} ${disabledClass}" value="${c.date_of_birth}" disabled readonly>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="${labelClass}">National ID</label>
                                <input class="${inputClass} ${disabledClass} font-mono" value="${formatNationalIdValue(c.national_id)}" disabled readonly>
                            </div>
                            <div>
                                <label class="${labelClass}">Status</label>
                                <input class="w-full px-3 py-2.5 rounded-lg border font-medium ${statusInputClass}" 
                                       value="${c.status_id == 1 ? 'Active' : 'Inactive'}" 
                                       disabled readonly>
                            </div>
                        </div>
                    </div>
                `,
                showConfirmButton: false,
                showCancelButton: true,
                cancelButtonText: "Close",
                didOpen: () => {
                    lucide.createIcons();
                }
            });
        })
        .catch(err => Swal.fire("Error", "Connection failed", "error"));
}

/* =========================
   DELETE CUSTOMER
========================= */
function confirmDelete(customerId) {
    Swal.fire({
        title: "Are you sure?",
        text: "This customer will be permanently deleted",
        icon: "warning",
        ...swalTheme(),
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Yes, delete",
    }).then((result) => {
        if (result.isConfirmed) {
            ajaxPost(API.customer.delete, { customer_id: customerId });
        }
    });
}

/* =========================
   COMMON AJAX FUNCTION
========================= */
async function ajaxPost(url, data) {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error("HTTP error " + response.status);
        }

        const text = await response.text();
        console.log("RAW RESPONSE:", text);

        let result;
        try {
            result = JSON.parse(text);
        } catch {
            throw new Error("Server did not return JSON");
        }

        if (result.status === "success") {
            await Swal.fire({
                title: "Success",
                text: result.message,
                icon: "success",
                ...swalTheme(),
            });

            loadCustomers(currentPage);
        } else {
            throw new Error(result.message);
        }
    } catch (err) {
        Swal.fire({
            title: "Error",
            text: err.message || "Cannot connect to server",
            icon: "error",
            ...swalTheme(),
        });
    }
}

/* =========================
    Dark Mode
========================= */
function isDarkMode() {
    return document.documentElement.classList.contains("dark");
}

function swalTheme() {
    return isDarkMode()
        ? {
            background: "#1f2937", // gray-800
            color: "#f9fafb", // gray-50
        }
        : {
            background: "#ffffff",
            color: "#111827",
        };
}

/* =========================
    RegExp ADD/EDIT
========================= */
function formatNationalId(input) {
    let digits = input.value.replace(/\D/g, "").slice(0, 13);

    let formatted = "";
    if (digits.length > 0) formatted += digits.substring(0, 1);
    if (digits.length > 1) formatted += "-" + digits.substring(1, 5);
    if (digits.length > 5) formatted += "-" + digits.substring(5, 10);
    if (digits.length > 10) formatted += "-" + digits.substring(10, 12);
    if (digits.length > 12) formatted += "-" + digits.substring(12, 13);

    input.value = formatted;
}

function formatNationalIdValue(id) {
    return id.replace(/^(\d)(\d{4})(\d{5})(\d{2})(\d)$/, "$1-$2-$3-$4-$5");
}

function allowNameOnly(input) {
    input.value = input.value
        .replace(/[^A-Za-zก-ฮ\s]/g, "") // ตัดทุกอย่างที่ไม่ตรง RegExp
        .replace(/\s+/g, " ") // เว้นวรรคซ้ำ
        .slice(0, 50); // จำกัดความยาว
}

/* =========================
   INIT
========================= */
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        currentSearch = e.target.value.trim();
        loadCustomers(1);
    }, 400);
});

/* =========================
   BIND EVENTS & LOAD
========================= */
document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', () => {
        changeSort(th.dataset.column);
    });
});

loadCustomers(currentPage);
/* =========================
   FETCH DATA
========================= */
/* assets/js/customer.js */

/* =========================
   FETCH DATA (SOFT LOADING - NO FLICKER)
========================= */
async function loadCustomers(page = 1) {
    currentPage = page;
    updateHeaderUI();

    // 🔥 1. เช็คก่อนว่ามีข้อมูลเดิมอยู่ไหม?
    // (เช็คว่ามีแถวอยู่ และแถวนั้นไม่ใช่ข้อความ Loading/Error)
    const hasData = tableBody.children.length > 0 && !tableBody.querySelector('td[colspan]');

    if (hasData) {
        // ✅ ถ้ามีข้อมูล: ให้ "จางลง" (Dim) แทนการลบทิ้ง (ตาจะไม่รู้สึกว่ากระพริบ)
        tableBody.classList.add('opacity-40', 'pointer-events-none', 'transition-opacity', 'duration-200');
    } else {
        // ⚪ ถ้าเปิดมาครั้งแรก (ตารางโล่ง): ให้ขึ้น Loading ตามปกติ
        tableBody.innerHTML = `
            <tr>
                <td colspan="11" class="p-6 text-center text-gray-400 animate-pulse">
                    Loading...
                </td>
            </tr>
        `;
    }

    const params = new URLSearchParams({
        page: currentPage,
        search: currentSearch,
        sort: currentSort,
        order: currentOrder,
        _t: Date.now() // กัน Cache
    });

    try {
        const res = await fetch(`${API_URL}?${params.toString()}`);
        const data = await res.json();

        // 🔥 2. พอข้อมูลมาถึง -> สวมข้อมูลใหม่เข้าไปทันที (Seamless Swap)
        renderTable(data.customers);
        renderPagination(data.page, data.totalPages);
        lucide.createIcons();

    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `
            <tr>
                <td colspan="11" class="p-6 text-center text-red-500">
                    Failed to load data
                </td>
            </tr>
        `;
    } finally {
        // ✅ 3. โหลดเสร็จแล้ว -> เอาความจางออก ให้กลับมาชัดเหมือนเดิม
        tableBody.classList.remove('opacity-40', 'pointer-events-none', 'transition-opacity', 'duration-200');
    }
}

/* =========================
   RENDER TABLE (WITH HIGHLIGHT)
========================= */

function renderTable(customers) {
    // 🔥 Reset Layout: ทุกครั้งที่ข้อมูลใหม่มา ให้กลับเป็น Auto เพื่อจัดระเบียบใหม่
    const table = document.querySelector('table');
    if (table) {
        table.style.tableLayout = 'auto'; 
        table.style.width = '';
        table.querySelectorAll('th').forEach(th => th.style.width = '');
    }

    const getSortClass = (col) => currentSort === col ? 'bg-gray-50/80 dark:bg-white/5' : '';
    const h = (text) => highlightText(text, currentSearch);

    tableBody.innerHTML = customers.map((c, index) => `
        <tr class="border-t border-gray-200 dark:border-gray-700
                   hover:bg-blue-50 dark:hover:bg-gray-700/50 transition duration-150 cursor-pointer"
                    onclick="if(!event.target.closest('button')) openViewCustomer(${c.customer_id})">
            
            <td class="text-center text-gray-500 dark:text-gray-400">
                ${(currentPage - 1) * 10 + (index + 1)}
            </td>
            <td class="${getSortClass('customer_id')}">${h(c.customer_id)}</td>
            <td class="${getSortClass('customer_code')} font-mono text-sm">${h(c.customer_code)}</td>
            <td class="${getSortClass('first_name')} font-medium text-gray-900 dark:text-white">${h(c.name)}</td>
            <td class="${getSortClass('gender')}">${h(c.gender)}</td>
            <td class="${getSortClass('date_of_birth')}">${h(c.date_of_birth)}</td>
            <td class="font-mono text-sm text-gray-600 dark:text-gray-300">${h(c.national_id)}</td>
            
            <td class="text-center ${getSortClass('status_name')}">
                <span class="px-3 py-1 rounded-full text-xs font-medium border
                    ${c.status_name === "Active"
                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-500 dark:border-yellow-700"
                    }">
                    ${h(c.status_name)}
                </span>
            </td>
            
            <td class="text-xs text-gray-500 ${getSortClass('create_at')}">${h(c.create_at)}</td>
            <td class="text-xs text-gray-500 ${getSortClass('update_at')}">${h(c.update_at)}</td>
            
            <td class="text-center">
                <div class="flex justify-center gap-2">
                    <button onclick="openEditCustomer(${c.customer_id})"
                        class="p-1.5 rounded-md text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                    <button onclick="confirmDelete(${c.customer_id})"
                        class="p-1.5 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 transition">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    lucide.createIcons();
    initResizableTable(); 
}

/* =========================
   HIGHLIGHT HELPER FUNCTION
   (เพิ่มฟังก์ชันนี้ไว้ล่างสุดของไฟล์ หรือที่กลุ่ม Helper)
========================= */
function highlightText(text, search) {
    if (!text) return "";
    const str = String(text);
    if (!search) return str;
    const terms = search.trim().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return str;
    const patternStr = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${patternStr})`, 'gi');

    return str.replace(regex, (match) =>
        `<mark class="
            /* ☀️ Light Mode: ใช้สีเหลืองที่สดขึ้น (Yellow-300) + ตัวอักษรสีดำ (ให้อ่านชัด) */
            bg-yellow-300 text-black 
            
            /* 🌙 Dark Mode: ใช้สีเหลืองอมส้มที่เข้มขึ้น + โปร่งแสง (Yellow-600) + ตัวอักษรสีขาว */
            dark:bg-yellow-600/80 dark:text-white 
            
            rounded-sm px-0.5 mx-0.5 font-semibold shadow-sm decoration-clone
        ">${match}</mark>`
    );
}

function changeSort(column) {
    if (currentSort === column) {
        if (currentOrder === "ASC") {
            currentOrder = "DESC";
        } else {
            currentSort = "";
            currentOrder = "ASC";
        }
    } else {
        currentSort = column;
        currentOrder = "ASC";
    }

    loadCustomers(1);
}

/* =========================
   UI HELPERS
========================= */
function updateHeaderUI() {
    const activeClasses = ['bg-gray-100', 'dark:bg-white/10'];

    document.querySelectorAll('.sortable').forEach(th => {
        const icon = th.querySelector('.sort-icon');
        const column = th.dataset.column;

        // 🔥 เพิ่มการเช็ค: ถ้าหา icon ไม่เจอ ให้ข้ามไปเลย (เว็บจะได้ไม่พัง)
        if (!icon) return;

        // Reset
        icon.textContent = '';
        th.classList.remove(...activeClasses);

        // Set Active
        if (column === currentSort) {
            icon.textContent = currentOrder === 'ASC' ? ' ▲' : ' ▼';
            th.classList.add(...activeClasses);
        }
    });
}

/* =========================
   RESIZABLE COLUMNS (Fix Sort Conflict)
========================= */

/* =========================
   RESIZABLE (HYBRID SYSTEM)
========================= */
function initResizableTable() {
    const table = document.querySelector('table');
    if (!table) return;

    const cols = table.querySelectorAll('th');

    cols.forEach((col) => {
        let resizer = col.querySelector('.resizer');
        if (!resizer) {
            resizer = document.createElement('div');
            resizer.className = 'resizer';
            resizer.addEventListener('click', (e) => e.stopPropagation());
            col.appendChild(resizer);
        }

        let startX = 0;
        let startColW = 0;
        let startTableW = 0;
        let isDragging = false;

        const mouseDownHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();

            // 1. Freeze: เปลี่ยน Auto -> Fixed ทันทีที่เริ่มจับ
            if (table.style.tableLayout !== 'fixed') {
                const currentWidths = [];
                table.querySelectorAll('th').forEach(c => currentWidths.push(c.getBoundingClientRect().width));

                // ล็อคความกว้างทุกช่อง
                table.querySelectorAll('th').forEach((c, i) => {
                    c.style.width = `${currentWidths[i]}px`;
                });

                // ล็อคความกว้างตาราง
                table.style.width = `${table.getBoundingClientRect().width}px`;
                table.style.tableLayout = 'fixed';
            }

            startX = e.clientX;
            startColW = col.getBoundingClientRect().width;
            startTableW = table.getBoundingClientRect().width;
            isDragging = false;

            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);

            resizer.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
        };

        const mouseMoveHandler = (e) => {
            isDragging = true;
            requestAnimationFrame(() => {
                const dx = e.clientX - startX;
                // คำนวณความกว้างใหม่
                const newColW = Math.max(50, startColW + dx);
                const realDiff = newColW - startColW;

                // ขยายช่อง + ขยายตารางไปพร้อมกัน
                col.style.width = `${newColW}px`;
                table.style.width = `${startTableW + realDiff}px`;
            });
        };

        const mouseUpHandler = () => {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
            resizer.classList.remove('resizing');
            document.body.style.cursor = '';

            if (isDragging) {
                const killClick = (ev) => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    window.removeEventListener('click', killClick, true);
                };
                window.addEventListener('click', killClick, true);
                setTimeout(() => window.removeEventListener('click', killClick, true), 100);
            }
        };

        resizer.addEventListener('mousedown', mouseDownHandler);
    });
}

// เรียกใช้งานเมื่อโหลดหน้าเว็บเสร็จ
document.addEventListener('DOMContentLoaded', initResizableTable);

/* =========================
   SEARCH SHORTCUT (Ctrl/Cmd + K)
========================= */
document.addEventListener('keydown', (e) => {
    // เช็คว่ากด Ctrl+K หรือ Meta(Cmd)+K
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); // ป้องกัน Browser เปิด Search bar ของตัวเอง
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }

    // กด ESC เพื่อออกจากช่องค้นหา
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (document.activeElement === searchInput) {
            searchInput.blur();
        }
    }
});