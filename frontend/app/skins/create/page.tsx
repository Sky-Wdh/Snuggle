'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/common/ToastProvider'
import type { User } from '@supabase/supabase-js'

interface SkinColors {
  bg: string
  fg: string
  accent: string
  muted: string
  border: string
  cardBg: string
}

const defaultColors: SkinColors = {
  bg: '#ffffff',
  fg: '#171717',
  accent: '#171717',
  muted: '#737373',
  border: '#e5e5e5',
  cardBg: '#fafafa',
}

const presetThemes = [
  { name: '라이트', colors: { bg: '#ffffff', fg: '#171717', accent: '#171717', muted: '#737373', border: '#e5e5e5', cardBg: '#fafafa' } },
  { name: '다크', colors: { bg: '#0a0a0a', fg: '#fafafa', accent: '#fafafa', muted: '#a3a3a3', border: '#262626', cardBg: '#171717' } },
  { name: '블루', colors: { bg: '#f0f9ff', fg: '#0c4a6e', accent: '#0284c7', muted: '#64748b', border: '#bae6fd', cardBg: '#e0f2fe' } },
  { name: '그린', colors: { bg: '#f0fdf4', fg: '#14532d', accent: '#16a34a', muted: '#64748b', border: '#bbf7d0', cardBg: '#dcfce7' } },
  { name: '퍼플', colors: { bg: '#faf5ff', fg: '#581c87', accent: '#9333ea', muted: '#64748b', border: '#e9d5ff', cardBg: '#f3e8ff' } },
  { name: '로즈', colors: { bg: '#fff1f2', fg: '#881337', accent: '#e11d48', muted: '#64748b', border: '#fecdd3', cardBg: '#ffe4e6' } },
]

