// models/create_todo.js

// Helper: Chuyển đổi ngày sang timestamp an toàn (Hỗ trợ cả YYYY-MM-DD và DD/MM/YYYY)
const dateToTimestamp = (dateStr) => {
    if (!dateStr) return -1;

    let dateObj;

    // Trường hợp 1: Định dạng ISO (YYYY-MM-DD...) do uni-datetime-picker trả về
    if (dateStr.includes('-')) {
        dateObj = new Date(dateStr);
    } 
    // Trường hợp 2: Định dạng VN (DD/MM/YYYY...) cũ
    else if (dateStr.includes('/')) {
        // Tách ngày và giờ (nếu có)
        const [dPart, tPart] = dateStr.split(' ');
        const [day, month, year] = dPart.split('/');
        // Chuyển về format ISO để new Date hiểu được trên iOS
        const isoStr = `${year}-${month}-${day}${tPart ? 'T' + tPart : ''}`;
        dateObj = new Date(isoStr);
    } else {
        dateObj = new Date(dateStr);
    }

    return isNaN(dateObj.getTime()) ? -1 : dateObj.getTime();
};

/**
 * Model: Xây dựng Payload để tạo công việc mới
 */
export const buildCreateTodoPayload = (form, config) => {
    return {
        // 1. Các trường Text cơ bản
        title: form.name,
        description: form.desc || "", 
        
        // 2. Các trường Config / System
        projectCode: config.projectCode,
        createdBy: config.uid,
        status: 'TO_DO',
        
        // 3. Enum & Loại
        links: 'CALL', 
        pluginType: 'test1', 
        
        // 4. Các trường Optional
        customerCode: form.customer || "test1", 
        assigneeId: form.assignee || "test1",    
        groupId: "test1",
        transId: "test1",
        tagCodes: "test1",
        groupMemberUid: "test1",
        files: "",
        phone: "072836272322",
        
        // 5. Các trường Thời gian
        dueDate: dateToTimestamp(form.dueDate),
        notificationReceivedAt: dateToTimestamp(form.notifyDate)
    };
};