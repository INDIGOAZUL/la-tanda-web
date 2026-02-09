// marketplace types - for products, orders and reviews

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export interface Category {
    id: string
    name: string
    slug: string
    description?: string
    parent_id?: string
}

export interface Product {
    id: string
    seller_id: string
    name: string
    description: string
    price: string
    currency: string
    stock: number
    images: string[]
    category_id: string
    rating: number
    review_count: number
    created_at: string
    updated_at: string
}

export interface Order {
    id: string
    buyer_id: string
    seller_id: string
    product_id: string
    quantity: number
    total_price: string
    currency: string
    status: OrderStatus
    shipping_address?: string
    tx_hash?: string
    created_at: string
}

export interface Review {
    id: string
    user_id: string
    user_name: string
    product_id: string
    rating: number
    comment?: string
    created_at: string
}

export interface ProductFilters {
    category_id?: string
    seller_id?: string
    min_price?: string
    max_price?: string
    search?: string
    sort_by?: 'price_asc' | 'price_desc' | 'newest' | 'rating'
    limit?: number
    offset?: number
}

export interface CreateProductData {
    name: string
    description: string
    price: string
    category_id: string
    stock: number
    images?: string[]
}

export interface CreateOrderData {
    product_id: string
    quantity: number
    shipping_address?: string
}
