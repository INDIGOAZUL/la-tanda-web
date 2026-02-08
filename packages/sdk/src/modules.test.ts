// tests for the new feed and tandas modules

import { FeedModule } from './modules/feed'
import { TandasModule } from './modules/tandas'
import { HttpClient } from './utils/http'

const mockHttp = () => {
    return {
        get: jest.fn(),
        post: jest.fn(),
    } as unknown as HttpClient
}

describe('FeedModule', () => {
    let feed: FeedModule
    let http: ReturnType<typeof mockHttp>

    beforeEach(() => {
        http = mockHttp()
        feed = new FeedModule(http as any)
    })

    test('gets posts with filters', async () => {
        await feed.getPosts({ limit: 5 })
        expect(http.get).toHaveBeenCalledWith('/social/posts', { limit: 5 })
    })

    test('creates post', async () => {
        const data = { content: 'hello world' }
        await feed.createPost(data)
        expect(http.post).toHaveBeenCalledWith('/social/create-post', data)
    })
})

describe('TandasModule', () => {
    let tandas: TandasModule
    let http: ReturnType<typeof mockHttp>

    beforeEach(() => {
        http = mockHttp()
        tandas = new TandasModule(http as any)
    })

    test('listGroups uses filters', async () => {
        await tandas.listGroups({ status: 'active' })
        expect(http.get).toHaveBeenCalledWith('/groups/list', { status: 'active' })
    })

    test('joinGroup calls specific endpoint', async () => {
        await tandas.joinGroup('abc')
        expect(http.post).toHaveBeenCalledWith('/groups/abc/join')
    })
})
