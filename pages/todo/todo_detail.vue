<template>
    <view class="container">
        <view v-if="isLoading" class="loading-overlay">
            <text>Đang tải...</text>
        </view>

        <view class="detail-header">
            <view class="header-top">
                <text class="header-code">#{{ form.code }}</text>
                <view class="header-actions">
                    <text class="btn-text" @click="saveTodo">Lưu</text>
                </view>
            </view>
            <input class="header-title-input" v-model="form.title" placeholder="Tên công việc" />
        </view>

        <scroll-view scroll-y="true" class="detail-body">
            
            <view class="section-block">
                <TodoEditor v-model="form.desc" />
            </view>

            <view class="section-title">Thông tin công việc</view>
            <view class="info-group">
                <view class="flat-item">
                    <view class="item-left">
                        <image src="https://img.icons8.com/ios/50/666666/checked-checkbox.png" class="item-icon"></image>
                        <text class="item-label">Trạng thái</text>
                    </view>
                    <picker mode="selector" :range="statusOptions" :value="form.statusIndex" @change="onStatusChange" class="item-picker-box">
                        <view class="picker-text">{{ statusOptions[form.statusIndex] }} ▾</view>
                    </picker>
                </view>

                <view class="flat-item">
                    <view class="item-left">
                        <image src="https://img.icons8.com/ios/50/666666/internet.png" class="item-icon"></image>
                        <text class="item-label">Nguồn</text>
                    </view>
                    <picker mode="selector" :range="sourceOptions" :value="form.sourceIndex" @change="onSourceChange" class="item-picker-box">
                        <view class="picker-text">{{ sourceOptions[form.sourceIndex] || 'Chọn nguồn' }} ▾</view>
                    </picker>
                </view>

                <view class="flat-item">
                        <view class="item-left">
                            <image src="https://img.icons8.com/ios/50/666666/user.png" class="item-icon"></image>
                            <text class="item-label">Người được giao</text>
                        </view>
                        
                        <picker 
                            mode="selector" 
                            :range="assigneeOptions" 
                            :value="form.assigneeIndex" 
                            @change="onAssigneeChange" 
                            class="item-picker-box"
                        >
                            <view class="picker-text">
                                {{ (form.assigneeIndex > -1 && assigneeOptions[form.assigneeIndex]) 
                                    ? assigneeOptions[form.assigneeIndex] 
                                    : 'Chọn người giao' 
                                }} ▾
                            </view>
                        </picker>
                    </view>

                <TodoDatePicker 
                    v-model:dueDate="form.dueDate"
                    v-model:notifyDate="form.notifyDate"
                    v-model:notifyTime="form.notifyTime"
                />
            </view>

            <view class="section-title">Thông tin khách hàng</view>
            <view class="info-group customer-block">
                <view v-if="isLoadingCustomer" class="loading-row">
                    <text class="loading-text">Đang tải thông tin từ CRM...</text>
                </view>
                
                <view v-else-if="!form.customerCode" class="empty-row">
                    <text>(Công việc này chưa gắn với khách hàng nào)</text>
                </view>
                
                <view v-else>
                    <view class="flat-item">
                        <view class="item-left">
                            <image src="https://img.icons8.com/ios/50/666666/user-male-circle.png" class="item-icon"></image>
                            <text class="item-label">{{ form.customerNameLabel }}</text>
                        </view>
                        <view class="item-right-text">{{ form.customerName }}</view>
                    </view>
                    
                    <view class="flat-item">
                        <view class="item-left">
                            <image src="https://img.icons8.com/ios/50/666666/phone.png" class="item-icon"></image>
                            <text class="item-label">{{ form.customerPhoneLabel }}</text>
                        </view>
                        <view class="item-right-text phone-text">{{ form.customerPhone }}</view>
                    </view>
                    
                    <view class="flat-item">
                        <view class="item-left">
                            <image src="https://img.icons8.com/ios/50/666666/manager.png" class="item-icon"></image>
                            <text class="item-label">{{ form.customerManagerLabel }}</text>
                        </view>
                        <view class="item-right-text highlight-text">
                            {{ form.customerManagerName || '(Chưa có)' }}
                        </view>
                    </view>
                </view>
            </view>

            <view class="section-header-row">
                            <text class="section-title no-margin">Lịch sử tương tác</text>
                            
                            <picker 
                                mode="selector" 
                                :range="historyFilterOptions" 
                                :value="historyFilterIndex" 
                                @change="onHistoryFilterChange"
                            >
                                <view class="filter-badge">
                                    {{ historyFilterOptions[historyFilterIndex] }} ▾
                                </view>
                            </picker>
                        </view>
                        
                        <view class="history-container">
                            <view v-if="isLoadingHistory" class="loading-row">
                                <text class="loading-text">Đang tải lịch sử...</text>
                            </view>
            
                            <view v-else-if="historyList.length === 0" class="empty-row">
                                <text>(Không tìm thấy dữ liệu)</text>
                            </view>
            
                            <view v-else class="timeline-list">
                                <view v-for="(item, index) in historyList" :key="item.id" class="timeline-item">
                                    <view class="timeline-line" v-if="index !== historyList.length - 1"></view>
                                    <view class="timeline-dot"></view>
                                    <view class="timeline-content">
                                        <view class="timeline-header">
                                            <text class="t-actor">{{ item.actorName }}</text>
                                            <text class="t-time">{{ item.timeStr }}</text>
                                        </view>
                                        <text class="t-action">{{ item.content }}</text>
                                    </view>
                                </view>
                            </view>
                        </view>

            <view style="height: 50px;"></view>

        </scroll-view> 
		</view>
