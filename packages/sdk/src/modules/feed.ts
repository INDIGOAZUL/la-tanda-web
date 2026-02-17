// feed module - social interactions (posts, likes, comments, bookmarks, trending)
// aligned with La Tanda v4.3.1

import { HttpClient } from '../utils/http'
import { validateId } from '../utils/validation'
import type {
    FeedPost,
    FeedComment,
    CreatePostData,
    FeedFilters
} from '../types/feed'

/**
 * Handles social feed interactions — posts, likes, comments, bookmarks, and more.
 */
export class FeedModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    /**
     * Fetches posts from the social feed.
     */
    async getPosts(filters: FeedFilters = {}): Promise<FeedPost[]> {
        return this._http.get<FeedPost[]>('/feed/social', filters)
    }

    /**
     * Creates a new social post.
     */
    async createPost(data: CreatePostData): Promise<FeedPost> {
        return this._http.post<FeedPost>('/feed/social', data)
    }

    /**
     * Toggles a like on a post.
     */
    async toggleLike(postId: string): Promise<{ liked: boolean }> {
        validateId(postId, 'postId')
        return this._http.post<{ liked: boolean }>(`/feed/social/${postId}/like`)
    }

    /**
     * Fetches comments for a specific post.
     */
    async getComments(postId: string): Promise<FeedComment[]> {
        validateId(postId, 'postId')
        return this._http.get<FeedComment[]>(`/feed/social/${postId}/comments`)
    }

    /**
     * Adds a comment to a post.
     */
    async addComment(postId: string, text: string): Promise<FeedComment> {
        validateId(postId, 'postId')
        return this._http.post<FeedComment>(`/feed/social/${postId}/comments`, { text })
    }

    /**
     * Toggles a bookmark on a post.
     */
    async toggleBookmark(postId: string): Promise<{ bookmarked: boolean }> {
        validateId(postId, 'postId')
        return this._http.post<{ bookmarked: boolean }>(`/feed/social/${postId}/bookmark`)
    }

    /**
     * Fetches the current user's bookmarked posts.
     */
    async getBookmarks(): Promise<FeedPost[]> {
        return this._http.get<FeedPost[]>('/feed/social/bookmarks')
    }

    /**
     * Deletes a post.
     */
    async deletePost(postId: string): Promise<{ success: boolean }> {
        validateId(postId, 'postId')
        return this._http.delete<{ success: boolean }>(`/feed/social/${postId}`)
    }

    /**
     * Edits an existing post.
     */
    async editPost(postId: string, data: Partial<CreatePostData>): Promise<FeedPost> {
        validateId(postId, 'postId')
        return this._http.put<FeedPost>(`/feed/social/${postId}`, data)
    }

    /**
     * Follows a user.
     */
    async followUser(userId: string): Promise<{ following: boolean }> {
        validateId(userId, 'userId')
        return this._http.post<{ following: boolean }>(`/feed/social/follow/${userId}`)
    }

    /**
     * Fetches trending posts.
     */
    async getTrending(): Promise<FeedPost[]> {
        return this._http.get<FeedPost[]>('/feed/social/trending')
    }

    /**
     * Casts a vote on a poll post.
     */
    async votePoll(postId: string, option: any): Promise<any> {
        validateId(postId, 'postId')
        return this._http.post(`/feed/social/${postId}/vote`, { option })
    }

    /**
     * Uploads an image for use in a social post.
     */
    async uploadImage(data: any): Promise<{ url: string }> {
        return this._http.post<{ url: string }>('/upload/social-image', data)
    }

    /**
     * Uploads a video for use in a social post.
     */
    async uploadVideo(data: any): Promise<{ url: string }> {
        return this._http.post<{ url: string }>('/upload/social-video', data)
    }
}
