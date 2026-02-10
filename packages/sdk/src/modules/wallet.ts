// wallet module - handles balances, history, and bank withdrawals
// optimized for HNL / Lempira based community banking

import { HttpClient } from '../utils/http'
import type {
    WalletBalance,
    Transaction,
    TransactionFilters,
    PaymentProcessRequest,
    PaymentResponse,
    AssetType
} from '../types/wallet'

export class WalletModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    /**
     * Retrieves all asset balances for the currently authenticated user.
     * Typically includes HNL (Lempiras) and LMP/USD if configured.
     */
    async getBalances(): Promise<WalletBalance[]> {
        return this._http.get<WalletBalance[]>('/wallet/balance')
    }

    /**
     * Fetches transaction history using the Payments API.
     * Replaces legacy /wallet/transactions.
     */
    async getHistory(filters: TransactionFilters = {}): Promise<Transaction[]> {
        return this._http.post<Transaction[]>('/payments/history', filters)
    }

    /**
     * Processes a payment (transfer, withdrawal, or contribution).
     * Replaces legacy /wallet/withdraw.
     */
    async processPayment(req: PaymentProcessRequest): Promise<PaymentResponse> {
        return this._http.post<PaymentResponse>('/payments/process', req)
    }

    async getAvailableMethods(): Promise<any> {
        return this._http.get('/payments/methods/available')
    }

    // get a specific asset balance
    async getBalance(asset: AssetType = 'HNL'): Promise<string> {
        const res = await this.getBalances()
        const item = res.find(a => a.symbol === asset || a.asset === asset)
        return item ? item.amount : '0'
    }

    // Legacy method maintained for compatibility but using new API
    async getTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
        return this.getHistory(filters)
    }

    // Legacy method maintained for compatibility but using new API
    async withdraw(amount: string, destination: string, description?: string): Promise<PaymentResponse> {
        return this.processPayment({
            symbol: 'HNL',
            amount,
            destination,
            type: 'withdrawal',
            description
        })
    }
}
