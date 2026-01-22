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

// --- Main Function ---
async function loadCustomers(page = 1) {
    const tableBody = document.getElementById("tableBody");
    // หาตัว Overlay (ถ้าไม่มี ให้สร้างใหม่สดๆ)
    let overlay = document.querySelector('.table-loading-overlay');
    if (!overlay) {
        const container = document.querySelector('.table-container');
        if (container) {
            overlay = document.createElement('div');
            overlay.className = 'table-loading-overlay';
            overlay.innerHTML = `<div class="flex flex-col items-center"><i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-500"></i><span class="text-xs text-gray-500 mt-2 font-medium">Updating...</span></div>`;
            container.appendChild(overlay);
            lucide.createIcons();
        }
    }

    // ✅ 1. Show Loading (Fade In)
    if (overlay) overlay.classList.add('active');

    const params = new URLSearchParams({
        page: state.currentPage,
        search: state.currentSearch,
        sort: state.currentSort,
        order: state.currentOrder,
        _t: Date.now()
    });

    try {
        // หน่วงเวลานิดนึง (300ms) ให้ตาเห็น Effect ว่ามีการโหลด
        const startTime = Date.now();
        const minLoadTime = 300; 

        const data = await CustomerService.getAll(params.toString());
        
        // รอให้ครบเวลา (ถ้าโหลดเร็วกว่ากำหนด)
        const elapsed = Date.now() - startTime;
        if (elapsed < minLoadTime) await new Promise(r => setTimeout(r, minLoadTime - elapsed));

        if (data.status === 'error') throw new Error(data.message);

        TableUI.renderTable(data.customers, state, {});
        TableUI.renderPagination(data.page, data.totalPages, loadCustomers);
        TableUI.updateHeaderUI(state); // 🔥 อย่าลืมเรียกอันนี้เพื่ออัปเดตไอคอนหัวตาราง

    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `
            <tr>
                <td colspan="100%" class="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <div class="flex flex-col items-center gap-2">
                        <i data-lucide="alert-circle" class="w-6 h-6"></i>
                        <span>Error: ${err.message}</span>
                    </div>
                </td>
            </tr>
        `;
        lucide.createIcons();
    } finally {
        // ✅ 2. Hide Loading (Fade Out)
        if (overlay) {
            setTimeout(() => overlay.classList.remove('active'), 100);
        }
    }
}

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

// ผูก Event Click ให้กับทุกปุ่ม Sort
document.addEventListener('click', (e) => {
    // ✅ 1. เช็คว่ากำลังลากขยายช่องอยู่หรือเปล่า? (ถ้าใช่ ให้หยุดทันที)
    if (document.body.classList.contains('is-resizing')) return;

    // ✅ 2. เช็คว่ากดโดนเส้น Resizer หรือเปล่า? (ถ้าใช่ ให้หยุดทันที)
    if (e.target.classList.contains('resizer')) return;

    const th = e.target.closest('.sortable');
    if (th) {
        changeSort(th.dataset.column);
    }
});

// Start
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById("tableBody")) loadCustomers(1);
    
    // Event Search
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
});