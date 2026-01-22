/* assets/js/modules/api-config.js */

const BASE = window.APP_BASE_URL || '';

export const API = {
    customer: {
        list: `${BASE}/customers/api/customer_fetch.php`,
        get:  `${BASE}/customers/api/show.php`,
        store: `${BASE}/customers/api/store.php`,
        update: `${BASE}/customers/api/update.php`,
        delete: `${BASE}/customers/api/delete.php`,
        upload: `${BASE}/customers/api/upload_photo.php`
    }
};