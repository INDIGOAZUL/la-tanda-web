import { LaTandaClient } from './client'
import { HttpClient } from './utils/http'

jest.mock('./utils/http')

describe('ProvidersModule', () => {
    let client: LaTandaClient
    let mockHttp: jest.Mocked<HttpClient>

    beforeEach(() => {
        client = new LaTandaClient({ baseUrl: 'https://api.test' })
        mockHttp = client.getHttpClient() as jest.Mocked<HttpClient>
    })

    test('register calls POST /api/marketplace/providers/register', async () => {
        const data = {
            business_name: 'Test Shop',
            description: 'A professional test shop',
            phone: '+504 9999-9999',
            email: 'shop@test.com',
            city: 'TEG',
            neighborhood: 'Central',
            shop_type: 'products' as const
        }
        mockHttp.post.mockResolvedValue({ id: 'p1', ...data })

        const result = await client.providers.register(data)

        expect(mockHttp.post).toHaveBeenCalledWith('/marketplace/providers/register', data)
        expect(result.id).toBe('p1')
    })

    test('getProfile calls GET /api/marketplace/providers/me', async () => {
        mockHttp.get.mockResolvedValue({ id: 'p1', business_name: 'Test Shop' })

        const result = await client.providers.getProfile()

        expect(mockHttp.get).toHaveBeenCalledWith('/marketplace/providers/me')
        expect(result.business_name).toBe('Test Shop')
    })

    test('updateProfile calls PUT /api/marketplace/providers/me', async () => {
        const data = { description: 'Updated info' }
        mockHttp.put.mockResolvedValue({ id: 'p1', ...data })

        const result = await client.providers.updateProfile(data)

        expect(mockHttp.put).toHaveBeenCalledWith('/marketplace/providers/me', data)
        expect(result.description).toBe('Updated info')
    })
})
