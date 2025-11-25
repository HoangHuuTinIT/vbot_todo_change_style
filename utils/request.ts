import { useAuthStore } from '@/stores/auth'; 

interface RequestOptions extends UniApp.RequestOptions {
    _isRetry?: boolean;
    data?: any;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    header?: any;
}

export const request = async <T = any>(options: RequestOptions): Promise<T> => {
    const authStore = useAuthStore();

    const token = authStore.todoToken || authStore.rootToken;
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.header
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return new Promise((resolve, reject) => {
        uni.request({
            url: options.url,
            method: options.method || 'GET',
            data: options.data || {},
            header: headers,
            
            success: async (res: UniApp.RequestSuccessCallbackResult) => {
                const data = res.data as any;
                if (res.statusCode === 200) {
                    resolve(data.data as T); 
                    return;
                }

                if (res.statusCode === 401) {
                    console.warn(`API 401: Token hết hạn tại ${options.url}`);

                    if (options._isRetry) {
                        console.error(' Refresh Token cũng thất bại -> Logout.');
                        authStore.logout();
                        reject(data);
                        return;
                    }

                    try {
                        await authStore.exchangeForTodoToken();
                        console.log(' Đã Refresh Token -> Đang gọi lại API cũ...');
                        const retryResult = await request<T>({ 
                            ...options, 
                            _isRetry: true 
                        });
                        
                        resolve(retryResult);

                    } catch (err) {
                        authStore.logout();
                        reject(err);
                    }
                    return;
                }

                console.error(`[API Error ${res.statusCode}]`, data);
                reject(data);
            },

            fail: (err) => {
                console.error('[Network Error]', err);
                reject(err);
            }
        });
    });
};