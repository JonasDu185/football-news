import type { NewsItem } from '@/lib/newsFilter'
import { NewsCard } from './NewsCard'
import { useMemo } from 'react'

interface NewsListProps {
  news: NewsItem[]
  onCardClick?: (item: NewsItem) => void
  showFeatured?: boolean
  readUrls?: Set<string>
  bookmarkedUrls?: Set<string>
  onToggleBookmark?: (item: NewsItem) => void
  /** 瀑布流双列模式 */
  columns?: 1 | 2
  /** 单列模式也使用紧凑卡片样式 */
  forceCompact?: boolean
}

export function NewsList({ news, onCardClick, showFeatured = false, readUrls, bookmarkedUrls, onToggleBookmark, columns = 1, forceCompact = false }: NewsListProps) {
  // 双列：按奇偶索引分左右列，保证左→右→左→右扫描顺序
  const { leftItems, rightItems } = useMemo(() => {
    if (columns === 1) return { leftItems: news, rightItems: [] as NewsItem[] }
    return {
      leftItems: news.filter((_, i) => i % 2 === 0),
      rightItems: news.filter((_, i) => i % 2 === 1),
    }
  }, [news, columns])

  if (news.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-muted-foreground text-sm">
        暂无新闻
      </p>
    )
  }

  if (columns === 2) {
    return (
      <div className="flex gap-1.5 px-4">
        <div className="flex-1 flex flex-col gap-1.5">
          {leftItems.map((item, i) => (
            <NewsCard
              key={`${item.url ?? i}-${item.title}`}
              news={item}
              index={i * 2}
              featured={showFeatured && i === 0}
              isRead={readUrls?.has(item.url ?? '')}
              isBookmarked={bookmarkedUrls?.has(item.url ?? '')}
              onToggleBookmark={onToggleBookmark}
              compact
              onClick={() => onCardClick?.(item)}
            />
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          {rightItems.map((item, i) => (
            <NewsCard
              key={`${item.url ?? i}-${item.title}`}
              news={item}
              index={i * 2 + 1}
              isRead={readUrls?.has(item.url ?? '')}
              isBookmarked={bookmarkedUrls?.has(item.url ?? '')}
              onToggleBookmark={onToggleBookmark}
              compact
              onClick={() => onCardClick?.(item)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 px-4">
      {news.map((item, index) => (
        <NewsCard key={`${item.url ?? index}-${item.title}`} news={item} index={index} featured={showFeatured && index === 0} isRead={readUrls?.has(item.url ?? '')} isBookmarked={bookmarkedUrls?.has(item.url ?? '')} onToggleBookmark={onToggleBookmark} compact={forceCompact} onClick={() => onCardClick?.(item)} />
      ))}
    </div>
  )
}
