// wallet types - balances, history and transfers

export type AssetType = 'LTD' | 'USDT' | 'ETH' | 'POL'

export interface BalanceInfo {
    asset: AssetType
    amount: string
    formatted: string
    usd_value?: number
}

export interface WalletBalances {
    total_usd: number
    assets: BalanceInfo[]
}

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'
export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'tanda_lock' | 'tanda_payout'

export interface Transaction {
    id: string
    hash?: string
    type: TransactionType
    status: TransactionStatus
    asset: AssetType
    amount: string
    fee?: string
    from_address?: string
    to_address?: string
    timestamp: string
    metadata?: Record<string, any>
}

export interface TransactionFilters {
    asset?: AssetType
    type?: TransactionType
    limit?: number
    offset?: number
}

export interface SendFundsRequest {
    to_address: string
    asset: AssetType
    amount: string
    memo?: string
}

export interface LockFundsRequest {
    group_id: string
    tanda_id: string
    amount: string
}

export interface GasEstimate {
    gas_price: string
    estimated_fee: string
    asset: AssetType
}
