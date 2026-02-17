// marketplace type definitions
// aligned with La Tanda v3.92.0

export interface Product {
    id: string
    seller_id: string
    name: string
    description: string
    price: string
    currency: string
    category: string
    image_url?: string
    status: 'available' | 'sold' | 'inactive'
    created_at: string
}


export interface CreateProductData {
    name: string
    description: string
    price: string
    category: string
    image_url?: string
}

export interface ProductFilters {
    category?: string
    min_price?: string
    max_price?: string
    seller_id?: string
    limit?: number
    offset?: number
}
