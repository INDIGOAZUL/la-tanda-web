// SDK Phase 3 - Extended Lottery Module
// This module covers the full set of public lottery endpoints.
// Authoritative source: https://latanda.online/api/lottery/*

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
    LotteryGame,
    LotteryDraw,
    LotteryTicket,
    BuyTicketResponse,
    Prediction,
    PredictorStats
} from '../types/lottery'

export class LotteryModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    // --- Section A: Game Catalog ---

    /**
     * Lists all active lottery games available in the system.
     */
    async listGames(): Promise<LotteryGame[]> {
        return this._http.get<LotteryGame[]>('/lottery/games')
    }

    /**
     * Gets detailed information about a specific lottery game.
     * @param gameId The unique identifier of the game.
     */
    async getGameDetail(gameId: string): Promise<LotteryGame> {
        return this._http.get<LotteryGame>(`/lottery/games/${gameId}`)
    }

    /**
     * Lists draws/rounds for a specific game.
     * @param gameId The unique identifier of the game.
     */
    async listDraws(gameId: string): Promise<LotteryDraw[]> {
        return this._http.get<LotteryDraw[]>(`/lottery/games/${gameId}/draws`)
    }

    // --- Section B: Tickets ---

    /**
     * Purchases tickets for a specific lottery draw.
     * @param drawId The unique identifier of the draw.
     * @param numbers Array of number sets to purchase.
     */
    async buyTickets(drawId: string, numbers: number[][]): Promise<BuyTicketResponse> {
        return this._http.post<BuyTicketResponse>('/lottery/tickets/buy', { draw_id: drawId, numbers })
    }

    /**
     * Lists all tickets purchased by the current user.
     */
    async listUserTickets(): Promise<LotteryTicket[]> {
        return this._http.get<LotteryTicket[]>('/lottery/tickets/me')
    }

    /**
     * Gets details for a specific ticket.
     * @param ticketId The unique identifier of the ticket.
     */
    async getTicketDetail(ticketId: string): Promise<LotteryTicket> {
        return this._http.get<LotteryTicket>(`/lottery/tickets/${ticketId}`)
    }

    /**
     * Claims winnings for a specific ticket.
     * @param ticketId The unique identifier of the winning ticket.
     */
    async claimWinnings(ticketId: string): Promise<{ success: boolean; amount: number }> {
        return this._http.post<{ success: boolean; amount: number }>(`/lottery/tickets/${ticketId}/claim`)
    }

    // --- Section C: Predictions / Picks ---

    /**
     * Submits a new prediction/pick for a game.
     * @param gameId The unique identifier of the game.
     * @param numbers The numbers being predicted.
     */
    async submitPrediction(gameId: string, numbers: number[]): Promise<Prediction> {
        return this._http.post<Prediction>('/lottery/predictions', { game_id: gameId, numbers })
    }

    /**
     * Lists predictions made by the current user.
     */
    async listUserPredictions(): Promise<Prediction[]> {
        return this._http.get<Prediction[]>('/lottery/predictions/me')
    }

    /**
     * Gets prediction stats for the current user.
     */
    async getPredictorStats(): Promise<PredictorStats> {
        return this._http.get<PredictorStats>('/lottery/predictor/stats')
    }

    // --- Section D: Legacy & Social (Phase 1/2) ---

    /**
     * Gets general prediction statistics for the current user.
     * @deprecated Use getPredictorStats for more detailed data.
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
}
