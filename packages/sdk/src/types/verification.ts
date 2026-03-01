// verification types - handles identity verification and KYC flows
// aligned with La Tanda v4.11.0+

export type KycStatus = 'not_started' | 'pending' | 'verified' | 'rejected';
export type DocumentType = 'id_card' | 'passport' | 'drivers_license' | 'residence_permit';

export interface IdentityStatus {
    status: KycStatus;
    identities: {
        document_type: DocumentType;
        verified: boolean;
        updated_at: string;
    }[];
    selfie_verified: boolean;
    ocr_processed: boolean;
    requirements_met: boolean;
}

export interface OcrRequest {
    document_url: string;
    document_type: DocumentType;
}

export interface OcrResult {
    success: boolean;
    data: {
        full_name: string;
        id_number: string;
        birth_date: string;
        expiry_date?: string;
        nationality: string;
    };
}

export interface VerificationResult {
    success: boolean;
    message?: string;
}
