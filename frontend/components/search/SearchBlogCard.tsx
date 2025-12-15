'use client'

import Link from 'next/link'
import { SearchBlogResult } from '@/lib/api/search'
import { getBlogImageUrl } from '@/lib/utils/image'
import SubscriptionButton from '@/components/common/SubscriptionButton'

interface SearchBlogCardProps {
    blog: SearchBlogResult
}

export default function SearchBlogCard({ blog }: SearchBlogCardProps) {
    const imageUrl = getBlogImageUrl(blog.thumbnail_url, blog.profile?.profile_image_url)

    return (
        <div className="flex items-center gap-4 py-5 border-b border-black/10 dark:border-white/10 last:border-b-0">
            {/* 프로필 이미지 */}
            <Link href={`/blog/${blog.id}`} className="shrink-0">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={blog.name}
                        className="h-14 w-14 rounded-full object-cover"
                    />
                ) : (
                    <div className="h-14 w-14 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                        <span className="text-lg font-medium text-black/40 dark:text-white/40">
                            {blog.name.charAt(0)}
                        </span>
                    </div>
                )}
            </Link>

            {/* 블로그 정보 */}
            <div className="flex-1 min-w-0">
                <Link href={`/blog/${blog.id}`}>
                    <h3 className="font-bold text-black dark:text-white hover:underline truncate">
                        {blog.name}
                    </h3>
                </Link>
                {blog.description && (
                    <p className="mt-0.5 text-sm text-black/60 dark:text-white/60 line-clamp-2">
                        {blog.description}
                    </p>
                )}
            </div>

            {/* 구독 버튼 */}
            <div className="shrink-0">
                <SubscriptionButton
                    targetId={blog.user_id}
                    label="구독"
                    labelSubscribed="구독중"
                    className="!px-4 !py-2 !text-sm"
                />
            </div>
        </div>
    )
}
