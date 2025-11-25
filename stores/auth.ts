// src/stores/auth.ts
import { defineStore } from 'pinia';
import { systemLogin, getTodoToken } from '@/api/auth';
import { getCrmToken } from '@/api/crm';
import { PROJECT_CODE, UID } from '@/utils/config';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const useAuthStore = defineStore('auth', {
    state: () => ({
        rootToken: uni.getStorageSync('vbot_root_token') || '',
        rootLoginTime: uni.getStorageSync('vbot_root_login_time') || 0, 
        
        todoToken: uni.getStorageSync('todo_access_token') || '',
        crmToken: uni.getStorageSync('crm_access_token') || '',
        uid: uni.getStorageSync('vbot_uid') || '',
        projectCode: uni.getStorageSync('vbot_project_code') || '',
    }),

    getters: {
        isLoggedIn: (state) => !!state.todoToken && !!state.crmToken,
        isRootTokenValid: (state) => {
            if (!state.rootToken || !state.rootLoginTime) return false;
            const now = Date.now();
            return (now - state.rootLoginTime) < SEVEN_DAYS_MS;
        }
    },

    actions: {
        setAuthData(data: any) {
            if (data.rootToken) {
                this.rootToken = data.rootToken;
                uni.setStorageSync('vbot_root_token', data.rootToken);
                
                this.rootLoginTime = Date.now();
                uni.setStorageSync('vbot_root_login_time', this.rootLoginTime);
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
            }
			if (data.crmToken) {
			                this.crmToken = data.crmToken;
			                uni.setStorageSync('crm_access_token', data.crmToken);
			            }
        },

        async fetchModuleTokens() {
                    try {
                        if (!this.isRootTokenValid) {
                            console.log('Root Token hết hạn, login lại...');
                            await this.loginDevMode();
                            return;
                        }
        
                        console.log('Store: Đang lấy Token cho Todo và CRM...');
                        
                        const [newTodoToken, newCrmToken] = await Promise.all([
                            getTodoToken(this.rootToken, this.projectCode, this.uid),
                            getCrmToken(this.projectCode, this.uid)
                        ]);
    
                        this.setAuthData({ 
                            todoToken: newTodoToken,
                            crmToken: newCrmToken
                        });
                        
                        console.log(' Store: Đã lấy đủ Token (Todo & CRM).');
                    } catch (error) {
                        console.error(' Store: Lỗi lấy module tokens:', error);
                        this.logout();
                        throw error;
                    }
                },
        async loginDevMode() {
            const devUser = import.meta.env.VITE_TEST_USERNAME;
            const devPass = import.meta.env.VITE_TEST_PASSWORD;
            const devUid = import.meta.env.VITE_UID;
            const devProject = import.meta.env.VITE_PROJECT_CODE;

            if (!devUser || !devPass) {
                console.warn('Chưa cấu hình tài khoản Dev trong .env');
                return;
            }

            try {
                console.log('Store: Đang gọi API đăng nhập hệ thống...');
                const loginData = await systemLogin(devUser, devPass);
    
                this.setAuthData({
                    rootToken: loginData.access_token,
                    uid: devUid,
                    projectCode: devProject
                });

                await this.fetchModuleTokens();
            } catch (error) {
                console.error(' Store: Đăng nhập Dev thất bại', error);
            }
        },

        async initialize(options: any) {
                    console.log(' Store: Khởi tạo Auth...');
                    if (this.todoToken && this.crmToken) {
                        console.log('>>  Đã có đủ Token cũ. Ready!');
                        return; 
                    }
        
                    if (this.isRootTokenValid) {
                        console.log('️ Thiếu token module, đang lấy lại...');
                        await this.fetchModuleTokens();
                        return;
                    }
        
                    console.log('Root Token hết hạn. Login lại...');
                    await this.loginDevMode();
                },
async exchangeForTodoToken() {
            await this.fetchModuleTokens();
        },
        logout() {
            console.log('Store: Đăng xuất...');
            this.rootToken = '';
            this.rootLoginTime = 0;
            this.todoToken = '';
            this.crmToken = '';
            uni.removeStorageSync('crm_access_token');
            uni.removeStorageSync('todo_access_token');
            uni.removeStorageSync('vbot_root_token');
            uni.removeStorageSync('vbot_root_login_time');
        }
    }
});