// tests for feed and tandas modules
// aligned with La Tanda v4.3.1

import { FeedModule } from './modules/feed'
import { TandasModule } from './modules/tandas'
import { HttpClient } from './utils/http'

const mockHttp = () => {
    return {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
    } as unknown as HttpClient
}

describe('FeedModule', () => {
    let feed: FeedModule
    let http: ReturnType<typeof mockHttp>

    beforeEach(() => {
        http = mockHttp()
        feed = new FeedModule(http as any)
    })

    test('gets posts from /feed/social', async () => {
        await feed.getPosts({ limit: 5 })
        expect(http.get).toHaveBeenCalledWith('/feed/social', { limit: 5 })
    })

    test('creates post to /feed/social', async () => {
        const data = { content: 'hello world' }
        await feed.createPost(data)
        expect(http.post).toHaveBeenCalledWith('/feed/social', data)
    })

    test('toggleLike calls correct endpoint (no /posts)', async () => {
        await feed.toggleLike('post_123')
        expect(http.post).toHaveBeenCalledWith('/feed/social/post_123/like')
    })

    test('getComments calls correct endpoint', async () => {
        await feed.getComments('post_123')
        expect(http.get).toHaveBeenCalledWith('/feed/social/post_123/comments')
    })

    test('addComment uses plural /comments endpoint', async () => {
        await feed.addComment('post_123', 'great post!')
        expect(http.post).toHaveBeenCalledWith('/feed/social/post_123/comments', { text: 'great post!' })
    })

    test('toggleBookmark calls correct endpoint', async () => {
        await feed.toggleBookmark('post_123')
        expect(http.post).toHaveBeenCalledWith('/feed/social/post_123/bookmark')
    })

    test('getBookmarks calls correct endpoint', async () => {
        await feed.getBookmarks()
        expect(http.get).toHaveBeenCalledWith('/feed/social/bookmarks')
    })

    test('deletePost uses DELETE method', async () => {
        await feed.deletePost('post_123')
        expect(http.delete).toHaveBeenCalledWith('/feed/social/post_123')
    })

    test('editPost uses PUT method', async () => {
        await feed.editPost('post_123', { content: 'updated' })
        expect(http.put).toHaveBeenCalledWith('/feed/social/post_123', { content: 'updated' })
    })

    test('getTrending calls correct endpoint', async () => {
        await feed.getTrending()
        expect(http.get).toHaveBeenCalledWith('/feed/social/trending')
    })

    test('rejects invalid IDs', async () => {
        await expect(feed.toggleLike('../../admin')).rejects.toThrow('Invalid postId')
    })
})

describe('TandasModule', () => {
    let tandas: TandasModule
    let http: ReturnType<typeof mockHttp>

    beforeEach(() => {
        http = mockHttp()
        tandas = new TandasModule(http as any)
    })

    test('listGroups uses /groups/public-pg', async () => {
        await tandas.listGroups({ status: 'active' })
        expect(http.get).toHaveBeenCalledWith('/groups/public-pg', { status: 'active' })
    })

    test('listMyTandas uses correct endpoint', async () => {
        await tandas.listMyTandas()
        expect(http.get).toHaveBeenCalledWith('/tandas/my-tandas')
    })

    test('joinGroup uses /groups/:id/join', async () => {
        await tandas.joinGroup('abc')
        expect(http.post).toHaveBeenCalledWith('/groups/abc/join')
    })

    test('contribute uses /tandas/pay', async () => {
        await tandas.contribute('g1', '100')
        expect(http.post).toHaveBeenCalledWith('/tandas/pay', {
            group_id: 'g1',
            amount: '100'
        })
    })

    test('getMembers uses /groups/:id/members', async () => {
        const get = http.get as jest.Mock
        get.mockResolvedValue([{ user_id: 'u1', name: 'User 1' }])

        const members = await tandas.getMembers('g1')
        expect(get).toHaveBeenCalledWith('/groups/g1/members')
        expect(members.length).toBe(1)
    })

    test('removeMember uses DELETE', async () => {
        await tandas.removeMember('g1', 'u1')
        expect(http.delete).toHaveBeenCalledWith('/groups/g1/members/u1')
    })

    test('getGroupDetails uses /groups/:id', async () => {
        await tandas.getGroupDetails('g1')
        expect(http.get).toHaveBeenCalledWith('/groups/g1')
    })

    test('runTombola uses /groups/:id/lottery-live', async () => {
        await tandas.runTombola('g1')
        expect(http.post).toHaveBeenCalledWith('/groups/g1/lottery-live')
    })

    test('updateMemberRole uses PATCH without /registration', async () => {
        await tandas.updateMemberRole('g1', 'u1', 'admin')
        expect(http.patch).toHaveBeenCalledWith('/groups/g1/members/u1/role', { role: 'admin' })
    })

    test('rejects invalid group IDs', async () => {
        await expect(tandas.joinGroup('../../admin')).rejects.toThrow('Invalid groupId')
    })
})
