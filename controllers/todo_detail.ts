// src/controllers/todo_detail.ts
import { ref , nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { updateTodo , getTodoDetail , getTodoMessages , createTodoMessage ,deleteTodoMessage , getTodoMessageDetail, updateTodoMessage,reactionTodoMessage} from '@/api/todo';
import { getAllMembers } from '@/api/project';
import {  getCrmCustomerDetail , getCrmActionTimeline} from '@/api/crm'; // Import API CRM
import { mapTodoDetailToForm, type TodoDetailForm } from '@/models/todo_detail';
import { PROJECT_CODE, UID } from '@/utils/config';
import { TIMELINE_TYPE_MAP } from '@/utils/constants';
import { useAuthStore } from '@/stores/auth';
import { formatRelativeTime } from '@/utils/dateUtils';
interface CommentItem {
    id: number;
	senderId: string | number;
    senderName: string;
    senderAvatarChar: string; // Chữ cái đầu
	senderAvatarColor: string;
    message: string; // HTML content
    timeDisplay: string;
    actionText: string; // "thêm 1 bình luận"
    isEdited: boolean;
	type: string;
    reactions: any[]; // Mảng emoji
    children: CommentItem[]; // Bình luận con (Replies)
}

interface HistoryItem {
    id: number;
    timeStr: string;      // Giờ hiển thị (VD: 10:30 21/11)
    content: string;      // Nội dung tương tác (Tiếng Việt)
    actorName: string;    // Tên người thực hiện
    originalType: string; // Lưu loại gốc để icon nếu cần
}
export const useTodoDetailController = () => {
	const authStore = useAuthStore();
	
	const currentUserId = authStore.uid;
    const isLoading = ref(false);
    // State loading riêng cho phần khách hàng để UI mượt hơn
    const isLoadingCustomer = ref(false); 
    const isLoadingHistory = ref(false);
	const historyList = ref<HistoryItem[]>([]);
	
	const comments = ref<CommentItem[]>([]);
	const isLoadingComments = ref(false);
	
	const newCommentText = ref(''); 
	const isSubmittingComment = ref(false);
	
	
	const isConfirmDeleteCommentOpen = ref(false);
	const commentToDeleteId = ref<number | null>(null);
	
	const isEditingComment = ref(false); // Đang ở chế độ sửa hay không
	const editingMemberName = ref('');
	const isConfirmCancelEditOpen = ref(false); // Modal xác nhận hủy sửa
	    // Lưu tạm thông tin bình luận đang sửa để lát gửi lại API update
	const isReplying = ref(false); // Trạng thái đang trả lời
	const isConfirmCancelReplyOpen = ref(false); // Modal hủy trả lời
	const replyingCommentData = ref<any>(null); // Lưu object comment đang được trả lời
	const replyingMemberName = ref(''); // Tên người được trả lời
	
	const isEmojiPickerOpen = ref(false);
	const currentReactingComment = ref<any>(null);
	const emojiList = ['👍', '👎', '😍', '😆', '😱', '😭', '😤'];
	
	const commentFilterIndex = ref(0);
	const commentFilterOptions = ['Tất cả hoạt động', 'Bình luận'];
	const commentFilterValues = ['', 'COMMENT'];	
	
	const isSavingDescription = ref(false);
	
	const onSaveDescription = async () => {
	        // 1. Kiểm tra xem có data gốc không
	        if (!form.value.raw) {
	            uni.showToast({ title: 'Không tìm thấy dữ liệu gốc', icon: 'none' });
	            return;
	        }
	
	        isSavingDescription.value = true;
	
	        try {
	            // 2. Chuẩn bị payload
	            // Lấy toàn bộ data gốc (raw) đè lên bằng các trường thay đổi
	            const payload = {
	                ...form.value.raw, // Spread toàn bộ trường cũ (id, title, createdBy, status...)
	                
	                // Các trường bắt buộc thay đổi theo yêu cầu:
	                preFixCode: "TODO", 
	                description: form.value.desc, // Lấy nội dung từ Editor
	                files: "",
	                tagCodes: "",
	                
	                // Lưu ý: Nếu form.title bị sửa ở UI, bạn cũng nên update vào đây
	                title: form.value.title || form.value.raw.title,
	            };
	
	            console.log("Payload Update Todo:", payload);
	
	            // 3. Gọi API
	            const res = await updateTodo(payload);
	
	            if (res) {
	                uni.showToast({ title: 'Đã cập nhật mô tả', icon: 'success' });
	                // (Tuỳ chọn) Có thể gọi lại fetchDetail(form.value.id) nếu muốn reload mới nhất
	            }
	        } catch (error) {
	            console.error("Lỗi cập nhật công việc:", error);
	            uni.showToast({ title: 'Cập nhật thất bại', icon: 'none' });
	        } finally {
	            isSavingDescription.value = false;
	        }
	    };
	
	const onRequestReply = async (item: any) => {
	        // Reset các trạng thái khác nếu đang dở (ví dụ đang sửa)
	        isEditingComment.value = false; 
	        editingCommentData.value = null;
	        newCommentText.value = ''; // Reset text cũ
	
	        // Lưu dữ liệu comment đang được trả lời
	        replyingCommentData.value = item;
	        isReplying.value = true;
	
	        // Tìm tên người được trả lời (Logic giống phần Edit)
	        const senderId = item.senderId;
	        const foundMember = memberList.value.find(m => m.UID === senderId);
	        if (foundMember) {
	            replyingMemberName.value = foundMember.UserName;
	        } else {
	            replyingMemberName.value = 'Người dùng ẩn'; 
	        }
	
	        // Focus vào ô nhập liệu (Cần nextTick để UI kịp render)
	        await nextTick();
	        // Nếu cần scroll xuống ô input thì xử lý ở đây (tùy chọn)
	    };
	
	    // 2. Nhấn "Hủy" -> Mở modal xác nhận
	    const onCancelReply = () => {
	        // Nếu chưa nhập gì thì hủy luôn cho nhanh
	        if (!newCommentText.value.trim()) {
	            confirmCancelReply();
	        } else {
	            isConfirmCancelReplyOpen.value = true;
	        }
	    };
	
	    // 3. Xác nhận hủy trong modal
	    const confirmCancelReply = () => {
	        isConfirmCancelReplyOpen.value = false;
	        resetReplyState();
	    };
	
	    // 4. Tiếp tục trả lời (Đóng modal)
	    const continueReplying = () => {
	        isConfirmCancelReplyOpen.value = false;
	    };
	
	    // 5. Gửi trả lời (Gọi API Create)
	    const submitReply = async () => {
	        if (!newCommentText.value || !newCommentText.value.trim()) {
	            uni.showToast({ title: 'Vui lòng nhập nội dung', icon: 'none' });
	            return;
	        }
	        if (!replyingCommentData.value) return;
	
	        isSubmittingComment.value = true;
	
	        try {
	            const todoId = form.value.id;
	            const senderId = authStore.uid;
	            
	            // Payload trả lời (parentId là ID của comment gốc)
	            const payload = {
	                todoId: todoId,
	                senderId: senderId,
	                message: newCommentText.value,
	                files: "",
	                parentId: replyingCommentData.value.id // <--- QUAN TRỌNG: ID của comment cha
	            };
	
	            console.log(">> Gửi trả lời:", payload);
	
	            const res = await createTodoMessage(payload);
	
	            if (res) {
	                uni.showToast({ title: 'Đã trả lời', icon: 'success' });
	                resetReplyState();
	                await fetchComments(todoId);
	            }
	        } catch (error) {
	            console.error("Lỗi gửi trả lời:", error);
	            uni.showToast({ title: 'Gửi thất bại', icon: 'none' });
	        } finally {
	            isSubmittingComment.value = false;
	        }
	    };
	
	    // Hàm reset trạng thái reply
	    const resetReplyState = () => {
	        isReplying.value = false;
	        replyingCommentData.value = null;
	        replyingMemberName.value = '';
	        newCommentText.value = '';
	    };
	
	    // 1. Mở Picker
	    const onToggleEmojiPicker = (commentItem: any) => {
	        currentReactingComment.value = commentItem;
	        isEmojiPickerOpen.value = true;
	    };
	
	    // 2. Đóng Picker
	    const closeEmojiPicker = () => {
	        isEmojiPickerOpen.value = false;
	        currentReactingComment.value = null;
	    };
	
	    // 3. Chọn Emoji (Xử lý API sau)
	        const selectEmoji = async (emoji: string) => {
	            // Kiểm tra xem có đang chọn comment nào không
	            if (!currentReactingComment.value) return;
	    
	            // [QUAN TRỌNG] Lấy ID tin nhắn TRƯỚC KHI đóng modal (vì đóng modal sẽ reset biến này về null)
	            const messageId = currentReactingComment.value.id; 
	    
	            // Đóng modal ngay cho giao diện mượt
	            closeEmojiPicker();
	    
	            // Chuẩn bị dữ liệu
	            const todoId = form.value.id;          // ID của công việc hiện tại
	            const senderId = authStore.uid;        // ID của người đang thả tim (chính mình)
	            
	            // Payload theo yêu cầu
	            const payload = {
	                todoId: Number(todoId),      // Đảm bảo là số nếu API yêu cầu số
	                senderId: senderId,
	                todoMessageId: Number(messageId), // Dùng biến messageId đã lấy ở trên
	                codeEmoji: emoji
	            };
	    
	            console.log(">> Gửi Reaction:", payload);
	    
	            try {
	                // Gọi API
	                const res = await reactionTodoMessage(payload);
	                
	                // Kiểm tra kết quả
	                if (res) {
	                    uni.showToast({ title: 'Đã thả cảm xúc', icon: 'none' });
	                    
	                    // Gọi lại API lấy danh sách comment để cập nhật giao diện mới nhất
	                    await fetchComments(todoId);
	                }
	            } catch (error) {
	                console.error("Lỗi thả cảm xúc:", error);
	                uni.showToast({ title: 'Lỗi kết nối', icon: 'none' });
	            }
	        };
	    const editingCommentData = ref<{
	        id: number;
	        todoId: number;
	        senderId: string;
	    } | null>(null);
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
	
	const onRequestEditComment = async (commentId: number) => {
	        const todoId = form.value.id; 
	        if (!todoId) return;
	
	        uni.showLoading({ title: 'Đang tải...' });
	        
	        try {
	            // Gọi API lấy chi tiết
	            const res = await getTodoMessageDetail(commentId, todoId);
	            
	            console.log("API Response Detail:", res); // In ra để kiểm tra cấu trúc thực tế
	
	            if (res) {
	                // [QUAN TRỌNG] Xử lý lấy dữ liệu đúng cấp độ
	                // Kiểm tra xem dữ liệu nằm trực tiếp ở res hay nằm trong res.data
	                // Dựa theo JSON bạn gửi thì dữ liệu nằm trong 'data'
	                const dataDetail = res.data || res; 
	
	                editingCommentData.value = {
	                    id: dataDetail.id,
	                    todoId: dataDetail.todoId,
	                    senderId: dataDetail.senderId
	                };
					
					const senderId = dataDetail.senderId;
					                
					                // Tìm trong memberList xem ai có UID trùng với senderId
					                const foundMember = memberList.value.find(m => m.UID === senderId);
					                
					                if (foundMember) {
					                    editingMemberName.value = foundMember.UserName;
					                } else {
					                    // Fallback nếu không tìm thấy (thường là chính mình)
					                    editingMemberName.value = 'tôi'; 
					                }
	                // Lấy message từ dataDetail (chứ không phải từ res cấp ngoài cùng)
	                const content = dataDetail.message || '';
	                
	                console.log("Nội dung edit:", content);
	
	                // 1. Bật chế độ Edit để giao diện đổi sang input
	                isEditingComment.value = true;
	
	                // 2. Đợi Vue cập nhật DOM xong mới gán giá trị vào Editor
	                await nextTick();
	                
	                // 3. Gán giá trị
	                newCommentText.value = content;
	            }
	        } catch (error) {
	            console.error("Lỗi lấy chi tiết bình luận:", error);
	            uni.showToast({ title: 'Lỗi tải dữ liệu', icon: 'none' });
	        } finally {
	            uni.hideLoading();
	        }
	    };
		
	const submitUpdateComment = async () => {
	        if (!editingCommentData.value) return;
	        if (!newCommentText.value || !newCommentText.value.trim()) {
	            uni.showToast({ title: 'Nội dung không được để trống', icon: 'none' });
	            return;
	        }
	
	        isSubmittingComment.value = true;
	
	        try {
	            // Chuẩn bị payload theo yêu cầu
	            const payload = {
	                id: editingCommentData.value.id,
	                todoId: editingCommentData.value.todoId,
	                senderId: editingCommentData.value.senderId,
	                message: newCommentText.value,
	                files: "" // Tạm để trống
	            };
	
	            console.log("Payload Update:", payload);
	
	            // Gọi API Update
	            await updateTodoMessage(payload);
	
	            uni.showToast({ title: 'Đã cập nhật', icon: 'success' });
	
	            // Reset trạng thái về ban đầu
	            resetEditState();
	            
	            // Load lại danh sách
	            await fetchComments(form.value.id);
	
	        } catch (error) {
	            console.error("Lỗi cập nhật:", error);
	            uni.showToast({ title: 'Cập nhật thất bại', icon: 'none' });
	        } finally {
	            isSubmittingComment.value = false;
	        }
	    };
	
	    // 3. Nhấn "Hủy" -> Hiện Modal xác nhận
	    const onCancelEditComment = () => {
	        isConfirmCancelEditOpen.value = true;
	    };
	
	    // 4. Trong Modal hủy: Nhấn "Tiếp tục chỉnh sửa"
	    const continueEditing = () => {
	        isConfirmCancelEditOpen.value = false;
	    };
	
	    // 5. Trong Modal hủy: Nhấn "Có, hủy bỏ"
	    const confirmCancelEdit = async () => {
	        isConfirmCancelEditOpen.value = false;
	        
	        // Reset trạng thái
	        resetEditState();
	
	        // Gọi lại API list theo yêu cầu
	        if (form.value.id) {
	             await fetchComments(form.value.id);
	        }
	    };
	
	    // Hàm phụ: Reset state edit
	    const resetEditState = () => {
	            isEditingComment.value = false;
	            editingCommentData.value = null;
	            newCommentText.value = ''; 
	            editingMemberName.value = ''; // [MỚI] Reset tên
	        };
	const onRequestDeleteComment = (commentId: number) => {
	        commentToDeleteId.value = commentId;
	        isConfirmDeleteCommentOpen.value = true;
	    };
	const confirmDeleteComment = async () => {
	        if (!commentToDeleteId.value) return;
	        
	        // Đóng modal ngay cho mượt
	        isConfirmDeleteCommentOpen.value = false;
	        
	        try {
	            await deleteTodoMessage(commentToDeleteId.value);
	            uni.showToast({ title: 'Đã xóa', icon: 'success' });
	            
	            // Reload lại list comment
	            if (form.value.id) {
	                await fetchComments(form.value.id);
	            }
	        } catch (error) {
	            console.error("Lỗi xóa bình luận:", error);
	            uni.showToast({ title: 'Xóa thất bại', icon: 'none' });
	        } finally {
	            commentToDeleteId.value = null;
	        }
	    };
	
	    // [MỚI] Hàm hủy xóa
	    const cancelDeleteComment = () => {
	        isConfirmDeleteCommentOpen.value = false;
	        commentToDeleteId.value = null;
	    };
    const submitComment = async () => {
            // 1. Validate dữ liệu
            if (!newCommentText.value || !newCommentText.value.trim()) {
                uni.showToast({ title: 'Vui lòng nhập nội dung', icon: 'none' });
                return;
            }
    
            // 2. Bật loading
            isSubmittingComment.value = true;
    
            try {
                // 3. Chuẩn bị dữ liệu gửi đi
                // Lấy todoId từ form (đã được load từ trước)
                const todoId = form.value.id; 
                
                // Lấy senderId từ Auth Store (UID của user đang đăng nhập)
                const senderId = authStore.uid;
    
                const payload = {
                    todoId: todoId,
                    senderId: senderId,
                    message: newCommentText.value, // Nội dung từ editor
                    files: "", // Tạm thời rỗng
                    parentId: -1 // Mặc định là comment cha
                };
    
                console.log("Đang gửi bình luận:", payload);
    
                // 4. Gọi API tạo bình luận
                const res = await createTodoMessage(payload);
    
                // 5. Xử lý thành công
                if (res) {
                    uni.showToast({ title: 'Đã gửi bình luận', icon: 'success' });
                    
                    // Reset ô nhập liệu
                    newCommentText.value = ''; 
                    
                    // [QUAN TRỌNG] Gọi lại API lấy danh sách để cập nhật giao diện
                    // (Hàm fetchComments đã viết ở bước trước)
                    await fetchComments(todoId);
                }
    
            } catch (error) {
                console.error("Lỗi gửi bình luận:", error);
                uni.showToast({ title: 'Gửi thất bại', icon: 'none' });
            } finally {
                // Tắt loading
                isSubmittingComment.value = false;
            }
        };
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
				fetchComments(id);
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
const processCommentData = (item: any): CommentItem => {
        // 1. Map Sender Info
        let senderName = 'Người dùng ẩn';
        let avatarChar = '?';
        let avatarColor = '#e3f2fd';
        if (item.senderId) {
                // Tìm trong memberList
                const member = memberList.value.find(m => m.UID === item.senderId || m.memberUID === item.senderId);
                if (member) {
                    senderName = member.UserName;
                    // Lấy màu từ API, nếu không có thì giữ màu mặc định
                    if (member.AvatarColor) {
                        avatarColor = member.AvatarColor;
                    }
                }
            }
        avatarChar = senderName.charAt(0).toUpperCase();

        // 2. Xử lý hành động
        let actionText = '';
        if (item.type === 'COMMENT') actionText = 'đã thêm một bình luận';
        else if (item.type === 'LOG') actionText = 'đã cập nhật hoạt động';
		else if (item.type==='UPDATE_TODO') actionText = 'cập nhật thông tin công việc';
        
        // 3. Xử lý Reactions
        const reactionList = item.reactions?.details || [];

        return {
            id: item.id,
			senderId: item.senderId,
            senderName,
            senderAvatarChar: avatarChar,
			senderAvatarColor: avatarColor,
            message: item.message || '',
            timeDisplay: formatRelativeTime(item.createdAt),
            actionText,
            isEdited: !!item.updatedAt, // Nếu có updatedAt thì là đã sửa
			type: item.type,
            reactions: reactionList,
            children: [] // Sẽ map đệ quy nếu cần
        };
    };
	
	const fetchComments = async (todoId: string | number) => {
	        isLoadingComments.value = true;
	        try {
	            // Lấy giá trị keySearch dựa trên index đang chọn
	            const currentKeySearch = commentFilterValues[commentFilterIndex.value];
	            
	            // Gọi API với tham số keySearch mới
	            const rawData = await getTodoMessages(todoId, currentKeySearch);
	            
	            if (Array.isArray(rawData)) {
	                comments.value = rawData.map((parent: any) => {
	                    const parentComment = processCommentData(parent);
	                    if (parent.replies && parent.replies.length > 0) {
	                        parentComment.children = parent.replies.map((child: any) => processCommentData(child));
	                    }
	                    return parentComment;
	                });
	            } else {
	                // Nếu API lỗi hoặc rỗng thì reset mảng
	                comments.value = [];
	            }
	        } catch (error) {
	            console.error("Lỗi lấy bình luận:", error);
	        } finally {
	            isLoadingComments.value = false;
	        }
	    };
		const onCommentFilterChange = (e: any) => {
		        const newIndex = e.detail.value;
		        // Nếu chọn lại cái cũ thì không làm gì
		        if (commentFilterIndex.value === newIndex) return;
		
		        commentFilterIndex.value = newIndex;
		        
		        // Gọi lại API ngay lập tức nếu đã có todoId
		        if (form.value.id) {
		            fetchComments(form.value.id);
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
    const onStatusChange = async (e: any) => {
            // 1. Lấy index từ UI Picker
            const newIndex = parseInt(e.detail.value);
            
            // 2. Cập nhật UI ngay lập tức cho người dùng thấy
            form.value.statusIndex = newIndex;
    
            // 3. Ánh xạ Index -> API Value
            // Thứ tự UI: ['Chưa xử lý', 'Đang xử lý', 'Hoàn thành']
            const apiStatusValues = ['TO_DO', 'IN_PROGRESS', 'DONE'];
            const newStatus = apiStatusValues[newIndex];
    
            // 4. Kiểm tra dữ liệu gốc
            if (!form.value.raw) {
                uni.showToast({ title: 'Thiếu dữ liệu gốc', icon: 'none' });
                return;
            }
    
            // 5. Hiển thị loading
            uni.showLoading({ title: 'Đang cập nhật...' });
    
            try {
                // 6. Chuẩn bị payload (Giống hệt logic Save Description)
                const payload = {
                    ...form.value.raw, // Lấy toàn bộ dữ liệu cũ
                    
                    status: newStatus, // <-- Ghi đè trạng thái mới
                    
                    // Các trường bắt buộc theo API update
                    preFixCode: "TODO",
                    description: form.value.desc, // Lấy mô tả hiện tại (đề phòng người dùng đã sửa mô tả nhưng chưa bấm lưu)
                    files: "",
                    tagCodes: "",
                    
                    // Cập nhật title nếu có sửa
                    title: form.value.title || form.value.raw.title
                };
    
                console.log("Payload Update Status:", payload);
    
                // 7. Gọi API
                const res = await updateTodo(payload);
    
                if (res) {
                    uni.showToast({ title: 'Đã cập nhật trạng thái', icon: 'success' });
                    
                    // [QUAN TRỌNG] Cập nhật lại dữ liệu raw local để các lần lưu sau chính xác
                    form.value.raw.status = newStatus;
    
                    // Tải lại lịch sử để thấy log thay đổi trạng thái (nếu có)
                    if (form.value.customerCode) {
                        await fetchHistoryLog(form.value.customerCode);
                    }
                    // Tải lại comment (nếu hệ thống có bắn log vào comment)
                    await fetchComments(form.value.id);
                }
            } catch (error) {
                console.error("Lỗi cập nhật trạng thái:", error);
                // Nếu lỗi, có thể rollback lại statusIndex cũ nếu muốn (tùy chọn)
                uni.showToast({ title: 'Lỗi cập nhật', icon: 'none' });
            } finally {
                uni.hideLoading();
            }
        };
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
		onHistoryFilterChange,
		
		comments, isLoadingComments,
		newCommentText, isSubmittingComment,submitComment, 
		isConfirmDeleteCommentOpen,
		onRequestDeleteComment,
		confirmDeleteComment,
		cancelDeleteComment,
		currentUserId,
		
		isEditingComment,
		onRequestEditComment,
		submitUpdateComment,
		onCancelEditComment,
		isConfirmCancelEditOpen,
		continueEditing,
		confirmCancelEdit,
		editingMemberName,
		
		isEmojiPickerOpen,
		emojiList,
		onToggleEmojiPicker,
		closeEmojiPicker,
		selectEmoji,
		
		
		isReplying,
		isConfirmCancelReplyOpen,
		replyingCommentData,
		replyingMemberName,
		onRequestReply,
		onCancelReply,
		confirmCancelReply,
		continueReplying,
		submitReply,
		
		commentFilterIndex,
		commentFilterOptions,
		onCommentFilterChange,
		
		isSavingDescription,
		onSaveDescription,
	
    };
};