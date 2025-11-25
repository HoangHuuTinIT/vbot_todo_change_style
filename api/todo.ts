//api/todo.ts 
import { request } from '@/utils/request';
import { mapTodoFromApi } from '@/models/todo';
import type { CreateTodoPayload } from '@/types/todo';
import { PROJECT_CODE, TODO_API_URL ,SERVER_BASE_URL} from '@/utils/config';

export const getTodos = async (params: any): Promise<any[]> => {
    const rawData = await request({
       url: `${TODO_API_URL}/getAll`,
        method: 'GET', 
        data: {
            projectCode: PROJECT_CODE,
            pageNo: params.pageNo || 1,
            pageSize: params.pageSize || 15, 
            ...params
        }
    });

    if (Array.isArray(rawData)) {
        return rawData.map((item: any) => mapTodoFromApi(item));
    }
    return [];
};

export const getTodoCount = async (params: any): Promise<number> => {
    const result = await request({
       url: `${TODO_API_URL}/countAll`,
        method: 'GET', 
        data: {
            projectCode: PROJECT_CODE,
            ...params 
        }
    });
    
    return Number(result) || 0; 
};

export const createTodo = (data: CreateTodoPayload): Promise<any> => {
    return request({
        url: `${TODO_API_URL}/create`,
        method: 'POST',
        data: data
    });
};

export const deleteTodo = (id: string | number): Promise<any> => {
    return request({
        url: `${TODO_API_URL}/delete`,
        method: 'POST',
        data: { id: id }
    });
};

export const getTodoDetail = (id: string | number): Promise<any> => {
    return request({
        url: `${TODO_API_URL}/getDetail`,
        method: 'GET',
        data: {
            id: id,
            projectCode: PROJECT_CODE
        }
    });
};

export const getTodoMessages = (todoId: string | number, keySearch: string = ''): Promise<any[]> => {
    return request({
        url: `${SERVER_BASE_URL}/api/module-todo/todoMessages/getAllNoPageWithReact`,
        method: 'GET',
        data: {
            todoId: todoId,
            keySearch: keySearch 
        }
    });
};

export const createTodoMessage = (data: any): Promise<any> => {
    return request({
        url: `${SERVER_BASE_URL}/api/module-todo/todoMessages/create`,
        method: 'POST',
        data: data
    });
};

export const deleteTodoMessage = (id: number | string): Promise<any> => {
    return request({
        url: `${SERVER_BASE_URL}/api/module-todo/todoMessages/delete`,
        method: 'POST',
        data: { id: id }
    });
};

export const getTodoMessageDetail = (id: number | string, todoId: number | string): Promise<any> => {
    return request({
        url: `${SERVER_BASE_URL}/api/module-todo/todoMessages/getDetail`,
        method: 'GET',
        data: {
            id: id,
            todoId: todoId
        }
    });
};

export const updateTodoMessage = (data: any): Promise<any> => {
    return request({
        url: `${SERVER_BASE_URL}/api/module-todo/todoMessages/update`,
        method: 'POST',
        data: data
    });
};

export const reactionTodoMessage = (data: any): Promise<any> => {
    return request({
        url: `${SERVER_BASE_URL}/api/module-todo/todoMessages/reaction`,
        method: 'POST',
        data: data
    });
};
export const updateTodo = (data: any): Promise<any> => {
    return request({
        url: `${TODO_API_URL}/update`,
        method: 'POST',
        data: data
    });
};
