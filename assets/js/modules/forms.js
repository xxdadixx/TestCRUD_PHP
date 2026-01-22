/* assets/js/modules/forms.js */
import { swalTheme, nameRegex, nationalIdRegex, formatNationalIdValue } from './utils.js';
import { CustomerService } from './api-service.js';

// 🎨 Common Input Style
const inputClass = "w-full px-3 py-2.5 bg-white dark:bg-[#1c1c1e] border border-[#d1d1d6] dark:border-[#424245] rounded-lg text-[#1d1d1f] dark:text-white focus:ring-4 focus:ring-[#0071e3]/10 focus:border-[#0071e3] transition-all outline-none placeholder-gray-400";
const labelClass = "block text-[11px] font-semibold text-[#86868b] dark:text-[#98989d] uppercase tracking-wider mb-1.5";
const disabledClass = "bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#86868b] cursor-not-allowed";

/* =========================
   ADD CUSTOMER
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
                        <img id="preview_img_add" src="https://cdn-icons-png.flaticon.com/512/847/847969.png" class="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg">
                        <label for="photo_input_add" class="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 shadow-sm transition"><i data-lucide="camera" class="w-4 h-4"></i></label>
                        <input type="file" id="photo_input_add" class="hidden" accept="image/*" onchange="window.previewImageAdd(this)">
                    </div>
                    <span class="text-xs text-gray-400">Upload profile picture</span>
                </div>

                <div>
                    <label class="${labelClass}">Customer Code</label>
                    <div class="relative">
                        <input id="customer_code" class="${inputClass} ${disabledClass} font-mono text-sm" value="Auto Generated" disabled>
                        <div class="absolute inset-y-0 right-3 flex items-center"><i data-lucide="lock" class="w-4 h-4 text-gray-400"></i></div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="${labelClass}">First Name</label>
                        <input id="first_name" class="${inputClass}" placeholder="e.g. Somchai" oninput="window.allowNameOnly(this)">
                    </div>
                    <div>
                        <label class="${labelClass}">Last Name</label>
                        <input id="last_name" class="${inputClass}" placeholder="e.g. Jaidee" oninput="window.allowNameOnly(this)">
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
                        <input id="date_of_birth" type="date" class="${inputClass}" max="${new Date().toISOString().split("T")[0]}">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="${labelClass}">National ID</label>
                        <input id="national_id" class="${inputClass} font-mono tracking-wide" placeholder="x-xxxx-xxxxx-xx-x" maxlength="17" inputmode="numeric" oninput="window.formatNationalId(this)">
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

            // Validation
            if (!nameRegex.test(data.first_name)) { Swal.showValidationMessage("First name must be 2–50 characters"); return false; }
            if (!nameRegex.test(data.last_name)) { Swal.showValidationMessage("Last name must be 2–50 characters"); return false; }
            if (!data.date_of_birth) { Swal.showValidationMessage("Date of birth is required"); return false; }
            const cleanNationalId = data.national_id.replace(/-/g, "");
            if (!nationalIdRegex.test(cleanNationalId)) { Swal.showValidationMessage("National ID must be 13 digits"); return false; }
            data.national_id = cleanNationalId;

            const fileInput = document.getElementById('photo_input_add');
            return {
                textData: data,
                photoFile: fileInput && fileInput.files.length > 0 ? fileInput.files[0] : null
            };
        },
        didOpen: () => lucide.createIcons()
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { textData, photoFile } = result.value;
            try {
                // 1. Create Customer
                const createRes = await CustomerService.create(textData);
                if (createRes.status !== "success") throw new Error(createRes.message);

                // 2. Upload Photo (if any)
                if (photoFile && createRes.customer_id) {
                    const formData = new FormData();
                    formData.append('photo', photoFile);
                    formData.append('customer_id', createRes.customer_id);
                    await CustomerService.uploadPhoto(formData);
                }

                await Swal.fire({ title: "Success", text: "Customer created successfully!", icon: "success", ...swalTheme() });
                if (onSuccess) onSuccess();

            } catch (err) {
                Swal.fire({ title: "Error", text: err.message, icon: "error", ...swalTheme() });
            }
        }
    });
}

/* =========================
   EDIT CUSTOMER
========================= */
export function openEditCustomer(customerId, onSuccess) {
    CustomerService.getOne(customerId).then((res) => {
        if (res.status !== "success") {
            Swal.fire("Error", res.message || "Failed to fetch data", "error");
            return;
        }
        const c = res.data;
        const photoUrl = c.photo ? `${window.APP_BASE_URL}/photos/${c.photo}?t=${new Date().getTime()}` : "https://cdn-icons-png.flaticon.com/512/847/847969.png";

        Swal.fire({
            title: "Edit Customer",
            width: 600,
            ...swalTheme(),
            html: `
                <div class="text-left space-y-5 px-1">
                    <input type="hidden" id="customer_id" value="${c.customer_id}">
                    <div class="flex flex-col items-center gap-3">
                        <div class="relative group">
                            <img id="preview_img" src="${photoUrl}" class="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg">
                            <label for="photo_input" class="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 shadow-sm transition"><i data-lucide="camera" class="w-4 h-4"></i></label>
                            <input type="file" id="photo_input" class="hidden" accept="image/*" onchange="window.previewImage(this)">
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
                            <input id="first_name" class="${inputClass}" value="${c.first_name}" oninput="window.allowNameOnly(this)">
                        </div>
                        <div>
                            <label class="${labelClass}">Last Name</label>
                            <input id="last_name" class="${inputClass}" value="${c.last_name}" oninput="window.allowNameOnly(this)">
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
                            <input id="national_id" class="${inputClass} font-mono" value="${formatNationalIdValue(c.national_id)}" maxlength="17" oninput="window.formatNationalId(this)">
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
            preConfirm: () => {
                const data = {
                    customer_id: c.customer_id,
                    first_name: document.getElementById("first_name").value.trim(),
                    last_name: document.getElementById("last_name").value.trim(),
                    gender: document.getElementById("gender").value,
                    date_of_birth: document.getElementById("date_of_birth").value,
                    national_id: document.getElementById("national_id").value.replace(/-/g, ""),
                    status_id: document.getElementById("status_id").value,
                };

                // Validation
                if (!nameRegex.test(data.first_name)) { Swal.showValidationMessage("First name must be 2–50 characters"); return false; }
                if (!nameRegex.test(data.last_name)) { Swal.showValidationMessage("Last name must be 2–50 characters"); return false; }
                if (!data.date_of_birth) { Swal.showValidationMessage("Date of birth is required"); return false; }
                if (!nationalIdRegex.test(data.national_id)) { Swal.showValidationMessage("National ID must be 13 digits"); return false; }

                const fileInput = document.getElementById('photo_input');
                return { textData: data, photoFile: fileInput && fileInput.files.length > 0 ? fileInput.files[0] : null };
            },
            didOpen: () => lucide.createIcons()
        }).then(async (result) => {
            // 🔥 แก้ตรงนี้: ใช้ CustomerService แทน ajaxPost
            if (result.isConfirmed) {
                const { textData, photoFile } = result.value;
                try {
                    // Update Text
                    const updateRes = await CustomerService.update(textData);
                    if (updateRes.status !== 'success') throw new Error(updateRes.message);

                    // Update Photo (if new)
                    if (photoFile) {
                        const formData = new FormData();
                        formData.append('photo', photoFile);
                        formData.append('customer_id', c.customer_id);
                        await CustomerService.uploadPhoto(formData);
                    }

                    await Swal.fire({ title: "Success", text: "Customer updated successfully", icon: "success", ...swalTheme() });
                    if (onSuccess) onSuccess();

                } catch (err) {
                    Swal.fire({ title: "Error", text: err.message, icon: "error", ...swalTheme() });
                }
            }
        });
    }).catch(err => {
        // 🔥 โชว์ Error จริง (err.message)
        Swal.fire({
            title: "Error",
            text: err.message || "Cannot load customer data",
            icon: "error",
            ...swalTheme()
        });
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
    }).then(async (result) => {
        // 🔥 แก้ตรงนี้: ใช้ CustomerService แทน ajaxPost
        if (result.isConfirmed) {
            try {
                const res = await CustomerService.delete(customerId);
                if (res.status === 'success') {
                    await Swal.fire({ title: "Deleted!", text: res.message, icon: "success", ...swalTheme() });
                    if (onSuccess) onSuccess();
                } else {
                    Swal.fire({ title: "Error", text: res.message, icon: "error", ...swalTheme() });
                }
            } catch (err) {
                Swal.fire({ title: "Error", text: err.message || "Cannot connect to server", icon: "error", ...swalTheme() });
            }
        }
    });
}

/* =========================
   VIEW CUSTOMER
========================= */
export function openViewCustomer(customerId) {
    CustomerService.getOne(customerId).then((res) => {
        if (res.status !== "success") {
            Swal.fire("Error", "Cannot fetch data", "error");
            return;
        }
        const c = res.data;
        const photoUrl = c.photo ? `${window.APP_BASE_URL}/photos/${c.photo}?t=${new Date().getTime()}` : "https://cdn-icons-png.flaticon.com/512/847/847969.png";
        const statusInputClass = c.status_id == 1 ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-500 dark:border-yellow-700";

        Swal.fire({
            title: "Customer Details",
            width: 600,
            ...swalTheme(),
            html: `
                <div class="text-left space-y-5 px-1">
                    <div class="flex flex-col items-center gap-3">
                        <img src="${photoUrl}" class="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg">
                    </div>
                    <div><label class="${labelClass}">Customer Code</label><input class="${inputClass} ${disabledClass} font-mono text-sm" value="${c.customer_code}" disabled readonly></div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label class="${labelClass}">First Name</label><input class="${inputClass} ${disabledClass}" value="${c.first_name}" disabled readonly></div>
                        <div><label class="${labelClass}">Last Name</label><input class="${inputClass} ${disabledClass}" value="${c.last_name}" disabled readonly></div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label class="${labelClass}">Gender</label><input class="${inputClass} ${disabledClass}" value="${c.gender}" disabled readonly></div>
                        <div><label class="${labelClass}">Date of Birth</label><input class="${inputClass} ${disabledClass}" value="${c.date_of_birth}" disabled readonly></div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label class="${labelClass}">National ID</label><input class="${inputClass} ${disabledClass} font-mono" value="${formatNationalIdValue(c.national_id)}" disabled readonly></div>
                        <div><label class="${labelClass}">Status</label><input class="w-full px-3 py-2.5 rounded-lg border font-medium ${statusInputClass}" value="${c.status_id == 1 ? 'Active' : 'Inactive'}" disabled readonly></div>
                    </div>
                </div>
            `,
            showConfirmButton: false, showCancelButton: true, cancelButtonText: "Close",
            didOpen: () => lucide.createIcons()
        });
    }).catch(err => {
        // 🔥 โชว์ Error จริง (err.message)
        Swal.fire({
            title: "Error",
            text: err.message || "Cannot load customer data",
            icon: "error",
            ...swalTheme()
        });
    });
}