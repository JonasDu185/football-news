import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

const MAX_BODY_SIZE = 5 * 1024 * 1024 // 5MB

// 检查是否为私有/内网 IP
function isPrivateIP(hostname: string): boolean {
  // IPv4 私有地址
  const ipv4Patterns = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
  ]
  if (ipv4Patterns.some((p) => p.test(hostname))) return true

  // IPv6 私有地址
  if (hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd')) return true

  return false
}

function validateURL(input: string): string | null {
  try {
    const url = new URL(input)

    // 只允许 http/https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

    // 拒绝裸 IP
    const isIP = /^[\d.]+$/.test(url.hostname) || url.hostname.includes(':')
    if (isIP) return null

    // 拒绝内网地址
    if (isPrivateIP(url.hostname)) return null

    return url.href
  } catch {
    return null
  }
}

function genericError(): Article {
  return { title: '', content: '', excerpt: null, byline: null, error: '无法提取文章内容' }
}

interface Article {
  title: string
  content: string
  excerpt: string | null
  byline: string | null
  error: string | null
}

export async function extractArticle(url: string): Promise<Article> {
  // #1 SSRF 防护：校验 URL
  const safeUrl = validateURL(url)
  if (!safeUrl) return genericError()

  try {
    const res = await fetch(safeUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FootballNews/1.0)',
      },
      redirect: 'follow',
    })

    if (!res.ok) {
      console.warn(`[reader] HTTP ${res.status} for ${safeUrl}`)
      return genericError()
    }

    // #2 DoS 防护：限制响应体大小
    const contentLength = res.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      console.warn(`[reader] 响应过大 ${contentLength} bytes: ${safeUrl}`)
      return genericError()
    }

    const html = await res.text()
    if (html.length > MAX_BODY_SIZE) {
      console.warn(`[reader] 实际大小超限 ${html.length} bytes: ${safeUrl}`)
      return genericError()
    }

    const doc = new JSDOM(html, { url: safeUrl })
    const article = new Readability(doc.window.document).parse()

    if (!article) {
      return { title: '', content: '', excerpt: null, byline: null, error: '无法解析文章' }
    }

    // 补充视频：Readability 会丢弃 video 标签，从原始 HTML 找回
    let extraContent = ''
    const videoEl = doc.window.document.querySelector('video')
    if (videoEl) {
      const src = videoEl.getAttribute('src')
      if (src) {
        const poster = videoEl.getAttribute('poster')
        extraContent = `<p><video controls preload="metadata" src="${src}"${poster ? ` poster="${poster}"` : ''} style="max-width:100%;height:auto;border-radius:0.5rem"></video></p>`
      } else {
        // 视频是 JS 动态加载的，提示用户在浏览器中打开
        extraContent = `<p style="color:var(--color-muted-foreground);font-size:0.875rem;text-align:center;padding:2em 0">📺 本文包含视频内容<br><a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--color-primary)">在浏览器中打开查看</a></p>`
      }
    }

    // 去掉无用的装饰图片（播放按钮图标等）
    let content = article.content || ''
    content = content.replace(/<img[^>]*video_play[^>]*>/gi, '')
    content = content.replace(/<img[^>]*\/ico\/[^>]*>/gi, '')

    return {
      title: article.title || '',
      content: content + extraContent,
      excerpt: article.excerpt || null,
      byline: article.byline || null,
      error: null,
    }
  } catch (err) {
    // #3 不泄露内部错误信息给客户端
    console.error('[reader] 提取失败:', err instanceof Error ? err.message : err)
    return genericError()
  }
}
