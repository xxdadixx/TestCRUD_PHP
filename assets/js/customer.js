/* assets/js/customer.js (Clean Version) */
import * as Utils from './modules/utils.js';
import { CustomerService } from './modules/api-service.js';
import { API } from './modules/api-config.js';
import * as TableUI from './modules/table-ui.js';
import * as Forms from './modules/forms.js';

const { swalTheme } = Utils;

window.formatNationalId = Utils.formatNationalId;
window.formatNationalIdValue = Utils.formatNationalIdValue;
window.allowNameOnly = Utils.allowNameOnly;
window.previewImageAdd = window.previewImageAdd || function (input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => document.getElementById('preview_img_add').src = e.target.result;
        reader.readAsDataURL(input.files[0]);
    }
};
window.previewImage = window.previewImage || function (input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => document.getElementById('preview_img').src = e.target.result;
        reader.readAsDataURL(input.files[0]);
    }
};

// --- State ---
let state = {
    currentPage: 1,
    currentSearch: "",
    currentSort: "",
    currentOrder: "ASC"
};
let debounceTimer = null;

window.changeSort = (column) => {
    // 1. ถ้ากำลังลาก (Resize) ห้าม Sort
    if (document.body.classList.contains('is-resizing')) return;

    if (state.currentSort === column) {
        if (state.currentOrder === 'ASC') {
            state.currentOrder = 'DESC';
        } else {
            state.currentSort = ''; // Reset
            state.currentOrder = 'ASC';
        }
    } else {
        state.currentSort = column;
        state.currentOrder = 'ASC';
    }
    loadCustomers(state.currentPage);
};

// --- Main Function ---
async function loadCustomers(page = 1) {
    const tableBody = document.getElementById("tableBody");
    if (!tableBody) return;

    state.currentPage = page;

    // 1. เรียก Overlay ขึ้นมา (ถ้ายังไม่มีก็สร้างใหม่)
    let overlay = document.querySelector('.table-loading-overlay');
    if (!overlay) {
        const container = document.querySelector('.table-container');
        if (container) {
            overlay = document.createElement('div');
            overlay.className = 'table-loading-overlay';
            // Spinner แบบเรียบๆ
            overlay.innerHTML = `<i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-500"></i>`;
            container.appendChild(overlay);
            lucide.createIcons();
        }
    }
    // โชว์ทันที
    if (overlay) overlay.classList.add('active');

    const params = new URLSearchParams({
        page: state.currentPage,
        search: state.currentSearch,
        sort: state.currentSort,
        order: state.currentOrder,
        _t: Date.now()
    });

    try {
        // 2. ยิง API ทันที (ไม่ต้องรอ Delay)
        const data = await CustomerService.getAll(params.toString());

        if (data.status === 'error') throw new Error(data.message);

        // 3. Render ทันทีที่ข้อมูลมา
        TableUI.renderTable(data.customers, state, {});
        TableUI.renderPagination(data.page, data.totalPages, loadCustomers);
        TableUI.updateHeaderUI(state);

    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="100%" class="p-6 text-center text-red-500">Error: ${err.message}</td></tr>`;
    } finally {
        // 4. ซ่อน Overlay ทันที
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
}

// ✅ ย้าย Event Binding มาไว้ใน loadCustomers หรือ DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // ... (ส่วนโหลดข้อมูลเดิม) ...

    // 🔥 ผูก Event Click ให้หัวตาราง (แบบ Delegation ที่ปลอดภัยกว่า)
    const tableHead = document.querySelector('thead');
    if (tableHead) {
        tableHead.addEventListener('click', (e) => {
            // หา th ที่เป็น sortable
            const th = e.target.closest('.sortable');
            if (!th) return;

            // ถ้ากดโดน Resizer ให้หยุด (ห้าม Sort)
            if (e.target.classList.contains('resizer')) return;

            // เรียก Sort
            const column = th.dataset.column;
            if (column) window.changeSort(column);
        });
    }
});

window.exportData = () => {
    Swal.fire({
        title: "Export to CSV?",
        text: "Do you want to download the customer list?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, Export",
        cancelButtonText: "Cancel",
        ...swalTheme() // ใช้ Theme เดียวกับทั้งเว็บ
    }).then((result) => {
        if (result.isConfirmed) {
            // ถ้ากด Yes ค่อยทำงาน
            const params = new URLSearchParams({
                search: state.currentSearch,
                sort: state.currentSort,
                order: state.currentOrder
            });

            window.location.href = `${API.customer.export}?${params.toString()}`;

            // (Optional) โชว์ Success เล็กๆ ว่าเริ่มโหลดแล้ว
            const Toast = Swal.mixin({
                toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, ...swalTheme()
            });
            Toast.fire({ icon: 'success', title: 'Download started' });
        }
    });
};

// --- Event Listeners ---
const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            state.currentSearch = e.target.value.trim();
            loadCustomers(1);
        }, 400);
    });
}

// 1. ปุ่ม Add
window.openAddCustomer = () => Forms.openAddCustomer(() => loadCustomers(1));

// 2. ปุ่ม Edit (ส่ง id ไป และสั่งให้โหลดหน้าเดิมเมื่อเสร็จ)
window.openEditCustomer = (id) => Forms.openEditCustomer(id, () => loadCustomers(state.currentPage));

// 3. ปุ่ม Delete
window.confirmDelete = (id) => Forms.confirmDelete(id, () => loadCustomers(state.currentPage));

// 4. ปุ่ม View (คลิกที่แถว)
window.openViewCustomer = (id) => Forms.openViewCustomer(id);

// 5. อื่นๆ ที่จำเป็น
window.loadCustomers = loadCustomers;

/* =========================
   CHANGE SORT (3 Steps: ASC -> DESC -> RESET)
========================= */
function changeSort(column) {
    if (state.currentSort === column) {
        // ถ้ากดคอลัมน์เดิม
        if (state.currentOrder === 'ASC') {
            // จังหวะ 2: เปลี่ยนเป็น DESC
            state.currentOrder = 'DESC';
        } else {
            // จังหวะ 3: ยกเลิกการ Sort (Reset)
            state.currentSort = ''; // ล้างค่า Sort
            state.currentOrder = 'ASC'; // กลับเป็นค่า Default
        }
    } else {
        // จังหวะ 1: กดคอลัมน์ใหม่ เริ่มที่ ASC
        state.currentSort = column;
        state.currentOrder = 'ASC';
    }

    // โหลดข้อมูลใหม่
    loadCustomers(1);
}