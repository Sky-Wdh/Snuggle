/**
 * 커스텀 스킨 템플릿 렌더러
 * Mustache-like 문법을 지원하는 간단한 템플릿 엔진
 */

export interface TemplateContext {
  // 블로그 정보
  blog_id?: string
  blog_name?: string
  blog_description?: string
  profile_image?: string
  post_count?: number
  subscriber_count?: number
  visitor_count?: number
  current_year?: number

  // 게시글 정보 (상세 페이지용)
  post_id?: string
  post_title?: string
  post_content?: string
  post_excerpt?: string
  post_date?: string
  thumbnail_url?: string
  category_name?: string
  view_count?: number
  like_count?: number

  // 목록 데이터
  posts?: PostItem[]
  categories?: CategoryItem[]

  // 조건
  no_posts?: boolean

  // 추가 데이터
  [key: string]: unknown
}

export interface PostItem {
  post_id: string
  post_title: string
  post_excerpt?: string
  post_date: string
  thumbnail_url?: string
  view_count: number
  like_count: number
  blog_id: string
}

export interface CategoryItem {
  category_id: string
  category_name: string
  blog_id: string
}

/**
 * 변수 치환: {{variable_name}}
 */
function replaceVariables(template: string, context: TemplateContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = context[varName]
    if (value === undefined || value === null) {
      return ''
    }
    // HTML 이스케이프 (post_content 제외 - HTML 렌더링 필요)
    if (varName === 'post_content') {
      return String(value)
    }
    return escapeHtml(String(value))
  })
}

/**
 * HTML 이스케이프
 */
function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char)
}

/**
 * 조건문 처리: {{#if condition}}...{{/if}}
 */
function processConditionals(template: string, context: TemplateContext): string {
  // {{#if variable}}...{{/if}} 패턴
  const ifPattern = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g

  return template.replace(ifPattern, (match, condition, content) => {
    const value = context[condition]
    // falsy 값 체크 (null, undefined, false, 0, '', [])
    const isTruthy = value !== undefined &&
                     value !== null &&
                     value !== false &&
                     value !== 0 &&
                     value !== '' &&
                     !(Array.isArray(value) && value.length === 0)

    return isTruthy ? content : ''
  })
}

/**
 * 반복문 처리: {{#items}}...{{/items}}
 */
function processLoops(
  template: string,
  context: TemplateContext,
  partials: Record<string, string>
): string {
  // {{#array_name}}...{{/array_name}} 패턴
  const loopPattern = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g

  return template.replace(loopPattern, (match, arrayName, itemTemplate) => {
    const items = context[arrayName]

    if (!Array.isArray(items) || items.length === 0) {
      return ''
    }

    return items.map((item) => {
      // 아이템 컨텍스트 생성 (부모 컨텍스트 + 아이템 데이터)
      const itemContext: TemplateContext = {
        ...context,
        ...item,
      }

      // 파셜 처리: {{> partial_name}}
      let processedTemplate = processPartials(itemTemplate, itemContext, partials)
      // 변수 치환
      processedTemplate = replaceVariables(processedTemplate, itemContext)
      // 조건문 처리
      processedTemplate = processConditionals(processedTemplate, itemContext)

      return processedTemplate
    }).join('\n')
  })
}

/**
 * 파셜 처리: {{> partial_name}}
 */
function processPartials(
  template: string,
  context: TemplateContext,
  partials: Record<string, string>
): string {
  const partialPattern = /\{\{>\s*(\w+)\s*\}\}/g

  return template.replace(partialPattern, (match, partialName) => {
    const partial = partials[partialName]
    if (!partial) {
      return `<!-- partial "${partialName}" not found -->`
    }

    // 파셜 템플릿 렌더링
    return renderTemplate(partial, context, partials)
  })
}

/**
 * 메인 템플릿 렌더링 함수
 */
export function renderTemplate(
  template: string,
  context: TemplateContext,
  partials: Record<string, string> = {}
): string {
  if (!template) return ''

  let result = template

  // 1. 반복문 처리 (내부에서 파셜, 변수, 조건문 처리)
  result = processLoops(result, context, partials)

  // 2. 파셜 처리
  result = processPartials(result, context, partials)

  // 3. 조건문 처리
  result = processConditionals(result, context)

  // 4. 변수 치환
  result = replaceVariables(result, context)

  return result
}

/**
 * 커스텀 스킨 전체 페이지 렌더링
 */
export interface CustomSkinTemplates {
  html_head: string
  html_header: string
  html_post_list: string
  html_post_item: string
  html_post_detail: string
  html_sidebar: string
  html_footer: string
  custom_css: string
}

export function renderCustomSkinPage(
  templates: CustomSkinTemplates,
  context: TemplateContext,
  pageType: 'list' | 'detail'
): {
  headHtml: string
  headerHtml: string
  contentHtml: string
  sidebarHtml: string
  footerHtml: string
  customCss: string
} {
  const partials = {
    post_item: templates.html_post_item,
  }

  return {
    headHtml: renderTemplate(templates.html_head, context, partials),
    headerHtml: renderTemplate(templates.html_header, context, partials),
    contentHtml: pageType === 'list'
      ? renderTemplate(templates.html_post_list, context, partials)
      : renderTemplate(templates.html_post_detail, context, partials),
    sidebarHtml: renderTemplate(templates.html_sidebar, context, partials),
    footerHtml: renderTemplate(templates.html_footer, context, partials),
    customCss: templates.custom_css,
  }
}

/**
 * 날짜 포맷팅 헬퍼
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

/**
 * 게시글 데이터를 템플릿 컨텍스트로 변환
 */
export function postToTemplateItem(post: {
  id: string
  title: string
  content?: string
  excerpt?: string
  thumbnail_url?: string | null
  created_at: string
  view_count?: number
  like_count?: number
  blog_id: string
}): PostItem {
  return {
    post_id: post.id,
    post_title: post.title,
    post_excerpt: post.excerpt || '',
    post_date: formatDate(post.created_at),
    thumbnail_url: post.thumbnail_url || undefined,
    view_count: post.view_count || 0,
    like_count: post.like_count || 0,
    blog_id: post.blog_id,
  }
}
