// providers types - handles marketplace business registration and profile management
// aligned with La Tanda v4.11.0+

export interface ProviderRegistration {
    business_name: string;
    description: string;
    phone: string;
    whatsapp?: string;
    email: string;
    city: string;
    neighborhood: string;
    service_areas?: string;
    social_links?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        tiktok?: string;
    };
    shop_type: 'products' | 'services' | 'both';
}

export interface ProviderProfile extends ProviderRegistration {
    id: string;
    user_id: string;
    status: 'pending' | 'active' | 'suspended';
    verified: boolean;
    rating: number;
    review_count: number;
    created_at: string;
    updated_at: string;
}

export interface ProviderUpdate extends Partial<ProviderRegistration> { }

export interface ProviderFilters {
    city?: string;
    verified?: boolean;
    limit?: number;
    offset?: number;
}
