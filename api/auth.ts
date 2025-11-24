import { request } from '@/utils/request';
import { SYSTEM_CONFIG } from '@/utils/enums';
// 1. Import biến AUTH_URL từ file config
import { AUTH_API_URL, CRM_API_URL } from '@/utils/config'; 

// Định nghĩa kiểu dữ liệu trả về của API Login gốc
interface LoginResponse {
    access_token: string;
    expires_in: number;
    uid: string;
    token_type: string;
}

// 1. API Đăng nhập hệ thống (Dev Mode)
export const systemLogin = (username: string, password: string): Promise<LoginResponse> => {
    return new Promise((resolve, reject) => {
        uni.request({
            // 2. Sửa URL cứng thành biến ghép
           url: `${AUTH_API_URL}/token`,
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
            // 3. Sửa URL cứng thành biến ghép
            // Lưu ý: AUTH_URL của bạn là ".../v1.0", nên đoạn sau chỉ cần bắt đầu từ "/api/..."
           url: `${CRM_API_URL}/token`,
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