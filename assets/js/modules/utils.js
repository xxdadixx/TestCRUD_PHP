export const nameRegex = /^[A-Za-zก-ฮ\s]{2,50}$/;
export const nationalIdRegex = /^\d{13}$/;

/* =========================
    Dark Mode
========================= */
export function isDarkMode() {
    return document.documentElement.classList.contains("dark");
}

export function swalTheme() {
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
export function formatNationalId(input) {
    let digits = input.value.replace(/\D/g, "").slice(0, 13);

    let formatted = "";
    if (digits.length > 0) formatted += digits.substring(0, 1);
    if (digits.length > 1) formatted += "-" + digits.substring(1, 5);
    if (digits.length > 5) formatted += "-" + digits.substring(5, 10);
    if (digits.length > 10) formatted += "-" + digits.substring(10, 12);
    if (digits.length > 12) formatted += "-" + digits.substring(12, 13);

    input.value = formatted;
}

export function formatNationalIdValue(id) {
    if (!id) return "";
    return id.replace(/^(\d)(\d{4})(\d{5})(\d{2})(\d)$/, "$1-$2-$3-$4-$5");
}

export function allowNameOnly(input) {
    input.value = input.value
        .replace(/[^A-Za-zก-ฮ\s]/g, "") // ตัดทุกอย่างที่ไม่ตรง RegExp
        .replace(/\s+/g, " ") // เว้นวรรคซ้ำ
        .slice(0, 50); // จำกัดความยาว
}

/* =========================
   HIGHLIGHT HELPER FUNCTION
   (เพิ่มฟังก์ชันนี้ไว้ล่างสุดของไฟล์ หรือที่กลุ่ม Helper)
========================= */
export function highlightText(text, search) {
    if (text === null || text === undefined) return "";
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