import { TODO_STATUS, STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';
import type { TodoItem } from '@/types/todo'; // Import Type

// --- PRIVATE HELPERS ---
const formatFullDateTime = (timestamp: number): string => {
    if (!timestamp || timestamp === -1 || timestamp === 0) return '';
    const date = new Date(timestamp);
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${d}/${m}/${y} ${h}:${min}:${s}`;
};

const dateToTimestamp = (dateStr: string): number => (!dateStr ? -1 : new Date(dateStr).getTime());

// --- PUBLIC MODELS ---

// Note: Params lọc có thể định nghĩa Interface riêng nếu muốn kỹ hơn
export const buildTodoParams = (filter: any, statusValue: string, sourceValue: string) => {
    return {
        keySearch: filter.title || '',
        code: filter.jobCode || '',
        status: statusValue || '',
        
        startDate: dateToTimestamp(filter.createdFrom),
        endDate: dateToTimestamp(filter.createdTo),
        
        dueDateFrom: dateToTimestamp(filter.dueDateFrom),
        dueDateTo: dateToTimestamp(filter.dueDateTo),
        
        customerCode: '',
        groupId: '',
        transId: '',
        createdBy: '',
        assigneeId: '',
        pluginType: '',
        links: sourceValue || ''
    };
};

export const mapTodoFromApi = (apiData: any): TodoItem => {
    if (!apiData) return {} as TodoItem;

    const status = apiData.status || TODO_STATUS.NEW;
    const title = apiData.title || 'Không tên';

    return {
        id: apiData.id,
        code: apiData.code,
        title: title,
        statusClass: STATUS_COLORS[status] || 'bg-orange',
        statusLabel: STATUS_LABELS[status] || status,
        avatarText: title.substring(0, 2).toUpperCase(),
        createdAtFormatted: formatFullDateTime(apiData.createdAt),
        raw: apiData
    };
};