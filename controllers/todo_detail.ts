import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getTodoDetail } from '@/api/todo';

// --- SỬA Ở ĐÂY: Import từ file mới ---
import { mapTodoDetailToForm, type TodoDetailForm } from '@/models/todo_detail'; 
import { TODO_SOURCE } from '@/utils/enums';

export const useTodoDetailController = () => {
    const isLoading = ref(false);

    // Khởi tạo form với Interface chuẩn
    const form = ref<TodoDetailForm>({
        id: '',
        title: '', 
        code: 'Loading...',
        desc: '',
        statusIndex: 0,
        sourceIndex: 0,
        assigneeIndex: 0,
        dueDate: '',
        notifyDate: '',
        notifyTime: ''
    });

    const statusOptions = ['Chưa xử lý', 'Đang xử lý', 'Hoàn thành'];
    const sourceOptions = ['Cuộc gọi', 'Khách hàng', 'Hội thoại', 'Tin nhắn'];
    const assigneeOptions = ['Nguyễn Văn A', 'Trần Thị B'];

    onLoad(async (options: any) => {
        if (options && options.id) {
            await fetchDetail(options.id);
        }
    });

 const fetchDetail = async (id: string | number) => {
         isLoading.value = true;
         try {
             // 1. Gọi API
             const rawResponse = await getTodoDetail(id);
             
             // 2. LOG RA KIỂM TRA (Quan trọng: Xem console để biết cấu trúc thật)
             console.log('🔍 API Response:', rawResponse);
 
             // 3. Xử lý dữ liệu an toàn
             // Nếu rawResponse có chứa thuộc tính 'data' bên trong (dạng wrapper), lấy nó ra.
             // Nếu không (nó đã là data rồi), thì dùng chính nó.
             // Kiểm tra thêm: rawResponse.id có tồn tại không? Nếu không thì khả năng cao dữ liệu nằm trong rawResponse.data
             const realData = (rawResponse && rawResponse.data && !rawResponse.id) 
                              ? rawResponse.data 
                              : rawResponse;
 
             console.log('🎯 Real Data for Mapper:', realData);
 
             // 4. Map dữ liệu
             const mappedData = mapTodoDetailToForm(realData);
             
             if (mappedData) {
                 form.value = mappedData;
             } else {
                 uni.showToast({ title: 'Dữ liệu trống', icon: 'none' });
             }
 
         } catch (error) {
             console.error('❌ Lỗi lấy chi tiết:', error);
             uni.showToast({ title: 'Lỗi kết nối', icon: 'none' });
         } finally {
             isLoading.value = false;
         }
     };
    const onStatusChange = (e: any) => { form.value.statusIndex = e.detail.value; };
    const onSourceChange = (e: any) => { form.value.sourceIndex = e.detail.value; };
    const onAssigneeChange = (e: any) => { form.value.assigneeIndex = e.detail.value; };
    const goBack = () => { uni.navigateBack(); };
    const saveTodo = () => { console.log("Lưu:", form.value); uni.showToast({ title: 'Đã lưu', icon: 'success' }); };

    return {
        isLoading,
        form,
        statusOptions, sourceOptions, assigneeOptions,
        onStatusChange, onSourceChange, onAssigneeChange,
        goBack, saveTodo
    };
};