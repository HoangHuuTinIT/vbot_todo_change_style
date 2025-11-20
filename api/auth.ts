//api/auth.ts
import { request } from '@/utils/request.js';
import { SYSTEM_CONFIG } from '@/utils/enums';

// Định nghĩa kiểu dữ liệu trả về của API Login gốc
interface LoginResponse {
    access_token: string;
    // Thêm các trường khác bạn cần:
    expires_in: number;
    uid: string;
    token_type: string;
}

// 1. API Đăng nhập hệ thống (Dev Mode)
export const systemLogin = (username: string, password: string): Promise<LoginResponse> => {
    return new Promise((resolve, reject) => {
        uni.request({
            url: 'https://api-staging.vbot.vn/v1.0/token',
            method: 'POST',
            header: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: {
                username: username,
                password: password,
                grant_type: 'password',
                type_account: 0, 
                source: SYSTEM_CONFIG.SOURCE_PARAM 
            },
            success: (res: UniApp.RequestSuccessCallbackResult) => {
                // Ép kiểu body trả về
                const data = res.data as any;
                if (res.statusCode === 200 && data.access_token) {
                    resolve(data as LoginResponse);
                } else {
                    reject(data);
                }
            },
            fail: (err) => reject(err)
        });
    });
};

// 2. API Lấy Token riêng cho module Todo
export const getTodoToken = (rootToken: string, projectCode: string, uid: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        uni.request({
            url: `https://api-staging.vbot.vn/v1.0/api/module-crm/token`,
            method: 'GET',
            data: {
                projectCode: projectCode,
                uid: uid,
                type: SYSTEM_CONFIG.MODULE_TYPE,
                source: SYSTEM_CONFIG.SOURCE_PARAM
            },
            header: {
                'Authorization': `Bearer ${rootToken}` 
            },
            success: (res: UniApp.RequestSuccessCallbackResult) => {
                const data = res.data as any;
                // Kiểm tra theo cấu trúc: data.data.token
                if (data && data.data && data.data.token) {
                    resolve(data.data.token as string);
                } else {
                    reject(data);
                }
            },
            fail: (err) => reject(err)
        });
    });
};