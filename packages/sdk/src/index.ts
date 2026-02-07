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
export type { HttpClient, RequestOptions, ApiResponse } from './utils/http'

// auth module exports
export { AuthModule } from './modules/auth'
export type {
    LoginCredentials,
    RegisterData,
    AuthResponse,
    UserInfo,
    TokenValidation,
    TwoFactorSetup,
    TwoFactorVerify,
    SocialAuthData,
    SessionInfo
} from './types/auth'
