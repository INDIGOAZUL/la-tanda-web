// lottery type definitions
// aligned with La Tanda v4.3.1
// Honduras national lottery prediction engine types

export interface LotteryStats {
    total_spins: number
    correct_predictions: number
    accuracy_rate: number
    current_streak: number
    best_streak: number
}

export interface SpinResult {
    predicted_numbers: number[]
    spin_type: 'paid' | 'trial'
    timestamp: string
    credits_remaining?: number
}

export interface SpinHistory {
    id: string
    predicted_numbers: number[]
    actual_numbers?: number[]
    matched: number
    spin_type: 'paid' | 'trial'
    timestamp: string
}

export interface LotteryResult {
    draw_date: string
    winning_numbers: number[]
    draw_type: string
    prize_info?: Record<string, any>
}

export interface LeaderboardEntry {
    user_id: string
    username: string
    accuracy_rate: number
    total_spins: number
    rank: number
}

export interface Achievement {
    id: string
    name: string
    description: string
    earned: boolean
    earned_at?: string
    icon?: string
}

export interface Jalador {
    number: number
    frequency: number
    last_drawn?: string
}

export interface SharePredictionData {
    prediction_id: string
    message?: string
}
