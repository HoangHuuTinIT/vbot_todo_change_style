import { SYSTEM_CONFIG } from '@/utils/enums';

// Khai báo kiểu cho biến môi trường (string | undefined)
export const BASE_URL: string = import.meta.env.VITE_API_BASE_URL as string;
export const AUTH_TOKEN: string = import.meta.env.VITE_AUTH_TOKEN as string;
export const PROJECT_CODE: string = import.meta.env.VITE_PROJECT_CODE as string;
export const UID: string = import.meta.env.VITE_UID as string;

export const FULL_API_URL: string = `${BASE_URL}?projectCode=${PROJECT_CODE}&uid=${UID}&type=${SYSTEM_CONFIG.MODULE_TYPE}&source=${SYSTEM_CONFIG.SOURCE_PARAM}`;