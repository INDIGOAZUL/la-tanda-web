// tests for auth module

import { AuthModule } from './modules/auth'
import { MemoryTokenStorage } from './config'
import { HttpClient } from './utils/http'

const mockHttp = () => {
    return {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        request: jest.fn(),
        setTokenRefreshHandler: jest.fn()
    } as unknown as HttpClient
}

describe('AuthModule', () => {
    let auth: AuthModule
    let http: ReturnType<typeof mockHttp>
    let storage: MemoryTokenStorage

    beforeEach(() => {
        http = mockHttp()
        storage = new MemoryTokenStorage()
        auth = new AuthModule(http as HttpClient, storage)
    })

    describe('login', () => {
        test('sends creds to login endpoint', async () => {
            const res = { auth_token: 'tok123', user: { id: '1' } }
            const post = http.post as jest.Mock
            post.mockResolvedValue(res)

            const r = await auth.login({ email: 'me@test.com', password: 'secret' })

            expect(post).toHaveBeenCalledWith('/auth/login', { email: 'me@test.com', password: 'secret' })
            expect(r.auth_token).toBe('tok123')
        })

        test('saves token after login', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue({ auth_token: 'saved' })

            await auth.login({ email: 'x@y.com', password: 'z' })

            expect(await storage.getToken()).toBe('saved')
        })
    })

    describe('register', () => {
        test('creates account and saves token', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue({ auth_token: 'new', user: { id: '2' } })

            const r = await auth.register({ name: 'Bob', email: 'bob@test.com', password: 'pw' })

            expect(post).toHaveBeenCalledWith('/auth/register', { name: 'Bob', email: 'bob@test.com', password: 'pw' })
            expect(r.auth_token).toBe('new')
            expect(await storage.getToken()).toBe('new')
        })
    })

    describe('logout', () => {
        test('clears token after logout', async () => {
            await storage.setToken('existing')
            const post = http.post as jest.Mock
            post.mockResolvedValue({})

            await auth.logout()

            expect(post).toHaveBeenCalledWith('/auth/logout')
            expect(await storage.getToken()).toBeNull()
        })
    })

    describe('refreshToken', () => {
        test('updates stored token', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue({ auth_token: 'fresh' })

            const tok = await auth.refreshToken()

            expect(tok).toBe('fresh')
            expect(await storage.getToken()).toBe('fresh')
        })

        test('clears token if refresh fails', async () => {
            await storage.setToken('old')
            const post = http.post as jest.Mock
            post.mockRejectedValue(new Error('oops'))

            const tok = await auth.refreshToken()

            expect(tok).toBeNull()
            expect(await storage.getToken()).toBeNull()
        })
    })

    describe('2FA', () => {
        test('setup returns qr code', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue({ secret: 'abc', qr_code: 'data:image', backup_codes: [] })

            const r = await auth.setup2FA()

            expect(post).toHaveBeenCalledWith('/auth/2fa/setup')
            expect(r.qr_code).toBe('data:image')
        })

        test('verify sends code', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue({ success: true })

            const r = await auth.verify2FA('123456')

            expect(post).toHaveBeenCalledWith('/auth/2fa/verify', { code: '123456' })
            expect(r.success).toBe(true)
        })
    })

    describe('forgotPassword', () => {
        test('sends reset email', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue({ success: true, message: 'sent' })

            const r = await auth.forgotPassword('user@test.com')

            expect(post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'user@test.com' })
            expect(r.success).toBe(true)
        })
    })

    describe('social login', () => {
        test('google login works', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue({ auth_token: 'google', user: {} })

            await auth.loginWithGoogle('gtoken')

            expect(post).toHaveBeenCalledWith('/auth/social/google', { token: 'gtoken' })
            expect(await storage.getToken()).toBe('google')
        })

        test('any provider works', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue({ auth_token: 'fb', user: {} })

            await auth.loginWithSocial({ provider: 'facebook', token: 'fbtoken' })

            expect(post).toHaveBeenCalledWith('/auth/social/facebook', { token: 'fbtoken', email: undefined })
        })
    })

    describe('helpers', () => {
        test('isAuthenticated false when empty', async () => {
            expect(await auth.isAuthenticated()).toBe(false)
        })

        test('getToken returns stored value', async () => {
            await storage.setToken('mytok')
            expect(await auth.getToken()).toBe('mytok')
        })
    })
})
