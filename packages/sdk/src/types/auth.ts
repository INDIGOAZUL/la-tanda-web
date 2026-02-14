// auth types - what we send/receive from the api

export interface LoginCredentials {
    email: string
    password: string
    remember?: boolean
}

export interface RegisterData {
    name: string
    email: string
    password: string
    phone?: string
    acceptTerms?: boolean
}

export interface AuthResponse {
    auth_token: string
    refresh_token?: string
    user: UserInfo
    requires_2fa?: boolean
    dashboard_url?: string
}

export interface UserInfo {
    id: string
    email: string
    name: string
    role: string
    permissions: string[]
    avatar?: string
    phone?: string
    verified: boolean
    createdAt: string
}

export interface TokenValidation {
    valid: boolean
    user_id?: string
    expires_at?: string
}

export interface TwoFactorSetup {
    secret: string
    qr_code: string
    backup_codes: string[]
}

export interface TwoFactorVerify {
    success: boolean
    backup_codes_remaining?: number
}

export interface PasswordResetRequest {
    email: string
}

export interface PasswordResetConfirm {
    token: string
    new_password: string
}

export interface SocialAuthData {
    provider: 'google' | 'facebook' | 'apple'
    token: string
    email?: string
}

export interface SessionInfo {
    valid: boolean
    user_id: string
    expires_at: string
    device?: string
    ip?: string
}
