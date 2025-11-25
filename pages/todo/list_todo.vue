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
					<view v-for="(item, index) in todos" :key="item.id || index" class="card-item" @click="goToDetail(item)">
						<view class="status-bar" :class="item.statusClass"></view>
						<view class="card-body">
							<view class="card-row top-row">
								<text class="card-title">{{ item.title }}</text>
								<view class="action-btn" @click.stop="showActionMenu(item)">
									<text class="dots">•••</text>
								</view>
							</view>
							<view class="card-row mid-row">
								<image src="https://img.icons8.com/ios/50/666666/time.png" class="icon-small"></image>
								<text class="card-date">Ngày tạo: {{ item.createdAtFormatted }}</text>
							</view>
							<view class="card-row bot-row">
								<view class="code-tag">#{{ item.code }}</view>
								<StatusBadge :status="item.status" />
							</view>
						</view>
					</view>
					<view style="height: 20px;"></view>
				</scroll-view>
			</view>

			<view class="fixed-footer">
				<picker mode="selector" :range="pageSizeOptions" :value="pageSizeIndex" @change="onPageSizeChange">
					<view class="page-size-selector">
						<text class="size-text">{{ pageSizeOptions[pageSizeIndex] }}</text>
						<text class="dropdown-arrow">▼</text>
					</view>
				</picker>

				<view class="pagination-controls">
					<view class="page-arrow" :class="{ 'disabled': currentPage <= 1 }" @click="changePage(-1)">‹</view>
					<view class="page-box active">{{ currentPage }}</view>
					<view class="page-arrow" :class="{ 'disabled': currentPage >= totalPages }" @click="changePage(1)">›</view>
				</view>

				<view class="add-task-simple" @click="addNewTask">
					<text class="plus-icon">+</text>
					<text class="add-text">Thêm công việc</text>
				</view>
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

					<view class="f-group">
					    <text class="f-label">Người tạo</text>
					    <picker mode="selector" :range="creatorOptions" :value="creatorIndex" @change="onCreatorChange">
					        <view class="f-picker">{{ creatorOptions[creatorIndex] }}<text class="arrow">▼</text></view>
					    </picker>
					</view>

					<view class="f-group">
						<text class="f-label">Mã khách hàng</text>
						<picker mode="selector" :range="customerOptions" :value="customerIndex" @change="onCustomerChange">
							<view class="f-picker">{{ customerOptions[customerIndex] }}<text class="arrow">▼</text></view>
						</picker>
					</view>

					<view class="f-group">
					    <text class="f-label">Người được giao</text>
					    <picker mode="selector" :range="assigneeOptions" :value="assigneeIndex" @change="onAssigneeChange">
					        <view class="f-picker">{{ assigneeOptions[assigneeIndex] }}<text class="arrow">▼</text></view>
					    </picker>
					</view>

					<view class="f-group">
						<text class="f-label">Nguồn</text>
						<picker mode="selector" :range="sourceOptions" :value="sourceIndex" @change="onSourceChange">
							<view class="f-picker">{{ sourceOptions[sourceIndex] }}<text class="arrow">▼</text></view>
						</picker>
					</view>

					<view class="f-section-title">Thời gian tạo</view>
					<view class="f-row">
						<view class="f-group half">
							<picker mode="date" :value="filter.createdFrom" @change="(e) => filter.createdFrom = e.detail.value">
								<view class="f-picker date">{{ filter.createdFrom || 'Từ ngày' }}</view>
							</picker>
						</view>
						<view class="f-group half">
							<picker mode="date" :value="filter.createdTo" @change="(e) => filter.createdTo = e.detail.value">
								<view class="f-picker date">{{ filter.createdTo || 'Đến ngày' }}</view>
							</picker>
						</view>
					</view>

					<view class="f-section-title">Thời gian hết hạn</view>
					<view class="f-row">
						<view class="f-group half">
							<picker mode="date" :value="filter.dueDateFrom" @change="(e) => filter.dueDateFrom = e.detail.value">
								<view class="f-picker date">{{ filter.dueDateFrom || 'Từ ngày' }}</view>
							</picker>
						</view>
						<view class="f-group half">
							<picker mode="date" :value="filter.dueDateTo" @change="(e) => filter.dueDateTo = e.detail.value">
								<view class="f-picker date">{{ filter.dueDateTo || 'Đến ngày' }}</view>
							</picker>
						</view>
					</view>
					
					<view style="height: 20px;"></view>
				</scroll-view>

				<view class="filter-footer">
					<button class="btn-reset" @click="resetFilter">Đặt lại</button>
					<button class="btn-apply" @click="applyFilter">Áp dụng</button>
				</view>
			</view>
		</view>

		<view class="modal-overlay" v-if="isConfirmDeleteOpen" @click.stop>
			<view class="modal-container">
				<view class="modal-header">
					<text class="modal-title">Thông báo</text>
				</view>
				<view class="modal-body">
					<text>Bạn có chắc muốn xóa công việc "{{ itemToDelete?.title }}"?</text>
				</view>
				<view class="modal-footer">
					<button class="modal-btn cancel" @click="cancelDelete">Hủy</button>
					<button class="modal-btn confirm" @click="confirmDelete">Xác nhận</button>
				</view>
			</view>
		</view>

	</view>
</template>

