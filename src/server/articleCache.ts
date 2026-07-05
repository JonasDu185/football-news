import { extractArticle } from './reader'
import type { ArticleCacheStore, CachedArticle } from './storage'

/** 先查缓存，未命中才抓取并自动缓存 */
export async function getArticle(
  url: string,
  cache: ArticleCacheStore,
): Promise<CachedArticle & { error: string | null }> {
  // 1. 查缓存
  const cached = cache.getCachedArticle(url)
  if (cached) return { ...cached, error: null }

  // 2. 抓取 + 解析
  const article = await extractArticle(url)

  // 3. 成功的文章写入缓存
  if (!article.error && article.content) {
    cache.cacheArticle(url, {
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      byline: article.byline,
    })
  }

  return article
}
