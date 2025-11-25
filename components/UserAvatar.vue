<template>
  <view 
    class="rounded-full flex items-center justify-center overflow-hidden shrink-0"
    :style="{
      width: size + 'px',
      height: size + 'px',
      backgroundColor: avatarColor || '#e0e0e0',
      borderRadius: '50%'
    }"
  >
    <image 
      v-if="avatarUrl" 
      :src="avatarUrl" 
      class="w-full h-full"
      mode="aspectFill"
    />
    
    <text 
      v-else 
      class="text-white font-bold flex items-center justify-center"
      :style="{ 
          fontSize: (size * 0.45) + 'px',
          lineHeight: '1', 
          display: 'flex' 
      }"
    >
      {{ initialChar }}
    </text>
  </view>
</template>

<script setup>
import { computed, defineProps } from 'vue';
const props = defineProps({
  name: {
    type: String,
    default: ''
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  avatarColor: {
    type: String,
    default: '#3b82f6'
  },
  size: {
    type: Number,
    default: 40
  }
});

const initialChar = computed(() => {
  if (!props.name) return '?';
  return props.name.trim().charAt(0).toUpperCase();
});
</script>

<style scoped>
.shrink-0 {
  flex-shrink: 0;
}
.w-full { width: 100%; }
.h-full { height: 100%; }
.text-white { color: white; }
.font-bold { font-weight: bold; }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.overflow-hidden { overflow: hidden; }
</style>