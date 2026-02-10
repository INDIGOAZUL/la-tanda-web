// tandas module - for joining circles, making contributions and getting paid
// aligned with La Tanda v3.92.0

import { HttpClient } from '../utils/http'
import type {
    TandaGroup,
    TandaMember,
    CreateGroupData,
    GroupFilters,
    PayoutStats
} from '../types/tandas'

export class TandasModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    // list available public groups
    async listGroups(filters: GroupFilters = {}): Promise<TandaGroup[]> {
        return this._http.get<TandaGroup[]>('/groups/public', filters)
    }

    // list my personal tandas
    async listMyTandas(filters: GroupFilters = {}): Promise<TandaGroup[]> {
        return this._http.get<TandaGroup[]>('/tandas/my-tandas', filters)
    }

    // create a new tanda circle
    async createGroup(data: CreateGroupData): Promise<TandaGroup> {
        return this._http.post<TandaGroup>('/groups/create', data)
    }

    // join an existing group
    async joinGroup(groupId: string): Promise<{ success: boolean }> {
        return this._http.post(`/groups/${groupId}/join`)
    }

    // leave a group
    async leaveGroup(groupId: string): Promise<{ success: boolean }> {
        return this._http.post(`/groups/${groupId}/leave`)
    }

    // get list of members in a group
    async getMembers(groupId: string): Promise<TandaMember[]> {
        return this._http.get<TandaMember[]>(`/groups/${groupId}/members`)
    }

    // get payout schedule and stats
    async getPayoutStats(groupId: string): Promise<PayoutStats> {
        return this._http.get<PayoutStats>(`/groups/${groupId}/payouts`)
    }

    // contribute funds to the current round
    async contribute(groupId: string, amount: string): Promise<{ success: boolean; tx_id: string }> {
        return this._http.post(`/groups/${groupId}/contribute`, { amount })
    }
}
