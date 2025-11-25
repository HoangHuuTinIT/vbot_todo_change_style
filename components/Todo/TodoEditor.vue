
<template>
    <view class="editor-wrapper">

        <view class="toolbar">
            <view class="tool-row">
                <view class="tool-item" @touchend.prevent="format('bold')" :class="{ 'active': formats.bold }">
                    <text class="txt-icon bold">B</text>
                </view>
                
                <view class="tool-item" @touchend.prevent="format('italic')" :class="{ 'active': formats.italic }">
                    <text class="txt-icon italic">I</text>
                </view>
                
                <view class="tool-item" @touchend.prevent="format('underline')" :class="{ 'active': formats.underline }">
                    <text class="txt-icon underline">U</text>
                </view>
                
                <view class="tool-item" @touchend.prevent="format('strike')" :class="{ 'active': formats.strike }">
                    <text class="txt-icon strike">S</text>
                </view>
                
                <view class="tool-divider"></view>
                
                <view class="tool-item" @touchend.prevent="format('list', 'ordered')">
                    <image src="https://img.icons8.com/ios/50/666666/numbered-list.png" class="img-tool"></image>
                </view>
                
                <view class="tool-item" @touchend.prevent="format('list', 'bullet')">
                    <image src="https://img.icons8.com/ios/50/666666/list.png" class="img-tool"></image>
                </view>
                
                <picker :range="headerOptions" range-key="label" @change="onHeaderChange" class="tool-picker">
                    <view class="picker-label">{{ currentHeader }} ▾</view>
                </picker>
            </view>
            
            <view class="tool-row">
                <view class="tool-item" @click="openColorPicker('color')">
                    <text class="txt-icon color-text" :style="{ color: currentColor }">A</text>
                    <view class="color-bar" :style="{ backgroundColor: currentColor }"></view>
                </view>
                
                <view class="tool-item" @click="openColorPicker('backgroundColor')">
                    <text class="txt-icon bg-text" :style="{ backgroundColor: currentBgColor }">A</text>
                </view>
                
                <view class="tool-divider"></view>
                
                <view class="tool-item" @click="showAlignPopup = true">
                    <image :src="alignIcon" class="img-tool"></image>
                </view>
                <view class="tool-divider"></view>
                
                <view class="tool-item" @click="handleLinkBtn" :class="{ 'active': isLinkSelected, 'disabled': !canInsertLink && !isLinkSelected }">
                    <image src="https://img.icons8.com/ios/50/666666/link--v1.png" class="img-tool" :style="{ opacity: (canInsertLink || isLinkSelected) ? 1 : 0.3 }"></image>
                </view>
                
                <view class="tool-item" @click="insertImage">
                    <image src="https://img.icons8.com/ios/50/666666/image.png" class="img-tool"></image>
                </view>
                
                <view class="tool-item" @click="insertVideo">
                    <image src="https://img.icons8.com/ios/50/666666/video-call.png" class="img-tool"></image>
                </view>
            </view>
        </view>

        <view class="ql-container static-view" v-if="isPopupOpen">
            <rich-text :nodes="modelValue || '<p style=\'color:#999\'>Nhập mô tả...</p>'"></rich-text>
        </view>
        
        <editor 
                    :id="editorId" 
                    class="ql-container" 
                    :placeholder="placeholder || 'Nhập nội dung...'" 
                    :show-img-size="true" 
                    :show-img-toolbar="true" 
                    :show-img-resize="true"
                    @ready="onEditorReady" 
                    @input="onEditorInput" 
                    @statuschange="onStatusChange">
                </editor>

        <view class="color-popup-overlay" v-if="showColorPopup" @click="closeColorPopup">
             <view class="color-popup" @click.stop>
                <text class="popup-title">Chọn màu</text>
                <view class="color-grid">
                    <view v-for="c in colorList" :key="c" class="color-cell" :style="{ backgroundColor: c }" @click="selectColor(c)"></view>
                    <view class="color-cell remove-color" @click="selectColor(null)">✕</view>
                </view>
            </view>
        </view>

        <view class="color-popup-overlay" v-if="showColorPopup" @click="closeColorPopup">
                     <view class="color-popup" @click.stop>
                        <text class="popup-title">Chọn màu</text>
                        <view class="color-grid">
                            <view v-for="c in colorList" :key="c" class="color-cell" :style="{ backgroundColor: c }" @click="selectColor(c)"></view>
                            <view class="color-cell remove-color" @click="selectColor(null)">✕</view>
                        </view>
                    </view>
                </view>
        
                <view class="link-popup-overlay" v-if="showLinkPopup" @click="closeLinkPopup">
                    <view class="link-popup" @click.stop>
                        <text class="popup-title">Chèn liên kết</text>
                         </view>
                </view>
				<view class="color-popup-overlay" v-if="showAlignPopup" @click="showAlignPopup = false">
				    <view class="link-popup" @click.stop> <text class="popup-title">Căn chỉnh</text>
				        
				        <view class="align-grid">
				            <view class="tool-item align-item" @click="selectAlign('left')" :class="{ active: formats.align === 'left' }">
				                <image src="https://img.icons8.com/ios/50/666666/align-left.png" class="img-tool"></image>
				            </view>
				            
				            <view class="tool-item align-item" @click="selectAlign('center')" :class="{ active: formats.align === 'center' }">
				                <image src="https://img.icons8.com/ios/50/666666/align-center.png" class="img-tool"></image>
				            </view>
				            
				            <view class="tool-item align-item" @click="selectAlign('right')" :class="{ active: formats.align === 'right' }">
				                <image src="https://img.icons8.com/ios/50/666666/align-right.png" class="img-tool"></image>
				            </view>
				            
				            <view class="tool-item align-item" @click="selectAlign('justify')" :class="{ active: formats.align === 'justify' }">
				                <image src="https://img.icons8.com/ios/50/666666/align-justify.png" class="img-tool"></image>
				            </view>
				        </view>
				    </view>
				</view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, getCurrentInstance ,watch} from 'vue';
