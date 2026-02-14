// marketplace module - community-driven product listings, purchases, and services
// aligned with La Tanda v4.3.1

import { HttpClient } from '../utils/http'
import { validateId } from '../utils/validation'
import type {
    Product,
    CreateProductData,
    ProductFilters
} from '../types/marketplace'

/**
 * Handles marketplace interactions — listing, creating, and purchasing products.
 */
export class MarketplaceModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    /**
     * Lists all products available in the community marketplace.
     */
    async listProducts(filters: ProductFilters = {}): Promise<Product[]> {
        return this._http.get<Product[]>('/marketplace/products', filters)
    }

    /**
     * Gets details of a specific product.
     */
    async getProduct(productId: string): Promise<Product> {
        validateId(productId, 'productId')
        return this._http.get<Product>(`/marketplace/products/${productId}`)
    }

    /**
     * Creates a new product listing (RESTful POST to /products).
     */
    async createProduct(data: CreateProductData): Promise<Product> {
        return this._http.post<Product>('/marketplace/products', data)
    }

    /**
     * Purchases a product.
     */
    async buyProduct(productId: string): Promise<{ success: boolean; transaction_id: string }> {
        validateId(productId, 'productId')
        return this._http.post(`/marketplace/products/${productId}/buy`)
    }

    /**
     * Lists the current user's own product listings.
     */
    async getMyProducts(): Promise<Product[]> {
        return this._http.get<Product[]>('/marketplace/products/my')
    }

    /**
     * Lists available services in the marketplace.
     */
    async getServices(): Promise<any[]> {
        return this._http.get('/marketplace/services')
    }

    /**
     * Gets product categories.
     */
    async getCategories(): Promise<any[]> {
        return this._http.get('/marketplace/categories')
    }

    /**
     * Submits a review for a product.
     */
    async submitReview(data: { product_id: string; rating: number; comment?: string }): Promise<{ success: boolean }> {
        return this._http.post('/marketplace/reviews', data)
    }
}
