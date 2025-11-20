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
                    <picker mode="selector" :range="assigneeOptions" :value="form.assigneeIndex" @change="onAssigneeChange" class="item-picker-box">
                        <view class="picker-text">{{ assigneeOptions[form.assigneeIndex] }} ▾</view>
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
                <text style="color: #999; font-size: 14px; padding: 15px; display: block;">
                    (Chưa có thông tin - API chưa hỗ trợ)
                </text>
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
        isLoading, // Lấy thêm isLoading
        form, 
        statusOptions, sourceOptions, assigneeOptions,
        onStatusChange, onSourceChange, onAssigneeChange,
        saveTodo
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
    
    /* Thêm CSS cho Loading */
    .loading-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.8); z-index: 100; display: flex; justify-content: center; align-items: center; color: #007aff; font-weight: bold; }
</style>