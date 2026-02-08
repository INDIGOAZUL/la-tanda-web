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

// wallet module exports
export { WalletModule } from './modules/wallet'
export type {
    AssetType,
    BalanceInfo,
    WalletBalances,
    Transaction,
    TransactionType,
    TransactionStatus,
    TransactionFilters,
    SendFundsRequest,
    LockFundsRequest,
    GasEstimate
} from './types/wallet'

// feed module exports
export { FeedModule } from './modules/feed'
export type {
    Post,
    Comment,
    CreatePostData,
    SocialFeedFilters,
    ReputationInfo
} from './types/feed'

// tandas module exports
export { TandasModule } from './modules/tandas'
export type {
    TandaGroup,
    TandaMember,
    TandaStatus,
    MemberRole,
    CreateGroupData,
    GroupFilters,
    PayoutStats
} from './types/tandas'
