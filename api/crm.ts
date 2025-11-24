// src/api/crm.ts
import { request } from '@/utils/request'; // Hoặc dùng uni.request trực tiếp nếu cần custom header khác biệt
import { SYSTEM_CONFIG } from '@/utils/enums';
import { useAuthStore } from '@/stores/auth';
import { CRM_API_URL } from '@/utils/config';

// 1. Lấy Token CRM
export const getCrmToken = (projectCode: string, uid: string): Promise<string> => {
    const authStore = useAuthStore();
    return new Promise((resolve, reject) => {
        uni.request({
            url: `${CRM_API_URL}/token`,
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
            url: `${CRM_API_URL}/Customer/getAllFieldSearch`,
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
           url: `${CRM_API_URL}/Customer/getAll`,
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

export const getCrmCustomerDetail = (crmToken: string, customerUid: string): Promise<any> => {
    return request({
        url: `${CRM_API_URL}/Customer/getDetail`,
        method: 'GET', // Thường getDetail là GET, nếu server bắt POST thì đổi lại
        data: {
            uid: customerUid // Param là uid như bạn mô tả
        },
        header: {
            'Authorization': `Bearer ${crmToken}` // Dùng token CRM vừa lấy được
        }
    });
};

export const getCrmActionTimeline = (crmToken: string, customerUid: string, type: string = 'ALL'): Promise<any[]> => {
    return request({
        // Thay 'type=ALL' thành 'type=${type}'
        url: `${CRM_API_URL}/ActionTimeline/getAll?from=-1&to=-1&customerUid=${customerUid}&type=${type}&page=1&size=10&memberUid=&projectCode=`,
        method: 'GET',
        header: {
            'Authorization': `Bearer ${crmToken}`
        }
    });
};