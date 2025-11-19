import { defineStore } from 'pinia';
import { systemLogin, getTodoToken } from '@/api/auth';
import { PROJECT_CODE, UID } from '@/utils/config'; // Import config nếu cần fallback

export const useAuthStore = defineStore('auth', {
    // 1. STATE: Chứa dữ liệu (Giống data trong Vue)
    state: () => ({
        rootToken: uni.getStorageSync('vbot_root_token') || '',
        todoToken: uni.getStorageSync('todo_access_token') || '',
        uid: uni.getStorageSync('vbot_uid') || '',
        projectCode: uni.getStorageSync('vbot_project_code') || '',
        tokenExpiry: uni.getStorageSync('token_expiry_time') || 0
    }),

    // 2. GETTERS: Tính toán dữ liệu (Giống computed)
    getters: {
        isLoggedIn: (state) => !!state.todoToken,
        // Kiểm tra xem token còn hạn không
        isValidToken: (state) => {
            const now = Date.now();
            return state.todoToken && state.tokenExpiry && now < state.tokenExpiry;
        }
    },

    // 3. ACTIONS: Xử lý logic (Giống methods)
    actions: {
        // Hàm này dùng để lưu cả vào State lẫn Storage (giữ đồng bộ)
        setAuthData(data) {
            if (data.rootToken) {
                this.rootToken = data.rootToken;
                uni.setStorageSync('vbot_root_token', data.rootToken);
            }
            if (data.uid) {
                this.uid = data.uid;
                uni.setStorageSync('vbot_uid', data.uid);
            }
            if (data.projectCode) {
                this.projectCode = data.projectCode;
                uni.setStorageSync('vbot_project_code', data.projectCode);
            }
            if (data.todoToken) {
                this.todoToken = data.todoToken;
                uni.setStorageSync('todo_access_token', data.todoToken);
                
                // Set hạn 1 tiếng
                const expiresIn = 3600 * 1000;
                this.tokenExpiry = Date.now() + expiresIn;
                uni.setStorageSync('token_expiry_time', this.tokenExpiry);
            }
        },

        // Logic đổi Root Token lấy Todo Token
        async exchangeForTodoToken() {
            try {
                console.log('🔄 Store: Đang đổi Token Todo...');
                const todoToken = await getTodoToken(this.rootToken, this.projectCode, this.uid);
                this.setAuthData({ todoToken });
                console.log('✅ Store: Đã có Token Todo mới.');
            } catch (error) {
                console.error('❌ Store: Lỗi đổi token:', error);
                throw error;
            }
        },

        // Logic đăng nhập Dev (dùng cho localhost)
        async loginDevMode() {
            const devUser = import.meta.env.VITE_TEST_USERNAME;
            const devPass = import.meta.env.VITE_TEST_PASSWORD;
            const devUid = import.meta.env.VITE_UID;
            const devProject = import.meta.env.VITE_PROJECT_CODE;

            if (!devUser || !devPass) {
                console.warn('⚠️ Chưa cấu hình tài khoản Dev trong .env');
                return;
            }

            try {
                console.log('🛠 Store: Đang đăng nhập Dev...');
                const loginData = await systemLogin(devUser, devPass);
                
                // Lưu thông tin Root
                this.setAuthData({
                    rootToken: loginData.access_token,
                    uid: devUid,
                    projectCode: devProject
                });

                // Đổi sang Token Todo
                await this.exchangeForTodoToken();
            } catch (error) {
                console.error('❌ Store: Đăng nhập Dev thất bại', error);
            }
        },

        // --- HÀM CHÍNH: App.vue sẽ gọi hàm này ---
        async initialize(options) {
            console.log('🚀 Store: Khởi tạo Auth...');

            // CASE 1: Có Token từ URL (Production)
            if (options && options.query && (options.query.token || options.query.access_token)) {
                console.log('>> Mode: Production (URL Detect)');
                const rootToken = options.query.token || options.query.access_token;
                const uid = options.query.uid;
                const projectCode = options.query.projectCode;

                // Lưu thông tin gốc
                this.setAuthData({ rootToken, uid, projectCode });
                
                // Đổi token ngay lập tức
                await this.exchangeForTodoToken();
                return;
            }

            // CASE 2: Không có URL -> Kiểm tra Cache
            if (this.isValidToken) {
                console.log('>> Token cũ còn hạn, không cần làm gì.');
                return;
            }

            // CASE 3: Cache hết hạn hoặc không có -> Login Dev
            console.log('>> Mode: Dev / Expired Token');
            await this.loginDevMode();
        },
		logout() {
		            console.log('👋 Store: Đăng xuất, xóa Token...');
		            this.rootToken = '';
		            this.todoToken = '';
		            this.tokenExpiry = 0;
		            
		            // Xóa Storage
		            uni.removeStorageSync('todo_access_token');
		            uni.removeStorageSync('token_expiry_time');
		            // Giữ lại rootToken phòng khi user mở lại app còn cứu được, 
		            // hoặc xóa luôn tùy logic bảo mật của bạn. Ở đây mình xóa luôn cho sạch.
		            uni.removeStorageSync('vbot_root_token');
		}
    }
});