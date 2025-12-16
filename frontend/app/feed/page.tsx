'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { getFeedPosts, PostListItem } from '@/lib/api/posts'
import { getSubscriptionCounts, getSubscribedBlogs, SubscribedBlog } from '@/lib/api/subscribe'
import FeedHeader from '@/components/feed/FeedHeader'
import FeedItem from '@/components/feed/FeedItem'
import SubscribedBlogs from '@/components/feed/SubscribedBlogs'

const POSTS_PER_PAGE = 10

export default function FeedPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [posts, setPosts] = useState<PostListItem[]>([])
    const [blogs, setBlogs] = useState<SubscribedBlog[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [counts, setCounts] = useState({ following: 0, followers: 0 })
    const loadMoreRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const init = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/')
                return
            }

            setUser(user)

            try {
                const [feedPosts, subCounts, subscribedBlogs] = await Promise.all([
                    getFeedPosts(POSTS_PER_PAGE, 0),
                    getSubscriptionCounts(user.id),
                    getSubscribedBlogs(user.id, 10)
                ])

                setPosts(feedPosts)
                setCounts(subCounts)
                setBlogs(subscribedBlogs)
                setHasMore(feedPosts.length === POSTS_PER_PAGE)
            } catch (error) {
                console.error('Feed loading failed:', error)
            } finally {
                setLoading(false)
            }
        }

        init()
    }, [router])

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return

        setLoadingMore(true)
        try {
            const newPosts = await getFeedPosts(POSTS_PER_PAGE, posts.length)
            setPosts(prev => [...prev, ...newPosts])
            setHasMore(newPosts.length === POSTS_PER_PAGE)
        } catch (error) {
            console.error('Load more failed:', error)
        } finally {
            setLoadingMore(false)
        }
    }, [loadingMore, hasMore, posts.length])

    useEffect(() => {
        if (loading || !hasMore) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore()
                }
            },
            { threshold: 0.1 }
        )

        const currentRef = loadMoreRef.current
        if (currentRef) {
            observer.observe(currentRef)
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef)
            }
        }
    }, [loading, hasMore, loadMore])

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-black">
                <main className="mx-auto max-w-6xl px-6 py-10">
                    <div className="flex gap-12">
                        {/* Main Content Skeleton */}
                        <div className="min-w-0 flex-1">
                            <div className="mb-10">
                                <div className="h-4 w-16 animate-pulse rounded bg-black/5 dark:bg-white/5" />
                                <div className="mt-2 h-8 w-24 animate-pulse rounded bg-black/5 dark:bg-white/5" />
                            </div>
                            <div className="space-y-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="py-6">
                                        <div className="flex gap-5">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 animate-pulse rounded-full bg-black/5 dark:bg-white/5" />
                                                    <div className="h-4 w-24 animate-pulse rounded bg-black/5 dark:bg-white/5" />
                                                </div>
                                                <div className="h-5 w-3/4 animate-pulse rounded bg-black/5 dark:bg-white/5" />
                                                <div className="h-4 w-full animate-pulse rounded bg-black/5 dark:bg-white/5" />
                                            </div>
                                            <div className="h-28 w-28 animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
                                        </div>
                                        <div className="mt-6 h-px bg-black/[0.06] dark:bg-white/[0.06]" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar Skeleton */}
                        <div className="hidden w-72 flex-shrink-0 lg:block">
                            <div className="mb-4 h-4 w-20 animate-pulse rounded bg-black/5 dark:bg-white/5" />
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="h-10 w-10 animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
                                        <div className="h-4 w-24 animate-pulse rounded bg-black/5 dark:bg-white/5" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    if (!user) return null

    const hasNoContent = posts.length === 0 && blogs.length === 0

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <main className="mx-auto max-w-6xl px-6 py-10">
                <div className="flex gap-12">
                    {/* Main Content */}
                    <div className="min-w-0 flex-1">
                        <FeedHeader
                            followingCount={counts.following}
                            followersCount={counts.followers}
                        />

                        <div>
                            {posts.length > 0 ? (
                                <>
                                    {posts.map((post) => (
                                        <FeedItem key={post.id} post={post} />
                                    ))}

                                    {/* Infinite Scroll Trigger */}
                                    <div ref={loadMoreRef} className="h-10" />

                                    {/* Loading More */}
                                    {loadingMore && (
                                        <div className="flex justify-center py-10">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/10 border-t-black/60 dark:border-white/10 dark:border-t-white/60" />
                                        </div>
                                    )}

                                    {/* End of Feed */}
                                    {!hasMore && posts.length > 0 && (
                                        <div className="py-12 text-center">
                                            <div className="inline-flex items-center gap-2 text-sm text-black/30 dark:text-white/30">
                                                <div className="h-px w-8 bg-black/10 dark:bg-white/10" />
                                                <span>모든 글을 확인했습니다</span>
                                                <div className="h-px w-8 bg-black/10 dark:bg-white/10" />
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : hasNoContent ? (
                                // No subscriptions, no posts
                                <div className="py-20 text-center">
                                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-black/[0.03] dark:bg-white/[0.03]">
                                        <svg className="h-12 w-12 text-black/20 dark:text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-black dark:text-white">
                                        아직 구독한 블로그가 없습니다
                                    </h3>
                                    <p className="mt-2 text-sm text-black/50 dark:text-white/50 max-w-sm mx-auto leading-relaxed">
                                        관심있는 블로그를 구독하면
                                        <br />
                                        새 글을 피드에서 확인할 수 있어요
                                    </p>
                                    <Link
                                        href="/"
                                        className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-all hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                    >
                                        블로그 둘러보기
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </Link>
                                </div>
                            ) : (
                                // Has subscriptions but no new posts
                                <div className="py-20 text-center">
                                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-black/[0.03] dark:bg-white/[0.03]">
                                        <svg className="h-12 w-12 text-black/20 dark:text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-black dark:text-white">
                                        새로운 글이 없습니다
                                    </h3>
                                    <p className="mt-2 text-sm text-black/50 dark:text-white/50">
                                        구독한 블로그에서 새 글이 올라오면 여기에 표시됩니다
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    {blogs.length > 0 && (
                        <div className="hidden w-72 flex-shrink-0 lg:block">
                            <div className="sticky top-8">
                                <SubscribedBlogs blogs={blogs} />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
