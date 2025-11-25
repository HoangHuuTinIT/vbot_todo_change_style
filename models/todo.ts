import { TODO_STATUS, STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';
import type { TodoItem } from '@/types/todo'; // Import Type

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
export interface TodoListFilterState {
    title: string;
    jobCode: string;
    createdFrom: string;
    createdTo: string;
    dueDateFrom: string;
    dueDateTo: string;
}
export const buildTodoParams = (
    filter: TodoListFilterState, 
    statusValue: string, 
    sourceValue: string, 
    creatorId: string, 
    assigneeId: string
): Partial<GetTodoParams> => {
    return {
        keySearch: filter.title || '',
        code: filter.jobCode || '',
        status: statusValue || '',
        
        startDate: dateToTimestamp(filter.createdFrom),
        endDate: dateToTimestamp(filter.createdTo),
        
        dueDateFrom: dateToTimestamp(filter.dueDateFrom),
        dueDateTo: dateToTimestamp(filter.dueDateTo),
        
        createdBy: creatorId || '',
        assigneeId: assigneeId || '',
        links: sourceValue || '',
        
        customerCode: '',
        groupId: '',
        transId: '',
        pluginType: '',
    };
};

export const mapTodoFromApi = (apiData: TodoItem): TodoItem => {
    if (!apiData) return {} as TodoItem;
    const status = apiData.status || TODO_STATUS.NEW;
    const title = apiData.title || 'Không tên';

    return {
        ...apiData, 
        title: title,
        statusClass: STATUS_COLORS[status] || 'bg-orange',
        statusLabel: STATUS_LABELS[status] || status,
        avatarText: title.substring(0, 2).toUpperCase(),
        createdAtFormatted: formatFullDateTime(apiData.createdAt),
    } as any; 
};