/**
 * HTML 消毒配置 — 客户端和服务端共用
 *
 * ReaderView（浏览器 DOM）和 sharePage（JSDOM）使用相同的白名单，
 * 避免两处各自维护导致不一致。
 */

/** DOMPurify 允许的标签 */
export const SANITIZE_ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'img', 'video', 'source',
  'a', 'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'strong', 'em', 'b', 'i',
  'br', 'figure', 'figcaption', 'span',
]

/** DOMPurify 允许的属性 */
export const SANITIZE_ALLOWED_ATTR = [
  'src', 'alt', 'href', 'target', 'rel',
  'loading', 'referrerpolicy',
  'controls', 'preload', 'poster',
  'style', 'class',
]

/** 给所有 img 标签加 referrerpolicy 绕过 CDN 防盗链 */
export function addImgReferrerBypass(html: string): string {
  return html.replace(/<img /g, '<img referrerpolicy="no-referrer" loading="lazy" ')
}
