// tandas module - handles savings circles, member roles, and community contributions
// fully aligned with the v3.92.0 registration namespace

import { HttpClient } from '../utils/http'
import type {
    TandaGroup,
    TandaMember,
    CreateGroupData,
    GroupFilters,
    PayoutStats,
    TandaStatus,
    MemberRole
} from '../types/tandas'

export class TandasModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    /**
     * Retrieves a list of available public groups for recruitment.
     * @param filters - Optional filters like status, min/max amount, and pagination.
     * @returns A list of TandaGroup objects.
     */
    async listGroups(filters: GroupFilters = {}): Promise<TandaGroup[]> {
        return this._http.get<TandaGroup[]>('/groups/public', filters)
    }

    /**
     * Lists my personal tandas.
     */
    async listMyTandas(): Promise<TandaGroup[]> {
        return this._http.get<TandaGroup[]>('/tandas/my-tandas', {})
    }

    /**
     * Creates a new Tanda savings circle.
     * @param data - The configuration for the new group (name, amount, frequency, etc).
     * @returns The newly created TandaGroup.
     */
    async createGroup(data: CreateGroupData): Promise<TandaGroup> {
        return this._http.post<TandaGroup>('/registration/groups/create', data)
    }

    /**
     * Join an existing group.
     */
    async joinGroup(groupId: string): Promise<{ success: boolean }> {
        return this._http.post<{ success: boolean }>(`/registration/groups/join/${groupId}`)
    }

    /**
     * Leave a group.
     */
    async leaveGroup(groupId: string): Promise<{ success: boolean }> {
        return this._http.post<{ success: boolean }>(`/registration/groups/leave/${groupId}`)
    }

    /**
     * Get list of members in a group.
     */
    async getMembers(groupId: string): Promise<TandaMember[]> {
        const res = await this._http.post<any>('/registration/groups/details', { groupId })
        return res.members || []
    }

    /**
     * Get payout schedule and stats.
     */
    async getPayoutStats(groupId: string): Promise<PayoutStats> {
        const res = await this._http.post<any>('/registration/groups/details', { groupId })
        return res.payout_stats
    }

    /**
     * Contribute funds to the current round.
     * v3.92.0 uses /groups/:id/contribute.
     */
    async contribute(groupId: string, amount: string): Promise<{ success: boolean; transaction_id: string }> {
        return this._http.post(`/groups/${groupId}/contribute`, { amount })
    }

    /**
     * Update group status (Admin only).
     */
    async updateStatus(groupId: string, status: TandaStatus): Promise<TandaGroup> {
        return this._http.patch<TandaGroup>(`/registration/groups/${groupId}/status`, { status })
    }

    /**
     * Update a member's role (Admin only).
     */
    async updateMemberRole(groupId: string, userId: string, role: MemberRole): Promise<{ success: boolean }> {
        return this._http.patch<{ success: boolean }>(`/registration/groups/${groupId}/members/${userId}/role`, { role })
    }
}
