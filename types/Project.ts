export interface ProjectMember {
    Id: number;
    UID: string;
    UserId: string | null;
    UserName: string;
    Avatar: string | null;
    AvatarColor: string;
    Code: string;
    Phone: string | null;
    Status: number;
    memberNo: string | null;
    memberUID: string; 
    [key: string]: any; 
}