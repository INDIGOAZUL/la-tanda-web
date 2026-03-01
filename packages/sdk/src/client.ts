// main client class for la tanda sdk
// aligned with La Tanda v4.3.1

import { HttpClient } from './utils/http'
import { AuthModule } from './modules/auth'
import { WalletModule } from './modules/wallet'
import { FeedModule } from './modules/feed'
import { TandasModule } from './modules/tandas'
import { MarketplaceModule } from './modules/marketplace'
import { LotteryModule } from './modules/lottery'
import { ProvidersModule } from './modules/providers'
import { VerificationModule } from './modules/verification'
import { NotificationModule } from './modules/notifications'
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
    providers: ProvidersModule
    verification: VerificationModule
    notifications: NotificationModule
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
        this.providers = new ProvidersModule(this._http)
        this.verification = new VerificationModule(this._http)
        this.notifications = new NotificationModule(this._http)
        this._initPlaceholderModules()
    }

    private _initPlaceholderModules() {
        // admin stub — v4.3.1 corrected paths
        this.admin = {
            getStats: () => this._http.get('/admin/dashboard/stats'),
            listUsers: (params: any) => this._http.get('/admin/users', params),
            updateUserStatus: (uid: string, status: string) =>
                this._http.put(`/admin/users/${uid}/status`, { status })
        } as AdminModule

        // mining stub — only status + claim in v4.3.1
        this.mining = {
            getStatus: () => this._http.get('/mining/status'),
            claim: () => this._http.post('/mining/claim')
        } as MiningModule

        // mia stub — chatbot
        this.mia = {
            chat: (message: string) => this._http.post('/mia/chat', { message }),
            getStatus: () => this._http.get('/mia/status')
        } as MIAModule
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
