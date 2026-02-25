// notification module - handles user alerts, unread counts, and preferences
// aligned with La Tanda v4.11.0+

import { HttpClient } from '../utils/http'
import type {
    NotificationPreferences,
    UnreadCount,
    NotificationListResponse,
    NotificationFilters
} from '../types/notifications'

/**
 * The NotificationModule manages the user's alert lifecycle and communication channels.
 * It provides tools for real-time unread counts and preference synchronization.
 * 
 * @category Communication
 */
export class NotificationModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    /**
     * Retrieves a paginated list of notifications for the user.
     * 
     * @param params - Optional filters, such as pagination or unread status.
     * @returns Object containing notifications list, total count, and unread count.
     */
    async list(params?: NotificationFilters): Promise<NotificationListResponse> {
        return this._http.get<NotificationListResponse>('/notifications', params)
    }

    /**
     * Marks a specific notification as 'read'.
     * 
     * @param id - The unique identifier of the notification.
     */
    async markRead(id: string): Promise<{ success: boolean }> {
        return this._http.post<{ success: boolean }>(`/notifications/read/${id}`)
    }

    /**
     * Fetches the current number of unread alerts. 
     * Typically used for badge counts in navigation bars.
     */
    async getUnreadCount(): Promise<UnreadCount> {
        return this._http.get<UnreadCount>('/notifications/unread-count')
    }

    /**
     * Marks all active notifications as 'read' in a single operation.
     * Efficient for users clearing their entire inbox at once.
     */
    async markAllRead(): Promise<{ success: boolean }> {
        return this._http.post<{ success: boolean }>('/notifications/read-all')
    }

    /**
     * Fetches the user's global notification dispatch settings.
     */
    async getPreferences(): Promise<NotificationPreferences> {
        return this._http.get<NotificationPreferences>('/notifications/preferences')
    }

    /**
     * Synchronizes updated notification preferences back to the server.
     * 
     * @param data - Partial preference update object.
     */
    async updatePreferences(data: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
        return this._http.put<NotificationPreferences>('/notifications/preferences', data)
    }
}
