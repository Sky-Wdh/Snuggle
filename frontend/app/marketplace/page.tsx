'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMarketplaceSkins, downloadSkin, getUserSkinLibrary, BlogSkin } from '@/lib/api/skins'
import Toast from '@/components/common/Toast'
import type { User } from '@supabase/supabase-js'

type TabType = 'all' | 'official' | 'community'

export default function MarketplacePage() {
  const [user, setUser] = useState<User | null>(null)
  const [skins, setSkins] = useState<BlogSkin[]>([])
  const [downloadedSkinIds, setDownloadedSkinIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [selectedSkin, setSelectedSkin] = useState<BlogSkin | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  })

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }))
  }

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        try {
          const library = await getUserSkinLibrary()
          setDownloadedSkinIds(library.map(item => item.skin_id))
        } catch (err) {
          console.error('Failed to load skin library:', err)
        }
      }

      try {
        const skinsData = await getMarketplaceSkins()
        setSkins(skinsData)
      } catch (err) {
        console.error('Failed to load marketplace skins:', err)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const filteredSkins = useMemo(() => {
    let result = skins
    if (activeTab === 'official') {
      result = result.filter(skin => skin.is_system)
    } else if (activeTab === 'community') {
      result = result.filter(skin => !skin.is_system)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(skin =>
        skin.name.toLowerCase().includes(query) ||
        skin.description?.toLowerCase().includes(query)
      )
    }
    return result
  }, [skins, activeTab, searchQuery])

  const stats = useMemo(() => ({
    total: skins.length,
    official: skins.filter(s => s.is_system).length,
    community: skins.filter(s => !s.is_system).length,
  }), [skins])

  const handleDownloadSkin = async (skin: BlogSkin) => {
    if (!user) {
      showToast('로그인이 필요합니다', 'error')
      return
    }
    setDownloading(skin.id)
    try {
      await downloadSkin(skin.id)
      setDownloadedSkinIds(prev => [...prev, skin.id])
      showToast(`'${skin.name}' 스킨이 추가되었습니다`, 'success')
    } catch {
      showToast('다운로드에 실패했습니다', 'error')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-[#09090b]">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-2 border-black/10 dark:border-white/10" />
          <div className="absolute inset-0 h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-black dark:border-t-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b]">
      {/* 히어로 배너 */}
      <section className="relative h-[320px] overflow-hidden">
        {/* 배경 이미지 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/image/skin_marketplace_banner.jpg)' }}
        />
        {/* 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#fafafa] via-[#fafafa]/60 to-transparent dark:from-[#09090b] dark:via-[#09090b]/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

        {/* 콘텐츠 */}
        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-12">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
              Skin Marketplace
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white drop-shadow-lg md:text-5xl">
              스킨 마켓
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/80 md:text-base">
              블로그를 당신만의 공간으로. 다양한 테마를 탐색하고 적용해보세요.
            </p>

            {/* 통계 */}
            <div className="mt-6 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{stats.total}</span>
                <span className="text-xs text-white/60">전체</span>
              </div>
              <div className="h-4 w-px bg-white/20" />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{stats.official}</span>
                <span className="text-xs text-white/60">공식</span>
              </div>
              <div className="h-4 w-px bg-white/20" />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{stats.community}</span>
                <span className="text-xs text-white/60">커뮤니티</span>
              </div>
            </div>
          </div>

          {/* 커스텀 스킨 버튼 */}
          <a
            href="/skins/create"
            className="absolute bottom-12 right-6 hidden items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/20 md:inline-flex"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            직접 만들기
          </a>
        </div>
      </section>

      {/* 필터 바 */}
      <section className="sticky top-16 z-20 border-b border-black/5 bg-[#fafafa]/90 backdrop-blur-xl dark:border-white/5 dark:bg-[#09090b]/90">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between py-4">
            {/* 탭 */}
            <div className="flex items-center gap-1">
              {[
                { key: 'all', label: '전체' },
                { key: 'official', label: '공식', icon: true },
                { key: 'community', label: '커뮤니티' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabType)}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'text-black dark:text-white'
                      : 'text-black/40 hover:text-black/70 dark:text-white/40 dark:hover:text-white/70'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {tab.icon && (
                      <svg className="h-3.5 w-3.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    {tab.label}
                  </span>
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-black dark:bg-white" />
                  )}
                </button>
              ))}
            </div>

            {/* 검색 */}
            <div className="relative">
              <input
                type="text"
                placeholder="검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 rounded-full border border-black/10 bg-white px-4 py-2 pl-9 text-sm outline-none transition-all placeholder:text-black/30 focus:w-56 focus:border-black/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20"
              />
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 스킨 그리드 */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        {filteredSkins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="mb-4 text-5xl opacity-20">◇</div>
            <p className="text-black/40 dark:text-white/40">
              {searchQuery ? '검색 결과가 없습니다' : '스킨이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSkins.map((skin, index) => {
              const isDownloaded = downloadedSkinIds.includes(skin.id)
              const isDownloading = downloading === skin.id
              const cssVars = skin.css_variables
              const bgColor = cssVars['--blog-bg'] || '#ffffff'
              const fgColor = cssVars['--blog-fg'] || '#000000'
              const accentColor = cssVars['--blog-accent'] || '#000000'
              const mutedColor = cssVars['--blog-muted'] || '#666666'
              const borderColor = cssVars['--blog-border'] || '#e5e5e5'
              const cardBgColor = cssVars['--blog-card-bg'] || '#ffffff'

              return (
                <div
                  key={skin.id}
                  className="group"
                  style={{
                    opacity: 0,
                    animation: 'fadeSlideUp 0.5s ease forwards',
                    animationDelay: `${index * 60}ms`
                  }}
                >
                  <div
                    className="relative cursor-pointer overflow-hidden rounded-xl transition-all duration-500 hover:scale-[1.02]"
                    onClick={() => setSelectedSkin(skin)}
                    style={{
                      boxShadow: '0 2px 20px -4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {/* 컬러 프리뷰 - 실제 블로그 축소판 */}
                    <div
                      className="relative aspect-[4/3] overflow-hidden"
                      style={{ backgroundColor: bgColor }}
                    >
                      {/* 미니 헤더 */}
                      <div
                        className="flex items-center justify-between px-3 py-2"
                        style={{ borderBottom: `1px solid ${borderColor}` }}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                          <div className="h-1 w-8 rounded-full" style={{ backgroundColor: fgColor, opacity: 0.8 }} />
                        </div>
                        <div
                          className="h-3 w-8 rounded-sm"
                          style={{ backgroundColor: accentColor }}
                        />
                      </div>

                      {/* 미니 콘텐츠 레이아웃 */}
                      <div className="flex gap-2 p-3">
                        {/* 포스트 영역 */}
                        <div className="flex-1 space-y-2">
                          {[1, 2].map((i) => (
                            <div
                              key={i}
                              className="rounded-md p-2"
                              style={{ backgroundColor: cardBgColor }}
                            >
                              <div className="h-1 w-12 rounded-full" style={{ backgroundColor: fgColor }} />
                              <div className="mt-1.5 h-0.5 w-full rounded-full" style={{ backgroundColor: mutedColor, opacity: 0.4 }} />
                              <div className="mt-1 h-0.5 w-2/3 rounded-full" style={{ backgroundColor: mutedColor, opacity: 0.3 }} />
                            </div>
                          ))}
                        </div>
                        {/* 사이드바 */}
                        <div
                          className="w-12 shrink-0 rounded-md p-2"
                          style={{ backgroundColor: cardBgColor }}
                        >
                          <div className="mx-auto h-5 w-5 rounded-md" style={{ backgroundColor: mutedColor, opacity: 0.15 }} />
                          <div className="mx-auto mt-1.5 h-0.5 w-6 rounded-full" style={{ backgroundColor: fgColor, opacity: 0.6 }} />
                          <div
                            className="mx-auto mt-1.5 h-2 w-6 rounded-sm"
                            style={{ backgroundColor: accentColor }}
                          />
                        </div>
                      </div>

                      {/* 호버 그라데이션 */}
                      <div
                        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{
                          background: `linear-gradient(135deg, ${accentColor}20 0%, transparent 50%, ${fgColor}10 100%)`
                        }}
                      />

                      {/* 뱃지들 */}
                      <div className="absolute left-2 top-2 flex items-center gap-1.5">
                        {skin.is_system && (
                          <div
                            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                            style={{
                              backgroundColor: accentColor,
                              color: bgColor
                            }}
                          >
                            <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Official
                          </div>
                        )}
                      </div>

                      {isDownloaded && (
                        <div className="absolute right-2 top-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 카드 하단 정보 */}
                    <div
                      className="relative border-t p-3"
                      style={{
                        backgroundColor: bgColor,
                        borderColor: borderColor
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3
                            className="truncate text-sm font-semibold"
                            style={{ color: fgColor }}
                          >
                            {skin.name}
                          </h3>
                          {skin.description && (
                            <p
                              className="mt-0.5 truncate text-xs"
                              style={{ color: mutedColor }}
                            >
                              {skin.description}
                            </p>
                          )}
                        </div>

                        {isDownloaded ? (
                          <a
                            href="/skins"
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-opacity hover:opacity-70"
                            style={{
                              backgroundColor: fgColor + '10',
                              color: fgColor
                            }}
                          >
                            적용하기
                          </a>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadSkin(skin)
                            }}
                            disabled={isDownloading || !user}
                            className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                            style={{
                              backgroundColor: accentColor,
                              color: bgColor
                            }}
                          >
                            {isDownloading ? (
                              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : '받기'}
                          </button>
                        )}
                      </div>

                      {/* 컬러 팔레트 바 */}
                      <div className="mt-2.5 flex h-1 overflow-hidden rounded-full">
                        <div className="flex-1" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }} />
                        <div className="flex-1" style={{ backgroundColor: cardBgColor }} />
                        <div className="flex-1" style={{ backgroundColor: fgColor }} />
                        <div className="flex-1" style={{ backgroundColor: accentColor }} />
                        <div className="flex-1" style={{ backgroundColor: mutedColor }} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 로그인 안내 */}
        {!user && skins.length > 0 && (
          <div className="mt-12 rounded-2xl bg-gradient-to-r from-black/[0.02] to-black/[0.04] p-8 text-center dark:from-white/[0.02] dark:to-white/[0.04]">
            <p className="text-black/60 dark:text-white/60">
              스킨을 다운로드하려면 로그인이 필요합니다
            </p>
            <a
              href="/"
              className="mt-4 inline-block rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black"
            >
              로그인
            </a>
          </div>
        )}
      </section>

      {/* 미리보기 모달 - 풀스크린 슬라이드 패널 */}
      {selectedSkin && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setSelectedSkin(null)}
        >
          {/* 백드롭 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.3s ease' }}
          />

          {/* 슬라이드 패널 */}
          <div
            className="relative ml-auto flex h-full w-full max-w-5xl flex-col bg-[#fafafa] shadow-2xl dark:bg-[#09090b]"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideInRight 0.4s ease' }}
          >
            {/* 헤더 */}
            <div className="flex shrink-0 items-center justify-between border-b border-black/5 px-6 py-4 dark:border-white/10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedSkin(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-black dark:text-white">{selectedSkin.name}</h2>
                    {selectedSkin.is_system && (
                      <span
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor: selectedSkin.css_variables['--blog-accent'],
                          color: selectedSkin.css_variables['--blog-bg']
                        }}
                      >
                        <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Official
                      </span>
                    )}
                  </div>
                  {selectedSkin.description && (
                    <p className="mt-0.5 text-sm text-black/50 dark:text-white/50">{selectedSkin.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* 컬러 팔레트 */}
                <div className="mr-2 hidden items-center gap-1.5 md:flex">
                  {[
                    selectedSkin.css_variables['--blog-bg'],
                    selectedSkin.css_variables['--blog-fg'],
                    selectedSkin.css_variables['--blog-accent'],
                    selectedSkin.css_variables['--blog-card-bg'],
                    selectedSkin.css_variables['--blog-muted'],
                  ].map((color, i) => (
                    <div
                      key={i}
                      className="h-5 w-5 rounded-md ring-1 ring-black/10 dark:ring-white/10"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>

                {downloadedSkinIds.includes(selectedSkin.id) ? (
                  <a
                    href="/skins"
                    className="rounded-lg bg-black/5 px-4 py-2 text-sm font-medium text-black/70 transition-colors hover:bg-black/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
                  >
                    적용하기
                  </a>
                ) : (
                  <button
                    onClick={() => handleDownloadSkin(selectedSkin)}
                    disabled={downloading === selectedSkin.id || !user}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-black/80 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    {downloading === selectedSkin.id ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        다운로드 중
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        다운로드
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* 미리보기 프레임 */}
            <div className="flex-1 overflow-hidden p-6">
              <div className="mx-auto h-full max-w-4xl overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
                {/* 브라우저 바 */}
                <div className="flex h-10 items-center gap-2 border-b px-4" style={{ backgroundColor: selectedSkin.css_variables['--blog-card-bg'], borderColor: selectedSkin.css_variables['--blog-border'] }}>
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedSkin.css_variables['--blog-muted'], opacity: 0.3 }} />
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedSkin.css_variables['--blog-muted'], opacity: 0.3 }} />
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedSkin.css_variables['--blog-muted'], opacity: 0.3 }} />
                  </div>
                  <div className="ml-4 flex-1">
                    <div
                      className="mx-auto max-w-md rounded-md px-3 py-1 text-center text-xs"
                      style={{
                        backgroundColor: selectedSkin.css_variables['--blog-bg'],
                        color: selectedSkin.css_variables['--blog-muted']
                      }}
                    >
                      snuggle.blog/my-blog
                    </div>
                  </div>
                </div>

                {/* 미리보기 콘텐츠 */}
                <div
                  className="h-[calc(100%-40px)] overflow-y-auto"
                  style={{
                    backgroundColor: selectedSkin.css_variables['--blog-bg'],
                    color: selectedSkin.css_variables['--blog-fg'],
                  }}
                >
                  {/* 블로그 헤더 */}
                  <header
                    className="border-b px-6 py-3"
                    style={{ borderColor: selectedSkin.css_variables['--blog-border'] }}
                  >
                    <div className="mx-auto flex max-w-4xl items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">Snuggle</span>
                        <span style={{ color: selectedSkin.css_variables['--blog-muted'] }}>/</span>
                        <span className="font-medium">My Blog</span>
                      </div>
                      <div className="flex items-center gap-5">
                        <span className="text-sm font-medium" style={{ color: selectedSkin.css_variables['--blog-fg'] }}>홈</span>
                        <span className="text-sm" style={{ color: selectedSkin.css_variables['--blog-muted'] }}>방명록</span>
                        <button
                          className="rounded-full px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
                          style={{
                            backgroundColor: selectedSkin.css_variables['--blog-accent'],
                            color: selectedSkin.css_variables['--blog-bg'],
                          }}
                        >
                          구독
                        </button>
                      </div>
                    </div>
                  </header>

                  {/* 블로그 본문 */}
                  <div className="mx-auto flex max-w-4xl gap-8 px-6 py-8">
                    {/* 메인 콘텐츠 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between pb-4">
                        <h2 className="text-lg font-semibold">게시글</h2>
                        <span className="text-sm" style={{ color: selectedSkin.css_variables['--blog-muted'] }}>3개</span>
                      </div>

                      <div className="border-t" style={{ borderColor: selectedSkin.css_variables['--blog-border'] }}>
                        {[
                          { title: '첫 번째 포스트', excerpt: '블로그의 첫 번째 글입니다. 반갑습니다!', date: '2024년 12월 15일', views: 128, likes: 12 },
                          { title: '개발 이야기', excerpt: '오늘은 새로운 기능을 구현해보았습니다.', date: '2024년 12월 10일', views: 256, likes: 24 },
                          { title: '일상 기록', excerpt: '맛있는 커피를 마시며 코딩하는 하루.', date: '2024년 12월 5일', views: 89, likes: 8 },
                        ].map((post, i) => (
                          <div
                            key={i}
                            className="border-b py-4 transition-colors"
                            style={{ borderColor: i < 2 ? selectedSkin.css_variables['--blog-border'] : 'transparent' }}
                          >
                            <h3 className="font-semibold">{post.title}</h3>
                            <p className="mt-1.5 text-sm" style={{ color: selectedSkin.css_variables['--blog-muted'] }}>
                              {post.excerpt}
                            </p>
                            <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: selectedSkin.css_variables['--blog-muted'], opacity: 0.7 }}>
                              <span>{post.date}</span>
                              <span style={{ color: selectedSkin.css_variables['--blog-border'] }}>·</span>
                              <span className="flex items-center gap-1">
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {post.views}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                {post.likes}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 사이드바 */}
                    <aside className="w-64 shrink-0">
                      <div
                        className="rounded-2xl border p-5"
                        style={{
                          borderColor: selectedSkin.css_variables['--blog-border'],
                          backgroundColor: selectedSkin.css_variables['--blog-card-bg'],
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className="h-20 w-20 rounded-2xl"
                            style={{ backgroundColor: selectedSkin.css_variables['--blog-muted'] + '20' }}
                          />
                          <h3 className="mt-3 text-lg font-bold">내 블로그</h3>
                          <p className="mt-1 text-center text-sm" style={{ color: selectedSkin.css_variables['--blog-muted'] }}>
                            개발과 일상을 기록합니다
                          </p>
                          <button
                            className="mt-3 rounded-full px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
                            style={{
                              backgroundColor: selectedSkin.css_variables['--blog-accent'],
                              color: selectedSkin.css_variables['--blog-bg'],
                            }}
                          >
                            구독하기
                          </button>
                        </div>

                        <div className="mt-5 flex justify-center gap-6">
                          <div className="text-center">
                            <div className="text-xl font-bold">3</div>
                            <div className="text-xs" style={{ color: selectedSkin.css_variables['--blog-muted'] }}>게시글</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold">128</div>
                            <div className="text-xs" style={{ color: selectedSkin.css_variables['--blog-muted'] }}>구독자</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold">1.2K</div>
                            <div className="text-xs" style={{ color: selectedSkin.css_variables['--blog-muted'] }}>방문</div>
                          </div>
                        </div>
                      </div>

                      {/* 블로그 정보 */}
                      <div
                        className="mt-4 rounded-2xl border p-5"
                        style={{
                          borderColor: selectedSkin.css_variables['--blog-border'],
                          backgroundColor: selectedSkin.css_variables['--blog-card-bg'],
                        }}
                      >
                        <h4 className="text-sm font-semibold">블로그 정보</h4>
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span style={{ color: selectedSkin.css_variables['--blog-muted'] }}>개설일</span>
                            <span>2024년 1월 1일</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: selectedSkin.css_variables['--blog-muted'] }}>총 방문</span>
                            <span>1,234명</span>
                          </div>
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </div>
  )
}
