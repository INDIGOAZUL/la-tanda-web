// wallet module tests
// aligned with La Tanda v4.3.1 (HNL single-currency system)

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

    describe('balance', () => {
        test('gets HNL balance', async () => {
            const mockResult = { amount: '1000', available: '1000', locked: '0', currency: 'HNL' }
            const get = http.get as jest.Mock
            get.mockResolvedValue(mockResult)

            const bal = await wallet.getBalance()

            expect(get).toHaveBeenCalledWith('/wallet/balance')
            expect(bal.amount).toBe('1000')
        })

        test('getBalances is alias for getBalance', async () => {
            const mockResult = { amount: '500', available: '500', locked: '0', currency: 'HNL' }
            const get = http.get as jest.Mock
            get.mockResolvedValue(mockResult)

            const bal = await wallet.getBalances()
            expect(get).toHaveBeenCalledWith('/wallet/balance')
            expect(bal.amount).toBe('500')
        })
    })

    describe('history', () => {
        test('uses GET with query params for history', async () => {
            const mockTx = [{ id: 'tx_1', amount: '10' }]
            const get = http.get as jest.Mock
            get.mockResolvedValue(mockTx)

            const res = await wallet.getHistory({ limit: 10 })

            expect(get).toHaveBeenCalledWith('/payments/history', { limit: 10 })
            expect(res[0].id).toBe('tx_1')
        })
    })

    describe('payments', () => {
        test('posts to process endpoint', async () => {
            const mockRes = { transaction_id: 'pay_123', status: 'completed', success: true }
            const post = http.post as jest.Mock
            post.mockResolvedValue(mockRes)

            const req = {
                amount: '500',
                destination: 'dest_123',
                type: 'transfer' as const
            }
            const r = await wallet.processPayment(req)

            expect(post).toHaveBeenCalledWith('/payments/process', req)
            expect(r.transaction_id).toBe('pay_123')
        })

        test('getAvailableMethods uses POST', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue([])

            await wallet.getAvailableMethods()
            expect(post).toHaveBeenCalledWith('/payments/methods/available')
        })
    })

    describe('withdrawals', () => {
        test('lists withdrawals', async () => {
            const get = http.get as jest.Mock
            get.mockResolvedValue([])

            await wallet.listWithdrawals()
            expect(get).toHaveBeenCalledWith('/wallet/withdrawals')
        })

        test('withdraws to bank', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue({ success: true })

            await wallet.withdrawToBank({
                amount: '100',
                bank_name: 'BAC',
                account_number: '1234',
                account_holder: 'Test'
            })
            expect(post).toHaveBeenCalledWith('/wallet/withdraw/bank', expect.objectContaining({
                amount: '100',
                bank_name: 'BAC'
            }))
        })

        test('withdraws to mobile', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue({ success: true })

            await wallet.withdrawToMobile({
                amount: '50',
                phone_number: '+504999',
                provider: 'tigo'
            })
            expect(post).toHaveBeenCalledWith('/wallet/withdraw/mobile', expect.objectContaining({
                phone_number: '+504999'
            }))
        })
    })

    describe('wallet PIN', () => {
        test('sets PIN', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue({ success: true })

            await wallet.setPin('1234')
            expect(post).toHaveBeenCalledWith('/wallet/pin/set', { pin: '1234' })
        })

        test('verifies PIN', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue({ verified: true })

            const r = await wallet.verifyPin('1234')
            expect(post).toHaveBeenCalledWith('/wallet/pin/verify', { pin: '1234' })
            expect(r.verified).toBe(true)
        })

        test('gets PIN status', async () => {
            const get = http.get as jest.Mock
            get.mockResolvedValue({ has_pin: true })

            const r = await wallet.getPinStatus()
            expect(get).toHaveBeenCalledWith('/wallet/pin/status')
            expect(r.has_pin).toBe(true)
        })
    })

    describe('legacy compatibility', () => {
        test('getTransactions redirects to getHistory', async () => {
            const get = http.get as jest.Mock
            get.mockResolvedValue([])

            await wallet.getTransactions({ limit: 5 })
            expect(get).toHaveBeenCalledWith('/payments/history', { limit: 5 })
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
