export interface ApiResponse<T> {
    status: number;
    error?: number;
    errorCode?: number; 
    msg?: string;       
    message?: string;   
    data: T;
}


export type TodoLinkType = 'CALL' | 'CUSTOMER' | 'CONVERSATION' | 'CHAT_MESSAGE';

export type TodoStatusType = 'TO_DO' | 'IN_PROGRESS' | 'DONE';

export type TodoMessageType = 'COMMENT' | 'UPDATE_TODO' | 'LOG';