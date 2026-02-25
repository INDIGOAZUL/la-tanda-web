// notification types - handles user alerts and preferences
// aligned with La Tanda v4.11.0+

export type NotificationType =
    | 'payment_reminder'
    | 'payment_received'
    | 'member_joined'
    | 'group_update'
    | 'turn_assigned'
    | 'invitation'
    | 'payout_ready'
    | 'extension_requested'
    | 'mora_applied'
    | 'distribution_executed'
    | (string & {});

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    created_at: string;
    data?: any;
}

export interface NotificationPreferences {
    payment_reminders: boolean;
    group_updates: boolean;
    member_activity: boolean;
    marketing: boolean;
    email_enabled: boolean;
    push_enabled: boolean;
}

export interface UnreadCount {
    unread_count: number;
    user_id: string;
}

export interface NotificationListResponse {
    notifications: Notification[];
    total: number;
    unread: number;
}

export interface NotificationFilters {
    limit?: number;
    offset?: number;
    unread?: boolean;
}
