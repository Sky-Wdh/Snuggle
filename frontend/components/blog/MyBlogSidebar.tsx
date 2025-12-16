'use client'

import { useEffect, useRef, useState } from 'react'
import { useUserStore } from '@/lib/store/useUserStore'
import { useBlogStore } from '@/lib/store/useBlogStore'
import ProfileImage from '@/components/common/ProfileImage'
import KakaoLoginButton from '@/components/auth/KakaoLoginButton'

export default function MyBlogSidebar() {
  const { user, isLoading: isUserLoading } = useUserStore()
  const { blogs, selectedBlog, isLoading: isBlogLoading, fetchBlogs, selectBlog } = useBlogStore()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isUserLoading) return
    if (user) {
      fetchBlogs(user.id)
    }
  }, [user, isUserLoading, fetchBlogs])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectBlog = (blog: typeof selectedBlog) => {
    if (blog) {
      selectBlog(blog)
      setIsDropdownOpen(false)
    }
  }

  // 로딩 상태
  if (isUserLoading || isBlogLoading) {
    return (
      <div className="animate-pulse rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-black/10 dark:bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
            <div className="h-3 w-32 rounded bg-black/10 dark:bg-white/10" />
          </div>
        </div>
      </div>
    )
  }

  // 비로그인 상태
  if (!user) {
    return (
      <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <h3 className="font-semibold text-black dark:text-white">내 블로그</h3>
        <p className="mt-2 text-sm text-black/50 dark:text-white/50">
          로그인하고 나만의 블로그를 시작하세요
        </p>
        <div className="mt-4">
          <KakaoLoginButton />
        </div>
      </div>
    )
  }

  const kakaoProfileImage = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  // 블로그가 있는 경우
  if (selectedBlog) {
    const profileImage = selectedBlog.thumbnail_url || kakaoProfileImage
    const hasMultipleBlogs = blogs.length > 1

    return (
      <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        {/* 프로필 영역 */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => hasMultipleBlogs && setIsDropdownOpen(!isDropdownOpen)}
            className={`flex w-full items-center gap-3 ${hasMultipleBlogs ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <ProfileImage
              src={profileImage}
              alt={selectedBlog.name}
              fallback={selectedBlog.name}
              size="md"
              rounded="xl"
            />
            <div className="flex-1 text-left min-w-0">
              <h3 className="font-semibold text-black dark:text-white truncate">
                {selectedBlog.name}
              </h3>
              {selectedBlog.description && (
                <p className="text-sm text-black/50 dark:text-white/50 line-clamp-1">
                  {selectedBlog.description}
                </p>
              )}
            </div>
            {hasMultipleBlogs && (
              <svg
                className={`h-4 w-4 flex-shrink-0 text-black/40 transition-transform dark:text-white/40 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          {/* 드롭다운 */}
          {isDropdownOpen && hasMultipleBlogs && (
            <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-zinc-900">
              <div className="py-1">
                {blogs.map((blog) => (
                  <button
                    key={blog.id}
                    onClick={() => handleSelectBlog(blog)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <ProfileImage
                      src={blog.thumbnail_url || kakaoProfileImage}
                      alt={blog.name}
                      fallback={blog.name}
                      size="sm"
                      rounded="xl"
                    />
                    <span className="flex-1 text-sm font-medium text-black dark:text-white">
                      {blog.name}
                    </span>
                    {blog.id === selectedBlog.id && (
                      <svg className="h-4 w-4 text-black dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-black/10 dark:border-white/10">
                <a
                  href="/account"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-black/60 transition-colors hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  새 블로그 만들기
                </a>
              </div>
            </div>
          )}
        </div>

        {/* 액션 링크 */}
        <div className="mt-5 flex items-center justify-center gap-4 text-sm">
          <a
            href={`/blog/${selectedBlog.id}`}
            className="font-medium text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white transition-colors"
          >
            내 블로그
          </a>
          <span className="text-black/20 dark:text-white/20">·</span>
          <a
            href="/write"
            className="font-medium text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white transition-colors"
          >
            글쓰기
          </a>
          <span className="text-black/20 dark:text-white/20">·</span>
          <a
            href={`/blog/${selectedBlog.id}/settings`}
            className="font-medium text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white transition-colors"
          >
            관리
          </a>
        </div>

        {/* 통계 */}
        <div className="mt-5 pt-5 border-t border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-lg font-bold tabular-nums text-black dark:text-white">
                {selectedBlog.total_view_count?.toLocaleString() || 0}
              </div>
              <div className="mt-0.5 text-xs text-black/40 dark:text-white/40">조회수</div>
            </div>
            <div className="w-px h-8 bg-black/10 dark:bg-white/10" />
            <div className="text-center flex-1">
              <div className="text-lg font-bold tabular-nums text-black dark:text-white">
                0
              </div>
              <div className="mt-0.5 text-xs text-black/40 dark:text-white/40">방문자</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 블로그가 없는 경우
  return (
    <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
      <h3 className="font-semibold text-black dark:text-white">내 블로그</h3>
      <p className="mt-2 text-sm text-black/50 dark:text-white/50">
        아직 블로그가 없습니다
      </p>
      <a
        href="/account"
        className="mt-4 block w-full rounded-xl bg-black py-2.5 text-center text-sm font-medium text-white dark:bg-white dark:text-black transition-colors hover:bg-black/80 dark:hover:bg-white/90"
      >
        블로그 만들기
      </a>
    </div>
  )
}
