import { useState } from 'react'
import type { NewsItem } from '@/lib/newsFilter'
import { BookmarkButton } from './BookmarkButton'

interface HotEditorialFeedProps {
  news: NewsItem[]
  onCardClick: (item: NewsItem) => void
  readUrls: Set<string>
  bookmarkedUrls: Set<string>
  onToggleBookmark: (item: NewsItem) => void
}

// ===== 工具函数 =====

function formatHeat(count: number): string | null {
  if (count <= 0) return null
  if (count >= 10000) return `${(count / 10000).toFixed(0)}万`
  return `${count}`
}

function pickTags(tags: string[], max: number): string[] {
  const excluded = new Set([
    '足球', '世界杯', '欧冠', '英超', '西甲', '德甲', '意甲', '法甲',
    '国家队', '转载', '话题',
  ])
  return tags.filter((t) => !excluded.has(t)).slice(0, max)
}

function fmtTime(time: string): string {
  const m = time.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return time.length >= 10 ? time.slice(5, 10) : time
  return `${parseInt(m[2], 10)}.${parseInt(m[3], 10)}`
}

// ===== 子组件 =====

/** 页面标题 */
function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="px-4 pt-3 pb-4">
      <h2 className="text-base text-foreground font-semibold leading-none mb-1.5">{title}</h2>
      <p className="text-[11px] text-muted-foreground">{subtitle}</p>
    </div>
  )
}

/** 持续关注分隔 */
function Divider() {
  return (
    <div className="px-4 pt-6 pb-3">
      <div className="flex items-center gap-3">
        <h3 className="text-[15px] text-foreground font-semibold leading-none shrink-0">持续关注</h3>
        <div className="flex-1 h-px bg-border/80" />
      </div>
    </div>
  )
}

/** 元信息行 — 左下时间，右下纯数字热度 */
function MetaRow({ time, count }: { time: string; count: number }) {
  const hl = formatHeat(count)
  return (
    <div className="flex items-center justify-between text-[11px] text-muted-foreground/70">
      <time dateTime={time} className="shrink-0">{time}</time>
      {hl && <span className="shrink-0 text-[10px] text-muted-foreground/60">{hl}</span>}
    </div>
  )
}

/** 标签行 */
function TagRow({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <p className="text-[10px] text-primary/80 font-medium tracking-wide leading-none mb-1">
      {tags.join(' · ')}
    </p>
  )
}

// ===== 头条 =====

function LeadStory({ item, isRead, isBookmarked, onClick, onToggleBookmark }: {
  item: NewsItem; isRead: boolean; isBookmarked: boolean
  onClick: () => void; onToggleBookmark: (item: NewsItem) => void
}) {
  const [imgError, setImgError] = useState(false)
  const tags = pickTags(item.tags, 3)
  const time = fmtTime(item.time)

  return (
    <div className="px-4 pb-5">
      <button type="button" onClick={onClick} className="block w-full text-left no-underline bg-transparent border-0 p-0 group">
        {/* 图片 */}
        {item.thumb && !imgError && (
          <div className="relative w-full aspect-[16/10] rounded-[6px] overflow-hidden bg-muted/50 mb-3">
            <img src={item.thumb} alt="" loading="lazy" referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-opacity ${isRead ? 'opacity-60 saturate-50' : 'group-hover:opacity-90'}`}
              onError={() => setImgError(true)} />
            {onToggleBookmark && (
              <BookmarkButton isBookmarked={isBookmarked} compact onClick={() => onToggleBookmark(item)} />
            )}
          </div>
        )}
        {/* 标签 */}
        <TagRow tags={tags} />
        {/* 标题 */}
        <h2 className={`text-[22px] leading-[1.3] font-semibold mb-2 ${isRead ? 'text-muted-foreground/60' : 'text-foreground'}`}>
          {item.title}
        </h2>
        {/* 元信息 */}
        <MetaRow time={time} count={item.count} />
      </button>
    </div>
  )
}

// ===== 双次头条 =====

function SecondaryStories({ items, readUrls, bookmarkedUrls, onClick, onToggleBookmark }: {
  items: NewsItem[]; readUrls: Set<string>; bookmarkedUrls: Set<string>
  onClick: (item: NewsItem) => void; onToggleBookmark: (item: NewsItem) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="px-4 pb-5">
      <div className="flex gap-3">
        {items.map((item) => (
          <SecondaryCard key={item.url ?? item.title} item={item}
            isRead={readUrls.has(item.url ?? '')}
            isBookmarked={bookmarkedUrls.has(item.url ?? '')}
            onClick={() => onClick(item)}
            onToggleBookmark={onToggleBookmark} />
        ))}
        {/* 单条时占位保持宽度 */}
        {items.length === 1 && <div className="flex-1" />}
      </div>
    </div>
  )
}

function SecondaryCard({ item, isRead, isBookmarked, onClick, onToggleBookmark }: {
  item: NewsItem; isRead: boolean; isBookmarked: boolean
  onClick: () => void; onToggleBookmark: (item: NewsItem) => void
}) {
  const [imgError, setImgError] = useState(false)
  const tags = pickTags(item.tags, 2)
  const time = fmtTime(item.time)

  return (
    <button type="button" onClick={onClick} className="flex-1 text-left no-underline bg-transparent border-0 p-0 group min-w-0">
      {item.thumb && !imgError ? (
        <div className="relative w-full aspect-[4/3] rounded-[5px] overflow-hidden bg-muted/50 mb-2">
          <img src={item.thumb} alt="" loading="lazy" referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-opacity ${isRead ? 'opacity-60 saturate-50' : 'group-hover:opacity-90'}`}
            onError={() => setImgError(true)} />
          {onToggleBookmark && (
            <BookmarkButton isBookmarked={isBookmarked} compact onClick={() => onToggleBookmark(item)} />
          )}
        </div>
      ) : (
        <div className="relative w-full aspect-[4/3] rounded-[5px] bg-muted/50 mb-2" />
      )}
      <TagRow tags={tags} />
      <h3 className={`text-[13px] leading-[1.38] font-semibold mb-1 line-clamp-2 ${isRead ? 'text-muted-foreground/60' : 'text-foreground'}`}>
        {item.title}
      </h3>
      <MetaRow time={time} count={item.count} />
    </button>
  )
}

