// tests for the la tanda sdk

import { LaTandaClient } from './client'
import { MemoryTokenStorage } from './config'
import { LaTandaError, AuthenticationError, ValidationError, RateLimitError } from './errors'
import { decodeToken, isTokenExpired, shouldRefreshToken } from './utils/jwt'

describe('LaTandaClient', () => {
    let client: LaTandaClient

    beforeEach(() => {
        client = new LaTandaClient({
            baseUrl: 'https://latanda.online',
            timeout: 5000
        })
    })

    describe('initialization', () => {
        test('creates with defaults', () => {
            const c = new LaTandaClient()
            expect(c).toBeDefined()
            expect(c.auth).toBeDefined()
            expect(c.wallet).toBeDefined()
            expect(c.tandas).toBeDefined()
            expect(c.marketplace).toBeDefined()
            expect(c.lottery).toBeDefined()
        })

        test('accepts custom config', () => {
            const c = new LaTandaClient({
                baseUrl: 'https://custom.api.com',
                timeout: 10000,
                headers: { 'X-Custom': 'val' }
            })
            const cfg = c.getConfig()
            expect(cfg.baseUrl).toBe('https://custom.api.com')
            expect(cfg.timeout).toBe(10000)
        })

        test('works with custom storage', () => {
            const storage = new MemoryTokenStorage()
            const c = new LaTandaClient({ tokenStorage: storage })
            expect(c).toBeDefined()
        })
    })

    describe('auth module', () => {
        test('has login', () => expect(typeof client.auth.login).toBe('function'))
        test('has register', () => expect(typeof client.auth.register).toBe('function'))
        test('has logout', () => expect(typeof client.auth.logout).toBe('function'))
        test('has isAuthenticated', () => expect(typeof client.auth.isAuthenticated).toBe('function'))

        test('isAuthenticated returns false when empty', async () => {
            const result = await client.auth.isAuthenticated()
            expect(result).toBe(false)
        })
    })

    describe('wallet module', () => {
        test('has getBalances', () => expect(typeof client.wallet.getBalances).toBe('function'))
        test('has getTransactions', () => expect(typeof client.wallet.getTransactions).toBe('function'))
        test('has withdraw', () => expect(typeof client.wallet.withdraw).toBe('function'))
    })

    describe('tandas module', () => {
        test('has listGroups', () => expect(typeof client.tandas.listGroups).toBe('function'))
        test('has createGroup', () => expect(typeof client.tandas.createGroup).toBe('function'))
        test('has listMyTandas', () => expect(typeof client.tandas.listMyTandas).toBe('function'))
    })
})

describe('Error Classes', () => {
    describe('LaTandaError', () => {
        test('stores properties', () => {
            const e = new LaTandaError('oops', 'TEST', 400, { field: 'email' })
            expect(e.message).toBe('oops')
            expect(e.code).toBe('TEST')
            expect(e.status).toBe(400)
            expect(e.details).toEqual({ field: 'email' })
            expect(e.timestamp).toBeInstanceOf(Date)
        })

        test('serializes to json', () => {
            const e = new LaTandaError('test', 'CODE', 400)
            const j = e.toJSON()
            expect(j.message).toBe('test')
            expect(j.code).toBe('CODE')
            expect(j.status).toBe(400)
        })
    })

    describe('AuthenticationError', () => {
        test('has defaults', () => {
            const e = new AuthenticationError()
            expect(e.code).toBe('AUTH_ERROR')
            expect(e.status).toBe(401)
        })
    })

    describe('ValidationError', () => {
        test('includes fields', () => {
            const e = new ValidationError('bad input', {
                email: ['invalid'],
                password: ['too short']
            })
            expect(e.fields.email).toContain('invalid')
            expect(e.fields.password).toContain('too short')
        })
    })

    describe('RateLimitError', () => {
        test('has retryAfter', () => {
            const e = new RateLimitError('slow down', 60)
            expect(e.retryAfter).toBe(60)
            expect(e.status).toBe(429)
        })
    })
})

describe('JWT Utilities', () => {
    // sample expired token for testing
    const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl8xMjMiLCJlbWFpbCI6InRlc3RAbGF0YW5kYS5vbmxpbmUiLCJyb2xlIjoidXNlciIsInBlcm1pc3Npb25zIjpbInJlYWQiLCJ3cml0ZSJdLCJpc3MiOiJsYXRhbmRhLm9ubGluZSIsImF1ZCI6ImxhdGFuZGEtd2ViLWFwcCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDgwMDAwfQ.signature'

    describe('decodeToken', () => {
        test('decodes valid jwt', () => {
            const p = decodeToken(sampleToken)
            expect(p).toBeDefined()
            expect(p?.user_id).toBe('user_123')
            expect(p?.email).toBe('test@latanda.online')
        })

        test('returns null for garbage', () => {
            expect(decodeToken('not-a-jwt')).toBeNull()
        })

        test('returns null for empty', () => {
            expect(decodeToken('')).toBeNull()
        })
    })

    describe('isTokenExpired', () => {
        test('true for expired', () => {
            expect(isTokenExpired(sampleToken)).toBe(true)
        })

        test('true for invalid', () => {
            expect(isTokenExpired('garbage')).toBe(true)
        })
    })

    describe('shouldRefreshToken', () => {
        test('true for expired token', () => {
            expect(shouldRefreshToken(sampleToken, 300)).toBe(true)
        })
    })
})

describe('MemoryTokenStorage', () => {
    let storage: MemoryTokenStorage

    beforeEach(() => {
        storage = new MemoryTokenStorage()
    })

    test('stores and gets token', async () => {
        await storage.setToken('abc123')
        const t = await storage.getToken()
        expect(t).toBe('abc123')
    })

    test('returns null when empty', async () => {
        const t = await storage.getToken()
        expect(t).toBeNull()
    })

    test('removes token', async () => {
        await storage.setToken('temp')
        await storage.removeToken()
        const t = await storage.getToken()
        expect(t).toBeNull()
    })
})
