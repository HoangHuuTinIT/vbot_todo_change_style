<template>
	<view class="container">
		
		<view class="flat-item">
			<view class="item-left">
				<image src="https://img.icons8.com/ios/50/666666/edit--v1.png" class="item-icon"></image>
			</view>
			<input class="item-input" v-model="form.name" placeholder="Nhập tên công việc *" />
		</view>

		<view class="editor-container">
			<view class="editor-label-row">
				<view class="item-left">
					<image src="https://img.icons8.com/ios/50/666666/document--v1.png" class="item-icon"></image>
					<text class="label-text">Mô tả</text>
				</view>
			</view>

			<view class="toolbar">
				<view class="tool-row">
					<view class="tool-item" @click="format('bold')" :class="{ 'active': formats.bold }"><text class="txt-icon bold">B</text></view>
					<view class="tool-item" @click="format('italic')" :class="{ 'active': formats.italic }"><text class="txt-icon italic">I</text></view>
					<view class="tool-item" @click="format('underline')" :class="{ 'active': formats.underline }"><text class="txt-icon underline">U</text></view>
					<view class="tool-item" @click="format('strike')" :class="{ 'active': formats.strike }"><text class="txt-icon strike">S</text></view>
					<view class="tool-divider"></view>
					<view class="tool-item" @click="format('list', 'ordered')"><image src="https://img.icons8.com/ios/50/666666/numbered-list.png" class="img-tool"></image></view>
					<view class="tool-item" @click="format('list', 'bullet')"><image src="https://img.icons8.com/ios/50/666666/list.png" class="img-tool"></image></view>
					<picker :range="headerOptions" range-key="label" @change="onHeaderChange" class="tool-picker"><view class="picker-label">{{ currentHeader }} ▾</view></picker>
				</view>
				<view class="tool-row">
					<view class="tool-item" @click="openColorPicker('color')"><text class="txt-icon color-text" :style="{ color: currentColor }">A</text><view class="color-bar" :style="{ backgroundColor: currentColor }"></view></view>
					<view class="tool-item" @click="openColorPicker('backgroundColor')"><text class="txt-icon bg-text" :style="{ backgroundColor: currentBgColor }">A</text></view>
					<view class="tool-divider"></view>
					<view class="tool-item" @click="toggleAlign"><image :src="alignIcon" class="img-tool"></image></view>
					<view class="tool-divider"></view>
					<view class="tool-item" @click="handleLinkBtn" :class="{ 'active': isLinkSelected, 'disabled': !canInsertLink && !isLinkSelected }"><image src="https://img.icons8.com/ios/50/666666/link--v1.png" class="img-tool" :style="{ opacity: (canInsertLink || isLinkSelected) ? 1 : 0.3 }"></image></view>
					<view class="tool-item" @click="insertImage"><image src="https://img.icons8.com/ios/50/666666/image.png" class="img-tool"></image></view>
					<view class="tool-item" @click="insertVideo"><image src="https://img.icons8.com/ios/50/666666/video-call.png" class="img-tool"></image></view>
				</view>
			</view>

			<view class="ql-container static-view" v-if="isPopupOpen">
				<rich-text :nodes="form.desc || '<p style=\'color:#999\'>Nhập mô tả...</p>'"></rich-text>
			</view>
			
			<editor 
				v-else
				id="editor" 
				class="ql-container" 
				placeholder="Nhập mô tả..." 
				:show-img-size="true" 
				:show-img-toolbar="true" 
				:show-img-resize="true"
				@ready="onEditorReady" 
				@input="onEditorInput" 
				@statuschange="onStatusChange">
			</editor>
		</view>

		<view class="flat-item"><view class="item-left"><image src="https://img.icons8.com/ios/50/666666/price-tag.png" class="item-icon"></image></view><input class="item-input" v-model="form.customer" placeholder="Mã khách hàng" /></view>
		<view class="flat-item"><view class="item-left"><image src="https://img.icons8.com/ios/50/666666/user.png" class="item-icon"></image></view><input class="item-input" v-model="form.assignee" placeholder="ID người nhận" /></view>
		
		<view class="flat-item date-compound-block">
			<view class="item-left icon-top-aligned">
				<image src="https://img.icons8.com/ios/50/666666/time.png" class="item-icon"></image>
			</view>
			<view class="right-column">
				
				<view class="date-row">
					<picker mode="date" :value="form.dueDate" @change="bindDateChange($event, 'dueDate')" class="full-width-picker">
						<view class="item-picker" :class="{ 'placeholder-color': !form.dueDate }">
							{{ form.dueDate ? formatDateDisplay(form.dueDate) : 'Chọn ngày hết hạn' }}
						</view>
					</picker>
				</view>

				<view class="inner-divider"></view>

				<view class="date-row">
					<picker mode="date" :value="form.notifyDate" @change="bindDateChange($event, 'notifyDate')" class="full-width-picker">
						<view class="item-picker" :class="{ 'placeholder-color': !form.notifyDate }">
							{{ form.notifyDate ? formatDateDisplay(form.notifyDate) : 'Chọn ngày thông báo' }}
						</view>
					</picker>
				</view>

			</view>
		</view>

		<view class="footer-action">
			<button class="btn btn-cancel" @click="goBack">Hủy bỏ</button>
			<button class="btn btn-submit" :disabled="loading" @click="submitForm">{{ loading ? 'Đang lưu...' : 'Lưu công việc' }}</button>
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
				<text class="popup-title">{{ isLinkSelected ? 'Chỉnh sửa liên kết' : 'Chèn liên kết' }}</text>
				
				<view class="input-group">
					<text class="input-label">Văn bản hiển thị:</text>
					<input class="link-input" v-model="linkText" placeholder="Nhập văn bản..." />
				</view>
				
				<view class="input-group">
					<text class="input-label">Đường dẫn (URL):</text>
					<input class="link-input" v-model="linkUrl" placeholder="https://" :focus="focusLinkInput" />
				</view>
				
				<view class="link-actions">
					<button v-if="isLinkSelected" class="link-btn remove" @click="removeLink">Gỡ Link</button>
					<button class="link-btn cancel" @click="closeLinkPopup">{{ isLinkSelected ? 'Hủy' : 'Thoát' }}</button>
					<button class="link-btn confirm" @click="confirmLink">Lưu</button>
				</view>
			</view>
		</view>

	</view>
