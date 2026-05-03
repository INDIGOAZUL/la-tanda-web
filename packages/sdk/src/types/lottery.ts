// Update for SDK Phase 3 - Lottery Deepen
// This file will track the new types for the expanded Lottery module.

export interface LotteryStats {
    total_spins: number
    correct_predictions: number
    accuracy_rate: number
    current_streak: number
    best_streak: number
}

/**
 * Game catalog types
 */
export interface LotteryGame {
    id: string
    name: string
    description: string
    price: number
    frequency: string // e.g., 'daily', 'weekly'
    next_draw: string
    is_active: boolean
    rules_url?: string
}

export interface LotteryDraw {
    id: string
    game_id: string
    draw_number: number
    draw_date: string
    winning_numbers?: number[]
    status: 'pending' | 'completed' | 'cancelled'
}

/**
 * Ticket management types
 */
export interface LotteryTicket {
    id: string
    user_id: string
    draw_id: string
    numbers: number[]
    purchase_date: string
    status: 'active' | 'won' | 'lost' | 'claimed'
    prize_amount?: number
}

export interface BuyTicketResponse {
    success: boolean
    ticket_ids: string[]
    total_cost: number
    balance_remaining: number
}

/**
 * Prediction and Picks types
 */
export interface Prediction {
    id: string
    user_id: string
    game_id: string
    numbers: number[]
    timestamp: string
    result?: 'hit' | 'miss'
}

export interface PredictorStats {
    user_id: string
    total_picks: number
    hits: number
    hit_rate: number
    rank: number
}

export interface MLPrediction {
    numbers: number[]
    confidence_score: number
    model_version: string
    generated_at: string
}

export interface EnsemblePrediction {
    numbers: number[]
    agreement_score: number
    source_models: string[]
    generated_at: string
}

export interface TablaJaladora {
    number: number
    pulls: number[]
    frequency: Record<number, number>
}

export interface AccuracyDashboard {
    daily_stats: Record<string, number>
    monthly_accuracy: number
    prediction_volume: number
    streak_history: number[]
}

/**
 * Legacy/Spin types (retained for compatibility if needed)
 */
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
