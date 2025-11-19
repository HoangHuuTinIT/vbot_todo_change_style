import { useAuthStore } from '@/stores/auth'; // Import Store TS

// Định nghĩa kiểu dữ liệu cho options request
interface RequestOptions extends UniApp.RequestOptions {
    _isRetry?: boolean; // Cờ custom để xử lý retry
    data?: any;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; // Giới hạn method
    header?: any;
}

// Hàm request chính (Interceptor Logic)
export const request = async (options: RequestOptions): Promise<any> => {
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
                const data = res.data as any; // Ép kiểu để dễ truy cập

                if (res.statusCode === 200) {
                    resolve(data.data); 
                    return;
                }

                if (res.statusCode === 401) {
                    console.warn(`⚠️ API 401: Token hết hạn tại ${options.url}`);

                    if (options._isRetry) {
                        console.error('❌ Refresh Token cũng thất bại -> Logout.');
                        authStore.logout();
                        reject(data);
                        return;
                    }

                    try {
                        // Thử đổi Token mới
                        await authStore.exchangeForTodoToken();
                        console.log('🔄 Đã Refresh Token -> Đang gọi lại API cũ...');

                        // Gọi lại request (đánh dấu là retry)
                        const retryResult = await request({ 
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