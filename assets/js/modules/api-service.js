import { swalTheme } from './utils.js';

// ฟังก์ชันกลางสำหรับยิง Request
async function sendRequest(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: {}
    };

    if (data instanceof FormData) {
        options.body = data; // ไม่ต้อง set Content-Type สำหรับ FormData
    } else if (data) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const result = await response.text();
        return JSON.parse(result);
    } catch (err) {
        throw err;
    }
}

export const CustomerService = {
    getAll: (params) => sendRequest(`${API.customer.show}?${params}`),
    getOne: (id) => sendRequest(`${API.customer.show}?id=${id}`),
    create: (data) => sendRequest(API.customer.store, 'POST', data),
    update: (data) => sendRequest(API.customer.update, 'POST', data),
    delete: (id) => sendRequest(API.customer.delete, 'POST', { customer_id: id }),
    uploadPhoto: (formData) => sendRequest(`${window.APP_BASE_URL}/customers/api/upload_photo.php`, 'POST', formData)
};