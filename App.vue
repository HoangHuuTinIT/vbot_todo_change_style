<script>
	// Import hàm xử lý auth
	import { fetchAppToken } from '@/api/auth.js';

	export default {
		onLaunch: function() {
					console.log('App Launch');
					
					fetchAppToken()
						.then(data => {
							console.log("Token mới nhất là:", data.token);
							// QUAN TRỌNG: Lưu token vào bộ nhớ đệm để dùng ở trang Add Todo
							// Giả sử server trả về object { token: "..." }
							uni.setStorageSync('vbot_token', data.token);
						})
						.catch(err => {
							console.error('Lỗi lấy token:', err);
						});
				},
		onShow: function() {
			console.log('App Show');
		},
		onHide: function() {
			console.log('App Hide');
		}
	}
</script>

<style>
	/* Mỗi trang public css */

</style>