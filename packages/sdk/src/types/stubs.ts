// stub types for modules not yet implemented

export interface AdminModule {
    getStats(): Promise<any>
    listUsers(params?: any): Promise<any[]>
    updateUser(uid: string, data: any): Promise<any>
}

export interface MiningModule {
    getStats(): Promise<any>
    startMiner(): Promise<{ success: boolean }>
    stopMiner(): Promise<{ success: boolean }>
    getRewards(): Promise<any>
}

export interface MIAModule {
    getPredictions(): Promise<any[]>
    analyzeMarket(data: any): Promise<any>
}

export interface LotteryModule {
    getDraws(): Promise<any[]>
    buyTicket(drawId: string): Promise<{ success: boolean }>
    getMyTickets(): Promise<any[]>
    getResults(drawId: string): Promise<any>
}
