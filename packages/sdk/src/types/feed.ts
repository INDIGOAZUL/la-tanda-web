// feed type definitions
// aligned with La Tanda v3.92.0

export interface FeedPost {
    id: string
    author_id: string
    author_name: string
    content: string
    media_url?: string
    likes_count: number
    comments_count: number
    has_liked?: boolean
    created_at: string
}

export interface FeedComment {
    id: string
    post_id: string
    author_id: string
    author_name: string
    text: string
    created_at: string
}

export interface CreatePostData {
    content: string
    media_url?: string
}

export interface FeedFilters {
    limit?: number
    offset?: number
    author_id?: string
}
