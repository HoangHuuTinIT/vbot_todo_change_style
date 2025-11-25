import { TODO_STATUS } from '@/utils/constants';
import { TODO_SOURCE, DEFAULT_VALUES } from '@/utils/enums';
import type { TodoForm, CreateTodoPayload, AppConfig } from '@/types/todo';
const dateToTimestamp = (dateStr: string): number => {
    if (!dateStr) return -1;
    const safeDateStr = dateStr.replace(/\//g, '-');
    const dateObj = new Date(safeDateStr);
    return isNaN(dateObj.getTime()) ? -1 : dateObj.getTime();
};

export interface CreateTodoConfig extends AppConfig {
    link?: string; 
}
export const buildCreateTodoPayload = (form: TodoForm, config: AppConfig): CreateTodoPayload => {
    
    const fullNotifyDateTime = `${form.notifyDate} ${form.notifyTime || '00:00'}`;
    const fullDueDate = form.dueDate; 

    return {
        title: form.name,
        description: form.desc || DEFAULT_VALUES.STRING, 
        
        projectCode: config.projectCode,
        createdBy: config.uid,
        
        status: TODO_STATUS.NEW as any, 
		links: config.link || TODO_SOURCE.CALL,
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