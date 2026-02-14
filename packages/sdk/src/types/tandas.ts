// tandas type definitions
// aligned with La Tanda v4.3.1

export type TandaStatus = 'pending' | 'active' | 'completed' | 'recruiting' | 'cancelled' | 'closed'
export type MemberStatus = 'pending' | 'active' | 'payout_received' | 'defaulted'
export type MemberRole = 'admin' | 'member' | 'auditor'

export interface TandaGroup {
    id: string
    name: string
    description?: string
    contribution_amount: string
    currency: string
    frequency: 'weekly' | 'biweekly' | 'monthly'
    max_members: number
    current_members: number
    status: TandaStatus
    start_date?: string
    is_private: boolean
    admin_id?: string
}

export interface TandaMember {
    user_id: string
    name: string
    status: MemberStatus
    role: MemberRole
    joined_at: string
    payout_order?: number
    total_contributed: string
}

export interface CreateGroupData {
    name: string
    description?: string
    contribution_amount: string
    frequency: 'weekly' | 'biweekly' | 'monthly'
    max_members: number
    is_private?: boolean
}

export interface GroupFilters {
    status?: TandaStatus
    min_amount?: string
    max_amount?: string
    limit?: number
    offset?: number
}

export interface GroupStats {
    total_pool: string
    next_payout_date: string
    next_receiver_name: string
    current_round: number
    total_rounds: number
    participation_rate?: number
}
