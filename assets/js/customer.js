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

    // 1. เช็คว่ามี Container ไหม ถ้าไม่มีก็จบ
    if (!container) return;

    // 🔥 แก้ไข: เคลียร์ปุ่มเก่าทิ้งก่อนเสมอ! (ไม่ว่าจะมีกี่หน้าก็ตาม)
    container.innerHTML = "";

    // 2. ถ้ามีแค่หน้าเดียว ไม่ต้องสร้างปุ่มเพิ่ม (จบการทำงานตรงนี้)
    if (totalPages <= 1) return;

    // --- ส่วนสร้างปุ่ม (Code เดิม) ---
    const createBtn = (label, targetPage, active = false, disabled = false) => {
        const btn = document.createElement("button");
        btn.textContent = label;

        btn.className = `
            px-3 py-1 rounded text-sm
            ${active ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-gray-200"}
            ${disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-blue-500 hover:text-white"}
        `;

        if (!disabled) {
            btn.onclick = () => loadCustomers(targetPage);
        }

        return btn;
    };

    /* ⏮ Prev */
    container.appendChild(createBtn("«", page - 1, false, page === 1));

    const pages = new Set();
    pages.add(1);
    pages.add(totalPages);

    for (let i = page - 1; i <= page + 1; i++) {
        if (i > 1 && i < totalPages) {
            pages.add(i);
        }
    }

    const sortedPages = [...pages].sort((a, b) => a - b);
    let lastPage = 0;

    sortedPages.forEach((p) => {
        if (p - lastPage > 1) {
            const dots = document.createElement("span");
            dots.textContent = "...";
            dots.className = "px-2 text-gray-500";
            container.appendChild(dots);
        }
        container.appendChild(createBtn(p, p, p === page));
        lastPage = p;
    });

    /* ⏭ Next */
    container.appendChild(createBtn("»", page + 1, false, page === totalPages));
}

/* =========================
   ADD CUSTOMER (UPDATED THEME)
========================= */
function openAddCustomer() {
    Swal.fire({
        title: "New Customer",
        width: 600,
        ...swalTheme(),
        html: `
            <div class="text-left space-y-5 px-1">
                
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

                <div class="grid grid-cols-2 gap-4">
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

                <div class="grid grid-cols-2 gap-4">
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

                <div class="grid grid-cols-2 gap-4">
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

        // 🛠️ ส่วน Logic เหมือนเดิม (ไม่ต้องแก้)
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

            return data;
        },
        didOpen: () => {
            lucide.createIcons(); // ให้ไอคอน Lock ทำงาน
        }
    }).then((result) => {
        if (result.isConfirmed) {
            ajaxPost(API.customer.store, result.value);
        }
    });
}

/* =========================
   UPDATE CUSTOMER (UPDATED THEME)
========================= */
function openEditCustomer(customerId) {
    fetch(API.customer.show + "?id=" + customerId)
        .then((res) => res.json())
        .then((res) => {
            if (res.status !== "success") {
                Swal.fire("Error", res.message, "error");
                return;
            }
            const c = res.data;

            Swal.fire({
                title: "Edit Customer",
                width: 600,
                ...swalTheme(),
                html: `
                    <div class="text-left space-y-5 px-1">
                        <input type="hidden" id="customer_id" value="${c.customer_id}">

                        <div>
                            <label class="${labelClass}">Customer Code</label>
                            <div class="relative">
                                <input id="customer_code" class="${inputClass} ${disabledClass} font-mono text-sm" 
                                    value="${c.customer_code}" disabled>
                                <div class="absolute inset-y-0 right-3 flex items-center">
                                    <i data-lucide="lock" class="w-4 h-4 text-gray-400"></i>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="${labelClass}">First Name</label>
                                <input id="first_name" class="${inputClass}" 
                                    value="${c.first_name}" oninput="allowNameOnly(this)">
                            </div>
                            <div>
                                <label class="${labelClass}">Last Name</label>
                                <input id="last_name" class="${inputClass}" 
                                    value="${c.last_name}" oninput="allowNameOnly(this)">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
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
                                <input id="date_of_birth" type="date" class="${inputClass}" 
                                    max="${new Date().toISOString().split("T")[0]}"
                                    value="${c.date_of_birth}">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="${labelClass}">National ID</label>
                                <input id="national_id" class="${inputClass} font-mono tracking-wide" 
                                    value="${formatNationalIdValue(c.national_id)}"
                                    maxlength="17" inputmode="numeric" oninput="formatNationalId(this)">
                            </div>
                            <div>
                                <label class="${labelClass}">Status</label>
                                <select id="status_id" class="${inputClass} appearance-none">
                                    <option value="1" ${c.status_id == 1 ? "selected" : ""}>Active</option>
                                    <option value="2" ${c.status_id == 2 ? "selected" : ""}>Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: "Save Changes",
                cancelButtonText: "Cancel",
                focusConfirm: false,

                // 🛠️ ส่วน Logic เหมือนเดิม
                preConfirm: () => {
                    const data = {
                        customer_id: c.customer_id,
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

                    return data;
                },
                didOpen: () => {
                    lucide.createIcons();
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    ajaxPost(API.customer.update, result.value);
                }
            });
        });
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
async function loadCustomers(page = 1) {
    currentPage = page;
    updateHeaderUI();

    tableBody.innerHTML = `
        <tr>
            <td colspan="11" class="p-6 text-center text-gray-400">
                Loading...
            </td>
        </tr>
    `;

    const params = new URLSearchParams({
        page: currentPage,
        search: currentSearch,
        sort: currentSort,
        order: currentOrder,
    });

    try {
        const res = await fetch(`${API_URL}?${params.toString()}`);
        const data = await res.json();

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
    }
}

