'use client'

type TabType = 'posts' | 'blogs'
type SortType = 'relevance' | 'latest'

interface SearchTabsProps {
    activeTab: TabType
    onTabChange: (tab: TabType) => void
    postCount?: number
    blogCount?: number
    sortBy?: SortType
    onSortChange?: (sort: SortType) => void
}

export default function SearchTabs({
    activeTab,
    onTabChange,
    postCount = 0,
    blogCount = 0,
    sortBy = 'relevance',
    onSortChange
}: SearchTabsProps) {
    return (
        <div className="mb-8">
            {/* 탭 */}
            <div className="flex border border-black/10 dark:border-white/10 overflow-hidden">
                <button
                    type="button"
                    onClick={() => onTabChange('posts')}
                    className={`flex-1 py-4 text-base font-semibold transition-colors border-b-2 ${
                        activeTab === 'posts'
                            ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                            : 'bg-white text-black/40 border-transparent hover:bg-black/5 dark:bg-black dark:text-white/40 dark:hover:bg-white/5'
                    }`}
                >
                    글
                    {activeTab === 'posts' && postCount > 0 && (
                        <span className="ml-2 text-sm px-2.5 py-0.5 rounded-full bg-white/20 dark:bg-black/20">
                            {postCount.toLocaleString()}건
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => onTabChange('blogs')}
                    className={`flex-1 py-4 text-base font-semibold transition-colors border-b-2 ${
                        activeTab === 'blogs'
                            ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                            : 'bg-white text-black/40 border-transparent hover:bg-black/5 dark:bg-black dark:text-white/40 dark:hover:bg-white/5'
                    }`}
                >
                    블로그
                    {activeTab === 'blogs' && blogCount > 0 && (
                        <span className="ml-2 text-sm px-2.5 py-0.5 rounded-full bg-white/20 dark:bg-black/20">
                            {blogCount.toLocaleString()}건
                        </span>
                    )}
                </button>
            </div>

            {/* 정렬 옵션 (글 탭에서만 표시) */}
            {activeTab === 'posts' && onSortChange && (
                <div className="mt-6 flex items-center gap-2 text-sm">
                    <button
                        onClick={() => onSortChange('relevance')}
                        className={`font-medium ${
                            sortBy === 'relevance'
                                ? 'text-black dark:text-white'
                                : 'text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60'
                        }`}
                    >
                        정확도순
                    </button>
                    <span className="text-black/20 dark:text-white/20">|</span>
                    <button
                        onClick={() => onSortChange('latest')}
                        className={`font-medium ${
                            sortBy === 'latest'
                                ? 'text-black dark:text-white'
                                : 'text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60'
                        }`}
                    >
                        최신순
                    </button>
                </div>
            )}
        </div>
    )
}

export type { TabType, SortType }
