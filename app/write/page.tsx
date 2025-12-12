'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent, ReactNodeViewRenderer, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import CodeBlockComponent from '@/components/write/CodeBlockComponent'

// highlight.js 테마 import
import 'highlight.js/styles/github-dark.css'

// lowlight 인스턴스 생성 (모든 언어 포함)
const lowlight = createLowlight(all)

// localStorage 키
const DRAFT_STORAGE_KEY = 'snuggle_draft'

// temp 이미지 URL 패턴 (R2 public URL)
const TEMP_IMAGE_PATTERN = /temp\/[^/]+\/[^"'\s]+/

// 이미지 업로드 함수
async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData()
    formData.append('file', file)

    try {
        const response = await fetch('/api/upload/temp', {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Upload failed')
        }

        const data = await response.json()
        return data.url
    } catch (error) {
        console.error('Image upload failed:', error)
        return null
    }
}

// 이미지 삭제 함수
async function deleteImage(url: string): Promise<void> {
    try {
        await fetch('/api/upload/temp', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        })
    } catch (error) {
        console.error('Image delete failed:', error)
    }
}

// HTML에서 이미지 URL 추출
function extractImageUrls(html: string): string[] {
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g
    const urls: string[] = []
    let match

    while ((match = imgRegex.exec(html)) !== null) {
        if (TEMP_IMAGE_PATTERN.test(match[1])) {
            urls.push(match[1])
        }
    }

    return urls
}

// 분리된 컴포넌트들
import WriteHeader from '@/components/write/WriteHeader'
import EditorToolbar from '@/components/write/EditorToolbar'
import TitleInput from '@/components/write/TitleInput'
import CategorySelector from '@/components/write/CategorySelector'

// 에디터 전용 스타일
import '@/components/write/editor.css'

interface Blog {
    id: string
    name: string
}

interface Category {
    id: string
    name: string
}

interface DraftData {
    title: string
    content: string
    categoryId: string | null
    uploadedImages: string[]
    lastSaved: number
}

