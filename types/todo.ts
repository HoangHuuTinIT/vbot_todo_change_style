// 1. Enum trạng thái (Mapping từ file enums.js)
export type TodoStatus = 'TO_DO' | 'IN_PROGRESS' | 'DONE';

// 2. Interface cho Form nhập liệu (UI)
export interface TodoForm {
    name: string;
    desc: string;
    customer: string;
    assignee: string;
    dueDate: string;    // YYYY-MM-DD
    notifyDate: string; // YYYY-MM-DD
    notifyTime: string; // HH:mm
}

// 3. Interface cho Payload gửi lên API (Server)
export interface CreateTodoPayload {
    title: string;
    description: string;
    projectCode: string;
    createdBy: string;
    status: TodoStatus;
    links: string;
    pluginType: string;
    customerCode: string;
    assigneeId: string;
    groupId: string;
    transId: string;
    tagCodes: string;
    groupMemberUid: string;
    files: string;
    phone: string;
    dueDate: number;             // Timestamp
    notificationReceivedAt: number; // Timestamp
}

// 4. Interface Config
export interface AppConfig {
    projectCode: string;
    uid: string;
}
export interface TodoItem {
    id: string | number;
    code: string;
    title: string;
    statusClass: string;
    statusLabel: string;
    avatarText: string;
    createdAtFormatted: string;
    raw: any; // Dữ liệu gốc chưa xử lý
}