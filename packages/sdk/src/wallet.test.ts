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
            const mockResult = {
                total_hnl: '1500.00',
                assets: [
                    { asset: 'HNL', amount: '1000', formatted: 'L 1,000.00' },
                    { asset: 'LTD', amount: '500', formatted: '500 LTD' }
                ]
            }
            const get = http.get as jest.Mock
            get.mockResolvedValue(mockResult)

            const bal = await wallet.getBalances()

            expect(get).toHaveBeenCalledWith('/wallet/balance')
            expect(bal.total_hnl).toBe('1500.00')
            expect(bal.assets.length).toBe(2)
        })

        test('gets specific asset balance', async () => {
            const mockResult = {
                assets: [{ asset: 'HNL', amount: '123' }]
            }
            const get = http.get as jest.Mock
            get.mockResolvedValue(mockResult)

            const amt = await wallet.getBalance('HNL')
            expect(amt).toBe('123')
        })
    })

    describe('transactions', () => {
        test('returns list of transactions with filters', async () => {
            const mockTx = [{ id: 'tx_1', asset: 'HNL', amount: '10' }]
            const get = http.get as jest.Mock
            get.mockResolvedValue(mockTx)

            const res = await wallet.getTransactions({ limit: 10 })

            // Test that filters are passed directly (not wrapped in {body})
            expect(get).toHaveBeenCalledWith('/wallet/transactions', { limit: 10 })
            expect(res[0].id).toBe('tx_1')
        })
    })

    describe('withdrawals', () => {
        test('posts to withdraw endpoint', async () => {
            const mockRes = { id: 'with_123', status: 'pending' }
            const post = http.post as jest.Mock
            post.mockResolvedValue(mockRes)

            const req = {
                bank_name: 'Banco Atlántida',
                account_number: '123456',
                account_holder: 'Juan Perez',
                amount: '500'
            }
            const r = await wallet.withdraw(req)

            expect(post).toHaveBeenCalledWith('/wallet/withdraw', req)
            expect(r.id).toBe('with_123')
            expect(r.status).toBe('pending')
        })
    })
})