/* =========================
   RENDER TABLE
========================= */
function renderTable(customers) {
    const getSortClass = (col) => currentSort === col ? 'bg-blue-50 dark:bg-blue-900' : '';

    tableBody.innerHTML = customers
        .map(
            (c, index) => `
        <tr class="whitespace-nowrap border-t border-gray-200 dark:border-gray-700
                   hover:bg-blue-50 dark:hover:bg-gray-700 transition">
            <td class="p-3 text-center">${index + 1}</td>
            <td class="p-3 ${getSortClass('customer_id')}">${c.customer_id}</td>
            <td class="p-3 ${getSortClass('customer_code')}">${c.customer_code}</td>
            <td class="p-3 ${getSortClass('first_name')}">${c.name}</td>
            
            </tr>
    `,
        )
        .join("");

    tableBody.innerHTML = customers
        .map(
            (c, index) => `
        <tr class="border-t border-gray-200 dark:border-gray-700
                   hover:bg-blue-50 dark:hover:bg-gray-700 transition">
            <td class="p-3 text-center">${index + 1}</td>
            <td class="p-3 ${getSortClass('customer_id')}">${c.customer_id}</td>
            <td class="p-3 ${getSortClass('customer_code')}">${c.customer_code}</td>
            <td class="p-3 ${getSortClass('first_name')}">${c.name}</td>
            <td class="p-3 ${getSortClass('gender')}">${c.gender}</td>
            <td class="p-3 ${getSortClass('date_of_birth')}">${c.date_of_birth}</td>
            <td class="p-3 font-mono">${c.national_id}</td>
            <td class="p-3 text-center ${getSortClass('status_name')}">
                <span class="px-3 py-1 rounded-full text-sm
                    ${c.status_name === "Active"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                }">
                    ${c.status_name}
                </span>
            </td>
            <td class="p-3 ${getSortClass('create_at')}">${c.create_at}</td>
            <td class="p-3 ${getSortClass('update_at')}">${c.update_at}</td>
            <td class="p-3 text-center">
                <div class="flex justify-center gap-3">
                    <button onclick="openEditCustomer(${c.customer_id})"
                        class="p-2 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                    <button onclick="confirmDelete(${c.customer_id})"
                        class="p-2 rounded-lg text-red-600 hover:bg-red-600 hover:text-white">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `,
        )
        .join("");
}

/* =========================
   PAGINATION
========================= */
function renderPagination(page, totalPages) {
    const container = document.getElementById("pagination");
    if (!container || totalPages <= 1) return;

    container.innerHTML = "";

    const createBtn = (label, targetPage, active = false, disabled = false) => {
        const btn = document.createElement("button");
        btn.textContent = label;

        btn.className = `
            px-3 py-1 rounded text-sm
            ${active ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-gray-200"}
            ${disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-blue-500 hover:text-white"}
        `;

        if (!disabled) {
            btn.onclick = () => loadCustomers(targetPage);
        }

        return btn;
    };

    /* ⏮ Prev */
    container.appendChild(createBtn("«", page - 1, false, page === 1));

    const pages = new Set();

    pages.add(1);
    pages.add(totalPages);

    for (let i = page - 1; i <= page + 1; i++) {
        if (i > 1 && i < totalPages) {
            pages.add(i);
        }
    }

    const sortedPages = [...pages].sort((a, b) => a - b);

    let lastPage = 0;

    sortedPages.forEach((p) => {
        if (p - lastPage > 1) {
            const dots = document.createElement("span");
            dots.textContent = "...";
            dots.className = "px-2 text-gray-500";
            container.appendChild(dots);
        }

        container.appendChild(createBtn(p, p, p === page));

        lastPage = p;
    });

    /* ⏭ Next */
    container.appendChild(createBtn("»", page + 1, false, page === totalPages));
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
    const activeClasses = ['bg-blue-100', 'dark:bg-blue-900'];

    document.querySelectorAll('.sortable').forEach(th => {
        const icon = th.querySelector('.sort-icon');
        const column = th.dataset.column;

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
   RESIZABLE COLUMNS LOGIC
========================= */
function initResizableTable() {
    const table = document.querySelector('table');
    if (!table) return;

    const cols = table.querySelectorAll('th');

    cols.forEach((col) => {
        // ป้องกันการสร้างซ้ำ
        if (col.querySelector('.resizer')) return;

        // สร้างแท่ง Resizer
        const resizer = document.createElement('div');
        resizer.classList.add('resizer');

        // ป้องกันไม่ให้คลิกแล้วไป Trigger การ Sort
        resizer.addEventListener('click', (e) => e.stopPropagation());

        col.appendChild(resizer);

        let x = 0;
        let w = 0;

        const mouseDownHandler = (e) => {
            e.stopPropagation(); // ป้องกัน Sort
            x = e.clientX;

            const styles = window.getComputedStyle(col);
            w = parseInt(styles.width, 10);

            // ติด Listeners ที่ Document เพื่อให้ลากเมาส์หลุดขอบตารางได้
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);

            resizer.classList.add('resizing');
        };

        const mouseMoveHandler = (e) => {
            // คำนวณระยะที่ขยับ
            const dx = e.clientX - x;
            // ปรับความกว้าง (Minimum 50px กันย่อจนหาย)
            col.style.width = `${Math.max(50, w + dx)}px`;
        };

        const mouseUpHandler = () => {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
            resizer.classList.remove('resizing');
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