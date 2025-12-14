import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

export interface Category {
  id: string
  name: string
  blog_id: string
}

// 블로그별 카테고리 목록
export async function getCategories(blogId: string): Promise<Category[]> {
  const response = await fetch(`${API_URL}/api/categories/blog/${blogId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch categories')
  }

  return response.json()
}

// 카테고리 추가
export async function createCategory(blogId: string, name: string): Promise<Category> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/api/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ blog_id: blogId, name }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create category')
  }

  return response.json()
}

// 카테고리 삭제
export async function deleteCategory(id: string): Promise<void> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/api/categories/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete category')
  }
}
