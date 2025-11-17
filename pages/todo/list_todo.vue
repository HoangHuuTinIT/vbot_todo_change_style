<template>
	<view class="container">
		<view class="header">
			<view class="header-left"></view>
			<text class="header-title">Công việc</text>
			<view class="header-right" @click="openFilter">
				<image src="https://img.icons8.com/ios-filled/50/333333/filter--v1.png" class="filter-icon"></image>
			</view>
		</view>

		<view class="content">
			
			<view class="list-container">
				<view v-if="isLoading" class="loading-state">
					<text>Đang tải dữ liệu...</text>
				</view>

				<view v-else-if="todos.length === 0" class="empty-state">
					<image src="https://img.icons8.com/ios/100/cccccc/empty-box.png" mode="aspectFit" class="empty-icon"></image>
					<text class="empty-text">Chưa có dữ liệu</text>
				</view>

				<scroll-view v-else scroll-y="true" class="list-view">
					<view v-for="(item, index) in todos" :key="item.id || index" class="card-item">
						<view class="status-bar" :class="getStatusColorClass(item.status)"></view>
						
						<view class="card-body">
							<view class="card-row top-row">
								<view class="circle-checkbox"></view>
								<text class="card-title">{{ item.title }}</text>
							</view>

							<view class="card-row mid-row">
								<image src="https://img.icons8.com/ios/50/666666/time.png" class="icon-small"></image>
								<text class="card-date">Tạo lúc: {{ formatTimeShort(item.createdAt) }}</text>
							</view>

							<view class="card-row bot-row">
								<view class="badge-yellow">
									<image src="https://img.icons8.com/ios-filled/50/997b00/clock--v1.png" class="icon-tiny"></image>
									<text>{{ item.code }}</text>
								</view>
								<view class="status-text">{{ getStatusLabel(item.status) }}</view>
								<view class="avatar-circle" :class="getStatusColorClass(item.status)">
									{{ getAvatarText(item.title) }}
								</view>
							</view>
						</view>
					</view>
					
					<view style="height: 20px;"></view>
				</scroll-view>
			</view>

			<view class="fixed-footer">
				<button class="btn-add-more" @click="addNewTask">+ Thêm công việc</button>
			</view>
		</view>

		<view class="filter-overlay" v-if="isFilterOpen" @click.stop="closeFilter">
			<view class="filter-panel" @click.stop>
				<view class="filter-header">
					<text class="filter-title">Bộ lọc tìm kiếm</text>
					<text class="close-btn" @click="closeFilter">✕</text>
				</view>
				<scroll-view scroll-y="true" class="filter-body">
					<view class="f-group">
						<text class="f-label">Tiêu đề / Từ khóa</text>
						<input class="f-input" v-model="filter.title" placeholder="Nhập từ khóa..." />
					</view>
					<view class="f-group">
						<text class="f-label">Mã công việc</text>
						<input class="f-input" v-model="filter.jobCode" placeholder="Ví dụ: TODO-08" />
					</view>
					<view class="f-group">
						<text class="f-label">Trạng thái</text>
						<picker mode="selector" :range="statusOptions" :value="statusIndex" @change="onStatusChange">
							<view class="f-picker">{{ statusOptions[statusIndex] }}<text class="arrow">▼</text></view>
						</picker>
					</view>
					<view class="f-section-title">Thời gian tạo</view>
					<view class="f-row">
						<view class="f-group half">
							<picker mode="date" :value="filter.createdFrom" @change="(e) => filter.createdFrom = e.detail.value"><view class="f-picker date">{{ filter.createdFrom || 'Từ ngày' }}</view></picker>
						</view>
						<view class="f-group half">
							<picker mode="date" :value="filter.createdTo" @change="(e) => filter.createdTo = e.detail.value"><view class="f-picker date">{{ filter.createdTo || 'Đến ngày' }}</view></picker>
						</view>
					</view>
				</scroll-view>
				<view class="filter-footer">
					<button class="btn-reset" @click="resetFilter">Đặt lại</button>
					<button class="btn-apply" @click="applyFilter">Áp dụng</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
	// --- GIỮ NGUYÊN CODE JS CŨ CỦA BẠN, KHÔNG CẦN SỬA GÌ ---
	import { ref } from 'vue';
	import { onShow } from '@dcloudio/uni-app';
	import { PROJECT_CODE } from '@/utils/config.js';

	const todos = ref([]);
	const isLoading = ref(false);
	const isFilterOpen = ref(false);
	const statusOptions = ['Tất cả', 'Chưa xử lý', 'Đang xử lý', 'Hoàn thành'];
	const statusValues = ['', 'TO_DO', 'IN_PROGRESS', 'DONE'];
	const statusIndex = ref(0);
	const filter = ref({ title: '', jobCode: '', createdFrom: '', createdTo: '', dueFrom: '', dueTo: '' });

	onShow(() => { getTodoList(); });

	const dateToTimestamp = (dateStr) => (!dateStr ? -1 : new Date(dateStr).getTime());
	
	const formatTimeShort = (timestamp) => {
		if (!timestamp || timestamp === -1) return '';
		const date = new Date(timestamp);
		const d = date.getDate();
		const m = date.getMonth() + 1;
		const h = date.getHours().toString().padStart(2, '0');
		const min = date.getMinutes().toString().padStart(2, '0');
		return `${h}:${min}, ${d} thg ${m}`;
	};

	const getStatusLabel = (code) => {
		const map = { 'TO_DO': 'Mới', 'IN_PROGRESS': 'Đang làm', 'DONE': 'Xong' };
		return map[code] || code;
	};

	const getStatusColorClass = (code) => {
		if (code === 'DONE') return 'bg-green';
		if (code === 'IN_PROGRESS') return 'bg-blue';
		return 'bg-orange'; 
	}
	
	const getAvatarText = (title) => {
		if (!title) return 'NA';
		return title.substring(0, 2).toUpperCase();
	}

	const addNewTask = () => { uni.navigateTo({ url: '/pages/todo/create_todo' }); }
	const openFilter = () => { isFilterOpen.value = true; }
	const closeFilter = () => { isFilterOpen.value = false; }
	const onStatusChange = (e) => { statusIndex.value = e.detail.value; }
	
	const resetFilter = () => { 
		filter.value = { title: '', jobCode: '', createdFrom: '', createdTo: '', dueFrom: '', dueTo: '' };
		statusIndex.value = 0; 
	}
	
	const applyFilter = () => { closeFilter(); getTodoList(); }

	const getTodoList = () => {
		const token = uni.getStorageSync('user_token') || uni.getStorageSync('vbot_token');
		if (!token) return;

		isLoading.value = true;
		const params = {
			projectCode: PROJECT_CODE,
			keySearch: filter.value.title || '', 
			code: filter.value.jobCode || '',
			status: statusValues[statusIndex.value],
			customerCode: '', groupId: '', transId: '', createdBy: '', assigneeId: '', pluginType: '', links: '',
			startDate: dateToTimestamp(filter.value.createdFrom),
			endDate: dateToTimestamp(filter.value.createdTo),
			dueDateFrom: -1, dueDateTo: -1,
			pageNo: 1, pageSize: 20
		};

		uni.request({
			url: 'https://api-staging.vbot.vn/v1.0/api/module-todo/todo/getAll',
			method: 'GET', data: params,
			header: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
			success: (res) => {
				if (res.statusCode === 200 && res.data?.errorCode === 0) {
					todos.value = res.data.data || [];
				} else { uni.showToast({ title: 'Lỗi tải', icon: 'none' }); }
			},
			complete: () => { isLoading.value = false; }
		});
	}