export default function CreateSkinPage() {
  const router = useRouter()
  const toast = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [skinName, setSkinName] = useState('')
  const [skinDescription, setSkinDescription] = useState('')
  const [colors, setColors] = useState<SkinColors>(defaultColors)
  const [layout, setLayout] = useState<'sidebar-right' | 'sidebar-left' | 'no-sidebar'>('sidebar-right')

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      if (!user) {
        toast.showToast('로그인이 필요합니다', 'error')
        router.push('/marketplace')
      }
    }
    checkUser()
  }, [router, toast])

  const handleColorChange = (key: keyof SkinColors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }))
  }

  const applyPreset = (preset: typeof presetThemes[0]) => {
    setColors(preset.colors)
  }

  const handleSubmit = async () => {
    if (!skinName.trim()) {
      toast.showToast('스킨 이름을 입력해주세요', 'error')
      return
    }

    if (!user) {
      toast.showToast('로그인이 필요합니다', 'error')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/skins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          name: skinName.trim(),
          description: skinDescription.trim() || null,
          is_system: false,
          css_variables: {
            '--blog-bg': colors.bg,
            '--blog-fg': colors.fg,
            '--blog-accent': colors.accent,
            '--blog-muted': colors.muted,
            '--blog-border': colors.border,
            '--blog-card-bg': colors.cardBg,
            '--blog-dark-bg': '#0a0a0a',
            '--blog-dark-fg': '#fafafa',
            '--blog-dark-accent': colors.accent,
            '--blog-dark-muted': '#a3a3a3',
            '--blog-dark-border': '#262626',
            '--blog-dark-card-bg': '#171717',
            '--blog-font-sans': 'Pretendard, system-ui, sans-serif',
            '--blog-font-mono': 'JetBrains Mono, monospace',
            '--blog-content-width': '680px',
            '--blog-border-radius': '12px',
          },
          layout_config: {
            layout,
            postListStyle: 'list',
            showThumbnails: true,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create skin')
      }

      toast.showToast('스킨이 생성되었습니다')
      router.push('/marketplace')
    } catch {
      toast.showToast('스킨 생성에 실패했습니다', 'error')
    } finally {
      setSaving(false)
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

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* 헤더 */}
        <div className="mb-10">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-1.5 text-sm text-black/50 transition-colors hover:text-black dark:text-white/50 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            마켓플레이스
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
            커스텀 스킨
          </h1>
          <p className="mt-2 text-black/50 dark:text-white/50">
            나만의 블로그 테마를 만들어보세요
          </p>
        </div>

        <div className="flex gap-10">
          {/* 설정 패널 */}
          <div className="w-72 shrink-0 space-y-6">
            {/* 기본 정보 */}
            <div>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                기본 정보
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                    이름
                  </label>
                  <input
                    type="text"
                    value={skinName}
                    onChange={(e) => setSkinName(e.target.value)}
                    placeholder="예: 미니멀 다크"
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-black outline-none transition-colors placeholder:text-black/30 focus:border-black/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                    설명
                  </label>
                  <textarea
                    value={skinDescription}
                    onChange={(e) => setSkinDescription(e.target.value)}
                    placeholder="스킨에 대한 간단한 설명"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-black outline-none transition-colors placeholder:text-black/30 focus:border-black/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/30"
                  />
                </div>
              </div>
            </div>

            {/* 프리셋 */}
            <div>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                프리셋
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {presetThemes.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="group flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <div
                      className="h-10 w-10 rounded-lg ring-1 ring-black/10 transition-transform group-hover:scale-105 dark:ring-white/10"
                      style={{ backgroundColor: preset.colors.bg }}
                    >
                      <div
                        className="mx-auto mt-3 h-2 w-5 rounded-full"
                        style={{ backgroundColor: preset.colors.accent }}
                      />
                    </div>
                    <span className="text-[11px] text-black/60 dark:text-white/60">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 색상 */}
            <div>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                색상
              </h2>
              <div className="space-y-3">
                {[
                  { key: 'bg', label: '배경' },
                  { key: 'fg', label: '텍스트' },
                  { key: 'accent', label: '강조' },
                  { key: 'muted', label: '보조' },
                  { key: 'border', label: '테두리' },
                  { key: 'cardBg', label: '카드' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-black/70 dark:text-white/70">{label}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colors[key as keyof SkinColors]}
                        onChange={(e) => handleColorChange(key as keyof SkinColors, e.target.value)}
                        className="h-7 w-7 cursor-pointer overflow-hidden rounded-md border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={colors[key as keyof SkinColors]}
                        onChange={(e) => handleColorChange(key as keyof SkinColors, e.target.value)}
                        className="w-20 rounded-md border border-black/10 bg-black/[0.02] px-2 py-1.5 text-xs text-black/70 outline-none dark:border-white/10 dark:bg-white/[0.02] dark:text-white/70"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 레이아웃 */}
            <div>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                레이아웃
              </h2>
              <div className="space-y-2">
                {[
                  { value: 'sidebar-right', label: '사이드바 오른쪽' },
                  { value: 'sidebar-left', label: '사이드바 왼쪽' },
                  { value: 'no-sidebar', label: '사이드바 없음' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
                      layout === option.value
                        ? 'border-black bg-black/[0.02] dark:border-white dark:bg-white/[0.02]'
                        : 'border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="layout"
                      value={option.value}
                      checked={layout === option.value}
                      onChange={(e) => setLayout(e.target.value as typeof layout)}
                      className="sr-only"
                    />
                    <div className={`h-2 w-2 rounded-full ${layout === option.value ? 'bg-black dark:bg-white' : 'bg-black/20 dark:bg-white/20'}`} />
                    <span className={`text-sm ${layout === option.value ? 'font-medium text-black dark:text-white' : 'text-black/60 dark:text-white/60'}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 저장 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={saving || !skinName.trim()}
              className="w-full rounded-lg bg-black py-3 text-sm font-medium text-white transition-colors hover:bg-black/80 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              {saving ? '저장 중...' : '스킨 저장'}
            </button>
          </div>

          {/* 미리보기 */}
          <div className="flex-1">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
              미리보기
            </h2>
            <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5 dark:bg-white/[0.02] dark:ring-white/10">
              {/* 브라우저 바 */}
              <div className="flex h-10 items-center gap-2 border-b border-black/5 bg-black/[0.02] px-4 dark:border-white/5 dark:bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-black/10 dark:bg-white/10" />
                  <div className="h-2.5 w-2.5 rounded-full bg-black/10 dark:bg-white/10" />
                  <div className="h-2.5 w-2.5 rounded-full bg-black/10 dark:bg-white/10" />
                </div>
              </div>

              {/* 미리보기 콘텐츠 */}
              <div
                className="h-[520px] overflow-y-auto"
                style={{ backgroundColor: colors.bg, color: colors.fg }}
              >
                {/* 헤더 */}
                <header
                  className="border-b px-5 py-3"
                  style={{ borderColor: colors.border }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Snuggle</span>
                      <span style={{ color: colors.muted }}>/</span>
                      <span className="text-sm font-medium">{skinName || '내 블로그'}</span>
                    </div>
                    <button
                      className="rounded-full px-3 py-1.5 text-xs font-medium"
                      style={{ backgroundColor: colors.accent, color: colors.bg }}
                    >
                      시작하기
                    </button>
                  </div>
                </header>

                {/* 본문 */}
                <div className={`flex ${layout === 'no-sidebar' ? 'justify-center' : ''} gap-6 p-5`}>
                  {layout === 'sidebar-left' && (
                    <aside className="w-44 shrink-0">
                      <div className="rounded-xl border p-4" style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}>
                        <div className="mx-auto h-12 w-12 rounded-xl" style={{ backgroundColor: colors.muted + '20' }} />
                        <div className="mt-3 text-center">
                          <div className="text-sm font-semibold">{skinName || '블로그'}</div>
                          <button className="mt-2 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: colors.accent, color: colors.bg }}>구독</button>
                        </div>
                        <div className="mt-3 flex justify-center gap-4 text-center">
                          <div><div className="text-sm font-semibold">3</div><div className="text-[10px]" style={{ color: colors.muted }}>글</div></div>
                          <div><div className="text-sm font-semibold">12</div><div className="text-[10px]" style={{ color: colors.muted }}>구독</div></div>
                        </div>
                      </div>
                    </aside>
                  )}

                  <div className={layout === 'no-sidebar' ? 'max-w-sm flex-1' : 'flex-1'}>
                    <div className="flex items-center justify-between pb-3">
                      <span className="text-sm font-semibold">게시글</span>
                      <span className="text-xs" style={{ color: colors.muted }}>3개</span>
                    </div>
                    <div className="border-t" style={{ borderColor: colors.border }}>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="border-b py-3" style={{ borderColor: i < 3 ? colors.border : 'transparent' }}>
                          <div className="text-sm font-semibold">예시 포스트 {i}</div>
                          <div className="mt-1 text-xs" style={{ color: colors.muted }}>내용 미리보기</div>
                          <div className="mt-1 text-[10px]" style={{ color: colors.muted, opacity: 0.7 }}>2024년 1월 {i}일</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {layout === 'sidebar-right' && (
                    <aside className="w-44 shrink-0">
                      <div className="rounded-xl border p-4" style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}>
                        <div className="mx-auto h-12 w-12 rounded-xl" style={{ backgroundColor: colors.muted + '20' }} />
                        <div className="mt-3 text-center">
                          <div className="text-sm font-semibold">{skinName || '블로그'}</div>
                          <button className="mt-2 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: colors.accent, color: colors.bg }}>구독</button>
                        </div>
                        <div className="mt-3 flex justify-center gap-4 text-center">
                          <div><div className="text-sm font-semibold">3</div><div className="text-[10px]" style={{ color: colors.muted }}>글</div></div>
                          <div><div className="text-sm font-semibold">12</div><div className="text-[10px]" style={{ color: colors.muted }}>구독</div></div>
                        </div>
                      </div>
                    </aside>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
