// wallet type definitions
// aligned with La Tanda v4.3.1 (HNL single-currency system)

export interface WalletBalance {
    amount: string
    available: string
    locked: string
    currency: string
}

export interface Transaction {
    id: string
    type: 'deposit' | 'withdrawal' | 'contribution' | 'payout' | 'transfer'
    amount: string
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
    timestamp: string
    description?: string
    fee?: string
}

export interface PaymentProcessRequest {
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
    status?: string
    limit?: number
    offset?: number
}

export interface BankWithdrawRequest {
    amount: string
    bank_name: string
    account_number: string
    account_holder: string
    description?: string
}

export interface MobileWithdrawRequest {
    amount: string
    phone_number: string
    provider: string
    description?: string
}

export interface WithdrawalRecord {
    id: string
    amount: string
    method: 'bank' | 'mobile'
    status: 'pending' | 'completed' | 'failed'
    created_at: string
    details: Record<string, any>
}

export interface PinStatus {
    has_pin: boolean
    last_changed?: string
}
