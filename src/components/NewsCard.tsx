import { useState } from 'react'
import type { NewsItem } from '@/lib/newsFilter'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface NewsCardProps {
  news: NewsItem
  onClick?: () => void
  index?: number
  featured?: boolean
  isRead?: boolean
}

export function NewsCard({ news, onClick, index = 0, featured = false, isRead = false }: NewsCardProps) {
  const [imgError, setImgError] = useState(false)

  const displayTags = news.tags
    .filter((t) => !['足球', '世界杯', '欧冠', '英超', '西甲', '德甲', '意甲', '法甲', '国家队'].includes(t))
    .slice(0, 2)

  const timeStr = news.time.length >= 16 ? news.time.slice(11, 16) : news.time

  const content = (
    <Card
      className="overflow-hidden border-border/50 bg-card hover:bg-secondary/30 transition-colors cursor-pointer card-enter relative"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* 精选徽章 */}
      {featured && (
        <span className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
          精选
        </span>
      )}
      {news.thumb && !imgError && (
        <div className="relative w-full h-36 overflow-hidden bg-muted">
          <img
            src={news.thumb}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        </div>
      )}
      <CardContent className={news.thumb && !imgError ? 'p-4 pt-3' : 'p-4'}>
        {displayTags.length > 0 && (
          <div className="flex gap-1.5 mb-2">
            {displayTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 border-foreground/25">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <h3 className="text-foreground text-[15px] font-medium leading-snug line-clamp-2 mb-2">
          {news.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">{news.source}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={news.time}>{timeStr}</time>
            {isRead && <span className="text-[10px] text-muted-foreground/50 ml-auto">已读</span>}
        </div>
      </CardContent>
    </Card>
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
