// tandas/groups types - for managing community saving circles

export type TandaStatus = 'recruiting' | 'active' | 'payout_phase' | 'completed' | 'cancelled'
export type MemberRole = 'leader' | 'member' | 'observer'

export interface TandaGroup {
    id: string
    name: string
    description?: string
    creator_id: string
    status: TandaStatus
    max_members: number
    member_count: number
    contribution_amount: string
    currency: string
    frequency: 'daily' | 'weekly' | 'monthly'
    next_payout_date?: string
    created_at: string
}

export interface TandaMember {
    user_id: string
    user_name: string
    role: MemberRole
    joined_at: string
    contribution_status: 'paid' | 'pending' | 'late'
    payout_turn?: number
}

export interface CreateGroupData {
    name: string
    description?: string
    max_members: number
    contribution_amount: string
    currency?: string
    frequency: 'daily' | 'weekly' | 'monthly'
}

export interface GroupFilters {
    status?: TandaStatus
    search?: string
    limit?: number
    offset?: number
}

export interface PayoutStats {
    total_payout: string
    next_payout_amount: string
    my_turn?: number
    current_turn: number
}
