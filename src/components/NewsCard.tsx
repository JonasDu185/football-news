import { useState, useLayoutEffect, useRef } from 'react'
import type { NewsItem } from '@/lib/newsFilter'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface NewsCardProps {
  news: NewsItem
  onClick?: () => void
  index?: number
  featured?: boolean
  isRead?: boolean
  /** 紧凑模式：双列瀑布流使用，缩略图自然比例 + 更小字号 */
  compact?: boolean
}

export function NewsCard({ news, onClick, index = 0, featured = false, isRead = false, compact = false }: NewsCardProps) {
  const [imgError, setImgError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // 卡片首次挂载时添加进场动画
  useLayoutEffect(() => {
    if (cardRef.current) {
      cardRef.current.classList.add('card-enter')
      ;(cardRef.current as HTMLElement).style.animationDelay = `${index * (compact ? 40 : 60)}ms`
    }
  }, [compact, index])

  const displayTags = news.tags
    .filter((t) => !['足球', '世界杯', '欧冠', '英超', '西甲', '德甲', '意甲', '法甲', '国家队'].includes(t))
    .slice(0, compact ? 1 : 2)

  const timeStr = news.time.length >= 16 ? news.time.slice(11, 16) : news.time

  const content = (
    <div ref={cardRef}>
      <Card
        className={`overflow-hidden border-border/50 bg-card hover:bg-secondary/30 transition-colors cursor-pointer relative ${compact ? '!pt-0 !gap-1 !pb-0' : ''}`}
      >
      {/* 精选徽章 */}
      {featured && (
        <span className={`absolute z-10 bg-primary text-primary-foreground font-bold rounded-full tracking-wide ${compact ? 'top-1 right-1 text-[8px] px-1.5 py-0.5' : 'top-2 right-2 text-[10px] px-2 py-0.5'}`}>
          精选
        </span>
      )}
      {news.thumb && !imgError && (
        <div className={`relative w-full overflow-hidden bg-muted ${compact ? 'max-h-48 rounded-t-xl' : 'h-36'}`}>
          <img
            src={news.thumb}
            alt=""
            className={`w-full ${compact ? 'h-auto' : 'h-full object-cover'}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        </div>
      )}
      <CardContent className={compact ? 'px-2 py-1' : news.thumb && !imgError ? 'p-4 pt-3' : 'p-4'}>
        {displayTags.length > 0 && (
          <div className={`flex gap-1 ${compact ? 'mb-0.5' : 'mb-2'}`}>
            {displayTags.map((tag) => (
              <Badge key={tag} variant="outline" className={`px-1.5 py-0 border-foreground/25 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <h3 className={`text-foreground font-medium leading-snug ${compact ? 'text-[13px] mb-0.5' : 'text-[15px] mb-2 line-clamp-2'}`}>
          {news.title}
        </h3>
        <div className={`flex items-center gap-1.5 text-muted-foreground ${compact ? 'text-[10px]' : 'text-xs'}`}>
          <span className="font-medium text-foreground/70 truncate">{news.source}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={news.time} className="shrink-0">{timeStr}</time>
            {isRead && <span className={`text-muted-foreground/50 ml-auto shrink-0 ${compact ? 'text-[8px]' : 'text-[10px]'}`}>已读</span>}
        </div>
      </CardContent>
    </Card>
    </div>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left no-underline bg-transparent border-0 p-0">
        {content}
      </button>
    )
  }

  return <div className="block">{content}</div>
}
