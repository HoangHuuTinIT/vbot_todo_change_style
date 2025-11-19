import { ref } from 'vue';
import { createTodo } from '@/api/todo'; // .ts không cần đuôi khi import
import { PROJECT_CODE, UID } from '@/utils/config';
import { buildCreateTodoPayload } from '@/models/create_todo';
import type { TodoForm } from '@/types/todo'; // Import Type

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
    
    // Định nghĩa rõ kiểu cho form: Ref<TodoForm>
    const form = ref<TodoForm>({
        name: '',
        desc: '',
        customer: '',
        assignee: '',
        dueDate: getTodayISO(),
        notifyDate: getTodayISO(),
        notifyTime: getCurrentTime()
    });

    // --- LOGIC ACTIONS ---
    const goBack = () => uni.navigateBack();

    const submitForm = async () => {
        if (!form.value.name || !form.value.name.trim()) {
            uni.showToast({ title: 'Vui lòng nhập tên công việc', icon: 'none' });
            return;
        }
    
        loading.value = true;
    
        try {
            // Payload giờ đã được type-safe
            const payload = buildCreateTodoPayload(form.value, {
                projectCode: PROJECT_CODE,
                uid: UID
            });
    
            await createTodo(payload);
    
            uni.showToast({ title: 'Tạo thành công!', icon: 'success' });
            setTimeout(() => { uni.navigateBack(); }, 1500);
    
        } catch (error: any) { // Error trong TS cần xử lý kiểu
            console.error("❌ Create Error:", error);
            const errorMsg = error?.message || 'Thất bại';
            uni.showToast({ title: 'Lỗi: ' + errorMsg, icon: 'none' });
        } finally {
            loading.value = false;
        }
    };

    return {
        loading, form, goBack, submitForm
    };
};