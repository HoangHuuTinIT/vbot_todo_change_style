<template>
    <view class="color-popup-overlay" v-if="visible" @click="close">
        <view class="color-popup" @click.stop>
            <text class="popup-title">Chọn màu</text>
            <view class="color-grid">
                <view v-for="c in colors" :key="c" 
                      class="color-cell" 
                      :style="{ backgroundColor: c }" 
                      @click="select(c)"></view>
                <view class="color-cell remove-color" @click="select(null)">✕</view>
            </view>
        </view>
    </view>
</template>

<script setup>
defineProps(['visible']);
const emit = defineEmits(['update:visible', 'select']);

const colors = ['#000000', '#424242', '#A64D79'];

const close = () => emit('update:visible', false);
const select = (color) => {
    emit('select', color);
    close();
};
</script>

<style scoped>
.color-popup-overlay { /* ... */ }
</style>