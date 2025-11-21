//api/todo.ts 
import { request } from '@/utils/request';
import { mapTodoFromApi } from '@/models/todo'; // Import mapper (File này vẫn là JS)
import type { CreateTodoPayload } from '@/types/todo';
import { PROJECT_CODE, TODO_API_URL } from '@/utils/config';

export const getTodos = async (params: any): Promise<any[]> => {
    const rawData = await request({
       url: `${TODO_API_URL}/getAll`,
        method: 'GET', // Lưu ý: Phải là POST để gửi data filter
        data: {
            projectCode: PROJECT_CODE,
            pageNo: params.pageNo || 1,
            pageSize: params.pageSize || 15, 
            ...params
        }
    });

    if (Array.isArray(rawData)) {
        // item: any vì mapTodoFromApi nhận input từ file JS
        return rawData.map((item: any) => mapTodoFromApi(item));
    }
    return [];
};

/**
 * 2. API Đếm tổng số lượng
 * - Return: Promise trả về number
 */
export const getTodoCount = async (params: any): Promise<number> => {
    const result = await request({
       url: `${TODO_API_URL}/countAll`,
        method: 'GET', // Lưu ý: Phải là POST
        data: {
            projectCode: PROJECT_CODE,
            ...params 
        }
    });
    
    // Ép kiểu về number cho chắc chắn
    return Number(result) || 0; 
};

/**
 * 3. API Tạo mới
 * - data: Sử dụng Interface CreateTodoPayload đã định nghĩa chặt chẽ
 */
export const createTodo = (data: CreateTodoPayload): Promise<any> => {
    return request({
        url: `${TODO_API_URL}/create`,
        method: 'POST',
        data: data
    });
};

/**
 * 4. API Xóa
 * - id: Có thể là string hoặc number
 */
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