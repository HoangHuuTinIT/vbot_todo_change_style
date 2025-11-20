// models/todo_detail.ts
import { TODO_STATUS } from '@/utils/constants';
import { TODO_SOURCE } from '@/utils/enums';

// Định nghĩa Interface cho Form Chi tiết để code gợi ý chuẩn hơn
export interface TodoDetailForm {
    id: string | number;
    title: string;
    code: string;
    desc: string;
    statusIndex: number;
    sourceIndex: number;
    assigneeIndex: number;
	assigneeId: string;
    dueDate: string;     // YYYY-MM-DD
    notifyDate: string;  // YYYY-MM-DD
    notifyTime: string;  // HH:mm
}

// --- HELPER: Xử lý ngày tháng nội bộ cho file này ---
const timestampToDateStr = (ts: number): string => {
    if (!ts || ts <= 0) return '';
    try {
        const date = new Date(ts);
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
    } catch { return ''; }
};

const timestampToTimeStr = (ts: number): string => {
    if (!ts || ts <= 0) return '';
    try {
        const date = new Date(ts);
        const h = date.getHours().toString().padStart(2, '0');
        const min = date.getMinutes().toString().padStart(2, '0');
        return `${h}:${min}`;
    } catch { return ''; }
};

/**
 * Hàm Mapper: Biến dữ liệu API (Raw) -> Dữ liệu Form (UI)
 */
export const mapTodoDetailToForm = (apiData: any): TodoDetailForm | null => {
    if (!apiData) return null;

    // 1. Xử lý Trạng thái (Map String API -> Index Picker)
    // Thứ tự: ['Chưa xử lý', 'Đang xử lý', 'Hoàn thành']
    const statusMap = [TODO_STATUS.NEW, TODO_STATUS.IN_PROGRESS, TODO_STATUS.DONE];
    let sIndex = statusMap.indexOf(apiData.status);
    if (sIndex === -1) sIndex = 0; // Mặc định là 'Chưa xử lý'

    // 2. Xử lý Nguồn (Map String API -> Index Picker)
    // Thứ tự: ['Cuộc gọi', 'Khách hàng', 'Hội thoại', 'Tin nhắn']
    const sourceMap = [TODO_SOURCE.CALL, TODO_SOURCE.CUSTOMER, TODO_SOURCE.CONVERSATION, TODO_SOURCE.CHAT_MESSAGE];
    let srcIndex = sourceMap.indexOf(apiData.links);
    if (srcIndex === -1) srcIndex = 0; // Mặc định

    // 3. Xử lý Ngày thông báo (Tách Date/Time)
    const notiTimestamp = apiData.notificationReceivedAt || 0;

    return {
        id: apiData.id,
        title: apiData.title || '',
        code: apiData.code || '',
        desc: apiData.description || '', // HTML từ API

        statusIndex: sIndex,
        sourceIndex: srcIndex,
        assigneeIndex: 0, // Tạm fix cứng vì chưa có API User
		assigneeId: apiData.assigneeId || '',
        dueDate: timestampToDateStr(apiData.dueDate),
        notifyDate: timestampToDateStr(notiTimestamp),
        notifyTime: timestampToTimeStr(notiTimestamp)
    };
};