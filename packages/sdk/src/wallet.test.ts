// wallet module tests - checking money moves

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
                total_usd: 1000,
                assets: [
                    { asset: 'LTD', amount: '500', formatted: '500 LTD' },
                    { asset: 'USDT', amount: '500', formatted: '$500.00' }
                ]
            }
            const get = http.get as jest.Mock
            get.mockResolvedValue(mockResult)

            const bal = await wallet.getBalances()

            expect(get).toHaveBeenCalledWith('/wallet/balance')
            expect(bal.total_usd).toBe(1000)
            expect(bal.assets.length).toBe(2)
        })

        test('gets specific asset balance', async () => {
            const mockResult = {
                assets: [{ asset: 'LTD', amount: '123' }]
            }
            const get = http.get as jest.Mock
            get.mockResolvedValue(mockResult)

            const amt = await wallet.getBalance('LTD')
            expect(amt).toBe('123')
        })
    })

    describe('transactions', () => {
        test('returns list of transactions with filters', async () => {
            const mockTx = [{ id: 'tx_1', asset: 'LTD', amount: '10' }]
            const get = http.get as jest.Mock
            get.mockResolvedValue(mockTx)

            const res = await wallet.getTransactions({ limit: 10 })

            expect(get).toHaveBeenCalledWith('/wallet/transactions', { body: { limit: 10 } })
            expect(res[0].id).toBe('tx_1')
        })
    })

    describe('sending funds', () => {
        test('posts to send endpoint', async () => {
            const mockRes = { id: 'new_tx' }
            const post = http.post as jest.Mock
            post.mockResolvedValue(mockRes)

            const req = { to_address: '0x123', asset: 'LTD' as const, amount: '50' }
            const r = await wallet.send(req)

            expect(post).toHaveBeenCalledWith('/wallet/send', req)
            expect(r.id).toBe('new_tx')
        })
    })

    describe('receiving', () => {
        test('gets public address', async () => {
            ; (http.get as jest.Mock).mockResolvedValue({ address: '0xMYADD' })

            const add = await wallet.getReceiveAddress('ETH')

            expect(http.get).toHaveBeenCalledWith('/wallet/receive', { body: { asset: 'ETH' } })
            expect(add).toBe('0xMYADD')
        })
    })

    describe('security/locking', () => {
        test('locks funds for group', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue({ success: true, tx_id: 'lock_1' })

            const r = await wallet.lockFunds({ group_id: 'g1', tanda_id: 't1', amount: '100' })

            expect(post).toHaveBeenCalledWith('/wallet/security/lock', { group_id: 'g1', tanda_id: 't1', amount: '100' })
            expect(r.success).toBe(true)
        })

        test('unlocks by id', async () => {
            const post = http.post as jest.Mock
            post.mockResolvedValue({ success: true })

            const r = await wallet.unlockFunds('l123')

            expect(post).toHaveBeenCalledWith('/wallet/security/unlock/l123')
            expect(r.success).toBe(true)
        })
    })
})
