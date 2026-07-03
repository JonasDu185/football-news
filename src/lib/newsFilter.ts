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

// 从 URL 域名提取可读的来源名
function guessSourceName(url: string | undefined): string | null {
  if (!url) return null
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
    // 去掉 www. 前缀
    const name = host.replace(/^www\./, '')
    // 知名域名映射
    const KNOWN: Record<string, string> = {
      'x.com': 'Twitter',
      'twitter.com': 'Twitter',
      'instagram.com': 'Instagram',
      'youtube.com': 'YouTube',
      'facebook.com': 'Facebook',
      'weibo.com': '微博',
      'bbc.com': 'BBC',
      'bbc.co.uk': 'BBC',
      'nytimes.com': '纽约时报',
      'theguardian.com': '卫报',
      'marca.com': '马卡报',
      'as.com': '阿斯报',
      'espn.com': 'ESPN',
      'mirror.co.uk': '镜报',
      'thesun.co.uk': '太阳报',
      'dailymail.co.uk': '每日邮报',
      'skysports.com': '天空体育',
      'goal.com': 'GOAL',
      'transfermarkt.com': '转会市场',
      'fifa.com': 'FIFA',
    }
    return KNOWN[name] || name
  } catch {
    return null
  }
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
        // 来源名：from_name 有值且不是默认的"直播吧"时直接用；
        // 如果 from_name 缺失或只是"直播吧"，但从外链能推断出域名，则用推断结果
        source:
          (item.from_name && item.from_name !== '直播吧') ? item.from_name
          : guessSourceName(item.from_url) || item.from_name || '直播吧',
        thumb: item.thumbnail ?? null,
        // 主链接：优先外媒原文；备用链接：直播吧（且只在主链接不是直播吧时才有意义）
        url: sourceUrl,
        fallbackUrl: sourceUrl !== zhibo8Url ? zhibo8Url : null,
        count: item.count ?? 0,
        tags: item.lable ? item.lable.split(',') : [],
      }
    })
}
