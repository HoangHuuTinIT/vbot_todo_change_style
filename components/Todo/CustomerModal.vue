<template>
    <view class="modal-overlay" v-if="visible" @click.stop="close">
        <view class="modal-content" @click.stop>
            
            <view class="modal-header">
                <text class="modal-title">Chọn khách hàng</text>
                <text class="close-btn" @click="close">✕</text>
            </view>

            <view v-if="loading" class="loading-state">Đang tải dữ liệu...</view>

            <scroll-view scroll-y class="customer-list" v-else>
                
                <view 
                    v-for="(item, index) in customers" 
                    :key="item.id" 
                    class="customer-item"
                    @click="selectCustomer(item)"
                >
                    <UserAvatar 
                        :name="item.name" 
                        :size="40"
                        class="mr-3" 
                    />

                    <view class="info-column">
                        <text class="name-text">{{ item.name || '(Không tên)' }}</text>
                        <text class="phone-text">{{ item.phone || 'Không có SĐT' }}</text>
                    </view>

                    <view class="date-column">
                        <text class="date-text">{{ formatDate(item.createAt) }}</text>
                    </view>
                </view>

                <view v-if="customers.length === 0" class="empty-state">Không có dữ liệu</view>
            </scroll-view>

        </view>
    </view>
</template>

<script setup lang="ts">
import UserAvatar from '@/components/UserAvatar.vue';
interface CustomerDisplay {
    id: number;
    name: string;
    phone: string;
    createAt: number;
    uid: string;
}

const props = defineProps<{
    visible: boolean;
    customers: CustomerDisplay[];
    loading: boolean;
}>();

const emit = defineEmits(['close', 'select']);

const close = () => {
    emit('close');
};

const selectCustomer = (item: CustomerDisplay) => {
    emit('select', item);
    close();
};



// Helper: Format date ngắn gọn (dd/mm)
const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    // Chỉ hiện ngày/tháng cho gọn, hoặc thêm năm tùy bạn
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};
</script>

<style lang="scss" scoped>
.modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0,0,0,0.5); z-index: 999;
    display: flex; justify-content: center; align-items: center;
}
.modal-content {
    width: 90%; height: 70vh; background-color: #fff;
    border-radius: 12px; display: flex; flex-direction: column; overflow: hidden;
}
.modal-header {
    padding: 15px; border-bottom: 1px solid #f0f0f0; 
    display: flex; justify-content: space-between; align-items: center;
}
.modal-title { font-weight: bold; font-size: 16px; color: #333; }
.close-btn { font-size: 20px; padding: 5px; color: #999; }

.customer-list { flex: 1; }
.loading-state, .empty-state { text-align: center; padding: 30px; color: #888; font-size: 14px; }

/* --- STYLING CHO ITEM MỚI --- */
.customer-item {
    display: flex;
    align-items: center;
    padding: 12px 15px;
    border-bottom: 1px solid #f5f5f7;
    background-color: #fff;
}
.customer-item:active {
    background-color: #f9f9f9; /* Hiệu ứng nhấn */
}


.mr-3 {
    margin-right: 12px;
}
/* 2. Info Column */
.info-column {
    flex: 1; /* Chiếm hết khoảng trống còn lại */
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden; /* Để xử lý text dài nếu cần */
}
.name-text {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    margin-bottom: 3px;
    /* Cắt chữ nếu quá dài */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.phone-text {
    font-size: 13px;
    color: #666;
}

/* 3. Date Column */
.date-column {
    margin-left: 10px;
    flex-shrink: 0;
}
.date-text {
    font-size: 12px;
    color: #999;
}
</style>