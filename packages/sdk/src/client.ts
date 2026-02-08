// main sdk client

import { LaTandaConfig, DEFAULT_CONFIG, MemoryTokenStorage, TokenStorage } from './config'
import { HttpClient } from './utils/http'
import { AuthModule } from './modules/auth'
import { WalletModule } from './modules/wallet'
import { FeedModule } from './modules/feed'
import { TandasModule } from './modules/tandas'

// placeholder interfaces for modules not yet implemented

interface MarketplaceModule {
    listProducts: (filters?: unknown) => Promise<unknown>
    getCategories: () => Promise<unknown>
    search: (query: string) => Promise<unknown>
}

interface LotteryModule {
    conduct: (groupId: string, members: string[]) => Promise<unknown>
    getStatus: (groupId: string) => Promise<unknown>
}

// Stubs for specialized modules requested by INDIGOAZUL
interface AdminModule {
    getStats: () => Promise<unknown>
    manageUsers: (action: string) => Promise<unknown>
}

interface MiningModule {
    getStatus: () => Promise<unknown>
    startMining: () => Promise<unknown>
}

interface MIAModule {
    getBalance: () => Promise<unknown>
    stake: (amount: string) => Promise<unknown>
}

export class LaTandaClient {
    private _config: LaTandaConfig
    private _http: HttpClient
    private _storage: TokenStorage

    // modules
    auth: AuthModule
    wallet: WalletModule
    feed: FeedModule
    tandas!: TandasModule
    marketplace!: MarketplaceModule
    lottery!: LotteryModule
    admin!: AdminModule
    mining!: MiningModule
    mia!: MIAModule

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
        this.wallet = new WalletModule(this._http)
        this.feed = new FeedModule(this._http)
        this.tandas = new TandasModule(this._http)
        this._initPlaceholderModules()
    }

    private _initPlaceholderModules() {
        // marketplace - to be implemented
        this.marketplace = {
            listProducts: (f) => this._http.get('/marketplace/products', f),
            getCategories: () => this._http.get('/marketplace/categories'),
            search: (q) => this._http.get('/marketplace/search', { q })
        }

        // lottery - to be implemented
        this.lottery = {
            conduct: (gid, members) => this._http.post('/lottery/conduct', { group_id: gid, members }),
            getStatus: (gid) => this._http.get('/lottery/status', { group_id: gid })
        }

        // admin stub
        this.admin = {
            getStats: () => this._http.get('/admin/stats'),
            manageUsers: (a) => this._http.post('/admin/users', { action: a })
        }

        // mining stub
        this.mining = {
            getStatus: () => this._http.get('/mining/status'),
            startMining: () => this._http.post('/mining/start')
        }

        // mia stub
        this.mia = {
            getBalance: () => this._http.get('/mia/balance'),
            stake: (amt) => this._http.post('/mia/stake', { amount: amt })
        }
    }

    getHttpClient() { return this._http }
    getConfig() { return { ...this._config } }
}
