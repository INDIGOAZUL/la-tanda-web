// social feed module - for getting the latest gossip and sharing updates
// aligned with La Tanda v3.92.0

import { HttpClient } from '../utils/http'
import type { Post, Comment, CreatePostData, SocialFeedFilters } from '../types/feed'

/**
 * Social Feed Module
 * Handles interactions with the La Tanda community feed.
 */
export class FeedModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    /**
     * Get the global social feed
     */
    async getPosts(filters: SocialFeedFilters = {}): Promise<Post[]> {
        return this._http.get<Post[]>('/feed/social/posts', filters)
    }

    /**
     * Post something new to the community
     */
    async createPost(data: CreatePostData): Promise<Post> {
        return this._http.post<Post>('/feed/social/posts', data)
    }

    /**
     * Like or unlike a post
     */
    async toggleLike(postId: string): Promise<{ liked: boolean; count: number }> {
        return this._http.post(`/feed/social/posts/${postId}/like`)
    }

    /**
     * Get comments for a specific post
     */
    async getComments(postId: string): Promise<Comment[]> {
        return this._http.get<Comment[]>(`/feed/social/posts/${postId}/comments`)
    }

    /**
     * Add a comment to a post
     */
    async addComment(postId: string, text: string): Promise<Comment> {
        return this._http.post(`/feed/social/posts/${postId}/comment`, { text })
    }
}