export default function WritePage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [blog, setBlog] = useState<Blog | null>(null)
    const [title, setTitle] = useState('')
    const [categoryId, setCategoryId] = useState<string | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [initialContent, setInitialContent] = useState('')

    // 업로드된 이미지 URL 추적
    const uploadedImagesRef = useRef<Set<string>>(new Set())
    const isInitializedRef = useRef(false)

    // localStorage에서 초안 불러오기
    useEffect(() => {
        if (typeof window === 'undefined') return

        try {
            const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
            if (saved) {
                const draft: DraftData = JSON.parse(saved)
                setTitle(draft.title || '')
                setInitialContent(draft.content || '')
                setCategoryId(draft.categoryId || null)
                uploadedImagesRef.current = new Set(draft.uploadedImages || [])
            }
        } catch (error) {
            console.error('Failed to load draft:', error)
        }
    }, [])

    // 에디터에 초기 콘텐츠 설정
    useEffect(() => {
        if (editor && initialContent && !isInitializedRef.current) {
            editor.commands.setContent(initialContent)
            isInitializedRef.current = true
        }
    }, [initialContent])

    // Tiptap 에디터 설정
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // CodeBlockLowlight 사용을 위해 비활성화
            }),
            CodeBlockLowlight.extend({
                addNodeView() {
                    return ReactNodeViewRenderer(CodeBlockComponent)
                },
                addKeyboardShortcuts() {
                    return {
                        'Mod-a': ({ editor }) => {
                            const { $from } = editor.state.selection
                            const node = $from.node($from.depth)

                            // 코드블록 안에 있는지 확인
                            if (node.type.name === 'codeBlock') {
                                const pos = $from.before($from.depth)
                                const nodeSize = node.nodeSize
                                editor.commands.setTextSelection({
                                    from: pos + 1,
                                    to: pos + nodeSize - 1,
                                })
                                return true
                            }
                            return false
                        },
                    }
                },
            }).configure({
                lowlight,
                defaultLanguage: 'javascript',
            }),
            Underline,
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full rounded-lg',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-500 underline',
                },
            }),
            Placeholder.configure({
                placeholder: '내용을 입력하세요...',
            }),
        ],
        content: '',
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px]',
            },
            handleDrop: (view, event, _slice, moved) => {
                if (!moved && event.dataTransfer?.files.length) {
                    const files = Array.from(event.dataTransfer.files)
                    const imageFiles = files.filter(file => file.type.startsWith('image/'))

                    if (imageFiles.length > 0) {
                        event.preventDefault()

                        imageFiles.forEach(async (file) => {
                            const url = await uploadImage(file)
                            if (url && view.state) {
                                // 업로드된 이미지 추적
                                uploadedImagesRef.current.add(url)

                                const { schema } = view.state
                                const coordinates = view.posAtCoords({
                                    left: event.clientX,
                                    top: event.clientY,
                                })

                                if (coordinates) {
                                    const node = schema.nodes.image.create({ src: url })
                                    const transaction = view.state.tr.insert(coordinates.pos, node)
                                    view.dispatch(transaction)
                                }
                            }
                        })

                        return true
                    }
                }
                return false
            },
            handlePaste: (view, event) => {
                const items = event.clipboardData?.items
                if (!items) return false

                const imageItems = Array.from(items).filter(
                    item => item.type.startsWith('image/')
                )

                if (imageItems.length > 0) {
                    event.preventDefault()

                    imageItems.forEach(async (item) => {
                        const file = item.getAsFile()
                        if (file) {
                            const url = await uploadImage(file)
                            if (url && view.state) {
                                // 업로드된 이미지 추적
                                uploadedImagesRef.current.add(url)

                                const { schema } = view.state
                                const node = schema.nodes.image.create({ src: url })
                                const transaction = view.state.tr.replaceSelectionWith(node)
                                view.dispatch(transaction)
                            }
                        }
                    })

                    return true
                }

                return false
            },
        },
        onUpdate: ({ editor }) => {
            // 현재 에디터의 이미지 URL 추출
            const currentContent = editor.getHTML()
            const currentImages = new Set(extractImageUrls(currentContent))

            // 삭제된 이미지 찾기 및 R2에서 삭제
            uploadedImagesRef.current.forEach(url => {
                if (!currentImages.has(url)) {
                    deleteImage(url)
                    uploadedImagesRef.current.delete(url)
                }
            })

            // localStorage에 저장 (디바운스 효과를 위해 setTimeout 사용)
            saveDraftDebounced(editor.getHTML())
        },
    })

    // 에디터에 초기 콘텐츠 설정 (editor가 생성된 후)
    useEffect(() => {
        if (editor && initialContent && !isInitializedRef.current) {
            editor.commands.setContent(initialContent)
            isInitializedRef.current = true
        }
    }, [editor, initialContent])

    // 디바운스된 저장 함수
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const saveDraftDebounced = useCallback((content: string) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        saveTimeoutRef.current = setTimeout(() => {
            saveDraft(content)
        }, 500)
    }, [])

    // localStorage에 저장
    const saveDraft = useCallback((content: string) => {
        if (typeof window === 'undefined') return

        const draft: DraftData = {
            title,
            content,
            categoryId,
            uploadedImages: Array.from(uploadedImagesRef.current),
            lastSaved: Date.now(),
        }

        try {
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
        } catch (error) {
            console.error('Failed to save draft:', error)
        }
    }, [title, categoryId])

    // 제목/카테고리 변경 시 저장
    useEffect(() => {
        if (editor && isInitializedRef.current) {
            saveDraftDebounced(editor.getHTML())
        }
    }, [title, categoryId, editor, saveDraftDebounced])

    // 초안 삭제
    const clearDraft = useCallback(() => {
        if (typeof window === 'undefined') return
        localStorage.removeItem(DRAFT_STORAGE_KEY)
    }, [])

    // 사용자 및 블로그 정보 가져오기
    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()

            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/')
                return
            }

            setUser(user)

            // 블로그 정보 가져오기
            const { data: blogData } = await supabase
                .from('blogs')
                .select('id, name')
                .eq('user_id', user.id)
                .single()

            if (!blogData) {
                router.push('/create-blog')
                return
            }

            setBlog(blogData)

            // 카테고리 정보 가져오기
            const { data: categoryData } = await supabase
                .from('categories')
                .select('id, name')
                .eq('blog_id', blogData.id)
                .order('name')

            if (categoryData) {
                setCategories(categoryData)
            }

            setLoading(false)
        }

        fetchData()
    }, [router])

    // 새 카테고리 추가
    const handleAddCategory = async (name: string): Promise<Category | null> => {
        if (!blog) return null

        // 중복 체크
        if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            alert('이미 존재하는 카테고리입니다')
            return null
        }

        const supabase = createClient()

        const { data, error } = await supabase
            .from('categories')
            .insert({
                blog_id: blog.id,
                name: name,
            })
            .select('id, name')
            .single()

        if (error || !data) {
            console.error('카테고리 추가 실패:', error)
            return null
        }

        setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
        return data
    }

    // 임시저장
    const handleSave = () => {
        if (editor) {
            saveDraft(editor.getHTML())
            alert('임시저장되었습니다.')
        }
    }

    // 발행하기
    const handlePublish = async () => {
        if (!editor || !blog || !title.trim()) {
            alert('제목을 입력해주세요.')
            return
        }

        const content = editor.getHTML()
        if (content === '<p></p>' || !content.trim()) {
            alert('내용을 입력해주세요.')
            return
        }

        setSaving(true)

        try {
            const supabase = createClient()

            const { error } = await supabase
                .from('posts')
                .insert({
                    blog_id: blog.id,
                    title: title.trim(),
                    content: content,
                    category_id: categoryId,
                    published: true,
                })
                .select()
                .single()

            if (error) throw error

            // 발행 성공 시 초안 삭제
            clearDraft()

            router.push(`/blog/${blog.id}`)
        } catch (error) {
            console.error('발행 실패:', error)
            alert('발행에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setSaving(false)
        }
    }

    // 로딩 상태
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            {/* 상단 헤더 */}
            <WriteHeader
                onBack={() => router.back()}
                onSave={handleSave}
                onPublish={handlePublish}
                saving={saving}
            />

            {/* 에디터 영역 */}
            <main className="mx-auto max-w-3xl px-6 py-10">
                {/* 제목 입력 */}
                <TitleInput value={title} onChange={setTitle} />

                {/* 카테고리 선택 */}
                <div className="mt-4">
                    <CategorySelector
                        categories={categories}
                        selectedId={categoryId}
                        onChange={setCategoryId}
                        onAddCategory={handleAddCategory}
                    />
                </div>

                {/* 구분선 */}
                <div className="my-6 h-px bg-black/10 dark:bg-white/10" />

                {/* 툴바 */}
                <EditorToolbar editor={editor} />

                {/* Tiptap 에디터 */}
                <EditorContent editor={editor} className="min-h-[500px]" />
            </main>
        </div>
    )
}
