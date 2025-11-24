// src/controllers/todo_detail.ts
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getTodoDetail } from '@/api/todo';
import { getAllMembers } from '@/api/project';
import {  getCrmCustomerDetail , getCrmActionTimeline} from '@/api/crm'; // Import API CRM
import { mapTodoDetailToForm, type TodoDetailForm } from '@/models/todo_detail';
import { PROJECT_CODE, UID } from '@/utils/config';
import { TIMELINE_TYPE_MAP } from '@/utils/constants';
import { useAuthStore } from '@/stores/auth';
interface HistoryItem {
    id: number;
    timeStr: string;      // Giờ hiển thị (VD: 10:30 21/11)
    content: string;      // Nội dung tương tác (Tiếng Việt)
    actorName: string;    // Tên người thực hiện
    originalType: string; // Lưu loại gốc để icon nếu cần
}
export const useTodoDetailController = () => {
	const authStore = useAuthStore();
    const isLoading = ref(false);
    // State loading riêng cho phần khách hàng để UI mượt hơn
    const isLoadingCustomer = ref(false); 

    const isLoadingHistory = ref(false);
	const historyList = ref<HistoryItem[]>([]);
       const historyFilterIndex = ref(0); // Vị trí đang chọn (0 là Tất cả)
           
           // 1. Danh sách hiển thị (UI)
           const historyFilterOptions = [
               'Tất cả', 
               'Công việc', 
               'Ticket', 
               'Lịch sử gọi', 
               'Khách hàng', 
               'Ghi chú'
           ];
    const historyFilterValues = [
            'ALL',          // Tất cả
            'TODO',         // Công việc
            'TICKET',       // Ticket
            'HISTORY_CALL', // Lịch sử gọi
            'CUSTOMER',     // Khách hàng
            'NOTE'          // Ghi chú
        ];
        const form = ref<TodoDetailForm>({
            // ... giữ nguyên
            id: '', title: '', code: 'Loading...', desc: '',
            statusIndex: 0, sourceIndex: 0, assigneeIndex: 0, assigneeId: '',
            dueDate: '', notifyDate: '', notifyTime: '',
            customerCode: '', customerName: '', customerNameLabel: '',
            customerPhone: '', customerPhoneLabel: '', 
            customerManagerName: '', customerManagerLabel: ''
        });

    const statusOptions = ['Chưa xử lý', 'Đang xử lý', 'Hoàn thành'];
    const sourceOptions = ['Cuộc gọi', 'Khách hàng', 'Hội thoại', 'Tin nhắn'];
    
    const memberList = ref<any[]>([]); 
    const assigneeOptions = ref<string[]>([]);

    onLoad(async (options: any) => {
        // 1. Lấy danh sách thành viên trước (để lát nữa map ID -> Tên quản lý)
        await fetchMembers(); 

        // 2. Lấy chi tiết Todo
        if (options && options.id) {
            await fetchDetail(options.id);
        }
    });

    const fetchMembers = async () => {
        try {
            const data = await getAllMembers();
            memberList.value = data;
            assigneeOptions.value = data.map(m => m.UserName || 'Thành viên ẩn danh');
        } catch (e) {
            console.error('Lỗi lấy members', e);
        }
    };

    const fetchDetail = async (id: string | number) => {
        isLoading.value = true;
        try {
            const rawResponse = await getTodoDetail(id);
            const realData = (rawResponse && rawResponse.data && !rawResponse.id) 
                             ? rawResponse.data 
                             : rawResponse;

            const mappedData = mapTodoDetailToForm(realData);
            
            if (mappedData) {
                form.value = mappedData;

                // Map người được giao (Assignee)
                if (form.value.assigneeId && memberList.value.length > 0) {
                    const index = memberList.value.findIndex(m => m.memberUID === form.value.assigneeId);
                    if (index !== -1) form.value.assigneeIndex = index;
                }

                // [QUAN TRỌNG] Nếu có mã khách hàng -> Gọi tiếp API CRM
                if (form.value.customerCode) {
                    await fetchCustomerInfo(form.value.customerCode);
					fetchHistoryLog(form.value.customerCode);
                }
            }
        } catch (error) {
            console.error('❌ Lỗi lấy chi tiết:', error);
            uni.showToast({ title: 'Lỗi kết nối', icon: 'none' });
        } finally {
            isLoading.value = false;
        }
    };

    // [LOGIC MỚI] Hàm xử lý lấy thông tin khách hàng
    const fetchCustomerInfo = async (customerUid: string) => {
            isLoadingCustomer.value = true;
            try {
                // B1. Lấy Token
              const crmToken = authStore.todoToken;
			  if (!crmToken) return;
                // B2. Gọi API
               const res = await getCrmCustomerDetail(crmToken, customerUid);
                
                // B3. Lấy danh sách fields
                const fields = res.fields || res.data?.fields || [];
    
                // Tìm các field tương ứng theo mã code
                const nameField = fields.find((f: any) => f.code === 'name');
                const phoneField = fields.find((f: any) => f.code === 'phone');
                const managerField = fields.find((f: any) => f.code === 'member_no');
    
                // --- CẬP NHẬT VALUE & LABEL ---
    
                // 1. Tên khách hàng
                if (nameField) {
                    form.value.customerName = nameField.value;
                    form.value.customerNameLabel = nameField.name; // <--- Lấy tiêu đề từ API
                }
    
                // 2. Số điện thoại
                if (phoneField) {
                    form.value.customerPhone = phoneField.value;
                    form.value.customerPhoneLabel = phoneField.name; // <--- Lấy tiêu đề từ API
                }
    
                // 3. Người quản lý
                if (managerField) {
                    // Lấy tiêu đề
                    form.value.customerManagerLabel = managerField.name; // <--- Lấy tiêu đề từ API
    
                    // Xử lý Value (Map ID -> Tên Member)
                    const managerUid = managerField.value;
                    const manager = memberList.value.find(m => m.memberUID === managerUid);
                    form.value.customerManagerName = manager ? manager.UserName : '(Chưa xác định)';
                }
    
            } catch (error) {
                console.error("Lỗi CRM:", error);
            } finally {
                isLoadingCustomer.value = false;
            }
        };
const fetchHistoryLog = async (customerUid: string) => {
        isLoadingHistory.value = true;
        try {
			const currentType = historyFilterValues[historyFilterIndex.value];
            // B1. Lấy token
            const crmToken = authStore.todoToken;
            if (!crmToken) {
                            console.error("Chưa có Token CRM/Todo");
                            return;
                        }
            // B2. Gọi API
         const rawHistory = await getCrmActionTimeline(crmToken, customerUid, currentType);
            
            // B3. Xử lý dữ liệu (Map)
            if (Array.isArray(rawHistory)) {
                historyList.value = rawHistory.map((item: any) => {
                    // 1. Xử lý thời gian (createAt)
                    const date = new Date(item.createAt);
                                        const day = date.getDate().toString().padStart(2, '0');
                                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                        const year = date.getFullYear();
                                        
                                        // Format mới: dd/mm/yyyy (VD: 21/11/2025)
                                        const timeStr = `${day}/${month}/${year}`;

                    // 2. Xử lý Tên người tương tác (memberUid)
                    let actorName = 'Hệ thống';
                    if (item.memberUid) {
                        // So sánh memberUid từ API Timeline với memberUID trong danh sách Member
                        const foundMember = memberList.value.find(m => m.memberUID === item.memberUid);
                        if (foundMember) {
                            actorName = foundMember.UserName;
                        }
                    }

                    // 3. Xử lý Nội dung tương tác (typeSub)
                    // Nếu typeSub có trong map thì lấy tiếng Việt, không thì lấy chính nó
                    const content = TIMELINE_TYPE_MAP[item.typeSub] || item.typeSub || 'Tương tác khác';

                    return {
                        id: item.id,
                        timeStr,
                        content,
                        actorName,
                        originalType: item.typeSub
                    };
                });
            }

        } catch (error) {
            console.error("Lỗi lấy lịch sử:", error);
        } finally {
            isLoadingHistory.value = false;
        }
    };
	const onHistoryFilterChange = (e: any) => {
	        // 1. Cập nhật index mới
	        historyFilterIndex.value = e.detail.value;
	        
	        // 2. Gọi lại API ngay lập tức (nếu đã có mã khách hàng)
	        if (form.value.customerCode) {
	            fetchHistoryLog(form.value.customerCode);
	        }
	    };
    // ... (Giữ nguyên các event handler cũ: onStatusChange, saveTodo...)
    const onStatusChange = (e: any) => { form.value.statusIndex = e.detail.value; };
    const onSourceChange = (e: any) => { form.value.sourceIndex = e.detail.value; };
    const onAssigneeChange = (e: any) => { 
        const idx = e.detail.value;
        form.value.assigneeIndex = idx;
        if (memberList.value[idx]) {
            form.value.assigneeId = memberList.value[idx].memberUID;
        }
    };
    const goBack = () => { uni.navigateBack(); };
    const saveTodo = () => { 
        console.log("Lưu:", form.value); 
        uni.showToast({ title: 'Đã lưu', icon: 'success' }); 
    };

    return {
        isLoading, isLoadingCustomer,
		 isLoadingHistory, historyList,// Trả về thêm biến này
        form,
        statusOptions, sourceOptions, assigneeOptions,
        onStatusChange, onSourceChange, onAssigneeChange,
        goBack, saveTodo,
		
		historyFilterOptions, 
		historyFilterIndex, 
		onHistoryFilterChange
    };
};