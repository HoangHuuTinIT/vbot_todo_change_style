export interface CrmFieldDefinition {
    id: number;
    code: string;
    uid: string;
    name: string;
    description: string;
    type: string; 
    isRequired: boolean;
    isUnique: boolean;
    number: number;
    options: any[];
    [key: string]: any;
}

export interface CrmCustomerFieldItem {
    id: number;
    name: string;
    code: string; 
    type: string;
    value: string;
    number: number;
    valueOption: any | null;
    [key: string]: any;
}

export interface CrmCustomer {
    id: number;
    uid: string;
    createAt?: number;
    customerFieldItems?: CrmCustomerFieldItem[]; 
    fields?: CrmCustomerFieldItem[]; 
}

export interface SearchCustomerPayload {
    page: number;
    size: number;
    fieldSearch: Array<{
        id: number;
        value: string;
        type: string;
        isSearch: boolean;
    }>;
}

export interface CrmTimelineItem {
    id: number;
    createAt: number;
    memberUid: string;
    dataOld: string; 
    param: string;  
    type: string; 
    typeSub: string; 
    content: string; 
    customerUid: string;
    customerId: number;
}