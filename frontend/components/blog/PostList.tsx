'use client'

import { useEffect, useState } from 'react'
import { getPosts, PostListItem } from '@/lib/api/posts'
import PostCard from './PostCard'

interface Post {
  id: string
  title: string
  content: string | null
  thumbnail_url: string | null
  created_at: string
  blog: {
    name: string
    thumbnail_url: string | null
  } | null
}

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const POSTS_PER_PAGE = 5

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPosts(15, 0) // Fetch 15 posts
        setPosts(data)
      } catch (err) {
        console.error('Error fetching posts:', err)
      }
      setLoading(false)
    }

    fetchPosts()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse border-b border-black/10 py-6 dark:border-white/10">
            <div className="flex gap-4">
              <div className="h-24 w-24 rounded-lg bg-black/10 dark:bg-white/10" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-3/4 rounded bg-black/10 dark:bg-white/10" />
                <div className="h-4 w-full rounded bg-black/10 dark:bg-white/10" />
                <div className="h-4 w-1/2 rounded bg-black/10 dark:bg-white/10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-black/50 dark:text-white/50">
          아직 게시된 글이 없습니다
        </p>
      </div>
    )
  }

  // Calculate posts for current page
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE
  const currentPosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE)
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)

  return (
    <div>
      <div className="h-[800px]">
        {currentPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-6">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="group flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:bg-black/5 disabled:opacity-25 dark:hover:bg-white/10"
            aria-label="이전 페이지"
          >
            <svg
              className="h-4 w-4 text-black/50 transition-transform duration-300 group-hover:-translate-x-0.5 dark:text-white/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Dot Indicators */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className="group relative flex h-6 w-6 items-center justify-center"
                aria-label={`${page}페이지`}
              >
                <span
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    currentPage === page
                      ? 'scale-100 bg-black dark:bg-white'
                      : 'scale-75 bg-black/20 group-hover:scale-100 group-hover:bg-black/40 dark:bg-white/20 dark:group-hover:bg-white/40'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="group flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:bg-black/5 disabled:opacity-25 dark:hover:bg-white/10"
            aria-label="다음 페이지"
          >
            <svg
              className="h-4 w-4 text-black/50 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-white/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
