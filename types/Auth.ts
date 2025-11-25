export interface TokenData {
    token: string;
    refreshToken: string;
    tokenType: string;
}

export interface GetTokenParams {
    projectCode: string;
    uid: string;
    type: 'TODO' | 'CRM';
    source: string; 
}