// feed module - handles social interactions (posts, likes, comments)
// aligned with La Tanda v3.92.0 social feed specs

import { HttpClient } from '../utils/http'
import type {
    FeedPost,
    FeedComment,
    CreatePostData,
    FeedFilters
} from '../types/feed'

/**
 * Handles social interactions like posts, likes, and comments.
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
        return this._http.get<FeedPost[]>('/feed/social/posts', filters)
    }

    /**
     * Creates a new social post.
     */
    async createPost(data: CreatePostData): Promise<FeedPost> {
        return this._http.post<FeedPost>('/feed/social/posts', data)
    }

    /**
     * Toggles a like on a post.
     */
    async toggleLike(postId: string): Promise<{ liked: boolean }> {
        return this._http.post<{ liked: boolean }>(`/feed/social/posts/${postId}/like`)
    }

    /**
     * Fetches comments for a specific post.
     */
    async getComments(postId: string): Promise<FeedComment[]> {
        return this._http.get<FeedComment[]>(`/feed/social/posts/${postId}/comments`)
    }

    /**
     * Adds a comment to a post.
     */
    async addComment(postId: string, text: string): Promise<FeedComment> {
        return this._http.post<FeedComment>(`/feed/social/posts/${postId}/comment`, { text })
    }
}