</template>

<script setup>
	import { ref, computed, nextTick } from 'vue';
	import { createTodo } from '@/api/todo.js';
	import { PROJECT_CODE, UID } from '@/utils/config.js';
	import { buildCreateTodoPayload } from '@/models/create_todo.js';

	const loading = ref(false);
	const pad = (n) => n.toString().padStart(2, '0');
	
	const getTodayISO = () => {
		const d = new Date();
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	};

	const formatDateDisplay = (isoStr) => {
		if (!isoStr) return '';
		try {
			if (isoStr.includes('-')) {
				const [y, m, d] = isoStr.split('-');
				return `${d}/${m}/${y}`;
			}
			return isoStr;
		} catch (e) {
			return isoStr;
		}
	};

	const form = ref({
		name: '',
		desc: '',
		customer: '',
		assignee: '',
		dueDate: getTodayISO(),
		notifyDate: getTodayISO() 
	});

	// --- Editor Variables ---
	const editorCtx = ref(null);
	const formats = ref({});
	const showLinkPopup = ref(false);
	const linkUrl = ref('');
	const linkText = ref('');
	const canInsertLink = ref(false);
	const isLinkSelected = ref(false);
	const focusLinkInput = ref(false);
	const showColorPopup = ref(false);
	const colorType = ref('color');
	const currentColor = ref('#000000');
	const currentBgColor = ref('transparent');
	const colorList = ['#000000', '#424242', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF', '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF', '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0', '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79'];
	const headerOptions = [{label:'Normal',value:null},{label:'H1',value:1},{label:'H2',value:2},{label:'H3',value:3}];
	const currentHeader = ref('Normal');
	const alignIcon = computed(() => formats.value.align === 'center' ? 'https://img.icons8.com/ios/50/666666/align-center.png' : (formats.value.align === 'right' ? 'https://img.icons8.com/ios/50/666666/align-right.png' : 'https://img.icons8.com/ios/50/666666/align-left.png'));
	const isPopupOpen = computed(() => showLinkPopup.value || showColorPopup.value);

	// --- Logic ---
	const submitForm = async () => {
		if (!form.value.name || !form.value.name.trim()) {
			uni.showToast({ title: 'Vui lòng nhập tên công việc', icon: 'none' });
			return;
		}
		loading.value = true;
		try {
			const payload = buildCreateTodoPayload(form.value, {
				projectCode: PROJECT_CODE,
				uid: UID
			});
			await createTodo(payload);
			uni.showToast({ title: 'Tạo thành công!', icon: 'success' });
			setTimeout(() => { uni.navigateBack(); }, 1500);
		} catch (error) {
			console.error("❌ Create Error:", error);
			uni.showToast({ title: 'Lỗi: ' + (error?.message || 'Thất bại'), icon: 'none' });
		} finally {
			loading.value = false;
		}
	};

	// --- Editor Methods ---
	const onEditorReady = () => { uni.createSelectorQuery().select('#editor').context((res) => { editorCtx.value = res.context; if (form.value.desc) editorCtx.value.setContents({ html: form.value.desc }); }).exec(); }
	const onEditorInput = (e) => { form.value.desc = e.detail.html; }
	const onStatusChange = (e) => { 
		formats.value = e.detail;
		if (e.detail.color) currentColor.value = e.detail.color;
		if (e.detail.backgroundColor) currentBgColor.value = e.detail.backgroundColor;
		if (e.detail.hasOwnProperty('link')) { isLinkSelected.value = true; linkUrl.value = e.detail.link || ''; } 
		else { isLinkSelected.value = false; linkUrl.value = ''; }
		editorCtx.value.getSelectionText({
			success: (res) => { if (res.text && res.text.length > 0) { canInsertLink.value = true; if (!isLinkSelected.value) linkText.value = res.text; } else { canInsertLink.value = false; if (!isLinkSelected.value) linkText.value = ''; } },
			fail: () => { canInsertLink.value = false; }
		});
	}
	const handleLinkBtn = () => { if (isLinkSelected.value || canInsertLink.value) { if(canInsertLink.value && !isLinkSelected.value) linkUrl.value=''; showLinkPopup.value = true; nextTick(() => { focusLinkInput.value = true; }); } else { uni.showToast({ title: 'Bôi đen chữ để chèn Link', icon: 'none' }); } }
	const closeLinkPopup = () => { showLinkPopup.value = false; focusLinkInput.value = false; }
	const confirmLink = () => { const url = linkUrl.value; const text = linkText.value; closeLinkPopup(); setTimeout(() => { if (url && text) { editorCtx.value.insertText({ text: text }); editorCtx.value.format('link', url); } }, 300); }
	const removeLink = () => { closeLinkPopup(); setTimeout(() => { editorCtx.value.format('link', null); }, 300); }
	const format = (name, value) => { if (editorCtx.value) editorCtx.value.format(name, value); }
	const onHeaderChange = (e) => { const sel = headerOptions[e.detail.value]; currentHeader.value = sel.label; format('header', sel.value); }
	const toggleAlign = () => { let a = 'center'; if(formats.value.align==='center') a='right'; else if(formats.value.align==='right') a='left'; format('align', a); }
	const openColorPicker = (type) => { colorType.value = type; showColorPopup.value = true; }
	const closeColorPopup = () => { showColorPopup.value = false; }
	const selectColor = (color) => { if (colorType.value === 'color') { currentColor.value = color || '#000000'; format('color', color); } else { currentBgColor.value = color || 'transparent'; format('backgroundColor', color); } closeColorPopup(); }
	const insertImage = () => { uni.chooseImage({ count: 1, success: (r) => editorCtx.value.insertImage({ src: r.tempFilePaths[0], width: '80%' }) }); }
	const insertVideo = () => { uni.chooseVideo({ count: 1, success: (r) => editorCtx.value.insertVideo({ src: r.tempFilePath, width: '80%' }) }); }
	
	const bindDateChange = (e, f) => { 
		form.value[f] = e.detail.value; 
	}
	const goBack = () => uni.navigateBack();
</script>

<style lang="scss">
	/* CSS Cũ (Giữ nguyên) */
	.container { min-height: 100vh; background-color: #f5f5f7; padding: 15px; box-sizing: border-box; }
	.flat-item { background-color: #fff; margin-bottom: 12px; padding: 15px; display: flex; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
	.item-left { display: flex; align-items: center; margin-right: 15px; }
	.icon-top-aligned { align-self: flex-start; margin-top: 2px; }
	.item-icon { width: 22px; height: 22px; opacity: 0.6; }
	.item-input { flex: 1; text-align: left; font-size: 15px; color: #333; }
	.editor-container { background-color: #fff; margin-bottom: 12px; padding: 15px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); display: flex; flex-direction: column; }
	.editor-label-row { display: flex; align-items: center; margin-bottom: 8px; }
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
	.color-popup-overlay, .link-popup-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.4); z-index: 9999; display: flex; justify-content: center; align-items: center; }
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
	.date-compound-block { align-items: flex-start; } .right-column { flex: 1; display: flex; flex-direction: column; }
	.date-row { width: 100%; height: 24px; display: flex; align-items: center; } .full-width-picker { width: 100%; }
	.item-picker { text-align: left; font-size: 15px; color: #333; width: 100%; } .placeholder-color { color: #808080; }
	.inner-divider { height: 1px; background-color: #f0f0f0; margin: 10px 0; width: 100%; }
	.footer-action { margin-top: 30px; display: flex; justify-content: space-between; }
	.btn { border-radius: 0; font-size: 15px; font-weight: bold; height: 45px; line-height: 45px; border: none; }
	.btn-cancel { width: 35%; background-color: #e5e5ea; color: #333; } .btn-submit { width: 60%; background-color: #007aff; color: #fff; }
	.btn-submit[disabled] { background-color: #8dc2ff; }
</style>