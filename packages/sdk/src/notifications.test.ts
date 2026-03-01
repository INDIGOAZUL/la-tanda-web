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

    test('list calls GET /notifications and returns wrapped response', async () => {
        const mockResponse = {
            notifications: [{ id: 'n1', title: 'Alert' }],
            total: 1,
            unread: 1
        }
        mockHttp.get.mockResolvedValue(mockResponse)

        const result = await client.notifications.list()

        expect(mockHttp.get).toHaveBeenCalledWith('/notifications', undefined)
        expect(result.notifications[0].title).toBe('Alert')
        expect(result.unread).toBe(1)
    })

    test('markRead calls POST /notifications/read/:id', async () => {
        mockHttp.post.mockResolvedValue({ success: true })
        const result = await client.notifications.markRead('n123')
        expect(mockHttp.post).toHaveBeenCalledWith('/notifications/read/n123')
        expect(result.success).toBe(true)
    })

    test('getUnreadCount calls GET /notifications/unread-count', async () => {
        mockHttp.get.mockResolvedValue({ unread_count: 5, user_id: 'u1' })

        const result = await client.notifications.getUnreadCount()

        expect(mockHttp.get).toHaveBeenCalledWith('/notifications/unread-count')
        expect(result.unread_count).toBe(5)
    })

    test('markAllRead calls POST /notifications/read-all', async () => {
        mockHttp.post.mockResolvedValue({ success: true })

        const result = await client.notifications.markAllRead()

        expect(mockHttp.post).toHaveBeenCalledWith('/notifications/read-all')
        expect(result.success).toBe(true)
    })

    test('updatePreferences calls PUT /notifications/preferences', async () => {
        const data = { marketing: true }
        mockHttp.put.mockResolvedValue({ marketing: true, push_enabled: false })

        const result = await client.notifications.updatePreferences(data)

        expect(mockHttp.put).toHaveBeenCalledWith('/notifications/preferences', data)
        expect(result.marketing).toBe(true)
    })
})
