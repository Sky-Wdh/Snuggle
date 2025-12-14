'use client'

import { useState, useRef, useEffect } from 'react'

interface Category {
    id: string
    name: string
}

interface CategorySelectorProps {
    categories: Category[]
    selectedIds: string[]
    onChange: (ids: string[]) => void
    onAddCategory?: (name: string) => Promise<Category | null>
    maxSelection?: number
}

export default function CategorySelector({
    categories,
    selectedIds,
    onChange,
    onAddCategory,
    maxSelection = 5,
}: CategorySelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [showAddInput, setShowAddInput] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const selectedCategories = categories.filter(c => selectedIds.includes(c.id))

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false)
                setShowAddInput(false)
                setNewCategoryName('')
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (showAddInput && inputRef.current) {
            inputRef.current.focus()
        }
    }, [showAddInput])

    const handleAddCategory = async () => {
        if (!newCategoryName.trim() || !onAddCategory) return

        setIsAdding(true)
        const newCategory = await onAddCategory(newCategoryName.trim())
        setIsAdding(false)

        if (newCategory) {
            if (selectedIds.length < maxSelection) {
                onChange([...selectedIds, newCategory.id])
            }
            setNewCategoryName('')
            setShowAddInput(false)
        }
    }

    const toggleCategory = (categoryId: string) => {
        if (selectedIds.includes(categoryId)) {
            onChange(selectedIds.filter(id => id !== categoryId))
        } else if (selectedIds.length < maxSelection) {
            onChange([...selectedIds, categoryId])
        }
    }

    const removeCategory = (categoryId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(selectedIds.filter(id => id !== categoryId))
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* 선택된 카테고리 표시 */}
            <div className="flex flex-wrap items-center gap-2">
                {selectedCategories.map(category => (
                    <span
                        key={category.id}
                        className="flex items-center gap-1 rounded-full bg-black/10 px-3 py-1.5 text-sm text-black dark:bg-white/10 dark:text-white"
                    >
                        {category.name}
                        <button
                            type="button"
                            onClick={(e) => removeCategory(category.id, e)}
                            className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
                        >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </span>
                ))}

                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-1.5 text-sm transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                >
                    <svg className="h-4 w-4 text-black/50 dark:text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-black/50 dark:text-white/50">
                        {selectedIds.length === 0 ? '카테고리 선택' : `추가 (${selectedIds.length}/${maxSelection})`}
                    </span>
                    <svg className={`h-4 w-4 text-black/50 transition-transform dark:text-white/50 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {isOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-zinc-900">
                    {/* 전체 해제 옵션 */}
                    {selectedIds.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                onChange([])
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-black/50 transition-colors hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/5"
                        >
                            전체 해제
                        </button>
                    )}

                    {/* 카테고리 목록 */}
                    {categories.length > 0 && (
                        <div className={selectedIds.length > 0 ? "border-t border-black/10 dark:border-white/10" : ""}>
                            {categories.map(category => {
                                const isSelected = selectedIds.includes(category.id)
                                const isDisabled = !isSelected && selectedIds.length >= maxSelection
                                return (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => toggleCategory(category.id)}
                                        disabled={isDisabled}
                                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                                            isSelected
                                                ? 'bg-black/5 dark:bg-white/5'
                                                : isDisabled
                                                ? 'cursor-not-allowed opacity-50'
                                                : 'hover:bg-black/5 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        <span className="text-black dark:text-white">{category.name}</span>
                                        {isSelected && (
                                            <svg className="h-4 w-4 text-black dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* 새 카테고리 추가 */}
                    {onAddCategory && (
                        <div className="border-t border-black/10 dark:border-white/10">
                            {showAddInput ? (
                                <div className="flex items-center gap-2 p-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddCategory()
                                            if (e.key === 'Escape') {
                                                setShowAddInput(false)
                                                setNewCategoryName('')
                                            }
                                        }}
                                        placeholder="카테고리 이름"
                                        className="flex-1 rounded-lg border border-black/10 bg-transparent px-3 py-1.5 text-sm text-black outline-none focus:border-black dark:border-white/10 dark:text-white dark:focus:border-white"
                                        disabled={isAdding}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCategory}
                                        disabled={isAdding || !newCategoryName.trim()}
                                        className="rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                                    >
                                        {isAdding ? '...' : '추가'}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowAddInput(true)}
                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-black/50 transition-colors hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    새 카테고리 추가
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
