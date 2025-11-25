<template>
  <view 
    class="px-2 py-1 rounded-full text-xs font-bold inline-block text-center min-w-[80px]"
    :class="badgeColorClass"
    :style="customStyle"
  >
    {{ badgeLabel }}
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TODO_STATUS, STATUS_LABELS } from '@/utils/constants';
import type { TodoStatusType } from '@/types/common';

// Nhận vào status code (VD: 'TO_DO')
const props = defineProps<{
  status: string 
}>();

const badgeLabel = computed(() => {
  // Ép kiểu để dùng index
  return STATUS_LABELS[props.status as TodoStatusType] || props.status || 'Không xác định';
});

const badgeColorClass = computed(() => {
  switch (props.status) {
    case TODO_STATUS.NEW:
      return 'bg-gray-200 text-gray-600'; // Màu xám (Chưa xử lý)
    case TODO_STATUS.IN_PROGRESS:
      return 'bg-orange-100 text-orange-600'; // Màu cam (Đang xử lý)
    case TODO_STATUS.DONE:
      return 'bg-green-100 text-green-600'; // Màu xanh lá (Hoàn thành)
    default:
      return 'bg-gray-100 text-gray-400';
  }
});

// Fallback style nếu không dùng Tailwind hoặc class không nhận
const customStyle = computed(() => {
  switch (props.status) {
    case TODO_STATUS.NEW:
      return { backgroundColor: '#e4e4e7', color: '#52525b' };
    case TODO_STATUS.IN_PROGRESS:
      return { backgroundColor: '#ffedd5', color: '#c2410c' };
    case TODO_STATUS.DONE:
      return { backgroundColor: '#dcfce7', color: '#15803d' };
    default:
      return { backgroundColor: '#f4f4f5', color: '#a1a1aa' };
  }
});
</script>

<style scoped>
/* Hỗ trợ class utility nếu chưa có tailwind */
.px-2 { padding-left: 8px; padding-right: 8px; }
.py-1 { padding-top: 4px; padding-bottom: 4px; }
.rounded-full { border-radius: 9999px; }
.text-xs { font-size: 12px; }
.font-bold { font-weight: 700; }
.inline-block { display: inline-block; }
.text-center { text-align: center; }
.min-w-\[80px\] { min-width: 80px; }
</style>