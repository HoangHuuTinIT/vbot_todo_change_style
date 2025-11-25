// src/api/crm.ts
import { request } from '@/utils/request'; 
import { SYSTEM_CONFIG } from '@/utils/enums';
import { useAuthStore } from '@/stores/auth';
import { CRM_API_URL } from '@/utils/config';

export const getCrmToken = (projectCode: string, uid: string): Promise<string> => {
    const authStore = useAuthStore();
    return new Promise((resolve, reject) => {
        uni.request({
            url: `${CRM_API_URL}/token`,
            method: 'GET',
            data: {
                projectCode,
                uid,
                type: 'CRM',
                source: SYSTEM_CONFIG.SOURCE_PARAM 
            },
            header: {
                'Authorization': `Bearer ${authStore.rootToken}` 
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

export const getCrmFieldSearch = (crmToken: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        uni.request({
            url: `${CRM_API_URL}/Customer/getAllFieldSearch`,
            method: 'POST',
            data: {}, 
            header: {
                'Authorization': `Bearer ${crmToken}` 
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
        method: 'GET', 
        data: {
            uid: customerUid
        },
        header: {
            'Authorization': `Bearer ${crmToken}`
        }
    });
};

export const getCrmActionTimeline = (crmToken: string, customerUid: string, type: string = 'ALL'): Promise<any[]> => {
    return request({
        url: `${CRM_API_URL}/ActionTimeline/getAll?from=-1&to=-1&customerUid=${customerUid}&type=${type}&page=1&size=10&memberUid=&projectCode=`,
        method: 'GET',
        header: {
            'Authorization': `Bearer ${crmToken}`
        }
    });
};