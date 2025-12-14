'use client'

import { NodeViewContent, NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { useState, useRef, useEffect } from 'react'

const LANGUAGES = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'c', label: 'C' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'php', label: 'PHP' },
    { value: 'swift', label: 'Swift' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'scss', label: 'SCSS' },
    { value: 'json', label: 'JSON' },
    { value: 'xml', label: 'XML' },
    { value: 'yaml', label: 'YAML' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'sql', label: 'SQL' },
    { value: 'bash', label: 'Bash' },
    { value: 'shell', label: 'Shell' },
]

export default function CodeBlockComponent({
    node,
    updateAttributes,
}: NodeViewProps) {
    const [showDropdown, setShowDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const currentLanguage = node.attrs.language || 'javascript'
    const currentLabel = LANGUAGES.find(l => l.value === currentLanguage)?.label || 'JavaScript'

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <NodeViewWrapper className="code-block-wrapper">
            <pre spellCheck={false}>
                <NodeViewContent className="hljs" spellCheck={false} />
            </pre>
            {/* 언어 선택 - 항상 표시 (오른쪽 아래) */}
            <div
                className="absolute -bottom-4 right-3 z-50"
                ref={dropdownRef}
                contentEditable={false}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setShowDropdown(!showDropdown)
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-black/60 backdrop-blur-sm transition-all hover:border-black/20 hover:bg-white hover:text-black/80 dark:border-zinc-700/50 dark:bg-zinc-800/90 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-700/90 dark:hover:text-zinc-300"
                >
                    {currentLabel}
                    <svg className={`h-3 w-3 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {showDropdown && (
                    <div className="lang-menu-enter absolute bottom-full right-0 mb-2 max-h-72 w-44 overflow-hidden rounded-xl border border-black/10 bg-white/95 shadow-2xl backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-800/95">
                        <div className="max-h-72 overflow-y-auto py-1">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.value}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        updateAttributes({ language: lang.value })
                                        setShowDropdown(false)
                                    }}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                                        currentLanguage === lang.value
                                            ? 'bg-black/5 text-black dark:bg-zinc-700/50 dark:text-white'
                                            : 'text-black/60 hover:bg-black/5 hover:text-black dark:text-zinc-400 dark:hover:bg-zinc-700/50 dark:hover:text-zinc-200'
                                    }`}
                                >
                                    {currentLanguage === lang.value && (
                                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    <span className={currentLanguage === lang.value ? '' : 'ml-5'}>{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </NodeViewWrapper>
    )
}
