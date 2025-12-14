import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

export async function uploadImage(file: File): Promise<string | null> {
  const token = await getAuthToken()
  if (!token) {
    console.error('Not authenticated')
    return null
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

export async function uploadTempImage(file: File): Promise<string | null> {
  const token = await getAuthToken()
  if (!token) {
    console.error('Not authenticated')
    return null
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch(`${API_URL}/api/upload/temp`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

export async function deleteTempImage(url: string): Promise<void> {
  const token = await getAuthToken()
  if (!token) {
    console.error('Not authenticated')
    return
  }

  try {
    await fetch(`${API_URL}/api/upload/temp`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    })
  } catch (error) {
    console.error('Image delete failed:', error)
  }
}
