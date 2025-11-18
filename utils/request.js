// utils/request.js
import { AUTH_TOKEN } from '@/utils/config.js';

export const request = (options) => {
    return new Promise((resolve, reject) => {
        // Ưu tiên lấy token từ Storage (do App.vue đã set), nếu không có mới dùng token cứng
        const dynamicToken = uni.getStorageSync('vbot_token'); 
        const finalToken = dynamicToken || AUTH_TOKEN;

        uni.request({
            url: options.url,
            method: options.method || 'GET',
            data: options.data || {},
            header: {
                'Authorization': `Bearer ${finalToken}`, 
                'Content-Type': 'application/json',
                ...options.header
            },
            success: (res) => {
                if (res.statusCode === 200 && res.data?.errorCode === 0) {
                    resolve(res.data.data);
                } else {
                    console.error(`[API Error] ${options.url}:`, res.data);
                    reject(res.data);
                }
            },
            fail: (err) => {
                console.error('[Network Error]:', err);
                reject(err);
            }
        });
    });
};