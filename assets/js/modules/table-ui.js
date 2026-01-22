import { highlightText } from './utils.js';

/* =========================
   RENDER TABLE (WITH HIGHLIGHT)
========================= */

export function renderTable(customers, state, actions) {
    // 🔥 เพิ่มบรรทัดนี้: ค้นหาตารางก่อนใช้งาน
    const tableBody = document.getElementById("tableBody");
    if (!tableBody) return;
    
    // ต้องรับค่า state (เช่น currentSearch, currentSort) เข้ามาเป็น parameter แทนการใช้ global variable
    const { currentSort, currentSearch, currentPage } = state;
    const { onEdit, onDelete, onView } = actions;

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
   PAGINATION (FIXED)
========================= */
export function renderPagination(page, totalPages, onLoadPage) {
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
   RESIZABLE (HYBRID SYSTEM)
========================= */
export function initResizableTable() {
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

/* =========================
   UI HELPERS
========================= */
export function updateHeaderUI(sortState) {
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