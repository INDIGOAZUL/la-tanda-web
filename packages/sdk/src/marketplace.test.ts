// tests for marketplace module
// aligned with La Tanda v3.92.0

import { LaTandaClient } from './client'

describe('MarketplaceModule', () => {
    let client: LaTandaClient

    beforeEach(() => {
        client = new LaTandaClient()
        // mock fetch globally
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: () => Promise.resolve({ data: [] }),
            })
        ) as jest.Mock
    })

    test('gets categories', async () => {
        await client.marketplace.getCategories()
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/marketplace/categories'),
            expect.any(Object)
        )
    })

    test('gets products with filters', async () => {
        await client.marketplace.getProducts({ category_id: 'cat_123', limit: 10 })
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/marketplace/products?category_id=cat_123&limit=10'),
            expect.any(Object)
        )
    })

    test('creates a product', async () => {
        const productData = {
            name: 'Test Product',
            description: 'Cool stuff',
            price: '100',
            category_id: 'cat_1',
            stock: 10
        }
        await client.marketplace.createProduct(productData)
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/marketplace/products'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(productData)
            })
        )
    })

    test('posts a review', async () => {
        await client.marketplace.createReview('prod_1', 5, 'Great!')
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/marketplace/products/prod_1/reviews'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ rating: 5, comment: 'Great!' })
            })
        )
    })
})
