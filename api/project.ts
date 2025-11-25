// api/project.ts
import { useAuthStore } from '@/stores/auth';
import { PROJECT_API_URL } from '@/utils/config';
interface ProjectMember {
    UserName: string;
    memberUID: string;
	UID: string;       
	AvatarColor: string;
}

export const getAllMembers = (): Promise<ProjectMember[]> => {
    const authStore = useAuthStore();
    const { rootToken, projectCode } = authStore;

    return new Promise((resolve, reject) => {
        uni.request({
            url: `${PROJECT_API_URL}/getAllMember`,
            method: 'GET',
            data: {
                projectCode: projectCode,
                status: 'all'
            },
            header: {
                'Authorization': `Bearer ${rootToken}`,
                'Content-Type': 'application/json'
            },
            success: (res: UniApp.RequestSuccessCallbackResult) => {
                const body = res.data as any;
                if (body.status === 1 && body.data) {
                    resolve(body.data as ProjectMember[]);
                } else {
                    reject(body.message || 'Lỗi lấy danh sách thành viên');
                }
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
};