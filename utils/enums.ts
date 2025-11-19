// utils/enums.js

// 1. Nguồn gốc công việc (Source)
export const TODO_SOURCE = {
    CALL: 'CALL',
    CUSTOMER: 'CUSTOMER',
    CONVERSATION: 'CONVERSATION',
    CHAT_MESSAGE: 'CHAT_MESSAGE'
};

// 2. Cấu hình hệ thống (Dùng cho API header/param)
export const SYSTEM_CONFIG = {
    SOURCE_PARAM: 'Desktop-RTC', // Nguồn thiết bị
    MODULE_TYPE: 'TODO'          // Loại module
};

// 3. Các giá trị mặc định (Tránh null/undefined)
export const DEFAULT_VALUES = {
    STRING: '',
    PLUGIN_TYPE: '',
    GROUP_ID: '',
    TRANS_ID: '',
    ASSIGNEE_ID: '',
    CUSTOMER_CODE: '',
    PHONE_PLACEHOLDER: '072836272322' // Số điện thoại giả lập (nếu cần giữ logic cũ)
};

// 4. Cấu hình Editor (Màu sắc, Header)
export const EDITOR_CONFIG = {
    DEFAULT_COLOR: '#000000',
    TRANSPARENT: 'transparent',
    HEADER_NORMAL: 'Normal'
};