// wallet module tests - checking money moves
// aligned with La Tanda v3.92.0 (HNL / Bank system)

import { WalletModule } from './modules/wallet'
import { HttpClient } from './utils/http'

const mockHttp = () => {
    return {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        request: jest.fn()
    } as unknown as HttpClient
}

describe('WalletModule', () => {
    let wallet: WalletModule
    let http: ReturnType<typeof mockHttp>

    beforeEach(() => {
        http = mockHttp()
        wallet = new WalletModule(http as HttpClient)
    })

    describe('balances', () => {
        test('gets all asset balances', async () => {
            const mockResult = [
                { symbol: 'HNL', asset: 'HNL', amount: '1000', total_hnl: '1000', available: '1000', locked: '0' },
                { symbol: 'USD', asset: 'USD', amount: '50', total_hnl: '1200', available: '50', locked: '0' }
            ]
            const get = http.get as jest.Mock
            get.mockResolvedValue(mockResult)

            const bal = await wallet.getBalances()

            expect(get).toHaveBeenCalledWith('/wallet/balance')
            expect(bal.length).toBe(2)
            expect(bal[0].symbol).toBe('HNL')
        })

        test('gets specific asset balance', async () => {
            const mockResult = [
                { symbol: 'HNL', asset: 'HNL', amount: '123' }
            ]
            const get = http.get as jest.Mock
            get.mockResolvedValue(mockResult)

            const amt = await wallet.getBalance('HNL')
            expect(amt).toBe('123')
        })
    })

    describe('history', () => {
        test('returns list of transactions with filters using POST', async () => {
            const mockTx = [{ id: 'tx_1', symbol: 'HNL', amount: '10' }]
            const post = http.post as jest.Mock
            post.mockResolvedValue(mockTx)

            const res = await wallet.getHistory({ limit: 10 })

            expect(post).toHaveBeenCalledWith('/payments/history', { limit: 10 })
            expect(res[0].id).toBe('tx_1')
        })
    })

    describe('payments', () => {
        test('posts to process endpoint', async () => {
            const mockRes = { transaction_id: 'pay_123', status: 'completed', success: true }
            const post = http.post as jest.Mock
            post.mockResolvedValue(mockRes)

            const req = {
                symbol: 'HNL' as const,
                amount: '500',
                destination: 'dest_123',
                type: 'transfer' as const
            }
            const r = await wallet.processPayment(req)

            expect(post).toHaveBeenCalledWith('/payments/process', req)
            expect(r.transaction_id).toBe('pay_123')
            expect(r.success).toBe(true)
        })
    })

    describe('legacy compatibility', () => {
        test('getTransactions redirects to getHistory', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue([])

            await wallet.getTransactions({ limit: 5 })
            expect(post).toHaveBeenCalledWith('/payments/history', { limit: 5 })
        })

        test('withdraw redirects to processPayment', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue({ success: true })

            await wallet.withdraw('100', 'bank_abc')
            expect(post).toHaveBeenCalledWith('/payments/process', expect.objectContaining({
                type: 'withdrawal',
                amount: '100',
                destination: 'bank_abc'
            }))
        })
    })
})
