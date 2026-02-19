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

    test('list calls GET /notifications', async () => {
        mockHttp.get.mockResolvedValue([{ id: 'n1', title: 'Alert' }])

        const result = await client.notifications.list()

        expect(mockHttp.get).toHaveBeenCalledWith('/notifications', undefined)
        expect(result[0].title).toBe('Alert')
    })

    test('markRead calls PUT /notifications/:id/read', async () => {
        mockHttp.put.mockResolvedValue({ success: true })
        const result = await client.notifications.markRead('n123')
        expect(mockHttp.put).toHaveBeenCalledWith('/notifications/n123/read')
        expect(result.success).toBe(true)
    })

    test('getUnreadCount calls GET /notifications/unread-count', async () => {
        mockHttp.get.mockResolvedValue({ count: 5 })

        const result = await client.notifications.getUnreadCount()

        expect(mockHttp.get).toHaveBeenCalledWith('/notifications/unread-count')
        expect(result.count).toBe(5)
    })

    test('markAllRead calls POST /notifications/read-all', async () => {
        mockHttp.post.mockResolvedValue({ success: true })

        const result = await client.notifications.markAllRead()

        expect(mockHttp.post).toHaveBeenCalledWith('/notifications/read-all')
        expect(result.success).toBe(true)
    })

    test('updatePreferences calls PUT /notifications/preferences', async () => {
        const data = { email: true }
        mockHttp.put.mockResolvedValue({ email: true, push: false })

        const result = await client.notifications.updatePreferences(data)

        expect(mockHttp.put).toHaveBeenCalledWith('/notifications/preferences', data)
        expect(result.email).toBe(true)
    })
})
