// social feed types - posts, comments, likes

export interface Post {
    id: string
    user_id: string
    user_name: string
    content: string
    image_url?: string
    likes_count: number
    comments_count: number
    is_liked: boolean
    created_at: string
}

export interface Comment {
    id: string
    post_id: string
    user_id: string
    user_name: string
    text: string
    created_at: string
}

export interface CreatePostData {
    content: string
    image_url?: string
}

export interface SocialFeedFilters {
    limit?: number
    offset?: number
    user_id?: string
}

export interface ReputationInfo {
    score: number
    rank: string
    verified: boolean
    total_tandas: number
}
