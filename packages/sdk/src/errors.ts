// error classes for the sdk
// each one maps to a specific api error scenario

export interface ErrorDetails {
    code?: string
    field?: string
    message?: string
    [key: string]: unknown
}

export class LaTandaError extends Error {
    readonly code: string
    readonly status: number
    readonly details?: ErrorDetails
    readonly timestamp: Date

    constructor(msg: string, code = 'UNKNOWN', status = 500, details?: ErrorDetails) {
        super(msg)
        this.name = 'LaTandaError'
        this.code = code
        this.status = status
        this.details = details
        this.timestamp = new Date()

        // v8 specific - keeps stack trace clean
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor)
        }
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            status: this.status,
            details: this.details,
            timestamp: this.timestamp.toISOString()
        }
    }
}

export class AuthenticationError extends LaTandaError {
    constructor(msg = 'Authentication failed', details?: ErrorDetails) {
        super(msg, 'AUTH_ERROR', 401, details)
        this.name = 'AuthenticationError'
    }
}

export class TokenExpiredError extends AuthenticationError {
    constructor(msg = 'Token has expired') {
        super(msg, { code: 'TOKEN_EXPIRED' })
        this.name = 'TokenExpiredError'
    }
}

export class InvalidTokenError extends AuthenticationError {
    constructor(msg = 'Invalid token') {
        super(msg, { code: 'INVALID_TOKEN' })
        this.name = 'InvalidTokenError'
    }
}

export class RateLimitError extends LaTandaError {
    readonly retryAfter?: number

    constructor(msg = 'Rate limit exceeded', retryAfter?: number) {
        super(msg, 'RATE_LIMIT', 429, { retryAfter })
        this.name = 'RateLimitError'
        this.retryAfter = retryAfter
    }
}

export class ValidationError extends LaTandaError {
    readonly fields: Record<string, string[]>

    constructor(msg = 'Validation failed', fields: Record<string, string[]> = {}) {
        super(msg, 'VALIDATION_ERROR', 400, { fields })
        this.name = 'ValidationError'
        this.fields = fields
    }
}

export class NotFoundError extends LaTandaError {
    readonly resource: string

    constructor(resource: string, msg?: string) {
        super(msg || `${resource} not found`, 'NOT_FOUND', 404, { resource })
        this.name = 'NotFoundError'
        this.resource = resource
    }
}

export class NetworkError extends LaTandaError {
    constructor(msg = 'Network error', details?: ErrorDetails) {
        super(msg, 'NETWORK_ERROR', 0, details)
        this.name = 'NetworkError'
    }
}

export class ServerError extends LaTandaError {
    constructor(msg = 'Server error', status = 500) {
        super(msg, 'SERVER_ERROR', status)
        this.name = 'ServerError'
    }
}

export class InsufficientFundsError extends LaTandaError {
    readonly required: number
    readonly available: number

    constructor(required: number, available: number) {
        super(
            `Insufficient funds: need ${required}, have ${available}`,
            'INSUFFICIENT_FUNDS',
            400,
            { required, available }
        )
        this.name = 'InsufficientFundsError'
        this.required = required
        this.available = available
    }
}

// parse api errors into typed exceptions
export function parseApiError(status: number, data: unknown): LaTandaError {
    const d = data as { message?: string; error?: string; details?: ErrorDetails }
    const msg = d?.message || d?.error || 'Request failed'

    switch (status) {
        case 400:
            return new ValidationError(msg, d?.details?.fields as Record<string, string[]>)
        case 401:
            if (msg.toLowerCase().includes('expired')) {
                return new TokenExpiredError(msg)
            }
            return new AuthenticationError(msg, d?.details)
        case 403:
            return new AuthenticationError(msg, d?.details)
        case 404:
            return new NotFoundError('Resource', msg)
        case 429:
            return new RateLimitError(msg, d?.details?.retryAfter as number)
        default:
            if (status >= 500) return new ServerError(msg, status)
            return new LaTandaError(msg, 'API_ERROR', status, d?.details)
    }
}
