<template>
    <view class="flat-item date-compound-block">
        <view class="item-left icon-top-aligned">
            <image src="https://img.icons8.com/ios/50/666666/time.png" class="item-icon"></image>
        </view>
        <view class="right-column">
            
            <view class="date-row">
                <picker mode="date" :value="dueDate" @change="onDateChange($event, 'dueDate')" class="full-width-picker">
                    <view class="item-picker" :class="{ 'placeholder-color': !dueDate }">
                        <text class="picker-label">Hết hạn:</text> {{ dueDate ? formatDateDisplay(dueDate) : 'Chọn ngày' }}
                    </view>
                </picker>
            </view>

            <view class="inner-divider"></view>

            <view class="date-row split-row">
                <picker mode="date" :value="notifyDate" @change="onDateChange($event, 'notifyDate')" class="half-picker">
                    <view class="item-picker" :class="{ 'placeholder-color': !notifyDate }">
                        <text class="picker-label">Thông báo:</text> {{ notifyDate ? formatDateDisplay(notifyDate) : 'Ngày' }}
                    </view>
                </picker>

                <view class="vertical-divider"></view>

                <picker mode="time" :value="notifyTime" @change="onDateChange($event, 'notifyTime')" class="half-picker">
                    <view class="item-picker" :class="{ 'placeholder-color': !notifyTime }">
                        {{ notifyTime ? notifyTime : 'Giờ' }}
                    </view>
                </picker>
            </view>

        </view>
    </view>
</template>

<script setup lang="ts">
// Define Props & Emits để 2 chiều dữ liệu (v-model)
interface DatePickerProps {
    dueDate: string;
    notifyDate: string;
    notifyTime: string;
}
const props = defineProps<DatePickerProps>();
// Cú pháp v-model:field cần định nghĩa cả 3 emits
const emit = defineEmits(['update:dueDate', 'update:notifyDate', 'update:notifyTime']);

const onDateChange = (e: any, field: keyof DatePickerProps) => {
    emit(`update:${field}`, e.detail.value);
};

// Helper format ngày hiển thị (đưa vào đây cho gọn)
const formatDateDisplay = (isoStr) => {
    if (!isoStr) return '';
    try {
        if (isoStr.includes('-')) {
            const [y, m, d] = isoStr.split('-');
            return `${d}/${m}/${y}`;
        }
        return isoStr;
    } catch (e) { return isoStr; }
};
</script>

<style lang="scss" scoped>
    /* CSS chuyên biệt cho DatePicker */
    .flat-item { background-color: #fff; margin-bottom: 12px; padding: 15px; display: flex; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
    .item-left { display: flex; align-items: center; margin-right: 15px; }
    .item-icon { width: 22px; height: 22px; opacity: 0.6; }
    .icon-top-aligned { align-self: flex-start; margin-top: 2px; }
    
    .date-compound-block { align-items: flex-start; } 
    .right-column { flex: 1; display: flex; flex-direction: column; }
    .date-row { width: 100%; height: 30px; display: flex; align-items: center; } 
    .full-width-picker { width: 100%; }
    .item-picker { text-align: left; font-size: 15px; color: #333; width: 100%; display: flex; align-items: center; } 
    .placeholder-color { color: #808080; }
    .picker-label { font-weight: bold; color: #666; margin-right: 6px; font-size: 14px; }
    .inner-divider { height: 1px; background-color: #f0f0f0; margin: 10px 0; width: 100%; }
    
    .split-row { justify-content: space-between; }
    .half-picker { flex: 1; }
    .vertical-divider { width: 1px; height: 18px; background-color: #ccc; margin: 0 10px; }
</style>