<script setup lang="ts">
	import { useListTodoController } from '@/controllers/list_todo';
	import StatusBadge from '@/components/StatusBadge.vue';
	const { 
		todos, isLoading, isFilterOpen, filter,
		isConfirmDeleteOpen, itemToDelete,
		pageSizeOptions, pageSizeIndex, currentPage, totalPages, onPageSizeChange, changePage,
		statusOptions, statusIndex, onStatusChange,
		creatorOptions, creatorIndex, onCreatorChange,
		customerOptions, customerIndex, onCustomerChange,
		assigneeOptions, assigneeIndex, onAssigneeChange,
		sourceOptions, sourceIndex, onSourceChange,
		addNewTask, openFilter, closeFilter, resetFilter, applyFilter,
		showActionMenu, cancelDelete, confirmDelete,goToDetail
	} = useListTodoController();
</script>

<style lang="scss" scoped>
	.container { display: flex; flex-direction: column; height: 100vh; background-color: #f0f2f5; overflow: hidden; }
	.header { height: 50px; padding: 40px 20px 10px 20px; background-color: #fff; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
	.header-left { width: 30px; }
	.header-title { font-size: 20px; font-weight: bold; color: #333; flex: 1; text-align: center; }
	.header-right { width: 30px; display: flex; justify-content: flex-end; }
	.filter-icon { width: 24px; height: 24px; }
	
	.content { flex: 1; padding: 0; overflow: hidden; display: flex; flex-direction: column; }
	.list-container { flex: 1; padding: 15px; overflow: hidden; display: flex; flex-direction: column; }
	
	.fixed-footer { flex-shrink: 0; background-color: #fff; padding: 10px 15px; padding-bottom: calc(10px + env(safe-area-inset-bottom)); border-top: 1px solid #eee; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center; }

	.page-size-selector { display: flex; align-items: center; border: 1px solid #ddd; border-radius: 4px; padding: 4px 8px; background-color: #f9f9f9; }
	.size-text { font-size: 12px; color: #333; margin-right: 4px; }
	.dropdown-arrow { font-size: 10px; color: #666; }

	.pagination-controls { display: flex; align-items: center; gap: 5px; }
	.page-arrow { font-size: 18px; color: #666; padding: 0 10px; font-weight: bold; cursor: pointer; transition: opacity 0.2s; }
	.page-arrow.disabled { opacity: 0.3; pointer-events: none; }
	.page-box { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; color: #333; }
	.page-box.active { background-color: #2dce89; color: #fff; border-color: #2dce89; font-weight: bold; }

	.add-task-simple { display: flex; align-items: center; color: #007aff; padding: 5px 0; }
	.add-task-simple:active { opacity: 0.6; }
	.plus-icon { font-size: 20px; margin-right: 4px; font-weight: 400; line-height: 1; margin-top: -2px; }
	.add-text { font-size: 14px; font-weight: 600; white-space: nowrap; }

	.list-view { flex: 1; height: 1px; }
	.card-item { background-color: #fff; border-radius: 12px; margin-bottom: 15px; padding: 0; position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
	.status-bar { width: 6px; height: 100%; position: absolute; top: 0; left: 0; }
	.card-body { padding: 15px 15px 15px 20px; }
	.card-row { display: flex; align-items: center; margin-bottom: 8px; }
	.top-row { margin-bottom: 8px; align-items: flex-start; justify-content: space-between; }
	.card-title { font-size: 16px; font-weight: 600; color: #32325d; flex: 1; line-height: 1.4; padding-right: 10px; }
	.action-btn { padding: 0 5px; height: 24px; display: flex; align-items: center; justify-content: center; }
	.dots { font-size: 18px; color: #999; font-weight: bold; letter-spacing: 1px; transform: rotate(90deg); }
	.mid-row { margin-bottom: 15px; }
	.icon-small { width: 14px; height: 14px; margin-right: 6px; opacity: 0.6; }
	.card-date { font-size: 13px; color: #8898aa; }
	.bot-row { justify-content: space-between; align-items: center; margin-bottom: 0; }
	.code-tag { background-color: #f0f2f5; color: #525f7f; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; }
	.empty-state, .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #999; }
	.empty-icon { width: 80px; height: 80px; margin-bottom: 20px; }

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
	.arrow { font-size: 10px; color: #999; } .date { color: #333; }
	.filter-footer { padding: 20px; padding-bottom: calc(20px + env(safe-area-inset-bottom)); border-top: 1px solid #eee; display: flex; justify-content: space-between; background-color: #fff; }
	.btn-reset { width: 35%; background-color: #f5f5f5; color: #666; font-size: 14px; border-radius: 40px; }
	.btn-apply { width: 60%; background-color: #009688; color: white; font-size: 14px; border-radius: 40px; }
	.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
	.modal-container { width: 80%; background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: popIn 0.2s ease-out; }
	@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
	.modal-header { padding: 15px; border-bottom: 1px solid #eee; text-align: center; }
	.modal-title { font-size: 18px; font-weight: bold; color: #333; }
	.modal-body { padding: 20px 15px; text-align: center; font-size: 15px; color: #555; line-height: 1.5; }
	.modal-footer { display: flex; border-top: 1px solid #eee; }
	.modal-btn { flex: 1; height: 48px; line-height: 48px; font-size: 16px; background-color: #fff; border: none; border-radius: 0; }
	.modal-btn::after { border: none; }
	.modal-btn.cancel { color: #666; border-right: 1px solid #eee; }
	.modal-btn.confirm { color: #ff3b30; font-weight: bold; }
	.modal-btn:active { background-color: #f9f9f9; }
</style>