// jwt helpers - decode and check expiry without server verification

export interface JwtPayload {
    user_id: string
    email: string
    role: string
    permissions: string[]
    iss: string
    aud: string
    iat: number
    exp: number
}

export function decodeToken(token: string): JwtPayload | null {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) return null

        // base64url decode the payload
        const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const decoded = atob(b64)
        return JSON.parse(decoded)
    } catch {
        return null
    }
}

export function isTokenExpired(token: string, bufferSec = 0): boolean {
    const p = decodeToken(token)
    if (!p) return true
    const now = Math.floor(Date.now() / 1000)
    return p.exp < now + bufferSec
}

export function getTokenExpiration(token: string): Date | null {
    const p = decodeToken(token)
    if (!p) return null
    return new Date(p.exp * 1000)
}

export function getTimeToExpiry(token: string): number {
    const p = decodeToken(token)
    if (!p) return 0
    const now = Math.floor(Date.now() / 1000)
    const remaining = p.exp - now
    return remaining > 0 ? remaining : 0
}

export function shouldRefreshToken(token: string, threshold = 300): boolean {
    return isTokenExpired(token, threshold)
}

export function getUserFromToken(token: string) {
    const p = decodeToken(token)
    if (!p) return null
    return {
        userId: p.user_id,
        email: p.email,
        role: p.role,
        permissions: p.permissions
    }
}
