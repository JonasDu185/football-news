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
}

// 标准化后的新闻条目
export interface NewsItem {
  title: string
  time: string
  source: string
  thumb: string | null
  url: string | null
  tags: string[]
}

export function filterFootballNews(raw: RawNewsItem[]): NewsItem[] {
  return raw
    // 只保留足球相关：lable 或 type 包含足球标识
    .filter((item) => {
      const isFootball =
        item.type === 'zuqiu' ||
        item.lable?.includes('足球') ||
        item.lable?.includes('英超') ||
        item.lable?.includes('西甲') ||
        item.lable?.includes('德甲') ||
        item.lable?.includes('意甲') ||
        item.lable?.includes('法甲') ||
        item.lable?.includes('欧冠') ||
        item.lable?.includes('世界杯')
      return isFootball
    })
    // 按发布时间倒序（最新的排前面）
    .sort((a, b) => b.createtime.localeCompare(a.createtime))
    // 标准化输出字段
    .map((item) => ({
      title: item.shortTitle || item.title,
      time: item.createtime,
      source: item.from_name ?? '直播吧',
      thumb: item.thumbnail ?? null,
      // #16 修复：避免重复拼接完整 URL
      url: item.from_url
        || (item.url
          ? (item.url.startsWith('http') ? item.url : `https://news.zhibo8.com${item.url}`)
          : null),
      tags: item.lable ? item.lable.split(',') : [],
    }))
}
