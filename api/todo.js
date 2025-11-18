// api/todo.js
import { request } from '@/utils/request.js';
import { PROJECT_CODE } from '@/utils/config.js';
import { mapTodoFromApi } from '@/models/todo.js'; // Import Model

const API_URL = 'https://api-staging.vbot.vn/v1.0/api/module-todo/todo';

export const getTodos = async (params) => {
    // Gọi request
    const rawData = await request({
        url: `${API_URL}/getAll`,
        method: 'GET',
        data: {
            projectCode: PROJECT_CODE,
            pageNo: 1,
            pageSize: 15, // Sửa thành 15 theo mẫu request của bạn
            ...params     // Merge các params từ model gửi vào
        }
    });

    // --- ÁP DỤNG MODEL TẠI ĐÂY ---
    // rawData chính là mảng "data": [...] do utils/request.js đã xử lý
    if (Array.isArray(rawData)) {
        return rawData.map(item => mapTodoFromApi(item));
    }
    
    return [];
};

export const createTodo = (data) => {
    return request({
        url: `${API_URL}/create`,
        method: 'POST',
        data: data
    });
};