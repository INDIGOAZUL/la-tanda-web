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

    /**
     * @param http - The shared HttpClient instance.
     * @param storage - TokenStorage implementation for session persistence.
     * @param threshold - Buffer in seconds for token refresh checks (default: 300s).
     */
    constructor(http: HttpClient, storage: TokenStorage, threshold = 300) {
        this._http = http
        this._storage = storage
        this._threshold = threshold
    }

    /**
     * Authenticates a user and persists the session.
     * @param creds - Email and password credentials.
     * @returns AuthResponse containing the user profile and tokens.
     * @throws AuthenticationError if credentials are invalid.
     */
    async login(creds: LoginCredentials): Promise<AuthResponse> {
        const r = await this._http.post<AuthResponse>('/auth/login', creds)
        if (r.auth_token) await this._storage.setToken(r.auth_token)
        return r
    }

    /**
     * Registers a new user account.
     * @param data - User profile data (name, email, password, etc).
     * @returns AuthResponse containing the new user profile and tokens.
     */
    async register(data: RegisterData): Promise<AuthResponse> {
        const r = await this._http.post<AuthResponse>('/auth/register', data)
        if (r.auth_token) await this._storage.setToken(r.auth_token)
        return r
    }

    /**
     * Proactively refreshes the current session token.
     * @returns The new auth token string, or null if refresh failed.
     */
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

    /**
     * Extracts partial user info from the current JWT token locally.
     * Does NOT make an API call.
     */
    async getUserFromToken(): Promise<UserInfo | null> {
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

    async isAuthenticated(): Promise<boolean> {
        const tok = await this._storage.getToken()
        if (!tok) return false
        return !shouldRefreshToken(tok, 0)
    }
}
