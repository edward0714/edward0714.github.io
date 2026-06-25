/**
 * 工作小秘書 — API Client
 * 前端與後端 API 的通訊層
 * 
 * 使用方式：修改 API_BASE_URL 為後端伺服器實際位址
 */

const API_BASE_URL = (function() {
    // 部署到 GitHub Pages 時，改成後端實際位址
    // 例如：'http://你的伺服器IP:5000'
    // 開發時：'http://localhost:5000'
    const host = window.location.hostname;
    // 如果在 localhost 開發，自動使用 localhost
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    // 如果在 GitHub Pages 上，使用你的後端伺服器
    // ⚠️ 請修改為你的實際後端位址
    return 'http://172.16.1.3:5000';  // ← 改成你的後端實際可存取位址
})();

const ApiClient = {
    _request: async function(endpoint, options = {}) {
        const url = `${API_BASE_URL}/api${endpoint}`;
        const config = {
            credentials: 'include',  // 傳送 session cookie
            headers: { 'Accept': 'application/json' },
            ...options,
        };

        // 如果是 JSON body，設 Content-Type
        if (config.body && typeof config.body === 'string') {
            config.headers = { ...config.headers, 'Content-Type': 'application/json' };
        }

        try {
            const res = await fetch(url, config);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            return data;
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                throw new Error('無法連接到伺服器，請確認後端服務是否正常運行');
            }
            throw err;
        }
    },

    _get: (path) => ApiClient._request(path),
    _post: (path, body) => ApiClient._request(path, { method: 'POST', body: JSON.stringify(body) }),
    _put: (path, body) => ApiClient._request(path, { method: 'PUT', body: JSON.stringify(body) }),
    _delete: (path) => ApiClient._request(path, { method: 'DELETE' }),
    _formPost: (path, formData) => ApiClient._request(path, { method: 'POST', body: formData }),
    _formPut: (path, formData) => ApiClient._request(path, { method: 'PUT', body: formData }),

    // ─── Auth ────────────────────────────────
    checkAuth: () => ApiClient._get('/auth/check'),
    login: (username, password) => ApiClient._post('/auth/login', { username, password }),
    logout: () => ApiClient._post('/auth/logout'),
    forgotPassword: (email) => ApiClient._post('/auth/forgot-password', { email }),
    resetPassword: (token, password, confirm_password) =>
        ApiClient._post('/auth/reset-password', { token, password, confirm_password }),

    // ─── Dashboard ───────────────────────────
    getDashboard: () => ApiClient._get('/dashboard'),

    // ─── Profile ─────────────────────────────
    getProfile: () => ApiClient._get('/profile'),
    updateProfile: (data) => ApiClient._put('/profile', data),
    changePassword: (current_password, new_password, confirm_password) =>
        ApiClient._put('/profile/change-password', { current_password, new_password, confirm_password }),

    // ─── Tasks ───────────────────────────────
    getTasks: (status = '') => ApiClient._get(`/tasks${status ? `?status=${status}` : ''}`),
    createTask: (data) => ApiClient._post('/tasks', data),
    updateTask: (id, data) => ApiClient._put(`/tasks/${id}`, data),
    deleteTask: (id) => ApiClient._delete(`/tasks/${id}`),

    // ─── Reports ─────────────────────────────
    getReports: (type = '') => ApiClient._get(`/reports${type ? `?type=${type}` : ''}`),
    getReport: (id) => ApiClient._get(`/reports/${id}`),
    createReport: (formData) => ApiClient._formPost('/reports', formData),
    updateReport: (id, formData) => ApiClient._formPut(`/reports/${id}`, formData),
    summarizeReport: (id) => ApiClient._post(`/reports/${id}/summarize`),
    deleteReport: (id) => ApiClient._delete(`/reports/${id}`),
    getUploadUrl: (filename) => `${API_BASE_URL}/api/uploads/${filename}`,
};

// 登出工具
function logoutUser() {
    ApiClient.logout().then(() => {
        window.location.href = 'index.html';
    }).catch(() => {
        window.location.href = 'index.html';
    });
}

// 登入檢查（每個頁面載入時呼叫）
async function requireAuth() {
    try {
        const result = await ApiClient.checkAuth();
        if (!result.authenticated) {
            window.location.href = 'index.html';
            return null;
        }
        return result.user;
    } catch (e) {
        window.location.href = 'index.html';
        return null;
    }
}