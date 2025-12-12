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
    const [isFocused, setIsFocused] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const currentLanguage = node.attrs.language || 'javascript'
    const currentLabel = LANGUAGES.find(l => l.value === currentLanguage)?.label || 'JavaScript'

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsFocused(false)
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleWrapperClick = () => {
        setIsFocused(true)
    }

    return (
        <NodeViewWrapper
            className="code-block-wrapper"
            ref={wrapperRef}
            onClick={handleWrapperClick}
        >
            <pre>
                <NodeViewContent className="hljs" />
            </pre>
            {/* 언어 선택 - 코드블록 포커스 시에만 표시 */}
            {isFocused && (
                <div
                    className="lang-dropdown-enter absolute -bottom-3 left-3 z-50"
                    ref={dropdownRef}
                    contentEditable={false}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowDropdown(!showDropdown)
                        }}
                        className="flex items-center gap-1.5 rounded-md bg-zinc-700 px-2.5 py-1.5 text-xs font-medium text-gray-300 shadow-lg hover:bg-zinc-600"
                    >
                        {currentLabel}
                        <svg className={`h-3 w-3 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {showDropdown && (
                        <div className="lang-menu-enter absolute bottom-full left-0 mb-2 max-h-64 w-40 overflow-y-auto rounded-lg border border-zinc-600 bg-zinc-800 py-1 shadow-xl">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.value}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        updateAttributes({ language: lang.value })
                                        setShowDropdown(false)
                                    }}
                                    className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-700 ${
                                        currentLanguage === lang.value
                                            ? 'bg-zinc-700 text-white'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </NodeViewWrapper>
    )
}
