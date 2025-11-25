import type { TodoStatusType, TodoLinkType } from './common';
export interface AppConfig {
    projectCode: string;
    uid: string;
}

export interface TodoForm {
    name: string;
    desc: string;
    customer: string;
    customerUid?: string; 
    assignee: string;   
    dueDate: string;    
    notifyDate: string;  
    notifyTime: string; 
}
export interface TodoItem {
    id: number;
    title: string;
    code: string;
    customerCode: string;
    projectCode: string | null;
    groupId: string;
    transId: string;
    description: string; 
    status: TodoStatusType;
    createdBy: string;
    assigneeId: string;
    groupMemberUid: string | null;
    dueDate: number; 
    notificationReceivedAt: number; 
    tags: string[];
    links: TodoLinkType;
    pluginType: string;
    createdAt: number;
    updatedAt: number;
    completedAt: number | null;
    firstActionAt: number | null;
    reAssignCount: number | null;
}

export interface GetTodoParams {
    projectCode: string;
    keySearch?: string;
    code?: string;
    customerCode?: string;
    groupId?: string;
    transId?: string;
    status?: string;
    createdBy?: string;
    assigneeId?: string;
    pluginType?: string;
    links?: string;
    startDate?: number;
    endDate?: number;
    dueDateFrom?: number;
    dueDateTo?: number;
    pageNo?: number;
    pageSize?: number;
}

export interface CreateTodoPayload {
    title: string;
    customerCode: string;
    projectCode: string;
    description: string;
    status: TodoStatusType;
    groupId: string;
    transId: string;
    tagCodes: string;
    links: TodoLinkType;
    pluginType: string;
    createdBy: string;
    assigneeId: string;
    groupMemberUid: string;
    files: string;
    phone: string;
    dueDate: number; 
    notificationReceivedAt: number; 
}

export interface UpdateTodoPayload extends CreateTodoPayload {
    id: number;
    preFixCode: string; 
}