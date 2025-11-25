import { SYSTEM_CONFIG } from '@/utils/enums';

export const SERVER_BASE_URL: string = import.meta.env.VITE_SERVER_BASE_URL as string;

export const AUTH_API_URL = SERVER_BASE_URL; 

export const CRM_API_URL = `${SERVER_BASE_URL}/api/module-crm`;

export const PROJECT_API_URL = `${SERVER_BASE_URL}/api/project`;

export const TODO_API_URL = `${SERVER_BASE_URL}/api/module-todo/todo`;

export const PROJECT_CODE: string = import.meta.env.VITE_PROJECT_CODE as string;
export const UID: string = import.meta.env.VITE_UID as string;

export const FULL_API_URL: string = `${TODO_API_URL}?projectCode=${PROJECT_CODE}&uid=${UID}&type=${SYSTEM_CONFIG.MODULE_TYPE}&source=${SYSTEM_CONFIG.SOURCE_PARAM}`;