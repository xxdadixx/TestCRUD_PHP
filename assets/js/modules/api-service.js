import { API } from './api-config.js';
import { swalTheme } from './utils.js';

// ฟังก์ชันกลางสำหรับยิง Request
async function sendRequest(url, method = 'GET', data = null) {
    const options = { method, headers: {} };

    if (data instanceof FormData) {
        options.body = data;
    } else if (data) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const resultText = await response.text();
        try {
            return JSON.parse(resultText);
        } catch (e) {
            // 🔥 โชว์ Error จาก PHP ออกมาเลย
            throw new Error("Server Error: " + resultText.substring(0, 200));
        }
    } catch (err) {
        throw err;
    }
}

export const CustomerService = {
    getAll: (params) => sendRequest(`${API.customer.list}?${params}`),
    getOne: (id) => sendRequest(`${API.customer.get}?id=${id}`),

    create: (data) => sendRequest(API.customer.store, 'POST', data),
    update: (data) => sendRequest(API.customer.update, 'POST', data),
    delete: (id) => sendRequest(API.customer.delete, 'POST', { customer_id: id }),
    uploadPhoto: (formData) => sendRequest(API.customer.upload, 'POST', formData)
};