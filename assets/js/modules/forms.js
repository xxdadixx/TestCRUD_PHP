import { swalTheme, nameRegex, nationalIdRegex, formatNationalIdValue } from './utils.js';
import { CustomerService } from './api-service.js';

// 🎨 Common Input Style (Apple Design)
const inputClass = "w-full px-3 py-2.5 bg-white dark:bg-[#1c1c1e] border border-[#d1d1d6] dark:border-[#424245] rounded-lg text-[#1d1d1f] dark:text-white focus:ring-4 focus:ring-[#0071e3]/10 focus:border-[#0071e3] transition-all outline-none placeholder-gray-400";
const labelClass = "block text-[11px] font-semibold text-[#86868b] dark:text-[#98989d] uppercase tracking-wider mb-1.5";
const disabledClass = "bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#86868b] cursor-not-allowed";

/* =========================
   ADD CUSTOMER (WITH PHOTO)
========================= */

export function openAddCustomer(onSuccess) {
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

            // ✅ 1. ใส่ Validation กลับมาแล้วครับ
            data.first_name = data.first_name.replace(/\s+/g, " ").trim();
            data.last_name = data.last_name.replace(/\s+/g, " ").trim();

            if (!nameRegex.test(data.first_name)) { Swal.showValidationMessage("First name must be 2–50 characters"); return false; }
            if (!nameRegex.test(data.last_name)) { Swal.showValidationMessage("Last name must be 2–50 characters"); return false; }
            if (!data.date_of_birth) { Swal.showValidationMessage("Date of birth is required"); return false; }

            const cleanNationalId = data.national_id.replace(/-/g, "");
            if (!nationalIdRegex.test(cleanNationalId)) { Swal.showValidationMessage("National ID must be 13 digits"); return false; }
            data.national_id = cleanNationalId;

            // ✅ 2. Return data พร้อมกับ File Object
            const fileInput = document.getElementById('photo_input_add');
            return {
                textData: data,
                photoFile: fileInput && fileInput.files.length > 0 ? fileInput.files[0] : null
            };
        },
        didOpen: () => {
            lucide.createIcons();
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { textData, photoFile } = result.value;

            try {
                // 1. สร้างลูกค้า (ส่ง Text)
                const createRes = await fetch(API.customer.store, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(textData),
                });
                const createResult = await createRes.json();

                if (createResult.status !== "success") {
                    throw new Error(createResult.message + (createResult.debug ? ` (${createResult.debug})` : ""));
                }

                // 2. ถ้ามีรูป -> อัปโหลดรูปตามไป
                if (photoFile && createResult.customer_id) {
                    const formData = new FormData();
                    formData.append('photo', photoFile);
                    formData.append('customer_id', createResult.customer_id);

                    const uploadRes = await fetch(`${window.APP_BASE_URL}/customers/api/upload_photo.php`, {
                        method: 'POST',
                        body: formData
                    });
                    const uploadResult = await uploadRes.json();

                    if (uploadResult.status !== 'success') {
                        Swal.fire("Warning", "Customer created but photo upload failed: " + uploadResult.message, "warning");
                        loadCustomers(currentPage);
                        return;
                    }
                }

                // สำเร็จ
                await Swal.fire({
                    title: "Success",
                    text: "Customer created successfully!",
                    icon: "success",
                    ...swalTheme()
                });
                loadCustomers(currentPage);

            } catch (err) {
                console.error(err);
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

/* =========================
   EDIT CUSTOMER (WITH PHOTO UPLOAD)
========================= */

export function openEditCustomer(customerId, onSuccess) {
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

            // เตรียม URL รูป
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

                preConfirm: async () => {
                    const data = {
                        customer_id: c.customer_id,
                        first_name: document.getElementById("first_name").value.trim(),
                        last_name: document.getElementById("last_name").value.trim(),
                        gender: document.getElementById("gender").value,
                        date_of_birth: document.getElementById("date_of_birth").value,
                        national_id: document.getElementById("national_id").value.replace(/-/g, ""),
                        status_id: document.getElementById("status_id").value,
                    };

                    // ✅ Validation เต็มรูปแบบ
                    if (!nameRegex.test(data.first_name)) { Swal.showValidationMessage("First name must be 2–50 characters"); return false; }
                    if (!nameRegex.test(data.last_name)) { Swal.showValidationMessage("Last name must be 2–50 characters"); return false; }
                    if (!data.date_of_birth) { Swal.showValidationMessage("Date of birth is required"); return false; }
                    if (!nationalIdRegex.test(data.national_id)) { Swal.showValidationMessage("National ID must be 13 digits"); return false; }

                    // จัดการรูปภาพ (ถ้ามีการเลือกไฟล์ใหม่)
                    const fileInput = document.getElementById('photo_input');
                    if (fileInput.files.length > 0) {
                        const formData = new FormData();
                        formData.append('photo', fileInput.files[0]);
                        formData.append('customer_id', c.customer_id);

                        try {
                            const uploadRes = await fetch(`${window.APP_BASE_URL}/customers/api/upload_photo.php`, {
                                method: 'POST', body: formData
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

                    return data; 
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

/* =========================
   DELETE CUSTOMER
========================= */
export function confirmDelete(customerId, onSuccess) {
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