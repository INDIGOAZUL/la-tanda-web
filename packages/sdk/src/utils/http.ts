// http wrapper for all api calls

import { LaTandaError, NetworkError, parseApiError, TokenExpiredError } from '../errors'

export interface RequestOptions {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    headers?: Record<string, string>
    body?: unknown
    timeout?: number
}

export interface ApiResponse<T = unknown> {
    success: boolean
    data: T
    meta?: {
        timestamp: string
        version: string
        server?: string
        environment?: string
    }
    error?: {
        code: number
        message: string
        details?: string
    }
}

export type TokenRefreshHandler = () => Promise<string | null>

export class HttpClient {
    private _baseUrl: string
    private _timeout: number
    private _headers: Record<string, string>
    private _getToken: () => Promise<string | null>
    private _onRefresh?: TokenRefreshHandler
    private _isRefreshing = false
    private _refreshPromise: Promise<string | null> | null = null

    constructor(
        baseUrl: string,
        timeout = 30000,
        headers: Record<string, string> = {},
        tokenFn: () => Promise<string | null> = async () => null
    ) {
        this._baseUrl = baseUrl.replace(/\/$/, '') // strip trailing slash
        this._timeout = timeout
        this._headers = { 'Content-Type': 'application/json', ...headers }
        this._getToken = tokenFn
    }

    setTokenRefreshHandler(fn: TokenRefreshHandler) {
        this._onRefresh = fn
    }

    async request<T>(path: string, opts: RequestOptions): Promise<T> {
        const url = this._baseUrl + (path[0] === '/' ? path : '/' + path)
        const token = await this._getToken()

        const hdrs: Record<string, string> = { ...this._headers, ...opts.headers }
        if (token) hdrs['Authorization'] = `Bearer ${token}`

        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), opts.timeout || this._timeout)

        try {
            const resp = await fetch(url, {
                method: opts.method,
                headers: hdrs,
                body: opts.body ? JSON.stringify(opts.body) : undefined,
                signal: ctrl.signal
            })
            clearTimeout(t)

            // parse response
            let json: ApiResponse<T>
            const ct = resp.headers.get('content-type') || ''
            if (ct.includes('application/json')) {
                json = (await resp.json()) as ApiResponse<T>
            } else {
                const txt = await resp.text()
                json = { success: resp.ok, data: txt as unknown as T }
            }

            // handle failures
            if (!resp.ok) {
                const err = parseApiError(resp.status, json)
                // try refresh on token expiry
                if (err instanceof TokenExpiredError && this._onRefresh) {
                    const newTok = await this._tryRefresh()
                    if (newTok) return this.request<T>(path, opts)
                }
                throw err
            }

            if (json.success === false && json.error) {
                throw new LaTandaError(json.error.message, String(json.error.code), resp.status)
            }

            return json.data

        } catch (e) {
            clearTimeout(t)
            if (e instanceof LaTandaError) throw e
            if (e instanceof Error) {
                if (e.name === 'AbortError') throw new NetworkError('Request timed out')
                throw new NetworkError(e.message)
            }
            throw new NetworkError('Unknown error')
        }
    }

    private async _tryRefresh(): Promise<string | null> {
        if (this._isRefreshing && this._refreshPromise) {
            return this._refreshPromise
        }
        this._isRefreshing = true
        this._refreshPromise = this._onRefresh!()
        try {
            return await this._refreshPromise
        } finally {
            this._isRefreshing = false
            this._refreshPromise = null
        }
    }

    // convenience wrappers
    get<T>(path: string, o?: Partial<RequestOptions>) {
        return this.request<T>(path, { method: 'GET', ...o })
    }

    post<T>(path: string, body?: unknown, o?: Partial<RequestOptions>) {
        return this.request<T>(path, { method: 'POST', body, ...o })
    }

    put<T>(path: string, body?: unknown, o?: Partial<RequestOptions>) {
        return this.request<T>(path, { method: 'PUT', body, ...o })
    }

    patch<T>(path: string, body?: unknown, o?: Partial<RequestOptions>) {
        return this.request<T>(path, { method: 'PATCH', body, ...o })
    }

    delete<T>(path: string, o?: Partial<RequestOptions>) {
        return this.request<T>(path, { method: 'DELETE', ...o })
    }
}
