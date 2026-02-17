// tandas module - handles savings circles, group management, and contributions
// aligned with La Tanda v4.3.1

import { HttpClient } from '../utils/http'
import { validateId } from '../utils/validation'
import type {
    TandaGroup,
    TandaMember,
    CreateGroupData,
    GroupFilters,
    GroupStats,
    TandaStatus,
    MemberRole
} from '../types/tandas'

export class TandasModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    /**
     * Lists publicly available groups for recruitment.
     */
    async listGroups(filters: GroupFilters = {}): Promise<TandaGroup[]> {
        return this._http.get<TandaGroup[]>('/groups/public-pg', filters)
    }

    /**
     * Lists the authenticated user's personal tandas.
     */
    async listMyTandas(): Promise<TandaGroup[]> {
        return this._http.get<TandaGroup[]>('/tandas/my-tandas')
    }

    /**
     * Creates a new Tanda savings circle.
     */
    async createGroup(data: CreateGroupData): Promise<TandaGroup> {
        return this._http.post<TandaGroup>('/registration/groups/create', data)
    }

    /**
     * Gets full details for a specific group.
     */
    async getGroupDetails(groupId: string): Promise<TandaGroup> {
        validateId(groupId, 'groupId')
        return this._http.get<TandaGroup>(`/groups/${groupId}`)
    }

    /**
     * Joins an existing group.
     */
    async joinGroup(groupId: string): Promise<{ success: boolean }> {
        validateId(groupId, 'groupId')
        return this._http.post<{ success: boolean }>(`/groups/${groupId}/join`)
    }

    /**
     * Removes a member from a group (also used to leave a group).
     * To leave: pass your own userId.
     */
    async removeMember(groupId: string, userId: string): Promise<{ success: boolean }> {
        validateId(groupId, 'groupId')
        validateId(userId, 'userId')
        return this._http.delete<{ success: boolean }>(`/groups/${groupId}/members/${userId}`)
    }

    /**
     * Gets the list of members in a group.
     */
    async getMembers(groupId: string): Promise<TandaMember[]> {
        validateId(groupId, 'groupId')
        return this._http.get<TandaMember[]>(`/groups/${groupId}/members`)
    }

    /**
     * Contributes funds to the current tanda round.
     * Uses the /tandas/pay endpoint.
     */
    async contribute(groupId: string, amount: string): Promise<{ success: boolean; transaction_id: string }> {
        return this._http.post('/tandas/pay', { group_id: groupId, amount })
    }

    /**
     * Gets contribution history for a group.
     */
    async getContributions(groupId: string): Promise<any[]> {
        validateId(groupId, 'groupId')
        return this._http.get(`/groups/${groupId}/contributions`)
    }

    /**
     * Gets group statistics (totals, participation rate, etc).
     */
    async getStats(groupId: string): Promise<GroupStats> {
        validateId(groupId, 'groupId')
        return this._http.get<GroupStats>(`/groups/${groupId}/stats`)
    }

    /**
     * Gets the payment calendar for a group.
     */
    async getCalendar(groupId: string): Promise<any> {
        validateId(groupId, 'groupId')
        return this._http.get(`/groups/${groupId}/calendar`)
    }

    /**
     * Runs the Tombola — randomizes turns for a group.
     * This is the tanda-specific lottery (not the national lottery).
     */
    async runTombola(groupId: string): Promise<any> {
        validateId(groupId, 'groupId')
        return this._http.post(`/groups/${groupId}/lottery-live`)
    }

    /**
     * Updates a member's role within a group (Admin only).
     */
    async updateMemberRole(groupId: string, userId: string, role: MemberRole): Promise<{ success: boolean }> {
        validateId(groupId, 'groupId')
        validateId(userId, 'userId')
        return this._http.patch<{ success: boolean }>(`/groups/${groupId}/members/${userId}/role`, { role })
    }
}
