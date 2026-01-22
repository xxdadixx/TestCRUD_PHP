import * as Utils from './modules/utils.js';
import { CustomerService } from './modules/api-service.js';
import * as TableUI from './modules/table-ui.js';
import * as Forms from './modules/forms.js';

// --- State ---
let state = {
    currentPage: 1,
    currentSearch: "",
    currentSort: "",
    currentOrder: "ASC"
};
let debounceTimer = null;

/* =========================
   FETCH DATA (SOFT LOADING - NO FLICKER)
========================= */
async function loadCustomers(page = 1) {
    state.currentPage = page;
    TableUI.updateHeaderUI(state);

    if (!tableBody) return;
    currentPage = page;
    updateHeaderUI();

    // 🔥 1. เช็คก่อนว่ามีข้อมูลเดิมอยู่ไหม?
    // (เช็คว่ามีแถวอยู่ และแถวนั้นไม่ใช่ข้อความ Loading/Error)
    const hasData = tableBody.children.length > 0 && !tableBody.querySelector('td[colspan]');

    if (hasData) {
        // ... (โค้ดเดิม: ทำให้จางลง)
        tableBody.classList.add('opacity-40', 'pointer-events-none', 'transition-opacity', 'duration-200');
    } else {
        // 🔥 แก้ตรงนี้: ใส่ Loader สวยๆ กลางตาราง
        tableBody.innerHTML = `
            <tr class="border-b border-gray-100 dark:border-gray-800">
                <td colspan="11" class="h-96 text-center align-middle">
                    <div class="flex flex-col items-center justify-center gap-3">
                        <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-full shadow-sm">
                            <i data-lucide="loader-2" class="w-8 h-8 text-blue-500 animate-spin"></i>
                        </div>
                        <span class="text-sm text-gray-400 font-medium animate-pulse">Loading Data...</span>
                    </div>
                </td>
            </tr>
        `;
        lucide.createIcons(); // สร้างไอคอนทันที
    }

    const params = new URLSearchParams({
        page: state.currentPage,
        search: state.currentSearch,
        sort: state.currentSort,
        order: state.currentOrder,
        _t: Date.now()
    });

    try {
        const data = await CustomerService.getAll(params.toString());

        TableUI.renderTable(data.customers, state, {
            onEdit: (id) => Forms.openEditCustomer(id, () => loadCustomers(state.currentPage)),
            onDelete: (id) => Forms.confirmDelete(id, () => loadCustomers(state.currentPage)),
            onView: (id) => Forms.openViewCustomer(id)
        });

        TableUI.renderPagination(data.page, data.totalPages, loadCustomers);

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
   CONFIG
========================= */
const API_URL = "api/customer_fetch.php";
const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        // ... Debounce Logic ...
        state.currentSearch = e.target.value;
        loadCustomers(1);
    });
}

window.openAddCustomer = () => Forms.openAddCustomer(() => loadCustomers(1));
loadCustomers(1);

/* =========================
   STATE (DECLARE ONCE)
========================= */
const urlParams = new URLSearchParams(window.location.search);

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
   INIT
========================= */
// ✅ ป้องกัน Error: เช็คว่ามี searchInput ไหม
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentSearch = e.target.value.trim();
            loadCustomers(1);
        }, 400);
    });
}

// ✅ ป้องกัน Error: เช็คว่ามี sortable ไหม
document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', () => {
        changeSort(th.dataset.column);
    });
});

// ✅ สำคัญที่สุด: ถ้าไม่มีตาราง (เช่นอยู่หน้า Edit) ห้ามเรียกโหลดข้อมูล
if (tableBody) {
    loadCustomers(currentPage);
}

/* =========================
   BIND EVENTS & LOAD
========================= */
document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', () => {
        changeSort(th.dataset.column);
    });
});

// ✅ แก้ไข: เช็คก่อนว่ามีตารางไหม ถ้าไม่มี (เช่นอยู่หน้า Edit) ก็ไม่ต้องโหลด
if (document.getElementById("tableBody")) {
    loadCustomers(currentPage);
}

loadCustomers(currentPage);

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