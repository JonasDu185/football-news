import { useState } from 'react'
import type { NewsItem } from '@/lib/newsFilter'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLinkIcon } from 'lucide-react'

interface NewsCardProps {
  news: NewsItem
}

export function NewsCard({ news }: NewsCardProps) {
  const [imgError, setImgError] = useState(false)

  const displayTags = news.tags
    .filter((t) => !['足球', '世界杯', '欧冠', '英超', '西甲', '德甲', '意甲', '法甲', '国家队'].includes(t))
    .slice(0, 2)

  const timeStr = news.time.length >= 16 ? news.time.slice(11, 16) : news.time

  return (
    <Card className="overflow-hidden border-border/50 bg-card hover:bg-secondary/30 transition-colors">
      {/* 主链接：跳原文 */}
      <a
        href={news.url ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline"
        {...(news.url ? {} : { role: 'presentation', onClick: (e) => e.preventDefault() })}
      >
        {news.thumb && !imgError && (
          <div className="relative w-full h-36 overflow-hidden bg-muted">
            <img
              src={news.thumb}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          </div>
        )}
        <CardContent className={news.thumb && !imgError ? 'p-4 pt-3' : 'p-4'}>
          {displayTags.length > 0 && (
            <div className="flex gap-1.5 mb-2">
              {displayTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
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
          </div>
        </CardContent>
      </a>

      {/* 备用链接：直播吧 —— 仅当主链接是外媒时才显示 */}
      {news.fallbackUrl && (
        <div className="px-4 pb-3 -mt-1">
          <a
            href={news.fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLinkIcon className="size-3" />
            在直播吧打开
          </a>
        </div>
      )}
    </Card>
  )
}
