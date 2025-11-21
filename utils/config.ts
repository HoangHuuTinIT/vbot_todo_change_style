// src/utils/config.ts
import { SYSTEM_CONFIG } from '@/utils/enums';

// 1. Lấy URL Gốc từ .env
export const SERVER_BASE_URL: string = import.meta.env.VITE_SERVER_BASE_URL as string;

// 2. Lắp ráp các URL con (Endpoint Groups)
// - URL cho Auth (Login)
export const AUTH_API_URL = SERVER_BASE_URL; 

// - URL cho CRM Module
export const CRM_API_URL = `${SERVER_BASE_URL}/api/module-crm`;

// - URL cho Project Module
export const PROJECT_API_URL = `${SERVER_BASE_URL}/api/project`;

// - URL cho Todo Module
export const TODO_API_URL = `${SERVER_BASE_URL}/api/module-todo/todo`;


// 3. Các config khác (Giữ nguyên)
export const PROJECT_CODE: string = import.meta.env.VITE_PROJECT_CODE as string;
export const UID: string = import.meta.env.VITE_UID as string;

// Full API URL (Nếu bạn còn dùng ở đâu đó, cập nhật lại theo biến mới)
export const FULL_API_URL: string = `${TODO_API_URL}?projectCode=${PROJECT_CODE}&uid=${UID}&type=${SYSTEM_CONFIG.MODULE_TYPE}&source=${SYSTEM_CONFIG.SOURCE_PARAM}`;