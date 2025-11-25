
import { request } from '@/utils/request.js';
import { SYSTEM_CONFIG } from '@/utils/enums';
import { AUTH_API_URL, CRM_API_URL } from '@/utils/config'; 

interface LoginResponse {
    access_token: string;
    expires_in: number;
    uid: string;
    token_type: string;
}


export const systemLogin = (username: string, password: string): Promise<LoginResponse> => {
    return new Promise((resolve, reject) => {
        uni.request({
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

export const getTodoToken = (rootToken: string, projectCode: string, uid: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        uni.request({
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