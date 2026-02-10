// main client class for la tanda sdk
// aligned with La Tanda v3.92.0

import { HttpClient } from './utils/http'
import { AuthModule } from './modules/auth'
import { WalletModule } from './modules/wallet'
import { FeedModule } from './modules/feed'
import { TandasModule } from './modules/tandas'
import { MarketplaceModule } from './modules/marketplace'
import { LotteryModule } from './modules/lottery'
import { LaTandaConfig, DEFAULT_CONFIG, TokenStorage, MemoryTokenStorage } from './config'
import type { AdminModule, MiningModule, MIAModule } from './types'

export class LaTandaClient {
    private _http: HttpClient
    private _config: LaTandaConfig
    private _storage: TokenStorage

    auth: AuthModule
    wallet: WalletModule
    feed: FeedModule
    tandas: TandasModule
    marketplace: MarketplaceModule
    lottery: LotteryModule
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
        this.auth = new AuthModule(this._http, this._storage)
        this.wallet = new WalletModule(this._http)
        this.feed = new FeedModule(this._http)
        this.tandas = new TandasModule(this._http)
        this.marketplace = new MarketplaceModule(this._http)
        this.lottery = new LotteryModule(this._http)
        this._initPlaceholderModules()
    }

    private _initPlaceholderModules() {
        // admin stub
        this.admin = {
            getStats: () => this._http.get('/admin/stats'),
            listUsers: (params: any) => this._http.get('/admin/users', params),
            updateUser: (uid: string, data: any) => this._http.patch(`/admin/users/${uid}`, data)
        } as any

        // mining stub
        this.mining = {
            getStats: () => this._http.get('/mining/stats'),
            startMiner: () => this._http.post('/mining/start'),
            stopMiner: () => this._http.post('/mining/stop'),
            getRewards: () => this._http.get('/mining/rewards')
        } as any

        // mia stub - chatbot based in v3.92.0
        this.mia = {
            chat: (message: string) => this._http.post('/mia/chat', { message }),
            getStats: () => this._http.get('/mia/stats')
        } as any
    }

    // helper to get the config
    getConfig(): LaTandaConfig {
        return this._config
    }

    // helper to get the raw http client for custom requests
    getHttpClient(): HttpClient {
        return this._http
    }
}
