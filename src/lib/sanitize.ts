/**
 * HTML 消毒 + 防盗链处理 — 客户端和服务端共用
 *
 * 客户端（ReaderView）在浏览器中运行 DOMPurify，
 * 服务端（sharePage）通过 JSDOM 运行 DOMPurify，
 * 但消毒策略保持一致。
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

/** 给所有 img 标签加防盗链绕过，用于绕过 CDN Referer 检查 */
export function addImgReferrerBypass(html: string): string {
  return html.replace(/<img /g, '<img referrerpolicy="no-referrer" loading="lazy" ')
}
