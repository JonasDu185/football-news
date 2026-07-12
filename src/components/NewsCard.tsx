import { useState, useLayoutEffect, useRef } from 'react'
import type { NewsItem } from '@/lib/newsFilter'
import { BookmarkButton } from './BookmarkButton'
import { formatNewsTime, pickDisplayTags } from '@/lib/utils'

interface NewsCardProps {
  news: NewsItem
  onClick?: () => void
  index?: number
  featured?: boolean
  isRead?: boolean
  isBookmarked?: boolean
  onToggleBookmark?: (item: NewsItem) => void
  compact?: boolean
  variant?: 'card' | 'list'
}

export function NewsCard({
  news, onClick, index = 0, featured = false, isRead = false,
  isBookmarked = false, onToggleBookmark, compact = false, variant = 'card',
}: NewsCardProps) {
  const [imgError, setImgError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const handleToggle = () => onToggleBookmark?.(news)

  useLayoutEffect(() => {
    if (cardRef.current) {
      cardRef.current.classList.add('card-enter')
      ;(cardRef.current as HTMLElement).style.animationDelay = `${index * (compact ? 40 : 60)}ms`
    }
  }, [compact, index])

  const displayTags = pickDisplayTags(news.tags, compact ? 1 : 2)
  const timeStr = formatNewsTime(news.time)

  // ==================== 列表模式 ====================
  if (variant === 'list') {
    return (
      <div ref={cardRef} className="relative px-4">
        <button
          type="button"
          onClick={onClick}
          className="w-full text-left no-underline bg-transparent border-0 p-0 flex gap-3 py-3 border-b border-border/60 hover:bg-accent/5 transition-colors cursor-pointer min-h-[104px] items-start"
        >
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 py-0.5">
            {displayTags.length > 0 && (
              <p className="text-[10px] text-primary font-medium tracking-wide leading-none">
                {displayTags.join(' · ')}
              </p>
            )}
            <h3 className={`text-[15px] leading-[1.4] line-clamp-2 ${isRead ? 'text-muted-foreground/60' : 'text-foreground'}`}>
              {news.title}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
              <time dateTime={news.time} className="shrink-0">{timeStr}</time>
            </div>
          </div>
          {news.thumb && !imgError ? (
            <div className={`shrink-0 w-[96px] h-[72px] rounded-[5px] overflow-hidden bg-muted ${isRead ? 'opacity-60 saturate-50' : ''}`}>
              <img src={news.thumb} alt="" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={() => setImgError(true)} />
            </div>
          ) : (
            <div className="shrink-0 w-[96px] h-[72px] rounded-[5px] bg-muted/50" />
          )}
        </button>
        {onToggleBookmark && (
          <BookmarkButton isBookmarked={isBookmarked} compact onClick={handleToggle} />
        )}
      </div>
    )
  }

  // ==================== 卡片模式（瀑布流） ====================
  return (
    <div ref={cardRef} className="group/card cursor-pointer relative">
      <button type="button" onClick={onClick} className="block w-full text-left no-underline bg-transparent border-0 p-0">
        {/* 图片区 */}
        {news.thumb && !imgError ? (
          <div className={`relative w-full aspect-[4/3] rounded-[5px] overflow-hidden bg-muted mb-2 ${isRead ? 'opacity-60 saturate-50' : ''}`}>
            <img src={news.thumb} alt="" className="w-full h-full object-cover transition-opacity group-hover/card:opacity-90" loading="lazy" referrerPolicy="no-referrer" onError={() => setImgError(true)} />
            {featured && (
              <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[9px] font-medium px-1.5 py-0.5 rounded-[3px] leading-none">精选</span>
            )}
          </div>
        ) : (
          <div className="relative w-full aspect-[4/3] rounded-[5px] bg-muted/50 mb-2 flex items-center justify-center">
            {featured && (
              <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[9px] font-medium px-1.5 py-0.5 rounded-[3px] leading-none">精选</span>
            )}
          </div>
        )}

        {/* 标签 */}
        {displayTags.length > 0 && (
          <p className="text-[10px] text-primary/80 font-medium tracking-wide leading-none mb-1">{displayTags.join(' · ')}</p>
        )}

        {/* 标题 */}
        <h3 className={`text-[13px] leading-[1.4] font-semibold mb-1 line-clamp-2 ${isRead ? 'text-muted-foreground/60' : 'text-foreground'}`}>
          {news.title}
        </h3>

        {/* 元信息 */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground/70">
          <time dateTime={news.time} className="shrink-0">{timeStr}</time>
          <span className="truncate max-w-[80px] text-right">{news.source}</span>
        </div>
      </button>

      {/* 收藏按钮 — 与主点击区同级，图片右上角 */}
      {onToggleBookmark && (
        <BookmarkButton isBookmarked={isBookmarked} compact onClick={handleToggle} />
      )}
    </div>
  )
}
