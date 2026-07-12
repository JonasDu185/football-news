import { useState, useLayoutEffect, useRef } from 'react'
import type { NewsItem } from '@/lib/newsFilter'
import { BookmarkButton } from './BookmarkButton'

interface NewsCardProps {
  news: NewsItem
  onClick?: () => void
  index?: number
  featured?: boolean
  isRead?: boolean
  isBookmarked?: boolean
  onToggleBookmark?: (item: NewsItem) => void
  /** 紧凑模式：双列瀑布流使用，缩略图自然比例 + 更小字号 */
  compact?: boolean
  /** 列表模式：用于近期热点单列阅读流，横向布局、小图右侧、分隔线代替卡片阴影 */
  variant?: 'card' | 'list'
}

/** 时间格式化：YYYY-MM-DD HH:mm:ss → M.D */
function formatTime(time: string): string {
  const m = time.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return time.length >= 10 ? time.slice(5, 10) : time
  return `${parseInt(m[2], 10)}.${parseInt(m[3], 10)}`
}

/** 过滤掉大类标签，只保留赛事/球队/人物的细粒度标签 */
function pickDisplayTags(tags: string[], max: number): string[] {
  const excluded = new Set([
    '足球', '世界杯', '欧冠', '英超', '西甲', '德甲', '意甲', '法甲',
    '国家队', '转载', '话题',
  ])
  return tags.filter((t) => !excluded.has(t)).slice(0, max)
}

export function NewsCard({
  news, onClick, index = 0, featured = false, isRead = false,
  isBookmarked = false, onToggleBookmark, compact = false, variant = 'card',
}: NewsCardProps) {
  const [imgError, setImgError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (cardRef.current) {
      cardRef.current.classList.add('card-enter')
      ;(cardRef.current as HTMLElement).style.animationDelay = `${index * (compact ? 40 : 60)}ms`
    }
  }, [compact, index])

  const displayTags = pickDisplayTags(news.tags, compact ? 1 : 2)
  const timeStr = formatTime(news.time)

  // ==================== 列表模式 ====================
  if (variant === 'list') {
    const listBody = (
      <div ref={cardRef}>
        <div className="flex gap-3 py-3 border-b border-border/60 hover:bg-accent/5 transition-colors cursor-pointer min-h-[104px] items-start">
          {/* 左侧文字 */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 py-0.5">
            {displayTags.length > 0 && (
              <p className="text-[10px] text-primary font-medium tracking-wide leading-none">
                {displayTags.join(' · ')}
              </p>
            )}
            <h3 className={`text-[15px] leading-[1.4] line-clamp-2 ${
              isRead ? 'text-muted-foreground/60' : 'text-foreground'
            }`}>
              {news.title}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
              <time dateTime={news.time} className="shrink-0">{timeStr}</time>
            </div>
          </div>
          {/* 右侧小图 */}
          {news.thumb && !imgError ? (
            <div className="shrink-0 w-[96px] h-[72px] rounded-[5px] overflow-hidden bg-muted">
              <img
                src={news.thumb}
                alt=""
                className={`w-full h-full object-cover ${isRead ? 'opacity-60 saturate-50' : ''}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="shrink-0 w-[96px] h-[72px] rounded-[5px] bg-muted/50" />
          )}
          {/* 收藏 */}
          {onToggleBookmark && (
            <BookmarkButton isBookmarked={isBookmarked} compact onClick={() => onToggleBookmark(news)} />
          )}
        </div>
      </div>
    )

    return onClick ? (
      <button type="button" onClick={onClick} className="block w-full text-left no-underline bg-transparent border-0 p-0 px-4">
        {listBody}
      </button>
    ) : (
      <div className="px-4">{listBody}</div>
    )
  }

  // ==================== 卡片模式（瀑布流） ====================
  const cardBody = (
    <div ref={cardRef} className="group/card cursor-pointer">
      {/* 图片区 */}
      {news.thumb && !imgError ? (
        <div className="relative w-full aspect-[4/3] rounded-[5px] overflow-hidden bg-muted mb-2">
          <img
            src={news.thumb}
            alt=""
            className={`w-full h-full object-cover transition-opacity ${
              isRead ? 'opacity-60 saturate-50' : 'group-hover/card:opacity-90'
            }`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
          {/* 精选标记 */}
          {featured && (
            <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[9px] font-medium px-1.5 py-0.5 rounded-[3px] leading-none">
              精选
            </span>
          )}
          {/* 收藏按钮 */}
          {onToggleBookmark && (
            <BookmarkButton isBookmarked={isBookmarked} compact onClick={() => onToggleBookmark(news)} />
          )}
        </div>
      ) : (
        <div className="relative w-full aspect-[4/3] rounded-[5px] bg-muted/50 mb-2 flex items-center justify-center">
          {featured && (
            <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[9px] font-medium px-1.5 py-0.5 rounded-[3px] leading-none">
              精选
            </span>
          )}
          {onToggleBookmark && (
            <BookmarkButton isBookmarked={isBookmarked} compact onClick={() => onToggleBookmark(news)} />
          )}
        </div>
      )}

      {/* 标签 */}
      {displayTags.length > 0 && (
        <p className="text-[10px] text-primary/80 font-medium tracking-wide leading-none mb-1">
          {displayTags.join(' · ')}
        </p>
      )}

      {/* 标题 */}
      <h3 className={`text-[13px] leading-[1.4] font-semibold mb-1 line-clamp-2 ${
        isRead ? 'text-muted-foreground/60' : 'text-foreground'
      }`}>
        {news.title}
      </h3>

      {/* 元信息 — 左下时间，右下来源 */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground/70">
        <time dateTime={news.time} className="shrink-0">{timeStr}</time>
        <span className="truncate max-w-[80px] text-right">{news.source}</span>
      </div>
    </div>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left no-underline bg-transparent border-0 p-0">
        {cardBody}
      </button>
    )
  }

  return <div className="block">{cardBody}</div>
}
