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
                json: () => Promise.resolve({ success: true, data: [] }),
            })
        ) as jest.Mock
    })

    test('lists products with filters', async () => {
        await client.marketplace.listProducts({ category: 'home', limit: 10 })
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/marketplace/products?category=home&limit=10'),
            expect.any(Object)
        )
    })


    test('lists products with advanced filters', async () => {
        await client.marketplace.listProducts({ category: 'home', min_price: '50', limit: 20 })
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('category=home'),
            expect.any(Object)
        )
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('min_price=50'),
            expect.any(Object)
        )
    })

    test('creates a product', async () => {
        const productData = {
            name: 'Test Product',
            description: 'Cool stuff',
            price: '100',
            category: 'home'
        }
        await client.marketplace.createProduct(productData)
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/marketplace/create-product'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(productData)
            })
        )
    })

    test('handles api failure during listing', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                status: 400,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: () => Promise.resolve({ error: 'Invalid category' })
            })
        ) as jest.Mock

        await expect(client.marketplace.listProducts({ category: 'invalid' }))
            .rejects.toThrow('Invalid category')
    })
})
