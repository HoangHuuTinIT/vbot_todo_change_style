// src/api/crm.ts
import { request } from '@/utils/request'; // Hoặc dùng uni.request trực tiếp nếu cần custom header khác biệt
import { SYSTEM_CONFIG } from '@/utils/enums';
import { useAuthStore } from '@/stores/auth';

const CRM_BASE_URL = 'https://api-staging.vbot.vn/v1.0/api/module-crm';

// 1. Lấy Token CRM
export const getCrmToken = (projectCode: string, uid: string): Promise<string> => {
    const authStore = useAuthStore();
    return new Promise((resolve, reject) => {
        uni.request({
            url: `${CRM_BASE_URL}/token`,
            method: 'GET',
            data: {
                projectCode,
                uid,
                type: 'CRM', // Theo yêu cầu
                source: SYSTEM_CONFIG.SOURCE_PARAM // 'Desktop-RTC'
            },
            header: {
                'Authorization': `Bearer ${authStore.rootToken}` // Dùng token gốc
            },
            success: (res: any) => {
                if (res.data?.status === 1 && res.data?.data?.token) {
                    resolve(res.data.data.token);
                } else {
                    reject(res.data?.message || 'Lỗi lấy Token CRM');
                }
            },
            fail: (err) => reject(err)
        });
    });
};

// 2. Lấy cấu hình trường tìm kiếm (để lấy ID)
export const getCrmFieldSearch = (crmToken: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        uni.request({
            url: `${CRM_BASE_URL}/Customer/getAllFieldSearch`,
            method: 'POST',
            data: {}, // Body rỗng
            header: {
                'Authorization': `Bearer ${crmToken}` // Dùng token CRM
            },
            success: (res: any) => {
                if (res.data?.status === 1) {
                    resolve(res.data.data);
                } else {
                    reject(res.data?.message || 'Lỗi lấy Field Search');
                }
            },
            fail: (err) => reject(err)
        });
    });
};

// 3. Lấy danh sách khách hàng
export const getCrmCustomers = (crmToken: string, body: any): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        uni.request({
            url: `${CRM_BASE_URL}/Customer/getAll`,
            method: 'POST',
            data: body,
            header: {
                'Authorization': `Bearer ${crmToken}`
            },
            success: (res: any) => {
                if (res.data?.status === 1) {
                    resolve(res.data.data);
                } else {
                    reject(res.data?.message || 'Lỗi lấy danh sách KH');
                }
            },
            fail: (err) => reject(err)
        });
    });
};