'use client'

import Link from 'next/link'
import { getBlogImageUrl } from '@/lib/utils/image'

interface FeedItemProps {
    post: {
        id: string
        title: string
        content: string
        thumbnail_url: string | null
        created_at: string
        blog_id: string
        blog: {
            name: string
            thumbnail_url: string | null
            profile_image_url?: string | null
        } | null
    }
}

function getFirstParagraph(html: string): string {
    const withoutCode = html.replace(/<pre[\s\S]*?<\/pre>/gi, '')
    const withoutImages = withoutCode.replace(/<img[^>]*>/gi, '')
    const pMatch = withoutImages.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
    if (pMatch) {
        const text = pMatch[1].replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim()
        const firstLine = text.split(/[\r\n]/)[0]?.trim()
        if (firstLine) return firstLine
    }
    const plainText = withoutImages.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim()
    const firstLine = plainText.split(/[\r\n]/)[0]?.trim()
    return firstLine || ''
}

function formatDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`

    return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
    })
}

export default function FeedItem({ post }: FeedItemProps) {
    const blogName = post.blog?.name || '알 수 없음'
    const blogImage = getBlogImageUrl(post.blog?.thumbnail_url, post.blog?.profile_image_url)
    const preview = post.content ? getFirstParagraph(post.content).slice(0, 120) : ''
    const timeAgo = formatDate(post.created_at)

    return (
        <Link href={`/post/${post.id}`} className="group block">
            <article className="py-6">
                <div className="flex gap-5">
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Blog Info */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                                {blogImage ? (
                                    <img
                                        src={blogImage}
                                        alt={blogName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-black/40 dark:text-white/40">
                                        {blogName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <span className="text-sm font-medium text-black/70 dark:text-white/70">
                                {blogName}
                            </span>
                            <span className="text-black/20 dark:text-white/20">·</span>
                            <span className="text-sm text-black/40 dark:text-white/40">
                                {timeAgo}
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-black dark:text-white line-clamp-2 leading-snug group-hover:text-black/70 dark:group-hover:text-white/70 transition-colors">
                            {post.title}
                        </h3>

                        {/* Preview */}
                        {preview && (
                            <p className="mt-2 text-sm text-black/50 dark:text-white/50 line-clamp-2 leading-relaxed">
                                {preview}
                            </p>
                        )}
                    </div>

                    {/* Thumbnail */}
                    {post.thumbnail_url && (
                        <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
                            <img
                                src={post.thumbnail_url}
                                alt=""
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="mt-6 h-px bg-black/[0.06] dark:bg-white/[0.06]" />
            </article>
        </Link>
    )
}
