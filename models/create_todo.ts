import { TODO_STATUS } from '@/utils/constants';
import { TODO_SOURCE, DEFAULT_VALUES } from '@/utils/enums';
// Import Types
import type { TodoForm, CreateTodoPayload, AppConfig } from '@/types/todo';

// Helper: Chuyển đổi chuỗi ngày giờ sang timestamp
const dateToTimestamp = (dateStr: string): number => {
    if (!dateStr) return -1;
    const safeDateStr = dateStr.replace(/\//g, '-');
    const dateObj = new Date(safeDateStr);
    return isNaN(dateObj.getTime()) ? -1 : dateObj.getTime();
};

/**
 * Model: Xây dựng Payload
 * Bây giờ hàm này trả về kiểu CreateTodoPayload -> IDE sẽ biết chính xác kết quả trả về có gì
 */
export const buildCreateTodoPayload = (form: TodoForm, config: AppConfig): CreateTodoPayload => {
    
    const fullNotifyDateTime = `${form.notifyDate} ${form.notifyTime || '00:00'}`;
    const fullDueDate = form.dueDate; 

    return {
        title: form.name,
        description: form.desc || DEFAULT_VALUES.STRING, 
        
        projectCode: config.projectCode,
        createdBy: config.uid,
        
        status: TODO_STATUS.NEW as any, // Ép kiểu nếu constants JS chưa chuẩn
        links: TODO_SOURCE.CALL,
        pluginType: DEFAULT_VALUES.PLUGIN_TYPE, 
        
       customerCode: form.customerUid || DEFAULT_VALUES.CUSTOMER_CODE,
        assigneeId: form.assignee || DEFAULT_VALUES.ASSIGNEE_ID,       
        
        groupId: DEFAULT_VALUES.GROUP_ID,
        transId: DEFAULT_VALUES.TRANS_ID,
        
        tagCodes: "test1", 
        groupMemberUid: "test1",
        files: DEFAULT_VALUES.STRING,
        phone: DEFAULT_VALUES.PHONE_PLACEHOLDER,
        
        dueDate: dateToTimestamp(fullDueDate),
        notificationReceivedAt: dateToTimestamp(fullNotifyDateTime)
    };
};