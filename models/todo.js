import { TODO_STATUS, STATUS_LABELS, STATUS_COLORS } from '@/utils/constants.js';

// --- PRIVATE HELPERS (Dùng nội bộ) ---

// Hàm format đầy đủ: DD/MM/YYYY HH:mm:ss
const formatFullDateTime = (timestamp) => {
    // Handle trường hợp server trả về null, 0 hoặc -1
    if (!timestamp || timestamp === -1 || timestamp === 0) return '';
    
    const date = new Date(timestamp);
    
    // Lấy ngày, tháng, năm
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    
    // Lấy giờ, phút, giây
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    
    // Trả về định dạng: 18/11/2025 14:30:05
    return `${d}/${m}/${y} ${h}:${min}:${s}`;
};

const dateToTimestamp = (dateStr) => (!dateStr ? -1 : new Date(dateStr).getTime());

// --- PUBLIC MODELS ---

/**
 * 1. Request Model: Chuẩn hóa tham số filter gửi lên API
 * SỬA LỖI: Thêm tham số sourceValue vào hàm
 */
export const buildTodoParams = (filter, statusValue, sourceValue) => {
    return {
        keySearch: filter.title || '',
        code: filter.jobCode || '',
        status: statusValue || '',
        
        startDate: dateToTimestamp(filter.createdFrom),
        endDate: dateToTimestamp(filter.createdTo),
        
        // SỬA LỖI: Đã xóa 2 dòng gán -1 bị thừa ở dưới
        dueDateFrom: dateToTimestamp(filter.dueDateFrom),
        dueDateTo: dateToTimestamp(filter.dueDateTo),
        
        customerCode: '',
        groupId: '',
        transId: '',
        createdBy: '',
        assigneeId: '',
        pluginType: '',
        
        // Nhận giá trị từ tham số thứ 3
        links: sourceValue || ''
    };
};

/**
 * 2. Response Model: Chuẩn hóa dữ liệu từ Server về UI
 */
export const mapTodoFromApi = (apiData) => {
    if (!apiData) return {};

    const status = apiData.status || TODO_STATUS.NEW;
    const title = apiData.title || 'Không tên';

    return {
        id: apiData.id,
        code: apiData.code,
        title: title,
        
        // Class màu sắc
        statusClass: STATUS_COLORS[status] || 'bg-orange',
        
        // Label trạng thái
        statusLabel: STATUS_LABELS[status] || status,
        
        // Avatar text (nếu còn dùng ở đâu đó)
        avatarText: title.substring(0, 2).toUpperCase(),
        
        // Sử dụng hàm formatFullDateTime
        createdAtFormatted: formatFullDateTime(apiData.createdAt),
        
        raw: apiData
    };
};