// 直播吧原始数据条目
export interface RawNewsItem {
  title: string
  shortTitle: string
  type: string
  createtime: string
  thumbnail?: string
  from_name?: string
  from_url?: string
  url?: string
  lable?: string
  count?: number
}

// 标准化后的新闻条目
export interface NewsItem {
  title: string
  time: string
  source: string
  thumb: string | null
  url: string | null          // 主链接：优先外媒原文
  fallbackUrl: string | null   // 备用链接：直播吧自己的文章（国内一定能打开）
  count: number                // 热度值
  tags: string[]
}

function buildZhibo8Url(item: RawNewsItem): string | null {
  if (!item.url) return null
  return item.url.startsWith('http') ? item.url : `https://news.zhibo8.com${item.url}`
}

export function filterFootballNews(raw: RawNewsItem[]): NewsItem[] {
  return raw
    .filter((item) => {
      return (
        item.type === 'zuqiu' ||
        item.lable?.includes('足球') ||
        item.lable?.includes('英超') ||
        item.lable?.includes('西甲') ||
        item.lable?.includes('德甲') ||
        item.lable?.includes('意甲') ||
        item.lable?.includes('法甲') ||
        item.lable?.includes('欧冠') ||
        item.lable?.includes('世界杯')
      )
    })
    .sort((a, b) => b.createtime.localeCompare(a.createtime))
    .map((item) => {
      const zhibo8Url = buildZhibo8Url(item)
      const sourceUrl = item.from_url || zhibo8Url

      return {
        title: item.shortTitle || item.title,
        time: item.createtime,
        source: item.from_name ?? '直播吧',
        thumb: item.thumbnail ?? null,
        // 主链接：优先外媒原文；备用链接：直播吧（且只在主链接不是直播吧时才有意义）
        url: sourceUrl,
        fallbackUrl: sourceUrl !== zhibo8Url ? zhibo8Url : null,
        count: item.count ?? 0,
        tags: item.lable ? item.lable.split(',') : [],
      }
    })
}
