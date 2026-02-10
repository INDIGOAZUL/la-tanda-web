// lottery module - handles fair member selection using cryptographically secure entropy
// aligned with La Tanda v3.92.0

import { HttpClient } from '../utils/http'
import type {
    LotteryDraw,
    DrawFilters,
    ParticipantSelection
} from '../types/lottery'

export class LotteryModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    /**
     * Lists recent and upcoming lottery draws for saving circles.
     * @param filters - Optional filters like status and group_id.
     */
    async listDraws(filters: DrawFilters = {}): Promise<LotteryDraw[]> {
        return this._http.get<LotteryDraw[]>('/lottery/draws', filters)
    }

    /**
     * Triggers a fair selection draw for a group to determine the payout order.
     * v3.92.0 uses crypto.randomInt on the backend for this.
     * @param groupId - The ID of the Tanda group.
     */
    async performDraw(groupId: string): Promise<LotteryDraw> {
        return this._http.post<LotteryDraw>(`/lottery/draws/perform`, { group_id: groupId })
    }

    /**
     * Gets the current selection weights for a group.
     */
    async getWeights(groupId: string): Promise<ParticipantSelection[]> {
        return this._http.get<ParticipantSelection[]>(`/lottery/groups/${groupId}/weights`)
    }

    /**
     * Get details of a specific draw.
     */
    async getDrawDetails(drawId: string): Promise<LotteryDraw> {
        return this._http.get<LotteryDraw>(`/lottery/draws/${drawId}`)
    }
}
