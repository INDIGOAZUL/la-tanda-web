import { LaTandaClient } from './client'
import { HttpClient } from './utils/http'

jest.mock('./utils/http')

describe('NotificationModule', () => {
    let client: LaTandaClient
    let mockHttp: jest.Mocked<HttpClient>

    beforeEach(() => {
        client = new LaTandaClient({ baseUrl: 'https://api.test' })
        mockHttp = client.getHttpClient() as jest.Mocked<HttpClient>
    })

    test('list calls GET /api/notifications', async () => {
        mockHttp.get.mockResolvedValue([{ id: 'n1', title: 'Alert' }])

        const result = await client.notifications.list()

        expect(mockHttp.get).toHaveBeenCalledWith('/api/notifications', undefined)
        expect(result[0].title).toBe('Alert')
    })

    test('getUnreadCount calls GET /api/notifications/unread-count', async () => {
        mockHttp.get.mockResolvedValue({ count: 5 })

        const result = await client.notifications.getUnreadCount()

        expect(mockHttp.get).toHaveBeenCalledWith('/api/notifications/unread-count')
        expect(result.count).toBe(5)
    })

    test('markAllRead calls POST /api/notifications/read-all', async () => {
        mockHttp.post.mockResolvedValue({ success: true })

        const result = await client.notifications.markAllRead()

        expect(mockHttp.post).toHaveBeenCalledWith('/api/notifications/read-all')
        expect(result.success).toBe(true)
    })

    test('updatePreferences calls PUT /api/notifications/preferences', async () => {
        const data = { email: true }
        mockHttp.put.mockResolvedValue({ email: true, push: false })

        const result = await client.notifications.updatePreferences(data)

        expect(mockHttp.put).toHaveBeenCalledWith('/api/notifications/preferences', data)
        expect(result.email).toBe(true)
    })
})
