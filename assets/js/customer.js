/* assets/js/customer.js (Clean Version) */
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

// --- Main Function ---
async function loadCustomers(page = 1) {
    const tableBody = document.getElementById("tableBody");
    if (!tableBody) return; // ถ้าไม่มีตาราง (เช่นหน้า Edit) ให้หยุด

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

        // 4. Render UI
        TableUI.renderTable(data.customers, state, {
            onEdit: (id) => Forms.openEditCustomer(id, () => loadCustomers(state.currentPage)),
            onDelete: (id) => Forms.confirmDelete(id, () => loadCustomers(state.currentPage)),
            onView: (id) => Forms.openViewCustomer(id)
        });

        TableUI.renderPagination(data.page, data.totalPages, loadCustomers);

    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="11" class="p-6 text-center text-red-500">Failed to load data</td></tr>`;
    } finally {
        tableBody.classList.remove('opacity-40', 'pointer-events-none');
    }
}

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

// Global functions for HTML access
window.openAddCustomer = () => Forms.openAddCustomer(() => loadCustomers(1));
window.loadCustomers = loadCustomers; // เผื่อปุ่ม Pagination เรียก

// Start
document.addEventListener('DOMContentLoaded', () => {
    // เช็คก่อนว่าอยู่หน้าที่มีตารางไหม
    if (document.getElementById("tableBody")) {
        loadCustomers(1);
    }
});