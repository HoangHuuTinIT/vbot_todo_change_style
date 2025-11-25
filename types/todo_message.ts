import type { TodoMessageType } from './common';
export interface ReactionDetail {
    codeEmoji: string;
    senderId: string;
}

export interface ReactionData {
    total: number;
    details: ReactionDetail[];
}

export interface TodoMessageData {
    id: number;
    todoId: number;
    senderId: string;
    message: string; 
    type: TodoMessageType;
    files: string;
    createdAt: number;
    updatedAt: number | null;
    parentId: number | null;
    replies: TodoMessageData[]; 
    reactions: ReactionData;
    isDeleted?: boolean; 
}

export interface CreateMessagePayload {
    todoId: number;
    senderId: string;
    message: string;
    files: string;
    parentId?: number; 
}

export interface UpdateMessagePayload {
    id: number;
    todoId: number;
    senderId: string;
    message: string;
    files: string;
}

export interface ReactionPayload {
    todoId: number;
    senderId: string;
    todoMessageId: number;
    codeEmoji: string;
}