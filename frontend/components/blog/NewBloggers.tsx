'use client'

import { useEffect, useState } from 'react'
import { getNewBlogs, BlogItem } from '@/lib/api/blogs'
import { getBlogImageUrl } from '@/lib/utils/image'
import Link from 'next/link'

export default function NewBloggers() {
  const [blogs, setBlogs] = useState<BlogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchBlogs = async () => {
      const data = await getNewBlogs(3)
      setBlogs(data)
      setLoading(false)
    }
    fetchBlogs()
  }, [])

  const handleImageError = (blogId: string) => {
    setFailedImages((prev) => new Set(prev).add(blogId))
  }

  if (loading) {
    return (
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-4 w-20 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-24 animate-pulse rounded bg-black/5 dark:bg-white/5" />
                <div className="h-3 w-32 animate-pulse rounded bg-black/5 dark:bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (blogs.length === 0) {
    return null
  }

  return (
    <div className="mt-8">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-black dark:text-white">
            신규 블로거
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/5 text-[10px] font-bold text-black/40 dark:bg-white/10 dark:text-white/40">
            {blogs.length}
          </span>
        </div>
        <span className="text-xs text-black/30 dark:text-white/30">New</span>
      </div>

      {/* 블로거 목록 */}
      <div className="space-y-2">
        {blogs.map((blog, index) => {
          const thumbnailFailed = failedImages.has(blog.id)
          const imageUrl = thumbnailFailed
            ? getBlogImageUrl(null, blog.profile_image_url)
            : getBlogImageUrl(blog.thumbnail_url, blog.profile_image_url)

          return (
            <Link
              key={blog.id}
              href={`/blog/${blog.id}`}
              className="group flex items-center gap-3 rounded-xl p-2 -mx-2 transition-all hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
            >
              {/* 랭킹 번호 */}
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                <span className="text-xs font-bold tabular-nums text-black/20 dark:text-white/20">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              {/* 프로필 이미지 */}
              <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl bg-black/5 dark:bg-white/10">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={blog.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={() => handleImageError(blog.id)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-medium text-black/30 dark:text-white/30">
                    {blog.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* 블로그 정보 */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-black dark:text-white truncate text-sm">
                  {blog.name}
                </p>
                {blog.description && (
                  <p className="mt-0.5 text-xs text-black/40 dark:text-white/40 truncate">
                    {blog.description}
                  </p>
                )}
              </div>

              {/* 화살표 */}
              <svg
                className="h-4 w-4 flex-shrink-0 text-black/20 transition-all group-hover:translate-x-0.5 group-hover:text-black/40 dark:text-white/20 dark:group-hover:text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
