'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { searchPosts, searchBlogs, getSearchCounts, SearchPostResult, SearchBlogResult } from '@/lib/api/search'
import SearchHeader from '@/components/search/SearchHeader'
import SearchTabs, { TabType, SortType } from '@/components/search/SearchTabs'
import SearchPostCard from '@/components/search/SearchPostCard'
import SearchBlogCard from '@/components/search/SearchBlogCard'
import { SearchSkeleton, SearchEmpty, PageLoading } from '@/components/search/SearchStatus'

function SearchContent() {
    const searchParams = useSearchParams()
    const query = searchParams.get('q') || ''

    const [activeTab, setActiveTab] = useState<TabType>('posts')
    const [sortBy, setSortBy] = useState<SortType>('relevance')
    const [posts, setPosts] = useState<SearchPostResult[]>([])
    const [blogs, setBlogs] = useState<SearchBlogResult[]>([])
    const [postCount, setPostCount] = useState(0)
    const [blogCount, setBlogCount] = useState(0)
    const [loading, setLoading] = useState(false)

    // 검색 카운트 가져오기
    useEffect(() => {
        if (!query) {
            setPostCount(0)
            setBlogCount(0)
            return
        }

        const fetchCounts = async () => {
            try {
                const counts = await getSearchCounts(query)
                setPostCount(counts.postCount)
                setBlogCount(counts.blogCount)
            } catch (error) {
                console.error('Count error:', error)
            }
        }

        fetchCounts()
    }, [query])

    // 검색 결과 가져오기
    useEffect(() => {
        if (!query) return

        const fetchResults = async () => {
            setLoading(true)
            try {
                if (activeTab === 'posts') {
                    const results = await searchPosts(query, 20, 0, sortBy)
                    setPosts(results)
                } else {
                    const results = await searchBlogs(query)
                    setBlogs(results)
                }
            } catch (error) {
                console.error('Search error:', error)
            }
            setLoading(false)
        }

        fetchResults()
    }, [query, activeTab, sortBy])

    const handleSortChange = (sort: SortType) => {
        setSortBy(sort)
    }

    const renderResults = () => {
        if (!query) {
            return <SearchEmpty message="검색어를 입력해주세요" />
        }

        if (loading) {
            return <SearchSkeleton />
        }

        if (activeTab === 'posts') {
            if (posts.length === 0) {
                return <SearchEmpty message="검색 결과가 없습니다" />
            }
            return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
                    {posts.map((post) => (
                        <SearchPostCard key={post.id} post={post} />
                    ))}
                </div>
            )
        }

        if (blogs.length === 0) {
            return <SearchEmpty message="검색 결과가 없습니다" />
        }

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
                {blogs.map((blog) => (
                    <SearchBlogCard key={blog.id} blog={blog} />
                ))}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <SearchHeader initialQuery={query} />

            <main className="mx-auto max-w-5xl px-6 py-8">
                <SearchTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    postCount={postCount}
                    blogCount={blogCount}
                    sortBy={sortBy}
                    onSortChange={handleSortChange}
                />

                {renderResults()}
            </main>
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={<PageLoading />}>
            <SearchContent />
        </Suspense>
    )
}
