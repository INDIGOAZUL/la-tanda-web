// tests for lottery module
// aligned with La Tanda v3.92.0

import { LaTandaClient } from './client'

describe('LotteryModule', () => {
    let client: LaTandaClient

    beforeEach(() => {
        client = new LaTandaClient()
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: () => Promise.resolve({ success: true, data: [] }),
            })
        ) as jest.Mock
    })

    test('listDraws calls correct endpoint', async () => {
        await client.lottery.listDraws({ status: 'completed' })
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/draws?status=completed'),
            expect.any(Object)
        )
    })

    test('performDraw calls correct endpoint', async () => {
        await client.lottery.performDraw('g123')
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/draws/perform'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ group_id: 'g123' })
            })
        )
    })

    test('getWeights calls correct endpoint', async () => {
        await client.lottery.getWeights('g123')
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lottery/groups/g123/weights'),
            expect.any(Object)
        )
    })
})
