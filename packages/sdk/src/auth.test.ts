// tests for auth module
// aligned with La Tanda v4.3.1

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

    describe('helpers', () => {
        test('isAuthenticated false when empty', async () => {
            expect(await auth.isAuthenticated()).toBe(false)
        })

        test('getToken returns stored value', async () => {
            await storage.setToken('mytok')
            expect(await auth.getToken()).toBe('mytok')
        })

        test('getCurrentUser calls /user/profile', async () => {
            const get = http.get as jest.Mock
            get.mockResolvedValue({ id: '123', email: 'test@me.com' })

            const u = await auth.getCurrentUser()
            expect(get).toHaveBeenCalledWith('/user/profile')
            expect(u.id).toBe('123')
        })
    })
})
