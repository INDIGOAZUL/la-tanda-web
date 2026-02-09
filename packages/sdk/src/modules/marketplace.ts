// marketplace module - for product listings, orders and reputation

import { HttpClient } from '../utils/http'
import type {
    Product,
    Category,
    Order,
    Review,
    ProductFilters,
    CreateProductData,
    CreateOrderData
} from '../types/marketplace'

export class MarketplaceModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    // list categories
    async getCategories(): Promise<Category[]> {
        return this._http.get<Category[]>('/marketplace/categories')
    }

    // search and filter products
    async getProducts(filters: ProductFilters = {}): Promise<Product[]> {
        return this._http.get<Product[]>('/marketplace/products', filters)
    }

    // get single product details
    async getProduct(productId: string): Promise<Product> {
        return this._http.get<Product>(`/marketplace/products/${productId}`)
    }

    // create a new product listing
    async createProduct(data: CreateProductData): Promise<Product> {
        return this._http.post<Product>('/marketplace/products', data)
    }

    // place an order
    async createOrder(data: CreateOrderData): Promise<Order> {
        return this._http.post<Order>('/marketplace/orders', data)
    }

    // list my orders
    async getMyOrders(): Promise<Order[]> {
        return this._http.get<Order[]>('/marketplace/my-orders')
    }

    // get product reviews
    async getReviews(productId: string): Promise<Review[]> {
        return this._http.get<Review[]>(`/marketplace/products/${productId}/reviews`)
    }

    // post a review
    async createReview(productId: string, rating: number, comment?: string): Promise<Review> {
        return this._http.post<Review>(`/marketplace/products/${productId}/reviews`, { rating, comment })
    }
}
