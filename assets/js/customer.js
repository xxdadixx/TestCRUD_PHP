const nameRegex = /^[A-Za-zก-ฮ\s]{2,50}$/;
const nationalIdRegex = /^\d{13}$/;

/* =========================
   ADD CUSTOMER
========================= */
function openAddCustomer() {
    Swal.fire({
        title: 'Add Customer',
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

            <input id="date_of_birth" type="date" class="swal2-input" max="${new Date().toISOString().split('T')[0]}">
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
        confirmButtonText: 'Save',
        focusConfirm: false,

        preConfirm: () => {
            const data = {
                customer_code: document.getElementById('customer_code').value.trim(),
                first_name: document.getElementById('first_name').value.trim(),
                last_name: document.getElementById('last_name').value.trim(),
                gender: document.getElementById('gender').value,
                date_of_birth: document.getElementById('date_of_birth').value,
                national_id: document.getElementById('national_id').value.trim(),
                status_id: document.getElementById('status_id').value
            };

            data.first_name = data.first_name.replace(/\s+/g, ' ').trim();
            data.last_name = data.last_name.replace(/\s+/g, ' ').trim();

            if (!nameRegex.test(data.first_name)) {
                Swal.showValidationMessage(
                    'First name must be 2–50 characters (Thai/English letters only)'
                );
                return false;
            }

            if (!nameRegex.test(data.last_name)) {
                Swal.showValidationMessage(
                    'Last name must be 2–50 characters (Thai/English letters only)'
                );
                return false;
            }

            if (!data.date_of_birth) {
                Swal.showValidationMessage('Date of birth is required');
                return false;
            }

            const cleanNationalId = data.national_id.replace(/-/g, '');

            if (!nationalIdRegex.test(cleanNationalId)) {
                Swal.showValidationMessage('National ID must be 13 digits');
                return false;
            }

            data.national_id = cleanNationalId;

            if (!data.status_id) {
                Swal.showValidationMessage('Status is required');
                return false;
            }

            return data;
        }
    }).then(result => {
        if (result.isConfirmed) {
            ajaxPost(API.customer.store, result.value);
        }
    });
}

/* =========================
   UPDATE CUSTOMER
========================= */
function openEditCustomer(customerId) {

    fetch(API.customer.show + '?id=' + customerId)
        .then(res => res.json())
        .then(res => {

            if (res.status !== 'success') {
                Swal.fire('Error', res.message, 'error');
                return;
            }

            const c = res.data;

            Swal.fire({
                title: 'Edit Customer',
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
                        <option value="Unspecified" ${c.gender === 'Unspecified' ? 'selected' : ''}>Unspecified</option>
                        <option value="Male" ${c.gender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${c.gender === 'Female' ? 'selected' : ''}>Female</option>
                    </select>

                    <input id="date_of_birth" type="date"
                        max="${new Date().toISOString().split('T')[0]}"
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
                        <option value="1" ${c.status_id == 1 ? 'selected' : ''}>Active</option>
                        <option value="2" ${c.status_id == 2 ? 'selected' : ''}>Inactive</option>
                    </select>
                `,
                showCancelButton: true,
                confirmButtonText: 'Update',
                focusConfirm: false,

                preConfirm: () => {
                    const data = {
                        customer_id: c.customer_id,
                        first_name: document.getElementById('first_name').value.trim(),
                        last_name: document.getElementById('last_name').value.trim(),
                        gender: document.getElementById('gender').value,
                        date_of_birth: document.getElementById('date_of_birth').value,
                        national_id: document.getElementById('national_id').value.trim(),
                        status_id: document.getElementById('status_id').value
                    };

                    data.first_name = data.first_name.replace(/\s+/g, ' ').trim();
                    data.last_name = data.last_name.replace(/\s+/g, ' ').trim();

                    if (!nameRegex.test(data.first_name)) {
                        Swal.showValidationMessage(
                            'First name must be 2–50 characters (Thai/English letters only)'
                        );
                        return false;
                    }

                    if (!nameRegex.test(data.last_name)) {
                        Swal.showValidationMessage(
                            'Last name must be 2–50 characters (Thai/English letters only)'
                        );
                        return false;
                    }

                    if (!data.date_of_birth) {
                        Swal.showValidationMessage('Date of birth is required');
                        return false;
                    }

                    const cleanNationalId = data.national_id.replace(/-/g, '');

                    if (!nationalIdRegex.test(cleanNationalId)) {
                        Swal.showValidationMessage('National ID must be 13 digits');
                        return false;
                    }

                    data.national_id = cleanNationalId;

                    if (!data.status_id) {
                        Swal.showValidationMessage('Status is required');
                        return false;
                    }


                    return data;
                }
            }).then(result => {
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
        title: 'Are you sure?',
        text: 'This customer will be permanently deleted',
        icon: 'warning',
        ...swalTheme(),
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Yes, delete'
    }).then(result => {
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('HTTP error ' + response.status);
        }

        const text = await response.text();
        console.log('RAW RESPONSE:', text);

        let result;
        try {
            result = JSON.parse(text);
        } catch {
            throw new Error('Server did not return JSON');
        }

        if (result.status === 'success') {
            await Swal.fire({
                title: 'Success',
                text: result.message,
                icon: 'success',
                ...swalTheme()
            });

            location.reload();
        } else {
            throw new Error(result.message);
        }

    } catch (err) {
        Swal.fire({
            title: 'Error',
            text: err.message || 'Cannot connect to server',
            icon: 'error',
            ...swalTheme()
        });

    }
}

/* =========================
    Dark Mode
========================= */
function isDarkMode() {
    return document.documentElement.classList.contains('dark');
}

function swalTheme() {
    return isDarkMode()
        ? {
            background: '#1f2937', // gray-800
            color: '#f9fafb'       // gray-50
        }
        : {
            background: '#ffffff',
            color: '#111827'
        };
}

/* =========================
    RegExp ADD/EDIT
========================= */
function formatNationalId(input) {
    let digits = input.value.replace(/\D/g, '').slice(0, 13);

    let formatted = '';
    if (digits.length > 0) formatted += digits.substring(0, 1);
    if (digits.length > 1) formatted += '-' + digits.substring(1, 5);
    if (digits.length > 5) formatted += '-' + digits.substring(5, 10);
    if (digits.length > 10) formatted += '-' + digits.substring(10, 12);
    if (digits.length > 12) formatted += '-' + digits.substring(12, 13);

    input.value = formatted;
}

function formatNationalIdValue(id) {
    return id.replace(
        /^(\d)(\d{4})(\d{5})(\d{2})(\d)$/,
        '$1-$2-$3-$4-$5'
    );
}

function allowNameOnly(input) {
    input.value = input.value
        .replace(/[^A-Za-zก-ฮ\s]/g, '') // ตัดทุกอย่างที่ไม่ตรง RegExp
        .replace(/\s+/g, ' ')           // เว้นวรรคซ้ำ
        .slice(0, 50);                  // จำกัดความยาว
}

