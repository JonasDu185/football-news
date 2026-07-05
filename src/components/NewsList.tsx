import type { NewsItem } from '@/lib/newsFilter'
import { NewsCard } from './NewsCard'

interface NewsListProps {
  news: NewsItem[]
  onCardClick?: (item: NewsItem) => void
  showFeatured?: boolean
  readUrls?: Set<string>
  suppressAnim?: boolean
}

export function NewsList({ news, onCardClick, showFeatured = false, readUrls, suppressAnim = false }: NewsListProps) {
  if (news.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-muted-foreground text-sm">
        暂无新闻
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3 px-4">
      {news.map((item, index) => (
        <NewsCard key={`${item.url ?? index}-${item.title}`} news={item} index={index} featured={showFeatured && index === 0} isRead={readUrls?.has(item.url ?? '')} suppressAnim={suppressAnim} onClick={() => onCardClick?.(item)} />
      ))}
    </div>
  )
}
