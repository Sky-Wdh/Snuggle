'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSearchSuggestions, SearchSuggestion } from '@/lib/api/search'
import Link from 'next/link'
import ThemeToggle from '@/components/common/ThemeToggle'

interface SearchHeaderProps {
    initialQuery?: string
}

export default function SearchHeader({ initialQuery = '' }: SearchHeaderProps) {
    const router = useRouter()
    const [query, setQuery] = useState(initialQuery)
    const [isEditing, setIsEditing] = useState(false)
    const [suggestions, setSuggestions] = useState<SearchSuggestion | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        setQuery(initialQuery)
    }, [initialQuery])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setIsEditing(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        if (query.trim().length < 2) {
            setSuggestions(null)
            setIsOpen(false)
            return
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                const result = await getSearchSuggestions(query)
                setSuggestions(result)
                const hasResults =
                    result.posts.length > 0 ||
                    result.blogs.length > 0 ||
                    result.categories.length > 0
                if (isEditing) setIsOpen(hasResults)
            } catch (error) {
                console.error('Search suggestion error:', error)
            }
            setLoading(false)
        }, 300)

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [query, isEditing])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            setIsOpen(false)
            setIsEditing(false)
            router.push(`/search?q=${encodeURIComponent(query.trim())}`)
        }
    }

    const handleClear = () => {
        setQuery('')
        setIsEditing(true)
        inputRef.current?.focus()
    }

    const handleSuggestionClick = () => {
        setIsOpen(false)
        setIsEditing(false)
    }

    const handleQueryClick = () => {
        setIsEditing(true)
        setTimeout(() => {
            inputRef.current?.focus()
            inputRef.current?.select()
        }, 0)
    }

    return (
        <>
            {/* 상단 네비게이션 헤더 */}
            <header className="border-b border-black/10 bg-white dark:border-white/10 dark:bg-black">
                <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
                    <Link href="/" className="text-xl font-bold text-black dark:text-white">
                        Snuggle
                    </Link>
                    <ThemeToggle />
                </div>
            </header>

            {/* 검색 헤더 */}
            <div className="border-b border-black/10 bg-white py-8 dark:border-white/10 dark:bg-black">
                <div ref={wrapperRef} className="relative mx-auto max-w-5xl px-6">
                    <div className="flex items-center justify-center gap-3">
                        {isEditing ? (
                            <form onSubmit={handleSubmit} className="relative w-full max-w-md">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="검색어를 입력하세요"
                                    className="w-full h-12 rounded-full border border-black/10 bg-transparent px-5 pr-12 text-lg text-black placeholder-black/40 outline-none focus:border-black/30 dark:border-white/10 dark:text-white dark:placeholder-white/40 dark:focus:border-white/30"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </form>
                        ) : (
                            <>
                                <h1
                                    onClick={handleQueryClick}
                                    className="cursor-pointer text-2xl font-bold text-black dark:text-white"
                                >
                                    {query || '검색'}
                                </h1>
                                {query && (
                                    <button
                                        onClick={handleClear}
                                        className="flex h-6 w-6 items-center justify-center rounded-full bg-black/10 text-black/60 hover:bg-black/20 dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/20"
                                    >
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                                <div className="mx-2 h-5 w-px bg-black/20 dark:bg-white/20" />
                                <button
                                    onClick={handleQueryClick}
                                    className="text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>

                    {/* 추천 드롭다운 */}
                    {isOpen && suggestions && isEditing && (
                        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-full max-w-md rounded-xl border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-neutral-900 z-50 max-h-80 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-sm text-black/50 dark:text-white/50">
                                    검색 중...
                                </div>
                            ) : (
                                <>
                                    {suggestions.posts.length > 0 && (
                                        <div className="border-b border-black/5 dark:border-white/5">
                                            <div className="px-4 py-2 text-xs font-medium text-black/40 dark:text-white/40">
                                                게시글
                                            </div>
                                            {suggestions.posts.map((post) => (
                                                <Link
                                                    key={post.id}
                                                    href={`/post/${post.id}`}
                                                    onClick={handleSuggestionClick}
                                                    className="block px-4 py-2.5 text-sm text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                                                >
                                                    {post.title}
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {suggestions.blogs.length > 0 && (
                                        <div className="border-b border-black/5 dark:border-white/5">
                                            <div className="px-4 py-2 text-xs font-medium text-black/40 dark:text-white/40">
                                                블로그
                                            </div>
                                            {suggestions.blogs.map((blog) => (
                                                <Link
                                                    key={blog.id}
                                                    href={`/blog/${blog.id}`}
                                                    onClick={handleSuggestionClick}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                                                >
                                                    {blog.thumbnail_url ? (
                                                        <img
                                                            src={blog.thumbnail_url}
                                                            alt=""
                                                            className="h-6 w-6 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-6 w-6 rounded-full bg-black/10 dark:bg-white/10" />
                                                    )}
                                                    {blog.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {suggestions.categories.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 text-xs font-medium text-black/40 dark:text-white/40">
                                                카테고리
                                            </div>
                                            {suggestions.categories.map((category) => (
                                                <Link
                                                    key={category.id}
                                                    href={`/search?q=${encodeURIComponent(category.name)}`}
                                                    onClick={handleSuggestionClick}
                                                    className="block px-4 py-2.5 text-sm text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                                                >
                                                    {category.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
