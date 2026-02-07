// main sdk client

import { LaTandaConfig, DEFAULT_CONFIG, MemoryTokenStorage, TokenStorage } from './config'
import { HttpClient } from './utils/http'
import { AuthModule } from './modules/auth'

// placeholder interfaces for modules not yet implemented

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

    // modules
    auth: AuthModule
    wallet!: WalletModule
    tandas!: TandasModule
    marketplace!: MarketplaceModule
    lottery!: LotteryModule

    constructor(cfg: LaTandaConfig = {}) {
        this._config = {
            baseUrl: cfg.baseUrl || DEFAULT_CONFIG.baseUrl,
            timeout: cfg.timeout || DEFAULT_CONFIG.timeout,
            headers: { ...DEFAULT_CONFIG.headers, ...cfg.headers },
            tokenStorage: cfg.tokenStorage || new MemoryTokenStorage(),
            autoRefreshToken: cfg.autoRefreshToken ?? DEFAULT_CONFIG.autoRefreshToken,
            refreshThreshold: cfg.refreshThreshold ?? DEFAULT_CONFIG.refreshThreshold
        }

        this._storage = this._config.tokenStorage!

        this._http = new HttpClient(
            this._config.baseUrl!,
            this._config.timeout,
            this._config.headers,
            () => this._storage.getToken()
        )

        // set up token refresh
        if (this._config.autoRefreshToken) {
            this._http.setTokenRefreshHandler(() => this.auth.refreshToken())
        }

        // init modules
        this.auth = new AuthModule(this._http, this._storage, this._config.refreshThreshold)
        this._initPlaceholderModules()
    }

    private _initPlaceholderModules() {
        // wallet - to be implemented
        this.wallet = {
            getBalance: () => this._http.get('/wallet/balance'),
            getTransactions: (o) => this._http.get('/wallet/transactions', { body: o }),
            send: (d) => this._http.post('/wallet/send', d)
        }

        // tandas - to be implemented
        this.tandas = {
            listGroups: (f) => this._http.get('/groups/list', { body: f }),
            createGroup: (d) => this._http.post('/groups/create', d),
            listTandas: (f) => this._http.get('/tandas/list', { body: f })
        }

        // marketplace - to be implemented
        this.marketplace = {
            listProducts: (f) => this._http.get('/marketplace/products', { body: f }),
            getCategories: () => this._http.get('/marketplace/categories'),
            search: (q) => this._http.get(`/marketplace/search?q=${encodeURIComponent(q)}`)
        }

        // lottery - to be implemented
        this.lottery = {
            conduct: (gid, members) => this._http.post('/lottery/conduct', { group_id: gid, members }),
            getStatus: (gid) => this._http.get(`/lottery/status?group_id=${gid}`)
        }
    }

    getHttpClient() { return this._http }
    getConfig() { return { ...this._config } }
}
