import { filterFootballNews, type NewsItem, type RawNewsItem } from '../lib/newsFilter'

const ZHIBAO8_URL = 'http://m.zhibo8.com/json/hot/24hours.htm'
const FETCH_TIMEOUT_MS = 15_000 // #12 修复：15 秒超时

export async function fetchFootballNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch(ZHIBAO8_URL, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!response.ok) {
      console.warn(`[fetcher] 直播吧返回非 200: ${response.status}`)
      return []
    }

    const data = await response.json()
    const rawList: RawNewsItem[] = Array.isArray(data?.news) ? data.news : []
    return filterFootballNews(rawList)
  } catch (err) {
    console.warn('[fetcher] 抓取失败:', err instanceof Error ? err.message : err)
    return []
  }
}
