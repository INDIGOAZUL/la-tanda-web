// wallet module - handles HNL balances, payments, withdrawals, and PIN security
// aligned with La Tanda v4.3.1

import { HttpClient } from '../utils/http'
import type {
    WalletBalance,
    Transaction,
    TransactionFilters,
    PaymentProcessRequest,
    PaymentResponse,
    BankWithdrawRequest,
    MobileWithdrawRequest,
    WithdrawalRecord,
    PinStatus
} from '../types/wallet'

export class WalletModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    /**
     * Retrieves the user's HNL (Lempira) balance.
     * La Tanda uses a single-currency system.
     */
    async getBalance(): Promise<WalletBalance> {
        return this._http.get<WalletBalance>('/wallet/balance')
    }

    /**
     * Alias for getBalance() — kept for backwards compatibility.
     */
    async getBalances(): Promise<WalletBalance> {
        return this.getBalance()
    }

    /**
     * Fetches payment/transaction history.
     * Filters are sent as query params (GET request).
     */
    async getHistory(filters: TransactionFilters = {}): Promise<Transaction[]> {
        return this._http.get<Transaction[]>('/payments/history', filters)
    }

    /**
     * Processes a payment (transfer, withdrawal, or contribution).
     */
    async processPayment(req: PaymentProcessRequest): Promise<PaymentResponse> {
        return this._http.post<PaymentResponse>('/payments/process', req)
    }

    /**
     * Lists available payment methods for the user.
     */
    async getAvailableMethods(): Promise<any> {
        return this._http.post('/payments/methods/available')
    }

    // --- Withdrawals ---

    /**
     * Lists all past withdrawal records.
     */
    async listWithdrawals(): Promise<WithdrawalRecord[]> {
        return this._http.get<WithdrawalRecord[]>('/wallet/withdrawals')
    }

    /**
     * Initiates a withdrawal to a bank account.
     */
    async withdrawToBank(data: BankWithdrawRequest): Promise<PaymentResponse> {
        return this._http.post<PaymentResponse>('/wallet/withdraw/bank', data)
    }

    /**
     * Initiates a withdrawal to mobile money (Tigo Money, etc).
     */
    async withdrawToMobile(data: MobileWithdrawRequest): Promise<PaymentResponse> {
        return this._http.post<PaymentResponse>('/wallet/withdraw/mobile', data)
    }

    // --- Wallet PIN Security ---

    /**
     * Sets the user's wallet PIN for transaction authorization.
     */
    async setPin(pin: string): Promise<{ success: boolean }> {
        return this._http.post('/wallet/pin/set', { pin })
    }

    /**
     * Verifies the user's wallet PIN before a sensitive operation.
     */
    async verifyPin(pin: string): Promise<{ verified: boolean }> {
        return this._http.post('/wallet/pin/verify', { pin })
    }

    /**
     * Checks whether the user has set up a wallet PIN.
     */
    async getPinStatus(): Promise<PinStatus> {
        return this._http.get<PinStatus>('/wallet/pin/status')
    }

    // --- Legacy Compatibility ---

    /** @deprecated Use getHistory() instead. */
    async getTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
        return this.getHistory(filters)
    }

    /** @deprecated Use withdrawToBank() or withdrawToMobile() instead. */
    async withdraw(amount: string, destination: string, description?: string): Promise<PaymentResponse> {
        return this.processPayment({
            amount,
            destination,
            type: 'withdrawal',
            description
        })
    }
}