</template>

<script setup lang="ts">
    // Import controller đã chỉnh sửa
    import { useTodoDetailController } from '@/controllers/todo_detail';
    import TodoEditor from '@/components/Todo/TodoEditor.vue';
    import TodoDatePicker from '@/components/Todo/TodoDatePicker.vue';

    const { 
        isLoading,isLoadingCustomer, // Lấy thêm isLoading
		isLoadingHistory, historyList,
        form, 
        statusOptions, sourceOptions, assigneeOptions,
        onStatusChange, onSourceChange, onAssigneeChange,
        saveTodo,
		historyFilterOptions, historyFilterIndex, onHistoryFilterChange,
    } = useTodoDetailController();
</script>

<style lang="scss" scoped>
    /* Giữ nguyên CSS cũ */
    .container { height: 100vh; display: flex; flex-direction: column; background-color: #f5f5f7; }
    .detail-header { background-color: #fff; padding: 15px 15px 10px 15px; border-bottom: 1px solid #eee; }
    .header-top { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .header-code { font-size: 13px; color: #888; font-weight: bold; background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
    .btn-text { color: #007aff; font-weight: bold; font-size: 15px; }
    .header-title-input { font-size: 18px; font-weight: bold; color: #333; width: 100%; }
    .detail-body { flex: 1; padding: 15px; box-sizing: border-box; overflow-y: auto; }
    .section-block { margin-bottom: 20px; }
    .section-title { font-size: 14px; font-weight: bold; color: #666; margin-bottom: 10px; margin-left: 5px; text-transform: uppercase; }
    .info-group { background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.03); margin-bottom: 20px; }
    .flat-item { background-color: #fff; padding: 15px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f5f5f5; }
    .flat-item:last-child { border-bottom: none; }
    .item-left { display: flex; align-items: center; min-width: 120px; }
    .item-icon { width: 20px; height: 20px; opacity: 0.5; margin-right: 10px; }
    .item-label { font-size: 15px; color: #333; }
    .item-picker-box { flex: 1; text-align: right; }
    .picker-text { font-size: 15px; color: #007aff; font-weight: 500; }
    .customer-block { min-height: 80px; background: #fff; }
    .item-right-text { font-size: 15px; color: #333; font-weight: 500; text-align: right; flex: 1; }
        .phone-text { color: #007aff; } /* Màu xanh cho SĐT */
        .highlight-text { color: #ff9500; font-weight: bold; } /* Màu cam cho quản lý */
		.loading-row, .empty-row { padding: 20px; text-align: center; color: #999; font-size: 14px; font-style: italic;}
    /* Thêm CSS cho Loading */
	
	.history-container {
	        background-color: #fff;
	        border-radius: 8px;
	        padding: 20px 15px;
	        margin-bottom: 20px;
	        box-shadow: 0 1px 2px rgba(0,0,0,0.03);
	    }
	
	    .timeline-list {
	        position: relative;
	    }
	
	    .timeline-item {
	        display: flex;
	        position: relative;
	        padding-bottom: 25px; /* Khoảng cách giữa các item */
	    }
	    .timeline-item:last-child {
	        padding-bottom: 0;
	    }
	
	    .timeline-dot {
	        width: 10px;
	        height: 10px;
	        background-color: #007aff; /* Màu xanh chủ đạo */
	        border-radius: 50%;
	        margin-top: 5px;
	        z-index: 2;
	        flex-shrink: 0;
	    }
	
	    .timeline-line {
	        position: absolute;
	        left: 4px; /* Canh giữa dot (10px/2 - 1px) */
	        top: 15px; /* Bắt đầu từ dưới dot */
	        bottom: 0;
	        width: 2px;
	        background-color: #e5e5ea;
	        z-index: 1;
	    }
	
	    .timeline-content {
	        margin-left: 15px;
	        flex: 1;
	    }
	
	    .timeline-header {
	        display: flex;
	        justify-content: space-between;
	        margin-bottom: 4px;
	    }
	
	    .t-actor {
	        font-size: 15px;
	        font-weight: bold;
	        color: #333;
	    }
	
	    .t-time {
	        font-size: 12px;
	        color: #999;
	    }
	
	    .t-action {
	        font-size: 14px;
	        color: #555;
	        line-height: 1.4;
	    }
		.section-header-row {
		        display: flex;
		        justify-content: space-between;
		        align-items: center;
		        margin-bottom: 10px;
		        margin-left: 5px;
		        margin-right: 5px; /* Căn lề phải cho đẹp */
		    }
			.section-title.no-margin {
			        margin-bottom: 0; /* Bỏ margin bottom cũ của title để căn giữa với picker */
			    }
			
			    .filter-badge {
			        background-color: #e3f2fd; /* Màu nền xanh nhạt */
			        color: #007aff;
			        font-size: 13px;
			        font-weight: 600;
			        padding: 4px 10px;
			        border-radius: 15px;
			        display: flex;
			        align-items: center;
			    }
    .loading-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.8); z-index: 100; display: flex; justify-content: center; align-items: center; color: #007aff; font-weight: bold; }
</style>