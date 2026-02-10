// tests for the new feed and tandas modules
// aligned with La Tanda v3.92.0

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
        expect(http.get).toHaveBeenCalledWith('/feed/social/posts', { limit: 5 })
    })

    test('creates post', async () => {
        const data = { content: 'hello world' }
        await feed.createPost(data)
        expect(http.post).toHaveBeenCalledWith('/feed/social/posts', data)
    })

    test('toggleLike calls correct endpoint', async () => {
        await feed.toggleLike('post_123')
        expect(http.post).toHaveBeenCalledWith('/feed/social/posts/post_123/like')
    })

    test('getComments calls correct endpoint', async () => {
        await feed.getComments('post_123')
        expect(http.get).toHaveBeenCalledWith('/feed/social/posts/post_123/comments')
    })

    test('addComment calls correct endpoint', async () => {
        await feed.addComment('post_123', 'great post!')
        expect(http.post).toHaveBeenCalledWith('/feed/social/posts/post_123/comment', { text: 'great post!' })
    })
})

describe('TandasModule', () => {
    let tandas: TandasModule
    let http: ReturnType<typeof mockHttp>

    beforeEach(() => {
        http = mockHttp()
        tandas = new TandasModule(http as any)
    })

    test('listGroups uses public endpoint', async () => {
        await tandas.listGroups({ status: 'active' })
        expect(http.get).toHaveBeenCalledWith('/groups/public', { status: 'active' })
    })

    test('listMyTandas uses specific endpoint', async () => {
        await tandas.listMyTandas()
        expect(http.get).toHaveBeenCalledWith('/tandas/my-tandas', {})
    })

    test('joinGroup uses registration namespace', async () => {
        await tandas.joinGroup('abc')
        expect(http.post).toHaveBeenCalledWith('/registration/groups/join/abc')
    })

    test('contribute uses group-specific endpoint', async () => {
        await tandas.contribute('g1', '100')
        expect(http.post).toHaveBeenCalledWith('/groups/g1/contribute', {
            amount: '100'
        })
    })

    test('getMembers uses details endpoint', async () => {
        const post = http.post as jest.Mock
        post.mockResolvedValue({ members: [{ user_id: 'u1', name: 'User 1' }] })

        const members = await tandas.getMembers('g1')
        expect(post).toHaveBeenCalledWith('/registration/groups/details', { groupId: 'g1' })
        expect(members.length).toBe(1)
    })
})
