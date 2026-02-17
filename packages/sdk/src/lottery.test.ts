// tests for lottery module (prediction engine)
// aligned with La Tanda v4.3.1

import { LaTandaClient } from './client'

describe('LotteryModule (Prediction Engine)', () => {
    let client: LaTandaClient

    beforeEach(() => {
        client = new LaTandaClient({ baseUrl: 'https://test.latanda.online' })
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: () => Promise.resolve({ success: true, data: {} }),
            })
        ) as jest.Mock
    })

    test('getStats calls /lottery/stats', async () => {
        await client.lottery.getStats()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/stats'),
            expect.any(Object)
        )
    })

    test('spin calls POST /lottery/spin', async () => {
        await client.lottery.spin()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/spin'),
            expect.objectContaining({ method: 'POST' })
        )
    })

    test('trialSpin calls POST /lottery/trial-spin', async () => {
        await client.lottery.trialSpin()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/trial-spin'),
            expect.objectContaining({ method: 'POST' })
        )
    })

    test('getResults calls /lottery/results', async () => {
        await client.lottery.getResults()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/results'),
            expect.any(Object)
        )
    })

    test('getLeaderboard calls /lottery/leaderboard', async () => {
        await client.lottery.getLeaderboard()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/leaderboard'),
            expect.any(Object)
        )
    })

    test('getHistory calls /lottery/history', async () => {
        await client.lottery.getHistory()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/history'),
            expect.any(Object)
        )
    })

    test('sharePrediction calls POST /lottery/share-prediction', async () => {
        const data = { prediction_id: 'pred_123', message: 'Lucky numbers!' }
        await client.lottery.sharePrediction(data)
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/share-prediction'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(data)
            })
        )
    })
})
