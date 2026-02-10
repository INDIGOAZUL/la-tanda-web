// la tanda sdk entry point

export { LaTandaClient } from './client'

export type { LaTandaConfig, TokenStorage } from './config'
export { MemoryTokenStorage, DEFAULT_CONFIG } from './config'

export {
    LaTandaError,
    AuthenticationError,
    TokenExpiredError,
    InvalidTokenError,
    RateLimitError,
    ValidationError,
    NotFoundError,
    NetworkError,
    ServerError,
    InsufficientFundsError,
    parseApiError
} from './errors'

export {
    decodeToken,
    isTokenExpired,
    getTokenExpiration,
    getTimeToExpiry,
    shouldRefreshToken,
    getUserFromToken
} from './utils/jwt'

export type { JwtPayload } from './utils/jwt'
export { HttpClient } from './utils/http'
export type { RequestOptions, ApiResponse } from './utils/http'

// module exports
export * from './modules/auth'
export * from './modules/wallet'
export * from './modules/tandas'
export * from './modules/feed'
export * from './modules/marketplace'
export * from './modules/lottery'

// type exports
export * from './types/auth'
export * from './types/wallet'
export * from './types/tandas'
export * from './types/feed'
export * from './types/marketplace'
export * from './types/lottery'
