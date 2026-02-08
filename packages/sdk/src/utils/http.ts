// http utility for making api calls correctly

import { LaTandaError, NetworkError, parseApiError, TokenExpiredError } from '../errors'

export interface RequestOptions {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    headers?: Record<string, string>
    body?: any
    timeout?: number
}

// internal options for retry tracking
interface InternalRequestOptions extends RequestOptions {
    _isRetry?: boolean
}

export interface ApiResponse<T = any> {
    success: boolean
    data: T
    error?: {
        code: number
        message: string
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
    private _isRefreshRequest = false // guard for recursion

    constructor(
        baseUrl: string,
        timeout = 30000,
        headers: Record<string, string> = {},
        tokenFn: () => Promise<string | null> = async () => null
    ) {
        this._baseUrl = baseUrl.replace(/\/$/, '')
        this._timeout = timeout
        this._headers = { 'Content-Type': 'application/json', ...headers }
        this._getToken = tokenFn
    }

    setTokenRefreshHandler(fn: TokenRefreshHandler) {
        this._onRefresh = fn
    }

    async request<T>(path: string, opts: InternalRequestOptions): Promise<T> {
        // always prefix with /api
        const cleanPath = path.startsWith('/') ? path : `/${path}`
        const apiPath = cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`

        let url = this._baseUrl + apiPath

        // fix: GET with body bug
        if (opts.method === 'GET' && opts.body && typeof opts.body === 'object') {
            const params = new URLSearchParams()
            Object.entries(opts.body).forEach(([k, v]) => {
                if (v !== undefined && v !== null) params.append(k, String(v))
            })
            const qs = params.toString()
            if (qs) url += (url.includes('?') ? '&' : '?') + qs
            opts.body = undefined
        }

        const token = await this._getToken()
        const hdrs: Record<string, string> = { ...this._headers, ...opts.headers }
        if (token) hdrs['Authorization'] = `Bearer ${token}`

        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), opts.timeout || this._timeout)

        try {
            const response = await fetch(url, {
                method: opts.method,
                headers: hdrs,
                body: opts.body ? JSON.stringify(opts.body) : undefined,
                signal: controller.signal
            })
            clearTimeout(timer)

            let result: ApiResponse<T>
            const type = response.headers.get('content-type') || ''

            if (type.includes('application/json')) {
                result = await response.json() as ApiResponse<T>
            } else {
                const text = await response.text()
                result = { success: response.ok, data: text as unknown as T }
            }

            if (!response.ok) {
                const error = parseApiError(response.status, result)

                // PR FIX: Better recursion guard. 
                // 1. Don't retry if this is the refresh request itself.
                // 2. Don't retry more than once per user-initiated request.
                if (error instanceof TokenExpiredError && this._onRefresh && !this._isRefreshRequest && !opts._isRetry) {
                    const newToken = await this._handleRefresh()
                    if (newToken) {
                        return this.request<T>(path, { ...opts, _isRetry: true })
                    }
                }
                throw error
            }

            if (result.success === false && result.error) {
                throw new LaTandaError(result.error.message, String(result.error.code), response.status)
            }

            return result.data
        } catch (e) {
            clearTimeout(timer)
            if (e instanceof LaTandaError) throw e
            throw new NetworkError(e instanceof Error ? e.message : 'Request failed')
        }
    }

    private async _handleRefresh(): Promise<string | null> {
        if (this._isRefreshing) return null

        this._isRefreshing = true
        this._isRefreshRequest = true

        try {
            const token = await this._onRefresh!()
            return token
        } finally {
            this._isRefreshing = false
            this._isRefreshRequest = false
        }
    }

    async get<T>(path: string, body?: any, o?: Partial<RequestOptions>) {
        return this.request<T>(path, { method: 'GET', body, ...o })
    }

    async post<T>(path: string, body?: any, o?: Partial<RequestOptions>) {
        return this.request<T>(path, { method: 'POST', body, ...o })
    }

    async put<T>(path: string, body?: any, o?: Partial<RequestOptions>) {
        return this.request<T>(path, { method: 'PUT', body, ...o })
    }

    async patch<T>(path: string, body?: any, o?: Partial<RequestOptions>) {
        return this.request<T>(path, { method: 'PATCH', body, ...o })
    }

    async delete<T>(path: string, o?: Partial<RequestOptions>) {
        return this.request<T>(path, { method: 'DELETE', ...o })
    }
}
