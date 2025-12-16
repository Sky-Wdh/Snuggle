import { createClient } from '@/lib/supabase/client'

// 구독 여부 확인 (Supabase 직접 사용)
export async function checkSubscription(targetId: string): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('subscribe')
    .select('sub_id')
    .eq('sub_id', user.id)
    .eq('subed_id', targetId)
    .maybeSingle()

  if (error) {
    console.error('Check subscription error:', error)
    return false
  }

  return !!data
}

// 구독 토글 (Supabase 직접 사용)
export async function toggleSubscription(targetId: string): Promise<{ subscribed: boolean }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  // 자기 자신 구독 방지
  if (user.id === targetId) {
    throw new Error('자기 자신은 구독할 수 없습니다')
  }

  // 현재 구독 상태 확인
  const { data: existing } = await supabase
    .from('subscribe')
    .select('sub_id')
    .eq('sub_id', user.id)
    .eq('subed_id', targetId)
    .maybeSingle()

  if (existing) {
    // 구독 취소
    const { error } = await supabase
      .from('subscribe')
      .delete()
      .eq('sub_id', user.id)
      .eq('subed_id', targetId)

    if (error) {
      console.error('Unsubscribe error:', error)
      throw new Error('구독 취소에 실패했습니다')
    }

    return { subscribed: false }
  } else {
    // 구독 추가
    const { error } = await supabase
      .from('subscribe')
      .insert({
        sub_id: user.id,
        subed_id: targetId,
      })

    if (error) {
      console.error('Subscribe error:', error)
      throw new Error('구독에 실패했습니다')
    }

    return { subscribed: true }
  }
}
export interface Subscription {
  sub_id: string // 구독하는 사람 (나)
  subed_id: string // 구독 당하는 사람 (상대방)
}

// 구독 수 가져오기 (구독중 블로그 수, 구독자 수)
export async function getSubscriptionCounts(userId: string) {
  const supabase = createClient()

  // 1. 내가 구독하는 사용자 ID 목록
  const { data: subscriptions, error: subError } = await supabase
    .from('subscribe')
    .select('subed_id')
    .eq('sub_id', userId)

  if (subError) {
    console.error('Failed to fetch subscriptions:', subError)
    throw new Error('Failed to fetch subscription counts')
  }

  // 2. 구독한 사용자들의 블로그 수 카운트
  let followingBlogCount = 0
  if (subscriptions && subscriptions.length > 0) {
    const targetUserIds = subscriptions.map(s => s.subed_id)
    const { count, error: blogCountError } = await supabase
      .from('blogs')
      .select('*', { count: 'exact', head: true })
      .in('user_id', targetUserIds)

    if (!blogCountError) {
      followingBlogCount = count || 0
    }
  }

  // 3. 나를 구독하는 수 (Followers) - 사용자 수 기준
  const { count: followersCount, error: followersError } = await supabase
    .from('subscribe')
    .select('*', { count: 'exact', head: true })
    .eq('subed_id', userId)

  if (followersError) {
    console.error('Failed to fetch followers count:', followersError)
    throw new Error('Failed to fetch subscription counts')
  }

  return {
    following: followingBlogCount,
    followers: followersCount || 0,
  }
}

// 내가 구독한 유저 ID 목록 가져오기
export async function getSubscribedUserIds(userId: string): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('subscribe')
    .select('subed_id')
    .eq('sub_id', userId)

  if (error) {
    console.error('Failed to fetch subscribed user IDs:', error)
    return []
  }

  return data.map((row) => row.subed_id)
}

export interface SubscribedBlog {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  profile_image_url: string | null
}

// 내가 구독한 블로그 목록 가져오기
export async function getSubscribedBlogs(userId: string, limit: number = 10): Promise<SubscribedBlog[]> {
  const supabase = createClient()

  // 1. 구독 목록 가져오기
  const { data: subscriptions, error: subError } = await supabase
    .from('subscribe')
    .select('subed_id')
    .eq('sub_id', userId)
    .limit(limit)

  if (subError) {
    console.error('Failed to fetch subscriptions:', subError)
    return []
  }

  if (!subscriptions?.length) {
    return []
  }

  const targetIds = subscriptions.map(s => s.subed_id)

  // 2. subed_id가 user_id인 경우 - blogs와 profiles 함께 조회
  const { data: blogsByUserId, error: userIdError } = await supabase
    .from('blogs')
    .select('id, name, description, thumbnail_url, user_id')
    .in('user_id', targetIds)

  if (!userIdError && blogsByUserId && blogsByUserId.length > 0) {
    // profiles에서 프로필 이미지 가져오기
    const userIds = blogsByUserId.map(b => b.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, profile_image_url')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p.profile_image_url]) || [])

    return blogsByUserId.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      thumbnail_url: b.thumbnail_url,
      profile_image_url: profileMap.get(b.user_id) || null,
    }))
  }

  // 3. subed_id가 blog_id인 경우 시도
  const { data: blogsByBlogId } = await supabase
    .from('blogs')
    .select('id, name, description, thumbnail_url, user_id')
    .in('id', targetIds)

  if (blogsByBlogId && blogsByBlogId.length > 0) {
    const userIds = blogsByBlogId.map(b => b.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, profile_image_url')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p.profile_image_url]) || [])

    return blogsByBlogId.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      thumbnail_url: b.thumbnail_url,
      profile_image_url: profileMap.get(b.user_id) || null,
    }))
  }

  return []
}