</script>

<style lang="scss">
	/* --- LAYOUT CHUNG --- */
	.container { display: flex; flex-direction: column; height: 100vh; background-color: #f0f2f5; overflow: hidden; }
	.header { height: 50px; padding: 40px 20px 10px 20px; background-color: #fff; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
	.header-left { width: 30px; }
	.header-title { font-size: 20px; font-weight: bold; color: #333; flex: 1; text-align: center; }
	.header-right { width: 30px; display: flex; justify-content: flex-end; }
	.filter-icon { width: 24px; height: 24px; }
	
	/* --- CONTENT SỬA ĐỔI: CHIA 2 PHẦN --- */
	.content { 
		flex: 1; 
		/* Xóa padding cũ đi để footer tràn viền đẹp hơn */
		padding: 0; 
		overflow: hidden; 
		display: flex; 
		flex-direction: column; 
	}
	
	.list-container {
		flex: 1; /* Chiếm toàn bộ khoảng trống còn lại */
		padding: 15px; /* Padding cho danh sách nằm trong này */
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	/* --- FIXED FOOTER STYLE (MỚI) --- */
	.fixed-footer {
		flex-shrink: 0; /* Không cho phép bị co lại */
		background-color: #fff; /* Nền trắng để nổi bật */
		padding: 15px 20px;
		/* Thêm padding đáy cho iPhone X/11/12 */
		padding-bottom: calc(15px + env(safe-area-inset-bottom));
		border-top: 1px solid #eee;
		box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
		display: flex;
		justify-content: center;
	}

	.btn-add-more { 
		background-color: #fff; 
		color: #007aff; 
		border: 1px solid #007aff; 
		font-size: 14px; 
		border-radius: 20px; 
		width: 100%; /* Full width hoặc 150px tuỳ bạn */
		max-width: 200px;
	}

	/* --- GIỮ NGUYÊN CARD STYLE --- */
	.list-view { flex: 1; height: 1px; }
	.card-item { background-color: #fff; border-radius: 12px; margin-bottom: 15px; padding: 0; position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
	.status-bar { width: 40px; height: 15px; border-bottom-right-radius: 8px; position: absolute; top: 0; left: 0; }
	.card-body { padding: 15px 15px 15px 15px; padding-top: 25px; }
	.card-row { display: flex; align-items: center; margin-bottom: 8px; }
	.top-row { margin-bottom: 10px; }
	.circle-checkbox { width: 18px; height: 18px; border: 2px solid #8898aa; border-radius: 50%; margin-right: 10px; flex-shrink: 0; }
	.card-title { font-size: 16px; font-weight: 600; color: #32325d; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.mid-row { margin-bottom: 15px; }
	.icon-small { width: 16px; height: 16px; margin-right: 8px; opacity: 0.7; }
	.card-date { font-size: 14px; color: #525f7f; }
	.bot-row { justify-content: space-between; align-items: flex-end; }
	.badge-yellow { background-color: #fff9db; color: #d97706; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; display: flex; align-items: center; }
	.icon-tiny { width: 12px; height: 12px; margin-right: 4px; }
	.status-text { font-size: 12px; color: #8898aa; margin-left: auto; margin-right: 10px; }
	.avatar-circle { width: 36px; height: 36px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
	.bg-green { background-color: #2dce89; }
	.bg-blue { background-color: #11cdef; }
	.bg-orange { background-color: #fb6340; }
	
	.empty-state, .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #999; }
	.empty-icon { width: 80px; height: 80px; margin-bottom: 20px; }
	.btn-add-first { background-color: #007aff; color: white; border-radius: 20px; padding: 0 30px; margin-top: 20px; }

	/* Filter Styles (Giữ nguyên) */
	.filter-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); z-index: 999; display: flex; justify-content: flex-end; }
	.filter-panel { width: 85%; height: 100%; background-color: #fff; display: flex; flex-direction: column; animation: slideIn 0.3s ease-out; }
	@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
	.filter-header { padding: 40px 20px 20px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; font-weight: bold; font-size: 18px; }
	.close-btn { font-size: 24px; padding: 5px; color: #666; }
	.filter-body { flex: 1; height: 1px; width: 100%; padding: 20px; box-sizing: border-box; }
	.f-group { margin-bottom: 15px; }
	.f-label { font-size: 13px; color: #666; margin-bottom: 5px; display: block; }
	.f-input, .f-picker { background-color: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px; font-size: 14px; height: 20px; display: flex; align-items: center; justify-content: space-between; }
	.f-section-title { margin-top: 20px; margin-bottom: 10px; font-weight: bold; font-size: 14px; color: #009688; border-top: 1px dashed #eee; padding-top: 15px; }
	.f-row { display: flex; justify-content: space-between; }
	.half { width: 48%; }
	.arrow { font-size: 10px; color: #999; }
	.date { color: #333; }
	.filter-footer { padding: 20px; padding-bottom: calc(20px + env(safe-area-inset-bottom)); border-top: 1px solid #eee; display: flex; justify-content: space-between; background-color: #fff; }
	.btn-reset { width: 35%; background-color: #f5f5f5; color: #666; font-size: 14px; border-radius: 40px; }
	.btn-apply { width: 60%; background-color: #009688; color: white; font-size: 14px; border-radius: 40px; }
</style>