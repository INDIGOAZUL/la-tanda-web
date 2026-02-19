// notification types - handles user alerts and preferences
// aligned with La Tanda v4.6.1+

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'transaction' | 'tanda';
    read: boolean;
    created_at: string;
    data?: any;
}

export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
    transaction_alerts: boolean;
    tanda_reminders: boolean;
}

export interface UnreadCount {
    count: number;
}
