// main sdk client - this is what users import

import { LaTandaConfig, DEFAULT_CONFIG, MemoryTokenStorage, TokenStorage } from './config'
import { HttpClient } from './utils/http'
import { shouldRefreshToken } from './utils/jwt'

// module types - we'll flesh these out as we build each one

interface AuthModule {
    login: (creds: { email: string; password: string }) => Promise<unknown>
    register: (data: { name: string; email: string; password: string }) => Promise<unknown>
    logout: () => Promise<void>
    refreshToken: () => Promise<string | null>
    isAuthenticated: () => Promise<boolean>
}

interface WalletModule {
    getBalance: () => Promise<unknown>
    getTransactions: (opts?: unknown) => Promise<unknown>
    send: (data: unknown) => Promise<unknown>
}

interface TandasModule {
    listGroups: (filters?: unknown) => Promise<unknown>
    createGroup: (data: unknown) => Promise<unknown>
    listTandas: (filters?: unknown) => Promise<unknown>
}

interface MarketplaceModule {
    listProducts: (filters?: unknown) => Promise<unknown>
    getCategories: () => Promise<unknown>
    search: (query: string) => Promise<unknown>
}

interface LotteryModule {
    conduct: (groupId: string, members: string[]) => Promise<unknown>
    getStatus: (groupId: string) => Promise<unknown>
}

export class LaTandaClient {
    private _config: LaTandaConfig
    private _http: HttpClient
    private _storage: TokenStorage

    // public modules
    auth!: AuthModule
    wallet!: WalletModule
    tandas!: TandasModule
    marketplace!: MarketplaceModule
    lottery!: LotteryModule

    constructor(cfg: LaTandaConfig = {}) {
        // merge with defaults
        this._config = {
            baseUrl: cfg.baseUrl || DEFAULT_CONFIG.baseUrl,
            timeout: cfg.timeout || DEFAULT_CONFIG.timeout,
            headers: { ...DEFAULT_CONFIG.headers, ...cfg.headers },
            tokenStorage: cfg.tokenStorage || new MemoryTokenStorage(),
            autoRefreshToken: cfg.autoRefreshToken ?? DEFAULT_CONFIG.autoRefreshToken,
            refreshThreshold: cfg.refreshThreshold ?? DEFAULT_CONFIG.refreshThreshold
        }

        this._storage = this._config.tokenStorage!

        // set up http client
        this._http = new HttpClient(
            this._config.baseUrl!,
            this._config.timeout,
            this._config.headers,
            () => this._storage.getToken()
        )

        if (this._config.autoRefreshToken) {
            this._http.setTokenRefreshHandler(() => this._doRefresh())
        }

        this._initModules()
    }

    private _initModules() {
        // auth endpoints
        this.auth = {
            login: async (creds) => {
                const res = await this._http.post<{ auth_token: string; user: unknown }>('/auth/login', creds)
                if (res.auth_token) {
                    await this._storage.setToken(res.auth_token)
                }
                return res
            },

            register: async (data) => {
                const res = await this._http.post<{ auth_token: string; user: unknown }>('/auth/register', data)
                if (res.auth_token) {
                    await this._storage.setToken(res.auth_token)
                }
                return res
            },

            logout: async () => {
                try {
                    await this._http.post('/auth/logout')
                } finally {
                    await this._storage.removeToken()
                }
            },

            refreshToken: () => this._doRefresh(),

            isAuthenticated: async () => {
                const tok = await this._storage.getToken()
                if (!tok) return false
                return !shouldRefreshToken(tok, 0)
            }
        }

        // wallet endpoints
        this.wallet = {
            getBalance: () => this._http.get('/wallet/balance'),
            getTransactions: (o) => this._http.get('/wallet/transactions', { body: o }),
            send: (d) => this._http.post('/wallet/send', d)
        }

        // tandas/groups endpoints
        this.tandas = {
            listGroups: (f) => this._http.get('/groups/list', { body: f }),
            createGroup: (d) => this._http.post('/groups/create', d),
            listTandas: (f) => this._http.get('/tandas/list', { body: f })
        }

        // marketplace endpoints
        this.marketplace = {
            listProducts: (f) => this._http.get('/marketplace/products', { body: f }),
            getCategories: () => this._http.get('/marketplace/categories'),
            search: (q) => this._http.get(`/marketplace/search?q=${encodeURIComponent(q)}`)
        }

        // lottery endpoints
        this.lottery = {
            conduct: (gid, members) => this._http.post('/lottery/conduct', { group_id: gid, members }),
            getStatus: (gid) => this._http.get(`/lottery/status?group_id=${gid}`)
        }
    }

    private async _doRefresh(): Promise<string | null> {
        try {
            const res = await this._http.post<{ auth_token: string }>('/auth/refresh')
            if (res.auth_token) {
                await this._storage.setToken(res.auth_token)
                return res.auth_token
            }
            return null
        } catch {
            await this._storage.removeToken()
            return null
        }
    }

    getHttpClient() { return this._http }
    getConfig() { return { ...this._config } }
}
