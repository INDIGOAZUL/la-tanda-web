import { LaTandaClient } from './client'
import { HttpClient } from './utils/http'

jest.mock('./utils/http')

describe('VerificationModule', () => {
    let client: LaTandaClient
    let mockHttp: jest.Mocked<HttpClient>

    beforeEach(() => {
        client = new LaTandaClient({ baseUrl: 'https://api.test' })
        mockHttp = client.getHttpClient() as jest.Mocked<HttpClient>
    })

    test('uploadDocument calls POST /api/kyc/upload-document with FormData', async () => {
        const mockFile = new Blob(['test'], { type: 'image/png' })
        mockHttp.post.mockResolvedValue({ success: true, url: 'doc_url' })

        const result = await client.verification.uploadDocument(mockFile, 'id_card')

        expect(mockHttp.post).toHaveBeenCalledWith('/kyc/upload-document', expect.any(FormData))
        expect(result.success).toBe(true)
    })

    test('processOCR calls POST /api/kyc/process-ocr', async () => {
        const data = { document_url: 'doc_url', document_type: 'id_card' as const }
        mockHttp.post.mockResolvedValue({ success: true, data: { full_name: 'John Doe' } })

        const result = await client.verification.processOCR(data)

        expect(mockHttp.post).toHaveBeenCalledWith('/kyc/process-ocr', data)
        expect(result.data.full_name).toBe('John Doe')
    })

    test('getStatus calls GET /api/kyc/status', async () => {
        mockHttp.get.mockResolvedValue({ status: 'verified', requirements_met: true })

        const result = await client.verification.getStatus()

        expect(mockHttp.get).toHaveBeenCalledWith('/kyc/status')
        expect(result.status).toBe('verified')
    })
})
