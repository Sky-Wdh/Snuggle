'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAvailableSkins, applySkin, getBlogSkin, BlogSkin, removeSkinFromLibrary } from '@/lib/api/skins'
import { getBlogPosts, Post } from '@/lib/api/posts'
import { useToast } from '@/components/common/ToastProvider'
import PreviewBlogLayout from '@/components/skin/PreviewBlogLayout'
import PreviewSidebar from '@/components/skin/PreviewSidebar'
import PreviewPostList from '@/components/skin/PreviewPostList'
import type { User } from '@supabase/supabase-js'

interface Blog {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
}

interface Profile {
  id: string
  nickname: string | null
  profile_image_url: string | null
}

export default function SkinsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [userBlog, setUserBlog] = useState<Blog | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [blogPosts, setBlogPosts] = useState<Post[]>([])
  const [skins, setSkins] = useState<BlogSkin[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [selectedSkin, setSelectedSkin] = useState<BlogSkin | null>(null)
  const [appliedSkinId, setAppliedSkinId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const toast = useToast()

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: blogs } = await supabase
          .from('blogs')
          .select('id, name, description, thumbnail_url')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: true })
          .limit(1)

        if (blogs && blogs.length > 0) {
          const blogData = blogs[0]
          setUserBlog(blogData)

          try {
            const posts = await getBlogPosts(blogData.id, false)
            setBlogPosts(posts.slice(0, 5))
          } catch (err) {
            console.error('Failed to load posts:', err)
          }

          try {
            const skinApplication = await getBlogSkin(blogData.id)
            if (skinApplication?.skin_id) {
              setAppliedSkinId(skinApplication.skin_id)
            }
          } catch (err) {
            console.error('Failed to load applied skin:', err)
          }
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, nickname, profile_image_url')
          .eq('id', user.id)
          .maybeSingle()

        if (profileData) {
          setProfile(profileData)
        }
      }

      try {
        const skinsData = await getAvailableSkins()
        setSkins(skinsData)
        if (skinsData.length > 0) {
          setSelectedSkin(skinsData[0])
        }
      } catch (err) {
        console.error('Failed to load skins:', err)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const handleApplySkin = async () => {
    if (!selectedSkin) return

    if (!user) {
      toast.showToast('로그인이 필요합니다', 'error')
      return
    }

    if (!userBlog) {
      toast.showToast('블로그를 먼저 만들어주세요', 'error')
      return
    }

    setApplying(true)
    try {
      await applySkin(userBlog.id, selectedSkin.id)
      setAppliedSkinId(selectedSkin.id)
      toast.showToast('스킨이 적용되었습니다')
    } catch {
      toast.showToast('스킨 적용에 실패했습니다', 'error')
    } finally {
      setApplying(false)
    }
  }

  const handleRemoveSkin = async (skin: BlogSkin, e: React.MouseEvent) => {
    e.stopPropagation()

    if (skin.is_system) {
      toast.showToast('공식 스킨은 삭제할 수 없습니다', 'error')
      return
    }

    if (appliedSkinId === skin.id) {
      toast.showToast('적용 중인 스킨은 삭제할 수 없습니다', 'error')
      return
    }

    setRemoving(skin.id)
    try {
      await removeSkinFromLibrary(skin.id)
      setSkins(prev => prev.filter(s => s.id !== skin.id))
      if (selectedSkin?.id === skin.id) {
        setSelectedSkin(skins.find(s => s.id !== skin.id) || null)
      }
      toast.showToast('스킨이 삭제되었습니다')
    } catch {
      toast.showToast('스킨 삭제에 실패했습니다', 'error')
    } finally {
      setRemoving(null)
    }
  }

  // 검색 필터링
  const filteredSkins = useMemo(() => {
    if (!searchQuery.trim()) return skins
    const query = searchQuery.toLowerCase()
    return skins.filter(skin =>
      skin.name.toLowerCase().includes(query) ||
      skin.description?.toLowerCase().includes(query)
    )
  }, [skins, searchQuery])

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
      </div>
    )
  }

  const cssVars = selectedSkin?.css_variables
  const layout = selectedSkin?.layout_config?.layout || 'sidebar-right'
  const displayImage = userBlog?.thumbnail_url || profile?.profile_image_url

  return (
    <div className="min-h-[calc(100vh-64px)] bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* 페이지 타이틀 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
              스킨 설정
            </h1>
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              블로그 테마를 선택하세요
            </p>
          </div>
          {userBlog && (
            <a
              href={`/blog/${userBlog.id}`}
              className="text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              내 블로그 →
            </a>
          )}
        </div>

        {/* 로그인/블로그 안내 */}
        {!user && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
            <svg className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="flex-1 text-sm text-amber-800 dark:text-amber-200">
              스킨을 적용하려면 로그인이 필요합니다
            </p>
            <a href="/" className="text-sm font-medium text-amber-600 hover:underline dark:text-amber-400">
              로그인
            </a>
          </div>
        )}

        {user && !userBlog && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-900/50 dark:bg-blue-950/30">
            <svg className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="flex-1 text-sm text-blue-800 dark:text-blue-200">
              블로그를 먼저 만들어주세요
            </p>
            <a href="/create-blog" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
              블로그 만들기
            </a>
          </div>
        )}

        <div className="flex gap-5">
          {/* 왼쪽: 스킨 목록 */}
          <div className="w-[280px] shrink-0">
            <div className="sticky top-20 space-y-3">
              {/* 검색 */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="스킨 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500 dark:focus:border-neutral-600"
                />
              </div>

              {/* 스킨 리스트 */}
              <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                  {filteredSkins.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      {searchQuery ? '검색 결과가 없습니다' : '스킨이 없습니다'}
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {filteredSkins.map((skin) => {
                        const isSelected = selectedSkin?.id === skin.id
                        const isApplied = appliedSkinId === skin.id
                        const isRemoving = removing === skin.id
                        const bgColor = skin.css_variables['--blog-bg'] || '#ffffff'
                        const fgColor = skin.css_variables['--blog-fg'] || '#000000'
                        const accentColor = skin.css_variables['--blog-accent'] || '#3b82f6'

                        return (
                          <div
                            key={skin.id}
                            onClick={() => setSelectedSkin(skin)}
                            className={`group relative flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                              isSelected
                                ? 'bg-neutral-100 dark:bg-neutral-800'
                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                            }`}
                          >
                            {/* 컬러 스와치 */}
                            <div
                              className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700"
                              style={{ backgroundColor: bgColor }}
                            >
                              <div className="absolute bottom-1 left-1 flex gap-0.5">
                                <div
                                  className="h-1.5 w-3 rounded-sm"
                                  style={{ backgroundColor: fgColor, opacity: 0.7 }}
                                />
                                <div
                                  className="h-1.5 w-1.5 rounded-sm"
                                  style={{ backgroundColor: accentColor }}
                                />
                              </div>
                              {/* Official 뱃지 */}
                              {skin.is_system && (
                                <div
                                  className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full"
                                  style={{ backgroundColor: accentColor }}
                                >
                                  <svg className="h-2 w-2" style={{ color: bgColor }} viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* 스킨 정보 */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                                  {skin.name}
                                </span>
                                {skin.is_system && (
                                  <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ backgroundColor: accentColor + '20', color: accentColor }}>
                                    Official
                                  </span>
                                )}
                                {isApplied && (
                                  <span className="shrink-0 rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] font-medium text-white dark:bg-white dark:text-neutral-900">
                                    적용중
                                  </span>
                                )}
                              </div>
                              {skin.description && (
                                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                  {skin.description}
                                </p>
                              )}
                            </div>

                            {/* 삭제 버튼 (비공식 스킨만) */}
                            {!skin.is_system && !isApplied && (
                              <button
                                onClick={(e) => handleRemoveSkin(skin, e)}
                                disabled={isRemoving}
                                className="shrink-0 rounded p-1 text-neutral-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-50 dark:hover:bg-red-950/50"
                                title="스킨 삭제"
                              >
                                {isRemoving ? (
                                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                ) : (
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            )}

                            {/* 선택 표시 */}
                            {isSelected && !(!skin.is_system && !isApplied) && (
                              <svg className="h-4 w-4 shrink-0 text-neutral-900 dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* 마켓플레이스 링크 */}
                <a
                  href="/marketplace"
                  className="flex items-center gap-3 border-t border-neutral-100 px-3 py-2.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-white"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-neutral-300 dark:border-neutral-700">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span>더 많은 스킨 찾기</span>
                </a>
              </div>
            </div>
          </div>

          {/* 오른쪽: 미리보기 */}
          <div className="flex-1 min-w-0">
            {selectedSkin && cssVars ? (
              <div className="space-y-4">
                {/* 미리보기 헤더 */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                        {selectedSkin.name}
                      </h2>
                      {selectedSkin.is_system && (
                        <span
                          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            backgroundColor: (selectedSkin.css_variables['--blog-accent'] || '#3b82f6') + '20',
                            color: selectedSkin.css_variables['--blog-accent'] || '#3b82f6'
                          }}
                        >
                          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Official
                        </span>
                      )}
                    </div>
                    {selectedSkin.description && (
                      <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                        {selectedSkin.description}
                      </p>
                    )}
                  </div>
                  {appliedSkinId === selectedSkin.id ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-sm text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      적용됨
                    </span>
                  ) : (
                    <button
                      onClick={handleApplySkin}
                      disabled={applying || !user || !userBlog}
                      className="rounded-lg bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                    >
                      {applying ? '적용 중...' : '적용하기'}
                    </button>
                  )}
                </div>

                {/* 미리보기 프레임 */}
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  {/* 브라우저 바 */}
                  <div className="flex h-9 items-center gap-2 border-b border-neutral-200 bg-neutral-100 px-3 dark:border-neutral-800 dark:bg-neutral-800">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                      <div className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                      <div className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                    </div>
                    <div className="flex-1">
                      <div className="mx-auto max-w-xs rounded bg-white px-3 py-0.5 text-center text-xs text-neutral-400 dark:bg-neutral-900">
                        {userBlog ? `snuggle.com/blog/${userBlog.id}` : 'snuggle.com/blog'}
                      </div>
                    </div>
                  </div>

                  {/* 미리보기 콘텐츠 */}
                  <div
                    className="flex h-[600px] flex-col overflow-hidden"
                    style={{
                      backgroundColor: cssVars['--blog-bg'],
                      color: cssVars['--blog-fg'],
                      fontFamily: cssVars['--blog-font-sans'],
                    }}
                  >
                    {/* 블로그 헤더 */}
                    <header
                      className="relative shrink-0 border-b"
                      style={{ borderColor: cssVars['--blog-border'] }}
                    >
                      <div className="relative flex h-12 items-center justify-between px-5">
                        {/* 로고 + 블로그명 */}
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold" style={{ color: cssVars['--blog-fg'] }}>
                            Snuggle
                          </span>
                          <span className="text-sm" style={{ color: cssVars['--blog-muted'] }}>/</span>
                          <span className="text-sm font-medium" style={{ color: cssVars['--blog-fg'] }}>
                            {userBlog?.name || '내 블로그'}
                          </span>
                        </div>

                        {/* 네비게이션 - 중앙 */}
                        <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-5">
                          <span className="text-xs font-bold" style={{ color: cssVars['--blog-fg'] }}>홈</span>
                          <span className="text-xs font-medium" style={{ color: cssVars['--blog-muted'] }}>피드</span>
                          <span className="text-xs font-medium" style={{ color: cssVars['--blog-muted'] }}>스킨</span>
                        </nav>

                        {/* 오른쪽 액션 */}
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded-full px-3 py-1.5 text-xs font-medium"
                            style={{
                              backgroundColor: cssVars['--blog-accent'],
                              color: cssVars['--blog-bg'],
                            }}
                          >
                            시작하기
                          </button>
                        </div>
                      </div>
                    </header>

                    {/* 블로그 본문 */}
                    <PreviewBlogLayout
                      layout={layout}
                      cssVars={cssVars}
                      sidebar={
                        <PreviewSidebar
                          cssVars={cssVars}
                          blogName={userBlog?.name}
                          blogDescription={userBlog?.description}
                          displayImage={displayImage}
                          postCount={blogPosts.length}
                          subscriberCount={12}
                          visitorCount={48}
                        />
                      }
                    >
                      <PreviewPostList cssVars={cssVars} posts={blogPosts} />
                    </PreviewBlogLayout>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[600px] items-center justify-center rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-neutral-500 dark:text-neutral-400">
                  스킨을 선택해주세요
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
