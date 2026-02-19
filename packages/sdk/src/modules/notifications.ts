// notification module - handles user alerts, unread counts, and preferences
// aligned with La Tanda v4.6.1+

import { HttpClient } from '../utils/http'
import type { Notification, NotificationPreferences, UnreadCount } from '../types/notifications'

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
     * @param params - Optional filters, such as pagination or notification type.
     */
    async list(params?: any): Promise<Notification[]> {
        return this._http.get<Notification[]>('/api/notifications', params)
    }

    /**
     * Fetches the current number of unread alerts. 
     * Typically used for badge counts in navigation bars.
     */
    async getUnreadCount(): Promise<UnreadCount> {
        return this._http.get<UnreadCount>('/api/notifications/unread-count')
    }

    /**
     * Marks all active notifications as 'read' in a single operation.
     * Efficient for users clearing their entire inbox at once.
     */
    async markAllRead(): Promise<{ success: boolean }> {
        return this._http.post<{ success: boolean }>('/api/notifications/read-all')
    }

    /**
     * Fetches the user's global notification dispatch settings (Email, Push, SMS).
     */
    async getPreferences(): Promise<NotificationPreferences> {
        return this._http.get<NotificationPreferences>('/api/notifications/preferences')
    }

    /**
     * Synchronizes updated notification preferences back to the server.
     * 
     * @param data - Partial preference update object.
     */
    async updatePreferences(data: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
        return this._http.put<NotificationPreferences>('/api/notifications/preferences', data)
    }
}
