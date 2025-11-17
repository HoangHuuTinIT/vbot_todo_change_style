// api/auth.js
import { INITIAL_TOKEN, FULL_API_URL } from '@/utils/config.js';

export const fetchAppToken = () => {
    return new Promise((resolve, reject) => {
        
        // --- THÊM ĐOẠN LOG NÀY ĐỂ KIỂM TRA ---
        console.log("--------------------------------");
        console.log("🔍 DEBUG REQUEST AUTH:");
        console.log("1. URL:", FULL_API_URL);
        console.log("2. Token Config (ENV):", INITIAL_TOKEN); // Xem token lấy từ env ra sao
        console.log("3. Header gửi đi:", `Bearer ${INITIAL_TOKEN}`); // Xem chuỗi ghép cuối cùng
        console.log("--------------------------------");
        // ---------------------------------------

        uni.request({
            url: FULL_API_URL,
            method: 'GET',
            header: {
                'Authorization': `Bearer ${INITIAL_TOKEN}`, // Đảm bảo có khoảng trắng sau Bearer
                'Content-Type': 'application/json'
            },
            success: (res) => {
                // Log kết quả trả về
                console.log("📡 API Response Status:", res.statusCode);
                if (res.statusCode === 200 && res.data?.status === 1) {
                    resolve(res.data.data);
                } else {
                    // In ra lỗi chi tiết từ server
                    console.error("❌ Server từ chối:", res.data); 
                    reject(res); // Trả về nguyên object res để catch bắt được
                }
            },
            fail: (err) => {
                console.error("❌ Lỗi mạng (Network Error):", err);
                reject(err);
            }
        });
    });
};