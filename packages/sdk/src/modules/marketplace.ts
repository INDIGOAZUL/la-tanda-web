// marketplace module - handles community-driven product listings and sales
// aligned with La Tanda v3.92.0

import { HttpClient } from '../utils/http'
import type {
    Product,
    CreateProductData,
    ProductFilters
} from '../types/marketplace'

/**
 * Handles marketplace interactions like listing products and viewing orders.
 */
export class MarketplaceModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    /**
     * Lists all products available in the community marketplace.
     * @param filters - Optional filters for category, price range, and seller.
     */
    async listProducts(filters: ProductFilters = {}): Promise<Product[]> {
        return this._http.get<Product[]>('/marketplace/products', filters)
    }

    /**
     * Creates a new product listing in the marketplace.
     * @param data - The configuration for the new listing (name, price, category, etc).
     */
    async createProduct(data: CreateProductData): Promise<Product> {
        return this._http.post<Product>('/marketplace/create-product', data)
    }
}
