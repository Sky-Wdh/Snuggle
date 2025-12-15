'use client'

import Link from 'next/link'
import { SearchPostResult } from '@/lib/api/search'
import { getBlogImageUrl } from '@/lib/utils/image'

interface SearchPostCardProps {
    post: SearchPostResult
}

export default function SearchPostCard({ post }: SearchPostCardProps) {
    const blogImageUrl = post.blog ? getBlogImageUrl(post.blog.thumbnail_url, post.blog.profile_image_url) : null

    // HTML 태그 제거하고 텍스트만 추출
    const stripHtml = (html: string | null) => {
        if (!html) return ''
        return html.replace(/<[^>]*>/g, '').trim()
    }

    const excerpt = stripHtml(post.content)?.slice(0, 150)

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = (now.getTime() - date.getTime()) / 1000

        if (diff < 3600) {
            const minutes = Math.floor(diff / 60)
            return minutes <= 0 ? '방금 전' : `${minutes}분 전`
        }
        if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
        if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`

        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).replace(/\. /g, '.').replace(/\.$/, '')
    }

    return (
        <Link
            href={`/post/${post.id}`}
            className="block py-5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] -mx-4 px-4 rounded-lg"
        >
            <div className="flex gap-4">
                {/* 콘텐츠 영역 */}
                <div className="flex-1 min-w-0">
                    {/* 블로그 이름 */}
                    {post.blog && (
                        <div className="flex items-center gap-2 mb-2">
                            {blogImageUrl ? (
                                <img
                                    src={blogImageUrl}
                                    alt={post.blog.name}
                                    className="h-5 w-5 rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-5 w-5 rounded-full bg-black/10 dark:bg-white/10" />
                            )}
                            <span className="text-sm text-black/60 dark:text-white/60">
                                {post.blog.name}
                            </span>
                        </div>
                    )}

                    {/* 제목 */}
                    <h3 className="font-bold text-black dark:text-white line-clamp-2 leading-snug">
                        {post.title}
                    </h3>

                    {/* 본문 미리보기 */}
                    {excerpt && (
                        <p className="mt-2 text-sm text-black/60 dark:text-white/60 line-clamp-2 leading-relaxed">
                            {excerpt}
                        </p>
                    )}

                    {/* 메타 정보 */}
                    <div className="mt-3 flex items-center gap-3 text-xs text-black/40 dark:text-white/40">
                        <span className="flex items-center gap-1">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {post.like_count}
                        </span>
                        <span className="flex items-center gap-1">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {post.comment_count}
                        </span>
                        <span>{formatDate(post.created_at)}</span>
                    </div>
                </div>

                {/* 썸네일 */}
                {post.thumbnail_url && (
                    <div className="shrink-0">
                        <img
                            src={post.thumbnail_url}
                            alt=""
                            className="h-24 w-24 rounded-lg object-cover"
                        />
                    </div>
                )}
            </div>
        </Link>
    )
}
