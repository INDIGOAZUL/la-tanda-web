// wallet module - handles balances, history, and bank withdrawals
// aligned with La Tanda v3.92.0 (HNL / Bank based system)

import { HttpClient } from '../utils/http'
import type {
    WalletBalances,
    Transaction,
    TransactionFilters,
    WithdrawalRequest,
    WithdrawalResponse,
    AssetType
} from '../types/wallet'

export class WalletModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    // get all balances for the current user (HNL, LTD)
    async getBalances(): Promise<WalletBalances> {
        return this._http.get<WalletBalances>('/wallet/balance')
    }

    // get a specific asset balance
    async getBalance(asset: AssetType = 'HNL'): Promise<string> {
        const res = await this.getBalances()
        const item = res.assets.find(a => a.asset === asset)
        return item ? item.amount : '0'
    }

    // list recent wallet activity (deposits, withdrawals, contributions, payouts)
    async getTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
        // Fix: pass filters directly to avoid double-wrapping bug
        return this._http.get<Transaction[]>('/wallet/transactions', filters)
    }

    // withdraw funds to a bank account
    async withdraw(data: WithdrawalRequest): Promise<WithdrawalResponse> {
        return this._http.post<WithdrawalResponse>('/wallet/withdraw', data)
    }
}
