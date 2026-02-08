// tests for the core http client

import { HttpClient } from './http'
import { LaTandaError, TokenExpiredError, NetworkError } from '../errors'

// helper to mock fetch
const mockFetch = (resp: any, ok = true, status = 200) => {
    global.fetch = jest.fn().mockResolvedValue({
        ok,
        status,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => resp,
        text: async () => JSON.stringify(resp)
    })
}

describe('HttpClient', () => {
    let client: HttpClient

    beforeEach(() => {
        client = new HttpClient('https://test.com')
        jest.clearAllMocks()
    })

    test('automatically adds /api prefix to paths', async () => {
        mockFetch({ success: true, data: 'ok' })
        await client.get('test')

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('https://test.com/api/test'),
            expect.anything()
        )
    })

    test('converts GET body to query params', async () => {
        mockFetch({ success: true, data: 'ok' })
        await client.get('search', { q: 'hello', limit: 10 })

        const url = (global.fetch as jest.Mock).mock.calls[0][0]
        expect(url).toContain('q=hello')
        expect(url).toContain('limit=10')

        const options = (global.fetch as jest.Mock).mock.calls[0][1]
        expect(options.body).toBeUndefined()
    })

    test('prevents infinite recursion on token refresh', async () => {
        // mock a failed refresh that keeps returning 401
        let refreshCount = 0
        const onRefresh = jest.fn().mockImplementation(async () => {
            refreshCount++
            return 'new-token'
        })
        client.setTokenRefreshHandler(onRefresh)

        // mock api returning 401 every time
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 401,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ success: false, error: { code: 401, message: 'Expired' } })
        })

        await expect(client.get('secure')).rejects.toThrow(TokenExpiredError)

        // should only try refresh ONCE because of the guard
        expect(onRefresh).toHaveBeenCalledTimes(1)
        expect(global.fetch).toHaveBeenCalledTimes(2) // initial call + 1 retry
    })

    test('handles non-json responses', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'text/plain' }),
            text: async () => 'raw-text'
        })

        const res = await client.get('raw')
        expect(res).toBe('raw-text')
    })

    test('throws LaTandaError on api failure', async () => {
        mockFetch({ success: false, error: { code: 999, message: 'Boom' } }, false, 400)

        await expect(client.get('fail')).rejects.toThrow(LaTandaError)
    })

    test('handles request timeout', async () => {
        client = new HttpClient('https://test.com', 1) // 1ms timeout
        global.fetch = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

        await expect(client.get('slow')).rejects.toThrow(NetworkError)
    })
})
