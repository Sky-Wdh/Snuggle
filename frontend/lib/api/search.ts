const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface SearchPostResult {
    id: string
    title: string
    content: string | null
    thumbnail_url: string | null
    created_at: string
    blog_id: string
    like_count: number
    comment_count: number
    blog: {
        id: string
        name: string
        thumbnail_url: string | null
        profile_image_url: string | null
    } | null
}

export interface SearchBlogResult {
    id: string
    name: string
    description: string | null
    thumbnail_url: string | null
    user_id: string
    created_at: string
    profile: {
        id: string
        nickname: string
        profile_image_url: string | null
    } | null
}

export interface SearchCounts {
    postCount: number
    blogCount: number
}

// 검색 카운트
export async function getSearchCounts(query: string): Promise<SearchCounts> {
    if (!query.trim()) return { postCount: 0, blogCount: 0 }

    const params = new URLSearchParams({ q: query })
    const response = await fetch(`${API_BASE}/api/search/count?${params}`)

    if (!response.ok) {
        throw new Error('Failed to get search counts')
    }

    return response.json()
}

// 글 검색
export async function searchPosts(
    query: string,
    limit = 20,
    offset = 0,
    sort: 'relevance' | 'latest' = 'relevance'
): Promise<SearchPostResult[]> {
    if (!query.trim()) return []

    const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
        offset: offset.toString(),
        sort,
    })

    const response = await fetch(`${API_BASE}/api/search/posts?${params}`)

    if (!response.ok) {
        throw new Error('Failed to search posts')
    }

    return response.json()
}

// 블로그 검색
export async function searchBlogs(
    query: string,
    limit = 20,
    offset = 0
): Promise<SearchBlogResult[]> {
    if (!query.trim()) return []

    const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
        offset: offset.toString(),
    })

    const response = await fetch(`${API_BASE}/api/search/blogs?${params}`)

    if (!response.ok) {
        throw new Error('Failed to search blogs')
    }

    return response.json()
}

// 검색 추천 결과 타입
export interface SearchSuggestion {
    posts: { id: string; title: string; blog_id: string }[]
    blogs: { id: string; name: string; thumbnail_url: string | null }[]
    categories: { id: string; name: string; blog_id: string }[]
}

// 검색어 자동완성 추천
export async function getSearchSuggestions(query: string): Promise<SearchSuggestion> {
    if (!query.trim() || query.trim().length < 2) {
        return { posts: [], blogs: [], categories: [] }
    }

    const params = new URLSearchParams({ q: query })
    const response = await fetch(`${API_BASE}/api/search/suggest?${params}`)

    if (!response.ok) {
        throw new Error('Failed to get suggestions')
    }

    return response.json()
}
