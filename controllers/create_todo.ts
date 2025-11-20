// src/controllers/create_todo.ts
import { ref, onMounted, computed } from 'vue';
import { createTodo } from '@/api/todo';
import { getAllMembers } from '@/api/project'; // Import API vừa tạo
import { PROJECT_CODE, UID } from '@/utils/config';
import { buildCreateTodoPayload } from '@/models/create_todo';
import type { TodoForm } from '@/types/todo';

export const useCreateTodoController = () => {
    
    // Helpers
    const pad = (n: number) => n.toString().padStart(2, '0');
    const getTodayISO = () => {
        const d = new Date();
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    const getCurrentTime = () => {
        const d = new Date();
        return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    // --- FORM STATE ---
    const loading = ref<boolean>(false);
    
    const form = ref<TodoForm>({
        name: '',
        desc: '',
        customer: '',
        assignee: '', // Trường này sẽ chứa memberUID
        dueDate: getTodayISO(),
        notifyDate: getTodayISO(),
        notifyTime: getCurrentTime()
    });

    // --- MEMBER STATE (Mới) ---
    const memberList = ref<any[]>([]); // Chứa danh sách raw từ API
    const memberOptions = ref<string[]>([]); // Chứa danh sách tên để hiển thị trong Picker
    const selectedMemberIndex = ref<number>(-1); // Index của người được chọn trong Picker

    // --- LOGIC ACTIONS ---
    
    // 1. Hàm gọi API lấy thành viên (Mới)
    const fetchMembers = async () => {
        try {
            const data = await getAllMembers();
            memberList.value = data;
            // Map ra mảng chỉ chứa tên để dùng cho Picker
            memberOptions.value = data.map(m => m.UserName || 'Thành viên ẩn danh');
        } catch (error) {
            console.error('Lỗi lấy thành viên:', error);
            uni.showToast({ title: 'Không thể tải danh sách thành viên', icon: 'none' });
        }
    };

    // 2. Xử lý khi chọn từ Menu (Mới)
    const onMemberChange = (e: any) => {
        const index = e.detail.value;
        selectedMemberIndex.value = index;
        
        // Lấy member tương ứng từ list gốc
        const selectedMember = memberList.value[index];
        if (selectedMember) {
            // Hiển thị tên, nhưng lưu memberUID vào form
            form.value.assignee = selectedMember.memberUID; 
        }
    };

    // Computed để hiển thị tên người đang được chọn (UI Helper)
    const currentAssigneeName = computed(() => {
        if (selectedMemberIndex.value > -1 && memberOptions.value.length > 0) {
            return memberOptions.value[selectedMemberIndex.value];
        }
        return '';
    });

    const goBack = () => uni.navigateBack();

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
    
        } catch (error: any) { 
            console.error("❌ Create Error:", error);
            const errorMsg = error?.message || 'Thất bại';
            uni.showToast({ title: 'Lỗi: ' + errorMsg, icon: 'none' });
        } finally {
            loading.value = false;
        }
    };

    // Gọi API ngay khi Controller được dùng
    onMounted(() => {
        fetchMembers();
    });

    return {
        loading, 
        form, 
        goBack, 
        submitForm,
        // Return thêm các biến mới để View dùng
        memberOptions,
        onMemberChange,
        currentAssigneeName
    };
};