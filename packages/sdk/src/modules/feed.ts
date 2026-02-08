// social feed module - for getting the latest gossip and sharing updates

import { HttpClient } from '../utils/http'
import type { Post, Comment, CreatePostData, SocialFeedFilters, ReputationInfo } from '../types/feed'

export class FeedModule {
    private _http: HttpClient

    constructor(http: HttpClient) {
        this._http = http
    }

    // get the global social feed
    async getPosts(filters: SocialFeedFilters = {}): Promise<Post[]> {
        return this._http.get<Post[]>('/social/posts', filters)
    }

    // post something new
    async createPost(data: CreatePostData): Promise<Post> {
        return this._http.post<Post>('/social/create-post', data)
    }

    // like or unlike a post
    async toggleLike(postId: string): Promise<{ liked: boolean; count: number }> {
        return this._http.post(`/social/posts/${postId}/like`)
    }

    // get comments for a specific post
    async getComments(postId: string): Promise<Comment[]> {
        return this._http.get<Comment[]>(`/social/posts/${postId}/comments`)
    }

    // add a comment
    async addComment(postId: string, text: string): Promise<Comment> {
        return this._http.post(`/social/posts/${postId}/comment`, { text })
    }

    // check user reputation score
    async getReputation(userId?: string): Promise<ReputationInfo> {
        const path = userId ? `/reputation/score?userId=${userId}` : '/reputation/score'
        return this._http.get<ReputationInfo>(path)
    }
}
