// src/controllers/todo_detail.ts
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getTodoDetail } from '@/api/todo';
import { getAllMembers } from '@/api/project'; // [MỚI] Import API lấy thành viên
import { mapTodoDetailToForm, type TodoDetailForm } from '@/models/todo_detail'; 

export const useTodoDetailController = () => {
    const isLoading = ref(false);

    const form = ref<TodoDetailForm>({
        id: '', title: '', code: 'Loading...', desc: '',
        statusIndex: 0, sourceIndex: 0, assigneeIndex: 0, assigneeId: '',
        dueDate: '', notifyDate: '', notifyTime: ''
    });

    const statusOptions = ['Chưa xử lý', 'Đang xử lý', 'Hoàn thành'];
    const sourceOptions = ['Cuộc gọi', 'Khách hàng', 'Hội thoại', 'Tin nhắn'];
    
    // [MỚI] State cho danh sách thành viên
    const memberList = ref<any[]>([]);       // Chứa full data (để lấy UID)
    const assigneeOptions = ref<string[]>([]); // Chứa tên (để hiện lên Picker)

    onLoad(async (options: any) => {
        // Gọi song song hoặc tuần tự. Ở đây gọi tuần tự để đảm bảo logic
        await fetchMembers(); 

        if (options && options.id) {
            await fetchDetail(options.id);
        }
    });

    // 1. Hàm lấy danh sách thành viên
    const fetchMembers = async () => {
        try {
            const data = await getAllMembers();
            memberList.value = data;
            // Tạo mảng tên để hiển thị trong Picker
            assigneeOptions.value = data.map(m => m.UserName || 'Thành viên ẩn danh');
        } catch (e) {
            console.error('Lỗi lấy members', e);
            assigneeOptions.value = ['Không tải được danh sách'];
        }
    };

    // 2. Hàm lấy chi tiết Todo
    const fetchDetail = async (id: string | number) => {
        isLoading.value = true;
        try {
            const rawResponse = await getTodoDetail(id);
            // Xử lý wrapper data (nếu có)
            const realData = (rawResponse && rawResponse.data && !rawResponse.id) 
                             ? rawResponse.data 
                             : rawResponse;

            const mappedData = mapTodoDetailToForm(realData);
            
            if (mappedData) {
                form.value = mappedData;

                // [LOGIC MỚI] Tìm assigneeIndex dựa trên assigneeId
                if (form.value.assigneeId && memberList.value.length > 0) {
                    // Tìm người có memberUID trùng với assigneeId
                    const index = memberList.value.findIndex(m => m.memberUID === form.value.assigneeId);
                    
                    if (index !== -1) {
                        form.value.assigneeIndex = index;
                    } else {
                        // Nếu không tìm thấy (hoặc người đó bị xóa), có thể để mặc định hoặc hiện cảnh báo
                        form.value.assigneeIndex = -1; 
                    }
                }
            }
        } catch (error) {
            console.error('❌ Lỗi lấy chi tiết:', error);
            uni.showToast({ title: 'Lỗi kết nối', icon: 'none' });
        } finally {
            isLoading.value = false;
        }
    };

    // Event Handlers
    const onStatusChange = (e: any) => { form.value.statusIndex = e.detail.value; };
    const onSourceChange = (e: any) => { form.value.sourceIndex = e.detail.value; };
    
    // [MỚI] Khi chọn người mới từ Picker
    const onAssigneeChange = (e: any) => { 
        const idx = e.detail.value;
        form.value.assigneeIndex = idx;
        
        // Cập nhật luôn assigneeId mới vào form (để sau này bấm Lưu còn gửi đi)
        if (memberList.value[idx]) {
            form.value.assigneeId = memberList.value[idx].memberUID;
        }
    };

    const goBack = () => { uni.navigateBack(); };
    const saveTodo = () => { 
        // Lúc lưu, bạn sẽ dùng form.value.assigneeId để gửi lên API update
        console.log("Lưu:", form.value); 
        uni.showToast({ title: 'Đã lưu (Demo)', icon: 'success' }); 
    };

    return {
        isLoading,
        form,
        statusOptions, sourceOptions, 
        assigneeOptions, // [MỚI] Trả về options động
        onStatusChange, onSourceChange, onAssigneeChange,
        goBack, saveTodo
    };
};