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
    SharePredictionData
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
}
