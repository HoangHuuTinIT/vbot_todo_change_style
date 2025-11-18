// models/todo.js
import { TODO_STATUS, STATUS_LABELS, STATUS_COLORS } from '@/utils/constants.js';

// --- PRIVATE HELPERS (Dùng nội bộ) ---
const formatTimeShort = (timestamp) => {
    // Handle cả trường hợp server trả về 0 hoặc -1
    if (!timestamp || timestamp === -1 || timestamp === 0) return '';
    const date = new Date(timestamp);
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${min}, ${d} thg ${m}`;
};

const dateToTimestamp = (dateStr) => (!dateStr ? -1 : new Date(dateStr).getTime());

// --- PUBLIC MODELS ---

/**
 * 1. Request Model: Chuẩn hóa tham số filter gửi lên API
 * Input: Biến filter từ UI, status đang chọn
 * Output: Object params chuẩn như log bạn gửi
 */
export const buildTodoParams = (filter, statusValue) => {
    return {
        keySearch: filter.title || '',
        code: filter.jobCode || '',
        status: statusValue || '',
        
        // Xử lý ngày tháng: String -> Timestamp
        startDate: dateToTimestamp(filter.createdFrom),
        endDate: dateToTimestamp(filter.createdTo),
        
        // Các giá trị mặc định (Default values) để khớp với request mẫu
        dueDateFrom: -1,
        dueDateTo: -1,
        customerCode: '',
        groupId: '',
        transId: '',
        createdBy: '',
        assigneeId: '',
        pluginType: '',
        links: ''
    };
};

/**
 * 2. Response Model: Chuẩn hóa dữ liệu từ Server về UI
 * Input: 1 item trong mảng "data" của server
 * Output: Object đã format sẵn để hiển thị
 */
export const mapTodoFromApi = (apiData) => {
    if (!apiData) return {};

    const status = apiData.status || TODO_STATUS.NEW;
    const title = apiData.title || 'Không tên';

    return {
        // Giữ lại ID và Code để xử lý logic click
        id: apiData.id,
        code: apiData.code,
        
        // Dữ liệu hiển thị
        title: title,
        
        // --- LOGIC UI ĐÃ ĐƯỢC TÍNH TOÁN SẴN TẠI ĐÂY ---
        
        // 1. Class màu sắc (bg-green, bg-orange...)
        statusClass: STATUS_COLORS[status] || 'bg-orange',
        
        // 2. Label trạng thái (Mới, Xong...)
        statusLabel: STATUS_LABELS[status] || status,
        
        // 3. Avatar chữ cái (lấy 2 ký tự đầu)
        avatarText: title.substring(0, 2).toUpperCase(),
        
        // 4. Ngày tạo đã format (Ví dụ: "14:30, 17 thg 11")
        createdAtFormatted: formatTimeShort(apiData.createdAt),
        
        // Giữ lại raw data phòng khi cần dùng các trường khác (description, links...)
        raw: apiData
    };
};