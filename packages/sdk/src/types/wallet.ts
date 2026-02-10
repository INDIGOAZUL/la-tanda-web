// wallet types - balances, history and withdrawals
// aligned with La Tanda v3.92.0 (HNL / Bank based system)

export type AssetType = 'HNL' | 'LTD' // LTD is internal points, HNL is main currency

export interface BalanceInfo {
    asset: AssetType
    amount: string
    formatted: string
}

export interface WalletBalances {
    total_hnl: string
    assets: BalanceInfo[]
}

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'
export type TransactionType = 'deposit' | 'withdrawal' | 'contribution' | 'payout'

export interface Transaction {
    id: string
    type: TransactionType
    status: TransactionStatus
    asset: AssetType
    amount: string
    fee?: string
    timestamp: string
    description?: string
    metadata?: Record<string, any>
}

export interface TransactionFilters {
    asset?: AssetType
    type?: TransactionType
    limit?: number
    offset?: number
}

export interface WithdrawalRequest {
    bank_name: string
    account_number: string
    account_holder: string
    amount: string
    memo?: string
}

export interface WithdrawalResponse {
    id: string
    status: TransactionStatus
    estimated_arrival?: string
}
