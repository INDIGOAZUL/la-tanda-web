// stub types for modules not yet fully implemented
// aligned with La Tanda v4.3.1

export interface AdminModule {
    getStats(): Promise<any>
    listUsers(params?: any): Promise<any[]>
    updateUserStatus(uid: string, status: string): Promise<any>
}

export interface MiningModule {
    getStatus(): Promise<any>
    claim(): Promise<{ success: boolean }>
}

export interface MIAModule {
    chat(message: string): Promise<any>
    getStatus(): Promise<any>
}
