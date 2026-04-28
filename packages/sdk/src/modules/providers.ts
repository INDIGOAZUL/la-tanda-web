// providers module - handles marketplace business registration and profile management
// aligned with La Tanda v4.11.0+

import { HttpClient } from '../utils/http'
import type { ProviderRegistration, ProviderProfile, ProviderUpdate, ProviderFilters } from '../types/providers'

/**
 * The ProvidersModule handles the lifecycle of a "Mi Tienda" business account.
 * This includes everything from the initial registration as a vendor to 
 * managing the public profile and store configuration.
 * 
 * @category Marketplace
 */
export class ProvidersModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    /**
     * Registers the authenticated user as a marketplace provider.
     * 
     * NOTE: This is the primary onboarding endpoint for Mi Tienda. Successful 
     * registration will transition the user's role and allow them to start 
     * listing products/services.
     * 
     * @param data - The full registration payload including business identity.
     * @returns The newly created provider profile.
     */
    async register(data: ProviderRegistration): Promise<ProviderProfile> {
        return this._http.post<ProviderProfile>('/marketplace/providers/register', data)
    }

    /**
     * Retrieves a paginated list of marketplace providers.
     * 
     * @param filters - Optional search criteria like city and verification status.
     * @returns A list of matching provider profiles.
     */
    async listProviders(filters?: ProviderFilters): Promise<ProviderProfile[]> {
        return this._http.get<ProviderProfile[]>('/marketplace/providers', filters)
    }

    /**
     * Retrieves a specific provider profile by its unique ID.
     * 
     * @param id - The UUID of the provider to fetch.
     * @returns The requested provider profile.
     */
    async getProviderById(id: string): Promise<ProviderProfile> {
        return this._http.get<ProviderProfile>(`/marketplace/providers/${id}`)
    }

    /**
     * Retrieves the current user's provider profile.
     * 
     * This method will throw a NotFoundError if the user is not yet 
     * registered as a provider.
     * 
     * @returns The active business profile.
     */
    async getProfile(): Promise<ProviderProfile> {
        return this._http.get<ProviderProfile>('/marketplace/providers/me')
    }

    /**
     * Performs a partial update on the user's provider profile.
     * 
     * Ideal for updating description or social links without 
     * resubmitting the entire registration record.
     * 
     * @param data - The subset of fields to update.
     * @returns The updated provider profile.
     */
    async updateProfile(data: ProviderUpdate): Promise<ProviderProfile> {
        return this._http.put<ProviderProfile>('/marketplace/providers/me', data)
    }
}
