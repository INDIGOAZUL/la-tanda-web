// config stuff for the sdk

export interface LaTandaConfig {
    baseUrl?: string
    timeout?: number
    headers?: Record<string, string>
    tokenStorage?: TokenStorage
    autoRefreshToken?: boolean
    refreshThreshold?: number
}

export interface TokenStorage {
    getToken(): Promise<string | null>
    setToken(token: string): Promise<void>
    removeToken(): Promise<void>
}

// quick and dirty memory storage - works fine for testing
export class MemoryTokenStorage implements TokenStorage {
    private _token: string | null = null

    async getToken() {
        return this._token
    }

    async setToken(t: string) {
        this._token = t
    }

    async removeToken() {
        this._token = null
    }
}

export const DEFAULT_CONFIG = {
    baseUrl: 'https://latanda.online',
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
    autoRefreshToken: true,
    refreshThreshold: 300
}
