// lottery module - Honduras national lottery number prediction engine
// aligned with La Tanda v4.3.1
// NOTE: This is NOT a tanda draw system. Tanda turn selection (tombola)
// lives under Groups: POST /groups/:id/lottery-live

import { HttpClient } from '../utils/http'
import type {
    LotteryStats,
    SpinResult,
    SpinHistory,
    LotteryResult,
    LeaderboardEntry,
    Achievement,
    Jalador,
    SharePredictionData,
    ActiveGame,
    GameDetail,
    DrawRound,
    Ticket,
    BuyTicketData,
    ClaimWinningsResult,
    Prediction,
    SubmitPredictionData
} from '../types/lottery'

export class LotteryModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    /**
     * Gets prediction statistics for the current user.
     */
    async getStats(): Promise<LotteryStats> {
        return this._http.get<LotteryStats>('/lottery/stats')
    }

    /**
     * Executes a paid prediction spin.
     */
    async spin(): Promise<SpinResult> {
        return this._http.post<SpinResult>('/lottery/spin')
    }

    /**
     * Executes a free trial prediction spin.
     */
    async trialSpin(): Promise<SpinResult> {
        return this._http.post<SpinResult>('/lottery/trial-spin')
    }

    /**
     * Gets the user's spin history.
     */
    async getHistory(): Promise<SpinHistory[]> {
        return this._http.get<SpinHistory[]>('/lottery/history')
    }

    /**
     * Gets the latest real Honduras national lottery results.
     */
    async getResults(): Promise<LotteryResult[]> {
        return this._http.get<LotteryResult[]>('/lottery/results')
    }

    /**
     * Gets the prediction leaderboard.
     */
    async getLeaderboard(): Promise<LeaderboardEntry[]> {
        return this._http.get<LeaderboardEntry[]>('/lottery/leaderboard')
    }

    /**
     * Gets user achievements in the prediction game.
     */
    async getAchievements(): Promise<Achievement[]> {
        return this._http.get<Achievement[]>('/lottery/achievements')
    }

    /**
     * Gets "jaladores" — popular pulling numbers lookup.
     */
    async getJaladores(): Promise<Jalador[]> {
        return this._http.get<Jalador[]>('/lottery/jaladores')
    }

    /**
     * Gets the lottery-specific social feed.
     */
    async getSocialFeed(): Promise<any[]> {
        return this._http.get('/lottery/social-feed')
    }

    /**
     * Shares a prediction to the lottery social feed.
     */
    async sharePrediction(data: SharePredictionData): Promise<{ success: boolean }> {
        return this._http.post<{ success: boolean }>('/lottery/share-prediction', data)
    }

    // --- Phase 3 Additions ---

    /**
     * Game Catalog: list active games
     */
    async getActiveGames(): Promise<ActiveGame[]> {
        return this._http.get<ActiveGame[]>('/lottery/games/active')
    }

    /**
     * Game Catalog: get game detail
     */
    async getGameDetail(gameId: string): Promise<GameDetail> {
        return this._http.get<GameDetail>(`/lottery/games/${gameId}`)
    }

    /**
     * Game Catalog: list draws/rounds
     */
    async getDraws(gameId: string): Promise<DrawRound[]> {
        return this._http.get<DrawRound[]>(`/lottery/games/${gameId}/draws`)
    }

    /**
     * Tickets: buy ticket(s)
     */
    async buyTicket(data: BuyTicketData): Promise<Ticket> {
        return this._http.post<Ticket>('/lottery/tickets/buy', data)
    }

    /**
     * Tickets: list user tickets
     */
    async getUserTickets(): Promise<Ticket[]> {
        return this._http.get<Ticket[]>('/lottery/tickets')
    }

    /**
     * Tickets: get ticket detail
     */
    async getTicketDetail(ticketId: string): Promise<Ticket> {
        return this._http.get<Ticket>(`/lottery/tickets/${ticketId}`)
    }

    /**
     * Tickets: claim winnings
     */
    async claimWinnings(ticketId: string): Promise<ClaimWinningsResult> {
        return this._http.post<ClaimWinningsResult>(`/lottery/tickets/${ticketId}/claim`)
    }

    /**
     * Predictions: submit prediction
     */
    async submitPrediction(data: SubmitPredictionData): Promise<Prediction> {
        return this._http.post<Prediction>('/lottery/predictions', data)
    }

    /**
     * Predictions: list user predictions
     */
    async getUserPredictions(): Promise<Prediction[]> {
        return this._http.get<Prediction[]>('/lottery/predictions')
    }

    /**
     * Predictions: prediction history
     */
    async getPredictionHistory(): Promise<Prediction[]> {
        return this._http.get<Prediction[]>('/lottery/predictions/history')
    }

    /**
     * Predictions: hit-rate stats
     */
    async getHitRateStats(): Promise<LotteryStats> {
        return this._http.get<LotteryStats>('/lottery/predictions/stats')
    }

    /**
     * Leaderboard: per-game leaderboards
     */
    async getGameLeaderboard(gameId: string): Promise<LeaderboardEntry[]> {
        return this._http.get<LeaderboardEntry[]>(`/lottery/games/${gameId}/leaderboard`)
    }
}
