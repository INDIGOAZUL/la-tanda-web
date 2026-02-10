// lottery type definitions
// aligned with La Tanda v3.92.0

export interface LotteryDraw {
    id: string
    group_id: string
    draw_date: string
    winner_id: string
    winner_name: string
    pool_amount: string
    status: 'pending' | 'completed' | 'cancelled'
}

export interface ParticipantSelection {
    user_id: string
    name: string
    weight: number
}

export interface DrawFilters {
    status?: 'pending' | 'completed' | 'cancelled'
    group_id?: string
    limit?: number
    offset?: number
}
