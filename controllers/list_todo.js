import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getTodos, getTodoCount, deleteTodo } from '@/api/todo.js';
import { TODO_STATUS, STATUS_LABELS } from '@/utils/constants.js';
import { buildTodoParams } from '@/models/todo.js';

export const useListTodoController = () => {
    // --- STATE CƠ BẢN ---
    const todos = ref([]);
    const isLoading = ref(false);
    const isFilterOpen = ref(false);
    
    // State cho Popup xóa
    const isConfirmDeleteOpen = ref(false);
    const itemToDelete = ref(null);

    // --- FILTER CONFIG ---

    // 1. Trạng thái (Cũ)
    const statusOptions = ['Tất cả', STATUS_LABELS[TODO_STATUS.NEW], STATUS_LABELS[TODO_STATUS.IN_PROGRESS], STATUS_LABELS[TODO_STATUS.DONE]];
    const statusValues = ['', TODO_STATUS.NEW, TODO_STATUS.IN_PROGRESS, TODO_STATUS.DONE];
    const statusIndex = ref(0);

    // 2. Các bộ lọc MỚI (UI Only - Chưa có logic API)
    // Người tạo
    const creatorOptions = ['Tất cả', 'Nguyễn Văn A', 'Trần Thị B', 'Admin'];
    const creatorIndex = ref(0);
    
    // Mã khách hàng
    const customerOptions = ['Tất cả', 'KH001', 'KH002', 'VNG'];
    const customerIndex = ref(0);

    // Người giao
    const assigneeOptions = ['Tất cả', 'User 1', 'User 2'];
    const assigneeIndex = ref(0);

    // Nguồn
    const sourceOptions = ['Tất cả', 'CALL', 'CUSTOMER', 'CONVERSATION', 'CHAT_MESSAGE'];
        // Giá trị bắn API tương ứng (map 1-1 với mảng trên)
        const sourceValues = ['', 'CALL', 'CUSTOMER', 'CONVERSATION', 'CHAT_MESSAGE'];
        const sourceIndex = ref(0);

    // Object chứa giá trị input/date
    const filter = ref({ 
        title: '', 
        jobCode: '', 
        createdFrom: '', 
        createdTo: '',
        // Thêm date hết hạn
        dueDateFrom: '',
        dueDateTo: ''
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
                            sourceValues[sourceIndex.value] // Lấy giá trị link (CALL, CUSTOMER...)
                        );
            const currentSize = pageSizeValues[pageSizeIndex.value];
            
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

    // Handlers cho Pagination
    const onPageSizeChange = (e) => {
        pageSizeIndex.value = e.detail.value;
        currentPage.value = 1;
        getTodoList();
    };

    const changePage = (direction) => {
        const newPage = currentPage.value + direction;
        if (newPage >= 1 && newPage <= totalPages.value) {
            currentPage.value = newPage;
            getTodoList();
        }
    };

    // Logic Xóa
    const onRequestDelete = (item) => { itemToDelete.value = item; isConfirmDeleteOpen.value = true; };
    const cancelDelete = () => { isConfirmDeleteOpen.value = false; itemToDelete.value = null; };
    const confirmDelete = async () => {
        if (!itemToDelete.value) return;
        try {
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

    const showActionMenu = (item) => {
        uni.showActionSheet({
            itemList: ['Xóa công việc'],
            itemColor: '#ff3b30',
            success: (res) => {
                if (res.tapIndex === 0) onRequestDelete(item);
            }
        });
    };

    // UI Actions
    const addNewTask = () => { uni.navigateTo({ url: '/pages/todo/create_todo' }); };
    const openFilter = () => { isFilterOpen.value = true; };
    const closeFilter = () => { isFilterOpen.value = false; };
    
    // Change Handlers cho Filter
    const onStatusChange = (e) => { statusIndex.value = e.detail.value; };
    const onCreatorChange = (e) => { creatorIndex.value = e.detail.value; };
    const onCustomerChange = (e) => { customerIndex.value = e.detail.value; };
    const onAssigneeChange = (e) => { assigneeIndex.value = e.detail.value; };
    const onSourceChange = (e) => { sourceIndex.value = e.detail.value; };

    const resetFilter = () => { 
        // Reset text fields
        filter.value = { 
            title: '', jobCode: '', 
            createdFrom: '', createdTo: '',
            dueDateFrom: '', dueDateTo: ''
        }; 
        // Reset pickers
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

    return {
        todos, isLoading, isFilterOpen, filter,
        isConfirmDeleteOpen, itemToDelete,
        // Pagination
        pageSizeOptions, pageSizeIndex, currentPage, totalPages, totalItems, onPageSizeChange, changePage,
        // Options & Indexes cho Filter
        statusOptions, statusIndex, onStatusChange,
        creatorOptions, creatorIndex, onCreatorChange,
        customerOptions, customerIndex, onCustomerChange,
        assigneeOptions, assigneeIndex, onAssigneeChange,
        sourceOptions, sourceIndex, onSourceChange,
        // Actions
        addNewTask, openFilter, closeFilter, resetFilter, applyFilter,
        showActionMenu, cancelDelete, confirmDelete
    };
};