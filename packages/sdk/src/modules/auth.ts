// auth module - login, register, 2fa, all that stuff

import { HttpClient } from '../utils/http'
import { TokenStorage } from '../config'
import { shouldRefreshToken, getUserFromToken } from '../utils/jwt'
import type {
    LoginCredentials,
    RegisterData,
    AuthResponse,
    UserInfo,
    TokenValidation,
    TwoFactorSetup,
    TwoFactorVerify,
    SocialAuthData,
    SessionInfo
} from '../types/auth'

export class AuthModule {
    private _http: HttpClient
    private _storage: TokenStorage
    private _threshold: number

    constructor(http: HttpClient, storage: TokenStorage, threshold = 300) {
        this._http = http
        this._storage = storage
        this._threshold = threshold
    }

    async login(creds: LoginCredentials): Promise<AuthResponse> {
        const r = await this._http.post<AuthResponse>('/auth/login', creds)
        if (r.auth_token) await this._storage.setToken(r.auth_token)
        return r
    }

    async register(data: RegisterData): Promise<AuthResponse> {
        const r = await this._http.post<AuthResponse>('/auth/register', data)
        if (r.auth_token) await this._storage.setToken(r.auth_token)
        return r
    }

    async refreshToken(): Promise<string | null> {
        try {
            const r = await this._http.post<{ auth_token: string }>('/auth/refresh')
            if (r.auth_token) {
                await this._storage.setToken(r.auth_token)
                return r.auth_token
            }
            return null
        } catch {
            await this._storage.removeToken()
            return null
        }
    }

    async logout(): Promise<void> {
        try {
            await this._http.post('/auth/logout')
        } finally {
            await this._storage.removeToken()
        }
    }

    async validateToken(): Promise<TokenValidation> {
        return this._http.post<TokenValidation>('/auth/validate')
    }

    async validateSession(): Promise<SessionInfo> {
        return this._http.post<SessionInfo>('/auth/session/validate')
    }

    async forgotPassword(email: string) {
        return this._http.post<{ success: boolean; message: string }>(
            '/auth/forgot-password',
            { email }
        )
    }

    async resetPassword(token: string, pwd: string) {
        return this._http.post<{ success: boolean }>(
            '/auth/reset-password',
            { token, new_password: pwd }
        )
    }

    async setup2FA(): Promise<TwoFactorSetup> {
        return this._http.post<TwoFactorSetup>('/auth/2fa/setup')
    }

    async verify2FA(code: string): Promise<TwoFactorVerify> {
        return this._http.post<TwoFactorVerify>('/auth/2fa/verify', { code })
    }

    async disable2FA(code: string) {
        return this._http.post<{ success: boolean }>('/auth/2fa/disable', { code })
    }

    async loginWithGoogle(token: string): Promise<AuthResponse> {
        const r = await this._http.post<AuthResponse>('/auth/social/google', { token })
        if (r.auth_token) await this._storage.setToken(r.auth_token)
        return r
    }

    async loginWithSocial(data: SocialAuthData): Promise<AuthResponse> {
        const url = `/auth/social/${data.provider}`
        const r = await this._http.post<AuthResponse>(url, {
            token: data.token,
            email: data.email
        })
        if (r.auth_token) await this._storage.setToken(r.auth_token)
        return r
    }

    async isAuthenticated(): Promise<boolean> {
        const tok = await this._storage.getToken()
        if (!tok) return false
        return !shouldRefreshToken(tok, 0)
    }

    /**
     * Extracts partial user info from the current JWT token locally.
     * Use getCurrentUser() for a full verified profile from the API.
     */
    async getCurrentUserFromToken(): Promise<UserInfo | null> {
        const tok = await this._storage.getToken()
        if (!tok) return null

        const u = getUserFromToken(tok)
        if (!u) return null

        return {
            id: u.userId,
            email: u.email,
            name: '',
            role: u.role,
            permissions: u.permissions,
            verified: true,
            createdAt: ''
        }
    }

    /**
     * Fetches the full authenticated user profile from the La Tanda API.
     */
    async getCurrentUser(): Promise<UserInfo> {
        return this._http.get<UserInfo>('/auth/me')
    }

    async getToken() {
        return this._storage.getToken()
    }

    async shouldRefresh(): Promise<boolean> {
        const tok = await this._storage.getToken()
        if (!tok) return false
        return shouldRefreshToken(tok, this._threshold)
    }
}
