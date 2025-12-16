'use client'

import Link from 'next/link'
import { SubscribedBlog } from '@/lib/api/subscribe'
import { getBlogImageUrl } from '@/lib/utils/image'

interface SubscribedBlogsProps {
    blogs: SubscribedBlog[]
    loading?: boolean
}

export default function SubscribedBlogs({ blogs, loading }: SubscribedBlogsProps) {
    if (loading) {
        return (
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <div className="h-4 w-24 animate-pulse rounded bg-black/5 dark:bg-white/5" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="h-10 w-10 animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3.5 w-20 animate-pulse rounded bg-black/5 dark:bg-white/5" />
                                <div className="h-3 w-28 animate-pulse rounded bg-black/5 dark:bg-white/5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (blogs.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-black/10 p-6 text-center dark:border-white/10">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                    <svg className="h-6 w-6 text-black/30 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                </div>
                <p className="text-sm font-medium text-black/60 dark:text-white/60">
                    구독한 블로그가 없습니다
                </p>
                <Link
                    href="/"
                    className="mt-3 inline-block text-sm text-black/40 underline underline-offset-2 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors"
                >
                    블로그 둘러보기
                </Link>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-black dark:text-white">
                        구독중
                    </span>
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black/5 px-1.5 text-[10px] font-bold tabular-nums text-black/40 dark:bg-white/10 dark:text-white/40">
                        {blogs.length}
                    </span>
                </div>
            </div>

            {/* Blog List */}
            <div className="space-y-1">
                {blogs.map((blog) => {
                    const imageUrl = getBlogImageUrl(blog.thumbnail_url, blog.profile_image_url)

                    return (
                        <Link
                            key={blog.id}
                            href={`/blog/${blog.id}`}
                            className="group flex items-center gap-3 rounded-xl p-2 -mx-2 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                        >
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-black/5 dark:bg-white/10">
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={blog.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-black/30 dark:text-white/30">
                                        {blog.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-black dark:text-white">
                                    {blog.name}
                                </p>
                                {blog.description && (
                                    <p className="mt-0.5 truncate text-xs text-black/40 dark:text-white/40">
                                        {blog.description}
                                    </p>
                                )}
                            </div>
                            <svg
                                className="h-4 w-4 flex-shrink-0 text-black/0 transition-all group-hover:translate-x-0.5 group-hover:text-black/30 dark:text-white/0 dark:group-hover:text-white/30"
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
