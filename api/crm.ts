import { request } from '@/utils/request';
import { SYSTEM_CONFIG } from '@/utils/enums';
import { useAuthStore } from '@/stores/auth';
import { CRM_API_URL } from '@/utils/config';
import type { ApiResponse } from '@/types/common';
import type { TokenData } from '@/types/Auth';
import type { 
    CrmFieldDefinition, 
    CrmCustomer, 
    SearchCustomerPayload, 
    CrmTimelineItem 
} from '@/types/CRM';

export const getCrmToken = (projectCode: string, uid: string): Promise<string> => {
    const authStore = useAuthStore();
    return request<TokenData>({
        url: `${CRM_API_URL}/token`,
        method: 'GET',
        data: {
            projectCode,
            uid,
            type: 'CRM',
            source: SYSTEM_CONFIG.SOURCE_PARAM
        },
        header: {
            'Authorization': `Bearer ${authStore.rootToken}`
        }
    }).then(data => data.token); 
};

export const getCrmFieldSearch = (crmToken: string): Promise<CrmFieldDefinition[]> => {
    return request<CrmFieldDefinition[]>({
        url: `${CRM_API_URL}/Customer/getAllFieldSearch`,
        method: 'POST',
        data: {},
        header: { 'Authorization': `Bearer ${crmToken}` }
    });
};

export const getCrmCustomers = (crmToken: string, body: SearchCustomerPayload): Promise<CrmCustomer[]> => {
    return request<CrmCustomer[]>({
        url: `${CRM_API_URL}/Customer/getAll`,
        method: 'POST',
        data: body,
        header: { 'Authorization': `Bearer ${crmToken}` }
    });
};

export const getCrmCustomerDetail = (crmToken: string, customerUid: string): Promise<CrmCustomer> => {
    return request<CrmCustomer>({
        url: `${CRM_API_URL}/Customer/getDetail`,
        method: 'GET',
        data: { uid: customerUid },
        header: { 'Authorization': `Bearer ${crmToken}` }
    });
};

export const getCrmActionTimeline = (crmToken: string, customerUid: string, type: string = 'ALL'): Promise<CrmTimelineItem[]> => {
    return request<CrmTimelineItem[]>({
        url: `${CRM_API_URL}/ActionTimeline/getAll?from=-1&to=-1&customerUid=${customerUid}&type=${type}&page=1&size=10&memberUid=&projectCode=`,
        method: 'GET',
        header: { 'Authorization': `Bearer ${crmToken}` }
    });
};