// ===== 持续关注列表项 =====

function ListItem({ item, isRead, isBookmarked, onClick, onToggleBookmark }: {
  item: NewsItem; isRead: boolean; isBookmarked: boolean
  onClick: () => void; onToggleBookmark: (item: NewsItem) => void
}) {
  const [imgError, setImgError] = useState(false)
  const tags = pickTags(item.tags, 2)
  const time = fmtTime(item.time)
  const hl = formatHeat(item.count)

  return (
    <button type="button" onClick={onClick} className="block w-full text-left no-underline bg-transparent border-0 p-0 px-4">
      <div className="flex gap-3 py-3 border-b border-border/60 hover:bg-accent/5 transition-colors cursor-pointer min-h-[104px] items-start">
        {/* 左侧文字 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 py-0.5">
          <TagRow tags={tags} />
          <h3 className={`text-[15px] leading-[1.4] line-clamp-2 ${isRead ? 'text-muted-foreground/60' : 'text-foreground'}`}>
            {item.title}
          </h3>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground/80">
            <time dateTime={item.time} className="shrink-0">{time}</time>
            {hl && <span className="shrink-0 text-[10px] text-muted-foreground/60">{hl}</span>}
          </div>
        </div>
        {/* 右侧小图 */}
        {item.thumb && !imgError ? (
          <div className="shrink-0 w-[96px] h-[72px] rounded-[5px] overflow-hidden bg-muted">
            <img src={item.thumb} alt="" loading="lazy" referrerPolicy="no-referrer"
              className={`w-full h-full object-cover ${isRead ? 'opacity-60 saturate-50' : ''}`}
              onError={() => setImgError(true)} />
          </div>
        ) : (
          <div className="shrink-0 w-[96px] h-[72px] rounded-[5px] bg-muted/50" />
        )}
        {onToggleBookmark && (
          <BookmarkButton isBookmarked={isBookmarked} compact onClick={() => onToggleBookmark(item)} />
        )}
      </div>
    </button>
  )
}

// ===== 主组件 =====

export function HotEditorialFeed({
  news, onCardClick, readUrls, bookmarkedUrls, onToggleBookmark,
}: HotEditorialFeedProps) {
  const lead = news[0]
  const secondary = news.slice(1, 3)
  const rest = news.slice(3)

  return (
    <div className="pb-8">
      <SectionTitle title="近期热点" subtitle="过去 24 小时持续受到关注的报道" />

      {/* 头条 */}
      {lead && (
        <LeadStory item={lead}
          isRead={readUrls.has(lead.url ?? '')}
          isBookmarked={bookmarkedUrls.has(lead.url ?? '')}
          onClick={() => onCardClick(lead)}
          onToggleBookmark={onToggleBookmark} />
      )}

      {/* 双次头条 */}
      {secondary.length > 0 && (
        <SecondaryStories items={secondary}
          readUrls={readUrls} bookmarkedUrls={bookmarkedUrls}
          onClick={onCardClick} onToggleBookmark={onToggleBookmark} />
      )}

      {/* 持续关注 */}
      {rest.length > 0 && (
        <>
          <Divider />
          {rest.map((item) => (
            <ListItem key={item.url ?? item.title} item={item}
              isRead={readUrls.has(item.url ?? '')}
              isBookmarked={bookmarkedUrls.has(item.url ?? '')}
              onClick={() => onCardClick(item)}
              onToggleBookmark={onToggleBookmark} />
          ))}
        </>
      )}
    </div>
  )
}
