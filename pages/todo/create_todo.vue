<template>
    <view class="container">
        
        <view class="flat-item">
            <view class="item-left">
                <image src="https://img.icons8.com/ios/50/666666/edit--v1.png" class="item-icon"></image>
            </view>
            <input class="item-input" v-model="form.name" placeholder="Nhập tên công việc *" />
        </view>

        <TodoEditor v-model="form.desc" />

        <view class="flat-item">
            <view class="item-left"><image src="https://img.icons8.com/ios/50/666666/price-tag.png" class="item-icon"></image></view>
            <input class="item-input" v-model="form.customer" placeholder="Mã khách hàng" />
        </view>
        <view class="flat-item">
            <view class="item-left"><image src="https://img.icons8.com/ios/50/666666/user.png" class="item-icon"></image></view>
            <input class="item-input" v-model="form.assignee" placeholder="ID người nhận" />
        </view>
        
        <TodoDatePicker 
            v-model:dueDate="form.dueDate"
            v-model:notifyDate="form.notifyDate"
            v-model:notifyTime="form.notifyTime"
        />

        <view class="footer-action">
            <button class="btn btn-cancel" @click="goBack">Hủy bỏ</button>
            <button class="btn btn-submit" :disabled="loading" @click="submitForm">
                {{ loading ? 'Đang lưu...' : 'Lưu công việc' }}
            </button>
        </view>

    </view>
</template>

<script setup lang="ts">
    // Import file .ts (Vite sẽ tự hiểu)
    import { useCreateTodoController } from '@/controllers/create_todo';
    
    import TodoEditor from '@/components/Todo/TodoEditor.vue';
    import TodoDatePicker from '@/components/Todo/TodoDatePicker.vue';

    const { loading, form, goBack, submitForm } = useCreateTodoController();
</script>

<style lang="scss">
    .container { min-height: 100vh; background-color: #f5f5f7; padding: 15px; box-sizing: border-box; }
    
    /* CSS chung cho các input flat-item (nếu chưa có trong global) */
    .flat-item { background-color: #fff; margin-bottom: 12px; padding: 15px; display: flex; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
    .item-left { display: flex; align-items: center; margin-right: 15px; }
    .item-icon { width: 22px; height: 22px; opacity: 0.6; }
    .item-input { flex: 1; text-align: left; font-size: 15px; color: #333; }

    .footer-action { margin-top: 30px; display: flex; justify-content: space-between; }
    .btn { border-radius: 0; font-size: 15px; font-weight: bold; height: 45px; line-height: 45px; border: none; }
    .btn-cancel { width: 35%; background-color: #e5e5ea; color: #333; } 
    .btn-submit { width: 60%; background-color: #007aff; color: #fff; }
    .btn-submit[disabled] { background-color: #8dc2ff; }
</style>