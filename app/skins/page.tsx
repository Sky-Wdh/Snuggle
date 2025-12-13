'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSystemSkins, applySkin, BlogSkin } from '@/lib/api/skins'
import { getBlogPosts, Post } from '@/lib/api/posts'
import SkinCard from '@/components/skin/SkinCard'
import Toast from '@/components/common/Toast'
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
  const [previewSkin, setPreviewSkin] = useState<BlogSkin | null>(null)
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

      // 현재 사용자
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // 사용자의 블로그와 프로필
      if (user) {
        const { data: blogData } = await supabase
          .from('blogs')
          .select('id, name, description, thumbnail_url')
          .eq('user_id', user.id)
          .single()

        if (blogData) {
          setUserBlog(blogData)

          // 블로그 게시글 로드
          try {
            const posts = await getBlogPosts(blogData.id, false)
            setBlogPosts(posts.slice(0, 5)) // 미리보기용으로 최대 5개
          } catch (err) {
            console.error('Failed to load posts:', err)
          }
        }

        // 프로필 정보
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, nickname, profile_image_url')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        }
      }

      // 시스템 스킨 목록
      try {
        const skinsData = await getSystemSkins()
        setSkins(skinsData)
      } catch (err) {
        console.error('Failed to load skins:', err)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const handleApplySkin = async (skinId: string) => {
    if (!user) {
      showToast('로그인이 필요합니다', 'error')
      return
    }

    if (!userBlog) {
      showToast('블로그를 먼저 만들어주세요', 'error')
      return
    }

    setApplying(true)
    try {
      await applySkin(userBlog.id, skinId)
      showToast('스킨이 적용되었습니다!', 'success')
    } catch (err) {
      showToast('스킨 적용에 실패했습니다', 'error')
    } finally {
      setApplying(false)
    }
  }

  const handlePreview = (skin: BlogSkin) => {
    if (!userBlog) {
      showToast('블로그가 없어 미리보기를 할 수 없습니다', 'error')
      return
    }
    setPreviewSkin(skin)
  }

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // 컨텐츠에서 텍스트 추출 (HTML 태그 제거)
  const extractText = (html: string, maxLength: number = 100) => {
    const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white" />
      </div>
    )
  }

  // 미리보기 모드 - 전체 화면으로 실제 블로그 렌더링
  if (previewSkin && userBlog) {
    const cssVars = previewSkin.css_variables
    const displayImage = userBlog.thumbnail_url || profile?.profile_image_url

    return (
      <div
        className="min-h-screen"
        style={{
          backgroundColor: cssVars['--blog-bg'],
          color: cssVars['--blog-fg'],
          fontFamily: cssVars['--blog-font-sans'],
        }}
      >
        {/* 미리보기 배너 */}
        <div
          className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-3"
          style={{
            backgroundColor: cssVars['--blog-accent'],
            color: cssVars['--blog-bg'],
          }}
        >
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="font-medium">
              미리보기 중: {previewSkin.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                handleApplySkin(previewSkin.id)
                setPreviewSkin(null)
              }}
              disabled={applying}
              className="rounded-lg px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: cssVars['--blog-bg'],
                color: cssVars['--blog-accent'],
              }}
            >
              {applying ? '적용 중...' : '이 스킨 적용하기'}
            </button>
            <button
              onClick={() => setPreviewSkin(null)}
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
              }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              미리보기 종료
            </button>
          </div>
        </div>

        {/* 실제 블로그 레이아웃 */}
        <div className="pt-14">
          {/* 헤더 */}
          <header
            className="border-b"
            style={{ borderColor: cssVars['--blog-border'] }}
          >
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
              <span className="text-lg font-bold">Snuggle</span>
              <button
                className="rounded-full px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: cssVars['--blog-accent'],
                  color: cssVars['--blog-bg'],
                }}
              >
                새 글 작성
              </button>
            </div>
          </header>

          {/* 메인 컨텐츠 */}
          <main className="mx-auto max-w-6xl px-6 py-10">
            <div className="flex gap-10">
              {/* 왼쪽: 포스트 목록 */}
              <div className="flex-1">
                <h2
                  className="mb-6 text-xl font-semibold"
                  style={{ color: cssVars['--blog-fg'] }}
                >
                  최근 글
                </h2>

                {blogPosts.length === 0 ? (
                  <div
                    className="rounded-xl border py-16 text-center"
                    style={{
                      borderColor: cssVars['--blog-border'],
                      backgroundColor: cssVars['--blog-card-bg'],
                    }}
                  >
                    <p style={{ color: cssVars['--blog-muted'] }}>
                      아직 작성된 글이 없습니다
                    </p>
                    <p
                      className="mt-2 text-sm"
                      style={{ color: cssVars['--blog-muted'], opacity: 0.7 }}
                    >
                      첫 번째 글을 작성해보세요
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {blogPosts.map((post) => (
                      <div
                        key={post.id}
                        className="flex gap-4 rounded-xl border p-4 transition-colors"
                        style={{
                          borderColor: cssVars['--blog-border'],
                          backgroundColor: cssVars['--blog-card-bg'],
                        }}
                      >
                        {post.thumbnail_url && (
                          <img
                            src={post.thumbnail_url}
                            alt=""
                            className="h-24 w-32 shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-semibold line-clamp-1"
                            style={{ color: cssVars['--blog-fg'] }}
                          >
                            {post.title}
                          </h3>
                          <p
                            className="mt-1 text-sm line-clamp-2"
                            style={{ color: cssVars['--blog-muted'] }}
                          >
                            {extractText(post.content || '')}
                          </p>
                          <p
                            className="mt-2 text-xs"
                            style={{ color: cssVars['--blog-muted'], opacity: 0.7 }}
                          >
                            {formatDate(post.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 오른쪽: 프로필 사이드바 */}
              <div className="w-80 shrink-0">
                <div
                  className="rounded-2xl border p-6"
                  style={{
                    borderColor: cssVars['--blog-border'],
                    backgroundColor: cssVars['--blog-card-bg'],
                  }}
                >
                  {/* 프로필 이미지 */}
                  <div className="flex justify-center">
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt={userBlog.name}
                        className="h-24 w-24 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold"
                        style={{
                          backgroundColor: cssVars['--blog-accent'],
                          color: cssVars['--blog-bg'],
                        }}
                      >
                        {userBlog.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* 블로그 정보 */}
                  <div className="mt-4 text-center">
                    <h2
                      className="text-lg font-bold"
                      style={{ color: cssVars['--blog-fg'] }}
                    >
                      {userBlog.name}
                    </h2>
                    {userBlog.description && (
                      <p
                        className="mt-2 text-sm"
                        style={{ color: cssVars['--blog-muted'] }}
                      >
                        {userBlog.description}
                      </p>
                    )}
                  </div>

                  {/* 통계 */}
                  <div
                    className="mt-6 flex justify-center gap-8 border-t pt-6"
                    style={{ borderColor: cssVars['--blog-border'] }}
                  >
                    <div className="text-center">
                      <p
                        className="text-2xl font-bold"
                        style={{ color: cssVars['--blog-fg'] }}
                      >
                        {blogPosts.length}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: cssVars['--blog-muted'] }}
                      >
                        게시글
                      </p>
                    </div>
                  </div>

                  {/* 설정 버튼 */}
                  <button
                    className="mt-6 w-full rounded-lg border py-2.5 text-sm font-medium transition-colors"
                    style={{
                      borderColor: cssVars['--blog-border'],
                      color: cssVars['--blog-fg'],
                    }}
                  >
                    블로그 설정
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* 헤더 */}
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href="/" className="text-lg font-bold text-black dark:text-white">
            Snuggle
          </a>
          <nav className="flex items-center gap-6">
            <a
              href="/"
              className="text-sm font-medium text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
            >
              홈
            </a>
            <span className="text-sm font-medium text-black dark:text-white">
              스킨
            </span>
          </nav>
        </div>
      </header>

      {/* 메인 */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* 타이틀 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            블로그 스킨
          </h1>
          <p className="mt-3 text-black/60 dark:text-white/60">
            블로그에 어울리는 스킨을 선택하세요
          </p>
        </div>

        {/* 로그인 안내 */}
        {!user && (
          <div className="mt-8 rounded-xl border border-black/10 bg-black/5 p-6 text-center dark:border-white/10 dark:bg-white/5">
            <p className="text-black/70 dark:text-white/70">
              스킨을 적용하려면 로그인이 필요합니다
            </p>
            <a
              href="/"
              className="mt-3 inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              로그인하러 가기
            </a>
          </div>
        )}

        {/* 블로그 없음 안내 */}
        {user && !userBlog && (
          <div className="mt-8 rounded-xl border border-black/10 bg-black/5 p-6 text-center dark:border-white/10 dark:bg-white/5">
            <p className="text-black/70 dark:text-white/70">
              스킨을 적용하려면 블로그를 먼저 만들어주세요
            </p>
            <a
              href="/create-blog"
              className="mt-3 inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              블로그 만들기
            </a>
          </div>
        )}

        {/* 스킨 그리드 */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skins.map((skin) => (
            <SkinCard
              key={skin.id}
              skin={skin}
              onSelect={() => handleApplySkin(skin.id)}
              onPreview={() => handlePreview(skin)}
            />
          ))}
        </div>

        {skins.length === 0 && (
          <div className="mt-12 text-center text-black/50 dark:text-white/50">
            사용 가능한 스킨이 없습니다
          </div>
        )}
      </main>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </div>
  )
}
