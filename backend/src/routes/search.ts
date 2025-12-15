import { Router, Request, Response } from 'express'
import { supabase } from '../services/supabase.service.js'
import { logger } from '../utils/logger.js'

const router = Router()

// Types for search results
interface BlogSearchResult {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  user_id: string
  created_at: string | null
}

interface ProfileBasic {
  id: string
  nickname: string | null
  profile_image_url: string | null
}

// 검색 카운트 - 글과 블로그 개수 반환
router.get('/count', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string) || ''

    if (!query.trim()) {
      res.json({ postCount: 0, blogCount: 0 })
      return
    }

    const searchQuery = `%${query.trim()}%`

    // 병렬로 카운트 조회
    const [postsCount, blogsCount] = await Promise.all([
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('is_private', false)
        .or(`title.ilike.${searchQuery},content.ilike.${searchQuery}`),
      supabase
        .from('blogs')
        .select('id', { count: 'exact', head: true })
        .or(`name.ilike.${searchQuery},description.ilike.${searchQuery}`)
    ])

    res.json({
      postCount: postsCount.count || 0,
      blogCount: blogsCount.count || 0
    })
  } catch (error) {
    logger.error('Search count error:', error)
    res.status(500).json({ error: 'Failed to get search counts' })
  }
})

// 글 검색 - N+1 문제 해결
router.get('/posts', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string) || ''
    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0
    const sort = (req.query.sort as string) || 'relevance' // relevance or latest

    if (!query.trim()) {
      res.json([])
      return
    }

    const searchQuery = `%${query.trim()}%`

    // relation join으로 N+1 문제 해결
    let queryBuilder = supabase
      .from('posts')
      .select(`
        id, title, content, thumbnail_url, created_at, blog_id,
        blog:blogs ( id, name, thumbnail_url, user_id )
      `)
      .eq('is_private', false)
      .or(`title.ilike.${searchQuery},content.ilike.${searchQuery}`)

    // 정렬 옵션
    if (sort === 'latest') {
      queryBuilder = queryBuilder.order('created_at', { ascending: false })
    } else {
      // relevance - 제목 일치를 우선으로 (created_at으로 대체)
      queryBuilder = queryBuilder.order('created_at', { ascending: false })
    }

    const { data: posts, error } = await queryBuilder.range(offset, offset + limit - 1)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    // 포스트 ID 목록
    const postIds = (posts || []).map((p: Record<string, unknown>) => p.id as string)

    // 프로필 정보 가져오기 (카카오 프로필 이미지용)
    const userIds = (posts || [])
      .map((p: Record<string, unknown>) => {
        const blogData = p.blog as Record<string, unknown> | null
        return blogData?.user_id as string
      })
      .filter(Boolean)

    // 병렬로 프로필, 좋아요 수, 댓글 수 가져오기
    const [profilesResult, likesResult, commentsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, profile_image_url')
        .in('id', userIds),
      supabase
        .from('post_likes')
        .select('post_id')
        .in('post_id', postIds),
      supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
    ])

    const profileMap = new Map(
      (profilesResult.data || []).map((p: { id: string; profile_image_url: string | null }) => [p.id, p.profile_image_url])
    )

    // 좋아요 수 집계
    const likeCountMap = new Map<string, number>()
    for (const like of (likesResult.data || [])) {
      const postId = (like as { post_id: string }).post_id
      likeCountMap.set(postId, (likeCountMap.get(postId) || 0) + 1)
    }

    // 댓글 수 집계
    const commentCountMap = new Map<string, number>()
    for (const comment of (commentsResult.data || [])) {
      const postId = (comment as { post_id: string }).post_id
      commentCountMap.set(postId, (commentCountMap.get(postId) || 0) + 1)
    }

    // Transform response
    const result = (posts || []).map((post: Record<string, unknown>) => {
      const blogData = post.blog as Record<string, unknown> | null
      const blogUserId = blogData?.user_id as string | undefined
      const profileImageUrl = blogUserId ? profileMap.get(blogUserId) : null
      const postId = post.id as string
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        thumbnail_url: post.thumbnail_url,
        created_at: post.created_at,
        blog_id: post.blog_id,
        like_count: likeCountMap.get(postId) || 0,
        comment_count: commentCountMap.get(postId) || 0,
        blog: blogData ? {
          id: blogData.id,
          name: blogData.name,
          thumbnail_url: blogData.thumbnail_url,
          profile_image_url: profileImageUrl || null,
        } : null,
      }
    })

    res.json(result)
  } catch (error) {
    logger.error('Search posts error:', error)
    res.status(500).json({ error: 'Failed to search posts' })
  }
})

// 블로그 검색
router.get('/blogs', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string) || ''
    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0

    if (!query.trim()) {
      res.json([])
      return
    }

    const searchQuery = `%${query.trim()}%`

    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('id, name, description, thumbnail_url, user_id, created_at')
      .or(`name.ilike.${searchQuery},description.ilike.${searchQuery}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    // 프로필 정보 가져오기 (단일 쿼리로 최적화)
    const userIds = ((blogs as BlogSearchResult[]) || []).map((b) => b.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname, profile_image_url')
      .in('id', userIds)

    const profileMap = new Map<string, ProfileBasic>(
      ((profiles as ProfileBasic[]) || []).map((p) => [p.id, p])
    )

    const blogsWithProfiles = ((blogs as BlogSearchResult[]) || []).map((blog) => ({
      ...blog,
      profile: profileMap.get(blog.user_id) || null,
    }))

    res.json(blogsWithProfiles)
  } catch (error) {
    logger.error('Search blogs error:', error)
    res.status(500).json({ error: 'Failed to search blogs' })
  }
})

// 검색어 자동완성 추천
router.get('/suggest', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string) || ''

    if (!query.trim() || query.trim().length < 2) {
      res.json({ posts: [], blogs: [], categories: [] })
      return
    }

    const searchQuery = `%${query.trim()}%`

    // 병렬로 3개 테이블 조회
    const [postsResult, blogsResult, categoriesResult] = await Promise.all([
      supabase
        .from('posts')
        .select('id, title, blog_id')
        .eq('is_private', false)
        .ilike('title', searchQuery)
        .order('created_at', { ascending: false })
        .limit(5),

      supabase
        .from('blogs')
        .select('id, name, thumbnail_url')
        .ilike('name', searchQuery)
        .order('created_at', { ascending: false })
        .limit(3),

      supabase
        .from('categories')
        .select('id, name, blog_id')
        .ilike('name', searchQuery)
        .limit(3),
    ])

    res.json({
      posts: postsResult.data || [],
      blogs: blogsResult.data || [],
      categories: categoriesResult.data || [],
    })
  } catch (error) {
    logger.error('Search suggest error:', error)
    res.status(500).json({ error: 'Failed to get suggestions' })
  }
})

export default router
