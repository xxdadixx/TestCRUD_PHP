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

/* =========================
   ADD CUSTOMER
========================= */
function openAddCustomer() {
    Swal.fire({
        title: "Add Customer",
        width: 600,
        ...swalTheme(),
        html: `
            <small style="color: #6b7280">Customer code will be generated automatically</small>
            <input id="customer_code" class="swal2-input" value="CUS-2026-XXXX" disabled>
            <input  id="first_name" 
                    class="swal2-input" 
                    placeholder="First Name *" 
                    oninput="allowNameOnly(this)">
            <input  id="last_name" 
                    class="swal2-input" 
                    placeholder="Last Name *" 
                    oninput="allowNameOnly(this)">

            <select id="gender" class="swal2-select">
                <option value="Unspecified">Unspecified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
            </select>

            <input id="date_of_birth" type="date" class="swal2-input" max="${new Date().toISOString().split("T")[0]}">
            <input  id="national_id" 
                    class="swal2-input" 
                    placeholder="National ID (13 digits) *"
                    maxlength="17"
                    inputmode="numeric"
                    oninput="formatNationalId(this)">

            <select id="status_id" class="swal2-select">
                <option value="1">Active</option>
                <option value="2">Inactive</option>
            </select>
        `,
        showCancelButton: true,
        confirmButtonText: "Save",
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

            if (!nameRegex.test(data.first_name)) {
                Swal.showValidationMessage(
                    "First name must be 2–50 characters (Thai/English letters only)",
                );
                return false;
            }

            if (!nameRegex.test(data.last_name)) {
                Swal.showValidationMessage(
                    "Last name must be 2–50 characters (Thai/English letters only)",
                );
                return false;
            }

            if (!data.date_of_birth) {
                Swal.showValidationMessage("Date of birth is required");
                return false;
            }

            const cleanNationalId = data.national_id.replace(/-/g, "");

            if (!nationalIdRegex.test(cleanNationalId)) {
                Swal.showValidationMessage("National ID must be 13 digits");
                return false;
            }

            data.national_id = cleanNationalId;

            if (!data.status_id) {
                Swal.showValidationMessage("Status is required");
                return false;
            }

            return data;
        },
    }).then((result) => {
        if (result.isConfirmed) {
            ajaxPost(API.customer.store, result.value);
        }
    });
}

/* =========================
   UPDATE CUSTOMER
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
                    <input type="hidden" id="customer_id" value="${c.customer_id}">

                    <input id="customer_code" class="swal2-input"
                        value="${c.customer_code}" disabled>

                    <input  id="first_name" 
                            class="swal2-input"
                            value="${c.first_name}"
                            oninput="allowNameOnly(this)">

                    <input  id="last_name" 
                            class="swal2-input"
                            value="${c.last_name}"
                            oninput="allowNameOnly(this)">

                    <select id="gender" class="swal2-select">
                        <option value="Unspecified" ${c.gender === "Unspecified" ? "selected" : ""}>Unspecified</option>
                        <option value="Male" ${c.gender === "Male" ? "selected" : ""}>Male</option>
                        <option value="Female" ${c.gender === "Female" ? "selected" : ""}>Female</option>
                    </select>

                    <input id="date_of_birth" type="date"
                        max="${new Date().toISOString().split("T")[0]}"
                        class="swal2-input"
                        value="${c.date_of_birth}">

                    <input  id="national_id" 
                            class="swal2-input" 
                            placeholder="National ID (13 digits) *"
                            maxlength="17"
                            inputmode="numeric"
                            value="${formatNationalIdValue(c.national_id)}"
                            oninput="formatNationalId(this)">

                    <select id="status_id" class="swal2-select">
                        <option value="1" ${c.status_id == 1 ? "selected" : ""}>Active</option>
                        <option value="2" ${c.status_id == 2 ? "selected" : ""}>Inactive</option>
                    </select>
                `,
                showCancelButton: true,
                confirmButtonText: "Update",
                focusConfirm: false,

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

                    if (!nameRegex.test(data.first_name)) {
                        Swal.showValidationMessage(
                            "First name must be 2–50 characters (Thai/English letters only)",
                        );
                        return false;
                    }

                    if (!nameRegex.test(data.last_name)) {
                        Swal.showValidationMessage(
                            "Last name must be 2–50 characters (Thai/English letters only)",
                        );
                        return false;
                    }

                    if (!data.date_of_birth) {
                        Swal.showValidationMessage("Date of birth is required");
                        return false;
                    }

                    const cleanNationalId = data.national_id.replace(/-/g, "");

                    if (!nationalIdRegex.test(cleanNationalId)) {
                        Swal.showValidationMessage("National ID must be 13 digits");
                        return false;
                    }

                    data.national_id = cleanNationalId;

                    if (!data.status_id) {
                        Swal.showValidationMessage("Status is required");
                        return false;
                    }

                    return data;
                },
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

    if (!customers || customers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="11" class="p-6 text-center text-gray-500">
                    No customers found
                </td>
            </tr>
        `;
        return;
    }

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
