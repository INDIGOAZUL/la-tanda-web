// tests for lottery module (prediction engine and full game system)
// SDK Phase 3 - Updated for full coverage

import { LaTandaClient } from './client'

describe('LotteryModule (Prediction Engine & Game System)', () => {
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

    // --- Section A: Game Catalog Tests ---

    test('listGames calls GET /lottery/games', async () => {
        await client.lottery.listGames()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/games'),
            expect.objectContaining({ method: 'GET' })
        )
    })

    test('getGameDetail calls GET /lottery/games/:id', async () => {
        const gameId = 'game_456'
        await client.lottery.getGameDetail(gameId)
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/lottery/games/${gameId}`),
            expect.any(Object)
        )
    })

    test('listDraws calls GET /lottery/games/:id/draws', async () => {
        const gameId = 'game_456'
        await client.lottery.listDraws(gameId)
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/lottery/games/${gameId}/draws`),
            expect.any(Object)
        )
    })

    // --- Section B: Ticket Tests ---

    test('buyTickets calls POST /lottery/tickets/buy', async () => {
        const drawId = 'draw_789'
        const numbers = [[1, 2, 3], [4, 5, 6]]
        await client.lottery.buyTickets(drawId, numbers)
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/tickets/buy'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ draw_id: drawId, numbers })
            })
        )
    })

    test('listUserTickets calls GET /lottery/tickets/me', async () => {
        await client.lottery.listUserTickets()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/tickets/me'),
            expect.any(Object)
        )
    })

    test('getTicketDetail calls GET /lottery/tickets/:id', async () => {
        const ticketId = 'tkt_123'
        await client.lottery.getTicketDetail(ticketId)
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/lottery/tickets/${ticketId}`),
            expect.any(Object)
        )
    })

    test('claimWinnings calls POST /lottery/tickets/:id/claim', async () => {
        const ticketId = 'tkt_123'
        await client.lottery.claimWinnings(ticketId)
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/lottery/tickets/${ticketId}/claim`),
            expect.objectContaining({ method: 'POST' })
        )
    })

    // --- Section C: Predictions Tests ---

    test('submitPrediction calls POST /lottery/predictions', async () => {
        const gameId = 'game_456'
        const numbers = [7, 8, 9]
        await client.lottery.submitPrediction(gameId, numbers)
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/predictions'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ game_id: gameId, numbers })
            })
        )
    })

    test('listUserPredictions calls GET /lottery/predictions/me', async () => {
        await client.lottery.listUserPredictions()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/predictions/me'),
            expect.any(Object)
        )
    })

    test('getPredictorStats calls GET /lottery/predictor/stats', async () => {
        await client.lottery.getPredictorStats()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/predictor/stats'),
            expect.any(Object)
        )
    })

    test('getMLPredictions calls GET /lottery/predictions/ml/:id', async () => {
        const gameId = 'game_123'
        await client.lottery.getMLPredictions(gameId)
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/lottery/predictions/ml/${gameId}`),
            expect.any(Object)
        )
    })

    test('getEnsemblePredictions calls GET /lottery/predictions/ensemble/:id', async () => {
        const gameId = 'game_123'
        await client.lottery.getEnsemblePredictions(gameId)
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/lottery/predictions/ensemble/${gameId}`),
            expect.any(Object)
        )
    })

    test('getAccuracyDashboard calls GET /lottery/predictor/dashboard', async () => {
        await client.lottery.getAccuracyDashboard()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/predictor/dashboard'),
            expect.any(Object)
        )
    })

    // --- Section D: Analysis & Leaderboard Tests ---

    test('getLeaderboard calls /lottery/leaderboard (global)', async () => {
        await client.lottery.getLeaderboard()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/leaderboard'),
            expect.any(Object)
        )
    })

    test('getLeaderboard calls /lottery/leaderboard/:id (game-specific)', async () => {
        const gameId = 'loto_hn'
        await client.lottery.getLeaderboard(gameId)
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/lottery/leaderboard/${gameId}`),
            expect.any(Object)
        )
    })

    test('getTablaJaladora calls GET /lottery/analysis/tabla-jaladora', async () => {
        await client.lottery.getTablaJaladora()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/analysis/tabla-jaladora'),
            expect.any(Object)
        )
    })

    // --- Error Handling & Edge Cases ---

    test('buyTickets throws error if drawId is empty', async () => {
        await expect(client.lottery.buyTickets('', [[1, 2]]))
            .rejects.toThrow()
    })

    test('getGameDetail throws error if gameId is empty', async () => {
        await expect(client.lottery.getGameDetail(''))
            .rejects.toThrow()
    })

    test('submitPrediction handles server error (500)', async () => {
        ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: () => Promise.resolve({ error: 'Failed' })
            })
        )
        await expect(client.lottery.submitPrediction('game1', [1, 2]))
            .rejects.toThrow()
    })

    test('listDraws handles empty results', async () => {
        ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: () => Promise.resolve({ success: true, data: [] }),
            })
        )
        const draws = await client.lottery.listDraws('game1')
        expect(draws).toEqual([])
    })

    test('claimWinnings handles unauthorized error (401)', async () => {
        ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ error: 'Unauthorized' })
            })
        )
        await expect(client.lottery.claimWinnings('tkt1'))
            .rejects.toThrow()
    })

    test('buyTickets verifies payload structure', async () => {
        const drawId = 'draw1'
        const numbers = [[10, 20]]
        await client.lottery.buyTickets(drawId, numbers)
        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: JSON.stringify({ draw_id: drawId, numbers })
            })
        )
    })

    test('submitPrediction verifies payload structure', async () => {
        const gameId = 'game1'
        const numbers = [5, 15, 25]
        await client.lottery.submitPrediction(gameId, numbers)
        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: JSON.stringify({ game_id: gameId, numbers })
            })
        )
    })

    test('getResults handles malformed JSON response', async () => {
        ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: () => Promise.reject(new Error('Invalid JSON'))
            })
        )
        await expect(client.lottery.getResults()).rejects.toThrow()
    })

    test('listGames uses default GET method', async () => {
        await client.lottery.listGames()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ method: 'GET' })
        )
    })

    test('getPredictorStats returns typed data', async () => {
        const mockStats = { total_picks: 100, hits: 20, hit_rate: 0.2 }
        ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: () => Promise.resolve({ success: true, data: mockStats }),
            })
        )
        const stats = await client.lottery.getPredictorStats()
        expect(stats).toEqual(mockStats)
    })

    test('getMLPredictions returns array of predictions', async () => {
        const mockPredictions = [{ numbers: [1, 2], confidence_score: 0.85 }]
        ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: () => Promise.resolve({ success: true, data: mockPredictions }),
            })
        )
        const preds = await client.lottery.getMLPredictions('game1')
        expect(preds).toEqual(mockPredictions)
        expect(Array.isArray(preds)).toBe(true)
    })

    // --- Legacy Tests ---

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
