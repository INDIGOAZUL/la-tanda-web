import { HttpClient } from '../utils/http'
import { OcrRequest, OcrResult, IdentityStatus } from '../types/verification'

/**
 * The VerificationModule coordinates the Identity (KYC) flow for the platform.
 * It manages the secure transmission of sensitive documents and the 
 * interaction with the backend's OCR and biometric verification engines.
 * 
 * @category Safety & Trust
 */
export class VerificationModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    /**
     * Submits an identity document image or PDF for manual/automated review.
     * 
     * This method automatically wraps the file in a FormData object to ensure 
     * the binary data is handled correctly by the multipart/form-data boundary.
     * 
     * @param file - The binary Blob/File of the document.
     * @param type - The document classification (e.g., 'id_card', 'passport').
     */
    async uploadDocument(file: Blob, type: string): Promise<{ success: boolean; url: string }> {
        const formData = new FormData()
        formData.append('document', file)
        formData.append('document_type', type)

        return this._http.post<{ success: boolean; url: string }>('/kyc/upload-document', formData)
    }

    /**
     * Triggers the OCR engine to extract text information from an uploaded document.
     * 
     * Best practice: Call this after a successful `uploadDocument()` using the 
     * returned URL. This allows the user to review the extracted data for 
     * accuracy before final submission.
     */
    async processOCR(data: OcrRequest): Promise<OcrResult> {
        return this._http.post<OcrResult>('/kyc/process-ocr', data)
    }

    /**
     * Submits a selfie for biometric face-matching against the uploaded ID.
     * 
     * @param file - The binary camera capture of the user's face.
     */
    async uploadSelfie(file: Blob): Promise<{ success: boolean; url: string }> {
        const formData = new FormData()
        formData.append('selfie', file)

        return this._http.post<{ success: boolean; url: string }>('/kyc/upload-selfie', formData)
    }

    /**
     * Checks the current verification status across all identity requirements.
     * 
     * Useful for gated UI components that require 'verified' status to 
     * unlock restricted features.
     */
    async getStatus(): Promise<IdentityStatus> {
        return this._http.get<IdentityStatus>('/kyc/status')
    }
}
