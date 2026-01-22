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
    if (!tableBody) return; // ถ้าไม่มีตาราง (เช่นหน้า Edit) ให้หยุดทำงาน

    state.currentPage = page;
    TableUI.updateHeaderUI(state); // อัปเดตลูกศร Sort

    // 1. Loading State (แบบไม่กระพริบ)
    const hasData = tableBody.children.length > 0 && !tableBody.querySelector('td[colspan]');
    if (hasData) {
        tableBody.classList.add('opacity-40', 'pointer-events-none');
    } else {
        tableBody.innerHTML = `<tr><td colspan="11" class="h-96 text-center align-middle"><i data-lucide="loader-2" class="w-8 h-8 text-blue-500 animate-spin mx-auto"></i></td></tr>`;
        lucide.createIcons();
    }

    // 2. Prepare Params
    const params = new URLSearchParams({
        page: state.currentPage,
        search: state.currentSearch,
        sort: state.currentSort,
        order: state.currentOrder,
        _t: Date.now()
    });

    try {
        // 3. Fetch Data
        const data = await CustomerService.getAll(params.toString());

        if (data.status === 'error') {
            throw new Error(data.message);
        }

        // 4. Render UI
        TableUI.renderTable(data.customers, state, {});
        TableUI.renderPagination(data.page, data.totalPages, loadCustomers);

    } catch (err) {
        console.error(err);
        // 🔥 โชว์ Error ที่แท้จริง (err.message)
        tableBody.innerHTML = `
            <tr>
                <td colspan="11" class="p-6 text-center text-red-500 bg-red-50 dark:bg-red-900/10">
                    <div class="flex flex-col items-center gap-2">
                        <i data-lucide="alert-circle" class="w-6 h-6"></i>
                        <span class="font-bold">Error Loading Data</span>
                        <span class="text-sm font-mono bg-white dark:bg-black px-2 py-1 rounded border border-red-200 dark:border-red-800">
                            ${err.message}
                        </span>
                    </div>
                </td>
            </tr>
        `;
        lucide.createIcons();
    } finally {
        tableBody.classList.remove('opacity-40', 'pointer-events-none');
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