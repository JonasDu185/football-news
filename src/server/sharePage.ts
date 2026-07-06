import { JSDOM } from 'jsdom'
import DOMPurify from 'dompurify'

// 在模块加载时创建一个 JSDOM window 供 DOMPurify 使用
const purifyWindow = new JSDOM('').window
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const purify = DOMPurify(purifyWindow as any)

/** 转义 HTML 特殊字符 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 消毒文章正文，只保留安全标签 */
function sanitizeContent(html: string): string {
  return purify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'img', 'video', 'source',
      'a', 'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'strong', 'em', 'b', 'i',
      'br', 'figure', 'figcaption', 'span',
    ],
    ALLOWED_ATTR: [
      'src', 'alt', 'href', 'target', 'rel',
      'loading', 'referrerpolicy',
      'controls', 'preload', 'poster',
      'style', 'class',
    ],
  })
}

interface SharePageParams {
  title: string
  content: string
  sourceUrl: string
}

/** 渲染正常文章分享页 */
export function renderArticlePage(params: SharePageParams): string {
  const { title, content, sourceUrl } = params
  const safeContent = sanitizeContent(content)
  // 绕过防盗链：给所有 img 加 referrerpolicy
  const finalContent = safeContent.replace(/<img /g, '<img referrerpolicy="no-referrer" loading="lazy" ')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - 足球新闻</title>
  <meta name="description" content="${escapeHtml(title)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:type" content="article">
  <meta property="og:description" content="来自足球新闻的分享">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
      background: #f5f5f5;
      color: #1a1a1a;
      line-height: 1.8;
    }
    .header {
      background: #0B1121;
      color: #fff;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .header svg { width: 20px; height: 20px; }
    .container {
      max-width: 680px;
      margin: 0 auto;
      padding: 24px 16px 25px;
    }
    .card {
      background: #fff;
      border-radius: 12px;
      padding: 28px 20px 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }
    .card h1 {
      font-size: 22px;
      font-weight: 700;
      line-height: 1.4;
      margin-bottom: 20px;
      color: #0B1121;
    }
    .content {
      font-size: 17px;
      color: #333;
    }
    .content p { margin-bottom: 1em; }
    .content img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 12px 0;
    }
    .content video {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }
    .content a { color: #2563eb; text-decoration: underline; }
    .content blockquote {
      border-left: 3px solid #2563eb;
      padding-left: 16px;
      margin: 16px 0;
      color: #666;
      font-style: italic;
    }
    .content ul, .content ol { padding-left: 24px; margin-bottom: 1em; }
    .content li { margin-bottom: 0.5em; }
    .content h2,.content h3,.content h4 {
      margin: 1.2em 0 0.5em;
      color: #0B1121;
    }
    .content h2 { font-size: 19px; }
    .content h3 { font-size: 17px; }
    .content pre {
      background: #f0f0f0;
      padding: 12px 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 14px;
      margin-bottom: 1em;
    }
    .content figure { margin: 16px 0; }
    .content figcaption { font-size: 13px; color: #999; text-align: center; margin-top: 4px; }
    .footer {
      margin-top: 12px;
      padding-top: 10px;
      padding-bottom: 25px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      font-size: 12px;
      color: #999;
      line-height: 1;
    }
    .source-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #2563eb;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a14.5 14.5 0 0 1 0 20"/>
      <path d="M2 12h20"/>
    </svg>
    足球新闻 · 更纯粹的足球资讯
  </div>
  <div class="container">
    <div class="card">
      <h1>${escapeHtml(title)}</h1>
      <div class="content">${finalContent}</div>
      <a class="source-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">查看原文 →</a>
    </div>
    <div class="footer">由 足球新闻 提供</div>
  </div>
</body>
</html>`
}

/** 渲染错误页 */
export function renderErrorPage(errorMsg: string, fallbackUrl?: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>无法加载 - 足球新闻</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
      background: #f5f5f5;
      color: #333;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100dvh;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 12px;
      padding: 40px 24px;
      text-align: center;
      max-width: 360px;
      width: 100%;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }
    .icon { font-size: 40px; margin-bottom: 16px; }
    h1 { font-size: 18px; margin-bottom: 8px; color: #0B1121; }
    p { font-size: 14px; color: #999; margin-bottom: 20px; }
    a {
      display: inline-block;
      color: #2563eb;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📄</div>
    <h1>${escapeHtml(errorMsg)}</h1>
    <p>文章可能已被删除或暂时无法访问</p>
    ${fallbackUrl ? `<a href="${escapeHtml(fallbackUrl)}" target="_blank" rel="noopener noreferrer">在浏览器中打开原文 →</a>` : ''}
    <p style="margin-top:20px;font-size:12px;color:#bbb;">由 足球新闻 提供</p>
  </div>
</body>
</html>`
}
