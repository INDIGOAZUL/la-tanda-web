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

    // --- Phase 3 Tests ---

    test('getActiveGames calls /lottery/games/active', async () => {
        await client.lottery.getActiveGames()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/games/active'),
            expect.any(Object)
        )
    })

    test('getGameDetail calls /lottery/games/:id', async () => {
        await client.lottery.getGameDetail('game_123')
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/games/game_123'),
            expect.any(Object)
        )
    })

    test('getDraws calls /lottery/games/:id/draws', async () => {
        await client.lottery.getDraws('game_123')
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/games/game_123/draws'),
            expect.any(Object)
        )
    })

    test('buyTicket calls POST /lottery/tickets/buy', async () => {
        const data = { game_id: 'g1', draw_id: 'd1', numbers: [[1, 2, 3]] }
        await client.lottery.buyTicket(data)
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/tickets/buy'),
            expect.objectContaining({ method: 'POST', body: JSON.stringify(data) })
        )
    })

    test('getUserTickets calls /lottery/tickets', async () => {
        await client.lottery.getUserTickets()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/tickets'),
            expect.any(Object)
        )
    })

    test('getTicketDetail calls /lottery/tickets/:id', async () => {
        await client.lottery.getTicketDetail('tick_123')
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/tickets/tick_123'),
            expect.any(Object)
        )
    })

    test('claimWinnings calls POST /lottery/tickets/:id/claim', async () => {
        await client.lottery.claimWinnings('tick_123')
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/tickets/tick_123/claim'),
            expect.objectContaining({ method: 'POST' })
        )
    })

    test('submitPrediction calls POST /lottery/predictions', async () => {
        const data = { game_id: 'g1', predicted_numbers: [1, 2, 3] }
        await client.lottery.submitPrediction(data)
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/predictions'),
            expect.objectContaining({ method: 'POST', body: JSON.stringify(data) })
        )
    })

    test('getUserPredictions calls /lottery/predictions', async () => {
        await client.lottery.getUserPredictions()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/predictions'),
            expect.any(Object)
        )
    })

    test('getPredictionHistory calls /lottery/predictions/history', async () => {
        await client.lottery.getPredictionHistory()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/predictions/history'),
            expect.any(Object)
        )
    })

    test('getHitRateStats calls /lottery/predictions/stats', async () => {
        await client.lottery.getHitRateStats()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/predictions/stats'),
            expect.any(Object)
        )
    })

    test('getGameLeaderboard calls /lottery/games/:id/leaderboard', async () => {
        await client.lottery.getGameLeaderboard('game_123')
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/games/game_123/leaderboard'),
            expect.any(Object)
        )
    })
})
