// wallet type definitions
// aligned with La Tanda v3.92.0 (HNL / Bank based system)

export type AssetSymbol = 'HNL' | 'LMP' | 'USD'
export type AssetType = AssetSymbol // for compatibility

export interface WalletBalance {
    symbol: AssetSymbol
    asset: AssetSymbol // compatibility
    amount: string
    total_hnl: string
    available: string
    locked: string
}

export interface Transaction {
    id: string
    type: 'deposit' | 'withdrawal' | 'contribution' | 'payout' | 'transfer'
    symbol: AssetSymbol
    amount: string
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
    timestamp: string
    description?: string
    fee?: string
}

export interface PaymentProcessRequest {
    symbol: AssetSymbol
    amount: string
    destination: string
    type: 'transfer' | 'withdrawal' | 'contribution'
    description?: string
}

export interface PaymentResponse {
    success: boolean
    transaction_id: string
    status: string
}

export interface TransactionFilters {
    type?: string
    symbol?: string
    status?: string
    limit?: number
    offset?: number
}
