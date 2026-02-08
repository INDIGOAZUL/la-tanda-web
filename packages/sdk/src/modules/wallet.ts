// wallet module - handles all the money stuff: balances, transfers, and tanda locks

import { HttpClient } from '../utils/http'
import type {
    WalletBalances,
    Transaction,
    TransactionFilters,
    SendFundsRequest,
    LockFundsRequest,
    GasEstimate,
    AssetType
} from '../types/wallet'

export class WalletModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    // get all balances for the current user
    async getBalances(): Promise<WalletBalances> {
        return this._http.get<WalletBalances>('/wallet/balance')
    }

    // get a specific asset balance
    async getBalance(asset: AssetType): Promise<string> {
        const res = await this.getBalances()
        const item = res.assets.find(a => a.asset === asset)
        return item ? item.amount : '0'
    }

    // list recent wallet activity
    async getTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
        return this._http.get<Transaction[]>('/wallet/transactions', { body: filters })
    }

    // send funds to another address or user
    async send(data: SendFundsRequest): Promise<Transaction> {
        return this._http.post<Transaction>('/wallet/send', data)
    }

    // get our public deposit address
    async getReceiveAddress(asset: AssetType = 'LTD'): Promise<string> {
        const res = await this._http.get<{ address: string }>('/wallet/receive', {
            body: { asset }
        })
        return res.address
    }

    // lock funds to join a tanda group
    async lockFunds(data: LockFundsRequest): Promise<{ success: boolean; tx_id: string }> {
        return this._http.post('/wallet/security/lock', data)
    }

    // unlock funds (may fail if tanda is active)
    async unlockFunds(lockId: string): Promise<{ success: boolean }> {
        return this._http.post(`/wallet/security/unlock/${lockId}`)
    }

    // estimate gas for a transfer
    async estimateGas(asset: AssetType, amount: string, to: string): Promise<GasEstimate> {
        return this._http.get<GasEstimate>('/wallet/gas-estimate', {
            body: { asset, amount, to }
        })
    }

    // connect an external wallet address
    async connectExternal(address: string, signature: string): Promise<{ success: boolean }> {
        return this._http.post('/wallet/connect', { address, signature })
    }

    // swap between assets
    async swap(from: AssetType, to: AssetType, amount: string): Promise<Transaction> {
        return this._http.post<Transaction>('/wallet/swap', { from, to, amount })
    }
}
