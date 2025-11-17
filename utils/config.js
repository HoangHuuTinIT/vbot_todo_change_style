// utils/config.js

// Lấy giá trị từ .env
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN;
// Thêm export cho 2 biến này
export const PROJECT_CODE = import.meta.env.VITE_PROJECT_CODE;
export const UID = import.meta.env.VITE_UID;

// Export ra để dùng
export const INITIAL_TOKEN = AUTH_TOKEN;

// Ghép chuỗi URL đầy đủ
export const FULL_API_URL = `${BASE_URL}?projectCode=${PROJECT_CODE}&uid=${UID}&type=TODO&source=Desktop-RTC`;