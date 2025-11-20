// src/controllers/create_todo.ts
import { ref, onMounted, computed } from 'vue';
import { createTodo } from '@/api/todo';
import { getAllMembers } from '@/api/project'; // Import API vừa tạo
import { PROJECT_CODE, UID } from '@/utils/config';
import { buildCreateTodoPayload } from '@/models/create_todo';
import type { TodoForm } from '@/types/todo';
import { getCrmToken, getCrmFieldSearch, getCrmCustomers } from '@/api/crm';
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
		customerUid: '',
        assignee: '', // Trường này sẽ chứa memberUID
        dueDate: getTodayISO(),
        notifyDate: getTodayISO(),
        notifyTime: getCurrentTime()
    });

    // --- MEMBER STATE (Mới) ---
    const memberList = ref<any[]>([]); // Chứa danh sách raw từ API
    const memberOptions = ref<string[]>([]); // Chứa danh sách tên để hiển thị trong Picker
    const selectedMemberIndex = ref<number>(-1); // Index của người được chọn trong Picker


	const showCustomerModal = ref(false);
    const loadingCustomer = ref(false);
    const customerList = ref<any[]>([]); // List đã qua xử lý để hiển thị
    const customerToken = ref(''); // Lưu token CRM để dùng lại nếu cần
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

	const fetchCustomers = async () => {
	        // Nếu đã có data rồi thì không gọi lại (tùy logic)
	        if (customerList.value.length > 0) return;
	
	        loadingCustomer.value = true;
	        try {
	            // B1: Lấy Token CRM
	            const token = await getCrmToken(PROJECT_CODE, UID);
	            customerToken.value = token;
	
	            // B2: Lấy cấu hình Field Search để tìm ID của name, phone
	            const fields = await getCrmFieldSearch(token);
	            
	            // Tìm ID tương ứng
	            const nameField = fields.find((f: any) => f.code === 'name');
	            const phoneField = fields.find((f: any) => f.code === 'phone');
	            const memberNoField = fields.find((f: any) => f.code === 'member_no');
	            
	            const nameId = nameField ? nameField.id : 134; // Fallback ID nếu không tìm thấy
	            const phoneId = phoneField ? phoneField.id : 135;
	            const memberNoId = memberNoField ? memberNoField.id : 136;
	
	            // B3: Tạo Body request Get All
	            const requestBody = {
	                page: 1,
	                size: 20, // Lấy 20 khách hàng demo
	                fieldSearch: [
	                    { id: -1, value: "", type: "", isSearch: false }, // create_at
	                    { id: nameId, value: "", type: "", isSearch: false },
	                    { id: phoneId, value: "", type: "", isSearch: false },
	                    { id: memberNoId, value: "", type: "", isSearch: false }
	                ]
	            };
	
	            // B4: Gọi lấy danh sách
	            const rawData = await getCrmCustomers(token, requestBody);
	
	            // B5: Map dữ liệu phức tạp thành dữ liệu phẳng cho UI
	            customerList.value = rawData.map((item: any) => {
	                            const nameObj = item.customerFieldItems.find((f: any) => f.code === 'name');
	                            const phoneObj = item.customerFieldItems.find((f: any) => f.code === 'phone');
	                            
	                            return {
	                                id: item.id,
	                                uid: item.uid, // [QUAN TRỌNG] Lấy trường uid từ API trả về
	                                createAt: item.createAt,
	                                name: nameObj ? nameObj.value : '(Không tên)',
	                                phone: phoneObj ? phoneObj.value : '',
	                            };
	                        });
	
	        } catch (error) {
	            console.error('Lỗi tải khách hàng:', error);
	            uni.showToast({ title: 'Lỗi tải dữ liệu CRM', icon: 'none' });
	        } finally {
	            loadingCustomer.value = false;
	        }
	    };
	
	    const openCustomerPopup = () => {
	        showCustomerModal.value = true;
	        fetchCustomers(); // Gọi API khi mở popup
	    };
	
	    const onCustomerSelect = (customer: any) => {
	            // 1. Hiển thị lên màn hình cho đẹp
	            form.value.customer = `${customer.name} - ${customer.phone}`;
	            
	            // 2. [QUAN TRỌNG] Lưu UID vào biến ẩn để lát gửi API Todo
	            form.value.customerUid = customer.uid; 
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
           loading, form, 
           // Member
           memberOptions, onMemberChange, currentAssigneeName,
           // Customer (Return biến mới)
           showCustomerModal, loadingCustomer, customerList, 
           openCustomerPopup, onCustomerSelect,
           // Action
           goBack, submitForm
       };
};