import { EDITOR_CONFIG } from '@/utils/enums'; 
interface EditorProps {
    modelValue: string;
	placeholder?: string;
}

const props = defineProps<EditorProps>();
const emit = defineEmits(['update:modelValue']);
const editorId = ref(`editor-${Math.random().toString(36).substring(2, 9)}`);
// State riêng của Editor
const editorCtx = ref(null);
const formats = ref({});
const instance = getCurrentInstance(); 
const isTyping = ref(false);
// Popup State
const showLinkPopup = ref(false);
const linkUrl = ref('');
const linkText = ref('');
const canInsertLink = ref(false);
const isLinkSelected = ref(false);
const focusLinkInput = ref(false);
const showColorPopup = ref(false);
const colorType = ref('color');

const currentColor = ref(EDITOR_CONFIG.DEFAULT_COLOR);
const currentBgColor = ref(EDITOR_CONFIG.TRANSPARENT);
const currentHeader = ref(EDITOR_CONFIG.HEADER_NORMAL);

const colorList = ['#000000', '#424242', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF', '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF', '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0', '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79'];
const headerOptions = [{label:'Normal',value:null},{label:'H1',value:1},{label:'H2',value:2},{label:'H3',value:3}];

const alignIcon = computed(() => formats.value.align === 'center' ? 'https://img.icons8.com/ios/50/666666/align-center.png' : (formats.value.align === 'right' ? 'https://img.icons8.com/ios/50/666666/align-right.png' : 'https://img.icons8.com/ios/50/666666/align-left.png'));
const showAlignPopup = ref(false);

const isPopupOpen = computed(() => showLinkPopup.value || showColorPopup.value || showAlignPopup.value);

// 3. Hàm chọn căn lề
const selectAlign = (alignType) => {
    format('align', alignType); 
    showAlignPopup.value = false; 
};


const onEditorReady = () => {
    const queryId = `#${editorId.value}`;
    uni.createSelectorQuery().in(instance.proxy).select(queryId).context((res) => {
        if (res && res.context) {
            editorCtx.value = res.context;
            if (props.modelValue) {
                editorCtx.value.setContents({ html: props.modelValue });
            }
        } else {
            console.error(`Không tìm thấy Editor Context cho ID: ${queryId}`);
        }
    }).exec();
};

const lastEmittedValue = ref('');

watch(() => props.modelValue, (newVal) => {
    if (newVal === lastEmittedValue.value) return;

    if (editorCtx.value && newVal) {
        editorCtx.value.setContents({ html: newVal });
    }
});

const onEditorInput = (e) => {
    const val = e.detail.html;
    
    lastEmittedValue.value = val;

    emit('update:modelValue', val);
};


const onStatusChange = (e) => { 
    formats.value = e.detail;
    if (e.detail.color) currentColor.value = e.detail.color;
    if (e.detail.backgroundColor) currentBgColor.value = e.detail.backgroundColor;
    
    if (e.detail.hasOwnProperty('link')) { 
        isLinkSelected.value = true; 
        linkUrl.value = e.detail.link || ''; 
    } else { 
        isLinkSelected.value = false; 
        linkUrl.value = ''; 
    }
    
    if (editorCtx.value) {
        editorCtx.value.getSelectionText({
            success: (res) => { 
                if (res.text && res.text.length > 0) { 
                    canInsertLink.value = true; 
                    if (!isLinkSelected.value) linkText.value = res.text; 
                } else { 
                    canInsertLink.value = false; 
                    if (!isLinkSelected.value) linkText.value = ''; 
                } 
            },
            fail: () => { canInsertLink.value = false; }
        });
    }
};

const format = (name, value) => { if (editorCtx.value) editorCtx.value.format(name, value); };
const handleLinkBtn = () => { if (isLinkSelected.value || canInsertLink.value) { if(canInsertLink.value && !isLinkSelected.value) linkUrl.value=''; showLinkPopup.value = true; nextTick(() => { focusLinkInput.value = true; }); } else { uni.showToast({ title: 'Bôi đen chữ để chèn Link', icon: 'none' }); } };
const closeLinkPopup = () => { showLinkPopup.value = false; focusLinkInput.value = false; };
const confirmLink = () => { const url = linkUrl.value; const text = linkText.value; closeLinkPopup(); setTimeout(() => { if (url && text) { editorCtx.value.insertText({ text: text }); editorCtx.value.format('link', url); } }, 300); };
const removeLink = () => { closeLinkPopup(); setTimeout(() => { editorCtx.value.format('link', null); }, 300); };
const onHeaderChange = (e) => { const sel = headerOptions[e.detail.value]; currentHeader.value = sel.label; format('header', sel.value); };
const toggleAlign = () => { let a = 'center'; if(formats.value.align==='center') a='right'; else if(formats.value.align==='right') a='left'; format('align', a); };
const openColorPicker = (type) => { colorType.value = type; showColorPopup.value = true; };
const closeColorPopup = () => { showColorPopup.value = false; };

const selectColor = (color) => { 
    if (colorType.value === 'color') { 
        currentColor.value = color || EDITOR_CONFIG.DEFAULT_COLOR; 
        format('color', color); 
    } else { 
        currentBgColor.value = color || EDITOR_CONFIG.TRANSPARENT; 
        format('backgroundColor', color); 
    } 
    closeColorPopup(); 
};

const insertImage = () => { uni.chooseImage({ count: 1, success: (r) => editorCtx.value.insertImage({ src: r.tempFilePaths[0], width: '80%' }) }); };
const insertVideo = () => { uni.chooseVideo({ count: 1, success: (r) => editorCtx.value.insertVideo({ src: r.tempFilePath, width: '80%' }) }); };
</script>

<style lang="scss" scoped>
.editor-wrapper { 
        background-color: #fff; 
        margin-bottom: 0;
        padding: 15px; 
        box-shadow: 0 1px 2px rgba(0,0,0,0.03); 
        display: flex; 
        flex-direction: column;
        border-radius: 8px;
    }    
    .item-left { display: flex; align-items: center; margin-right: 15px; }
    .item-icon { width: 22px; height: 22px; opacity: 0.6; }
    .label-text { font-size: 15px; color: #666; }

    .toolbar { background-color: #f9f9fa; border: 1px solid #e0e0e0; border-radius: 4px; padding: 5px; margin-bottom: 10px; }
    .tool-row { display: flex; align-items: center; flex-wrap: wrap; padding: 4px 0; }
    .tool-row:first-child { border-bottom: 1px solid #f0f0f0; margin-bottom: 4px; padding-bottom: 8px; }
    .tool-item { width: 34px; height: 34px; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-right: 2px; border-radius: 4px; position: relative; }
    .tool-item:active, .tool-item.active { background-color: #e6e6e6; }
    .tool-item.disabled { opacity: 0.5; pointer-events: none; }
    .txt-icon { font-size: 16px; color: #333; font-weight: 500; font-family: serif; }
    .bold { font-weight: 900; } .italic { font-style: italic; } .underline { text-decoration: underline; } .strike { text-decoration: line-through; }
    .img-tool { width: 18px; height: 18px; opacity: 0.8; }
    .tool-divider { width: 1px; height: 18px; background-color: #ccc; margin: 0 6px; }
    .color-text { font-weight: bold; }
    .color-bar { width: 14px; height: 3px; margin-top: -2px; border-radius: 1px; }
    .bg-text { padding: 0 4px; border-radius: 2px; font-size: 14px; border: 1px solid #ddd; }
    .tool-picker { margin-left: auto; background-color: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 2px 8px; height: 24px; display: flex; align-items: center; }
    .picker-label { font-size: 12px; color: #333; }
    
    .ql-container { min-height: 120px; width: 100%; font-size: 15px; line-height: 1.6; color: #333; }
    .static-view { padding: 10px 0; border-top: 1px solid #eee; color: #333; min-height: 120px; overflow-y: auto; }

    .color-popup-overlay, .link-popup-overlay { position: fixed; z-index: 9999;;top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.4); z-index: 9999; display: flex; justify-content: center; align-items: center; }
    .color-popup, .link-popup { background-color: #fff; width: 85%; border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); animation: popIn 0.2s ease-out; }
    @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .popup-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; display: block; text-align: center; color: #333; }
    .color-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
    .color-cell { width: 30px; height: 30px; border-radius: 4px; border: 1px solid #eee; }
    .remove-color { display: flex; align-items: center; justify-content: center; background-color: #fff; color: #ff0000; font-size: 18px; font-weight: bold; border: 1px solid #ccc; }
    .input-group { margin-bottom: 15px; }
    .input-label { font-size: 13px; color: #666; margin-bottom: 5px; display: block; font-weight: 500; }
    .link-input { width: 100%; border: 1px solid #ddd; padding: 10px; border-radius: 6px; font-size: 15px; box-sizing: border-box; outline: none; }
    .link-input:focus { border-color: #007aff; }
    .link-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 5px; }
    .link-btn { font-size: 14px; height: 36px; line-height: 36px; padding: 0 15px; border-radius: 4px; border: none; margin: 0; }
    .link-btn.cancel { background-color: #f0f0f0; color: #333; }
    .link-btn.remove { background-color: #fff; color: #ff3b30; border: 1px solid #ff3b30; margin-right: auto; }
    .link-btn.confirm { background-color: #007aff; color: #fff; }
</style>