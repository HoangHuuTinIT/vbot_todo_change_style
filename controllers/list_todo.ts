import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
// Import từ file .ts (bỏ đuôi .js khi import cũng được)
import { getTodos, getTodoCount, deleteTodo } from '@/api/todo'; 
import { TODO_STATUS, STATUS_LABELS } from '@/utils/constants';
import { buildTodoParams } from '@/models/todo'; // Import từ .ts
import { TODO_SOURCE } from '@/utils/enums';
import type { TodoItem } from '@/types/todo';

export const useListTodoController = () => {
    // --- STATE CƠ BẢN ---
    // Định nghĩa rõ mảng chứa các TodoItem
    const todos = ref<TodoItem[]>([]);
    const isLoading = ref<boolean>(false);
    const isFilterOpen = ref<boolean>(false);
    
    const isConfirmDeleteOpen = ref<boolean>(false);
    const itemToDelete = ref<TodoItem | null>(null);

    // --- FILTER CONFIG ---
    const statusOptions = ['Tất cả', STATUS_LABELS[TODO_STATUS.NEW], STATUS_LABELS[TODO_STATUS.IN_PROGRESS], STATUS_LABELS[TODO_STATUS.DONE]];
    const statusValues = ['', TODO_STATUS.NEW, TODO_STATUS.IN_PROGRESS, TODO_STATUS.DONE];
    const statusIndex = ref<number>(0);

    // ... (Giữ nguyên creatorOptions, customerOptions...)
    const creatorOptions = ['Tất cả', 'Nguyễn Văn A', 'Trần Thị B', 'Admin'];
    const creatorIndex = ref(0);
    const customerOptions = ['Tất cả', 'KH001', 'KH002', 'VNG'];
    const customerIndex = ref(0);
    const assigneeOptions = ['Tất cả', 'User 1', 'User 2'];
    const assigneeIndex = ref(0);

    // Source Enum
    const sourceOptions = ['Tất cả', 'Cuộc gọi (CALL)', 'Khách hàng (CUSTOMER)', 'Hội thoại (CONVERSATION)', 'Tin nhắn (CHAT_MESSAGE)'];
    const sourceValues = ['', TODO_SOURCE.CALL, TODO_SOURCE.CUSTOMER, TODO_SOURCE.CONVERSATION, TODO_SOURCE.CHAT_MESSAGE];
    const sourceIndex = ref<number>(0);

    const filter = ref({ 
        title: '', jobCode: '', 
        createdFrom: '', createdTo: '',
        dueDateFrom: '', dueDateTo: ''
    });

    // --- STATE PHÂN TRANG ---
    const pageSizeOptions = ['5/trang', '10/trang', '15/trang', '20/trang'];
    const pageSizeValues = [5, 10, 15, 20];
    const pageSizeIndex = ref(2); 
    const currentPage = ref(1);
    const totalItems = ref(0);

    const totalPages = computed(() => {
        if (totalItems.value === 0) return 1;
        const size = pageSizeValues[pageSizeIndex.value];
        return Math.ceil(totalItems.value / size);
    });

    // --- METHODS ---
    const getTodoList = async () => {
        isLoading.value = true;
        try {
            const filterParams = buildTodoParams(
                filter.value, 
                statusValues[statusIndex.value],
                sourceValues[sourceIndex.value]
            );
            
            const currentSize = pageSizeValues[pageSizeIndex.value];
            
            // Vì getTodos và getTodoCount đã trả về Promise đúng kiểu, code này an toàn
            const [listData, countData] = await Promise.all([
                getTodos({ 
                    ...filterParams, 
                    pageNo: currentPage.value, 
                    pageSize: currentSize 
                }),
                getTodoCount(filterParams)
            ]);

            todos.value = listData || [];
            totalItems.value = countData || 0;
        } catch (error) {
            console.error(error);
            uni.showToast({ title: 'Lỗi tải dữ liệu', icon: 'none' });
        } finally {
            isLoading.value = false;
        }
    };

    const onPageSizeChange = (e: any) => {
        pageSizeIndex.value = e.detail.value;
        currentPage.value = 1;
        getTodoList();
    };

    const changePage = (direction: number) => {
        const newPage = currentPage.value + direction;
        if (newPage >= 1 && newPage <= totalPages.value) {
            currentPage.value = newPage;
            getTodoList();
        }
    };

    // Logic Xóa
    const onRequestDelete = (item: TodoItem) => { itemToDelete.value = item; isConfirmDeleteOpen.value = true; };
    const cancelDelete = () => { isConfirmDeleteOpen.value = false; itemToDelete.value = null; };
    
    const confirmDelete = async () => {
        if (!itemToDelete.value) return;
        try {
            // itemToDelete.value.id đã được TS đảm bảo tồn tại
            await deleteTodo(itemToDelete.value.id);
            uni.showToast({ title: 'Đã xóa thành công', icon: 'success' });
            isConfirmDeleteOpen.value = false;
            itemToDelete.value = null;
            getTodoList(); 
        } catch (error) {
            console.error("Delete Error:", error);
            uni.showToast({ title: 'Xóa thất bại', icon: 'none' });
        }
    };

    const showActionMenu = (item: TodoItem) => {
        uni.showActionSheet({
            itemList: ['Xóa'],
            itemColor: '#ff3b30',
            success: (res) => {
                if (res.tapIndex === 0) onRequestDelete(item);
            }
        });
    };

    // ... (Các hàm UI Actions giữ nguyên logic, chỉ thêm : any vào event nếu cần)
    const addNewTask = () => { uni.navigateTo({ url: '/pages/todo/create_todo' }); };
    const openFilter = () => { isFilterOpen.value = true; };
    const closeFilter = () => { isFilterOpen.value = false; };
    
    const onStatusChange = (e: any) => { statusIndex.value = e.detail.value; };
    const onCreatorChange = (e: any) => { creatorIndex.value = e.detail.value; };
    const onCustomerChange = (e: any) => { customerIndex.value = e.detail.value; };
    const onAssigneeChange = (e: any) => { assigneeIndex.value = e.detail.value; };
    const onSourceChange = (e: any) => { sourceIndex.value = e.detail.value; };

    const resetFilter = () => { 
        filter.value = { 
            title: '', jobCode: '', 
            createdFrom: '', createdTo: '',
            dueDateFrom: '', dueDateTo: ''
        }; 
        statusIndex.value = 0; 
        creatorIndex.value = 0;
        customerIndex.value = 0;
        assigneeIndex.value = 0;
        sourceIndex.value = 0;
        currentPage.value = 1;
    };
    
    const applyFilter = () => { 
        currentPage.value = 1;
        closeFilter(); 
        getTodoList(); 
    };

    onShow(() => { getTodoList(); });
const goToDetail = (item: TodoItem) => {
    // Truyền ID qua query param
    uni.navigateTo({
        url: `/pages/todo/todo_detail?id=${item.id}`
    });
};
    return {
        todos, isLoading, isFilterOpen, filter,goToDetail,
        isConfirmDeleteOpen, itemToDelete,
        pageSizeOptions, pageSizeIndex, currentPage, totalPages, totalItems, onPageSizeChange, changePage,
        statusOptions, statusIndex, onStatusChange,
        creatorOptions, creatorIndex, onCreatorChange,
        customerOptions, customerIndex, onCustomerChange,
        assigneeOptions, assigneeIndex, onAssigneeChange,
        sourceOptions, sourceIndex, onSourceChange,
        addNewTask, openFilter, closeFilter, resetFilter, applyFilter,
        showActionMenu, cancelDelete, confirmDelete
    };
};