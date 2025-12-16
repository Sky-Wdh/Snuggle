'use client'

interface FeedHeaderProps {
    followingCount: number
    followersCount: number
}

export default function FeedHeader({ followingCount, followersCount }: FeedHeaderProps) {
    return (
        <div className="mb-10">
            {/* Title Section */}
            <div className="flex items-end justify-between">
                <div>
                    <div className="text-xs font-medium uppercase tracking-widest text-black/40 dark:text-white/40">
                        My Feed
                    </div>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-black dark:text-white">
                        피드
                    </h1>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-2xl font-bold tabular-nums text-black dark:text-white">
                            {followingCount}
                        </div>
                        <div className="text-xs text-black/40 dark:text-white/40">
                            구독중
                        </div>
                    </div>
                    <div className="h-8 w-px bg-black/10 dark:bg-white/10" />
                    <div className="text-right">
                        <div className="text-2xl font-bold tabular-nums text-black dark:text-white">
                            {followersCount}
                        </div>
                        <div className="text-xs text-black/40 dark:text-white/40">
                            구독자
                        </div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="mt-6 h-px bg-gradient-to-r from-black/10 via-black/10 to-transparent dark:from-white/10 dark:via-white/10" />
        </div>
    )
}
