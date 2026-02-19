// providers module - handles marketplace business registration and profile management
// aligned with La Tanda v4.6.1+

import { HttpClient } from '../utils/http'
import type { ProviderRegistration, ProviderProfile, ProviderUpdate } from '../types/providers'

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
     * @param data - The full registration payload including business identity 
     *               and store preferences.
     * @returns The newly created provider profile.
     */
    async register(data: ProviderRegistration): Promise<ProviderProfile> {
        return this._http.post<ProviderProfile>('/api/marketplace/providers/register', data)
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
        return this._http.get<ProviderProfile>('/api/marketplace/providers/me')
    }

    /**
     * Performs a partial update on the user's provider profile.
     * 
     * Ideal for updating opening hours, description, or social links 
     * without resubmitting the entire registration record.
     * 
     * @param data - The subset of fields to update.
     * @returns The updated provider profile.
     */
    async updateProfile(data: ProviderUpdate): Promise<ProviderProfile> {
        return this._http.put<ProviderProfile>('/api/marketplace/providers/me', data)
    }
}
