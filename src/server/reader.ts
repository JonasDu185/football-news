import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

interface Article {
  title: string
  content: string
  excerpt: string | null
  byline: string | null
  error: string | null
}

export async function extractArticle(url: string): Promise<Article> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FootballNews/1.0)',
      },
    })

    if (!res.ok) {
      return { title: '', content: '', excerpt: null, byline: null, error: `HTTP ${res.status}` }
    }

    const html = await res.text()
    const doc = new JSDOM(html, { url })
    const article = new Readability(doc.window.document).parse()

    if (!article) {
      return { title: '', content: '', excerpt: null, byline: null, error: '无法解析文章' }
    }

    return {
      title: article.title || '',
      content: article.content || '',
      excerpt: article.excerpt || null,
      byline: article.byline || null,
      error: null,
    }
  } catch (err) {
    return {
      title: '',
      content: '',
      excerpt: null,
      byline: null,
      error: err instanceof Error ? err.message : '未知错误',
    }
  }
}
