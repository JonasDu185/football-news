import { useState } from 'react'
import type { NewsItem } from '@/lib/newsFilter'
import { BookmarkButton } from './BookmarkButton'
import { formatNewsTime, formatNewsHeat, pickDisplayTags } from '@/lib/utils'

interface HotEditorialFeedProps {
  news: NewsItem[]
  onCardClick: (item: NewsItem) => void
  bookmarkedUrls: Set<string>
  onToggleBookmark: (item: NewsItem) => void
}

// ===== 子组件 =====

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="px-4 pt-3 pb-4">
      <h2 className="text-base text-foreground font-semibold leading-none mb-1.5">{title}</h2>
      <p className="text-[11px] text-muted-foreground">{subtitle}</p>
    </div>
  )
}

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

function MetaRow({ time, count }: { time: string; count: number }) {
  const hl = formatNewsHeat(count)
  return (
    <div className="flex items-center justify-between text-[11px] text-muted-foreground/70">
      <time dateTime={time} className="shrink-0">{time}</time>
      {hl && <span className="shrink-0 text-[10px] text-muted-foreground/60">{hl}</span>}
    </div>
  )
}

function TagRow({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <p className="text-[10px] text-primary/80 font-medium tracking-wide leading-none mb-1">
      {tags.join(' · ')}
    </p>
  )
}

// ===== 头条 — 标题叠加到图片内 =====

function LeadStory({ item, isBookmarked, onClick, onToggleBookmark }: {
  item: NewsItem; isBookmarked: boolean
  onClick: () => void; onToggleBookmark: (item: NewsItem) => void
}) {
  const [imgError, setImgError] = useState(false)
  const tags = pickDisplayTags(item.tags, 3)
  const time = formatNewsTime(item.time)
  const handleToggle = () => onToggleBookmark(item)

  return (
    <div className="px-4 pb-5">
      <div className="relative">
        <button type="button" onClick={onClick} className="block w-full text-left no-underline bg-transparent border-0 p-0">
          {item.thumb && !imgError ? (
            <div className="relative w-full aspect-[16/10] rounded-[6px] overflow-hidden bg-muted/50">
              <img src={item.thumb} alt="" loading="lazy" referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)} />
              {/* 磨砂标题栏：半透明深色 + backdrop-filter，高度随标题自动撑开 */}
              <div
                className="absolute inset-x-0 bottom-0 px-3 py-2.5"
                style={{
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.48) 35%)',
                }}
              >
                <h2 className="text-[21px] leading-[1.3] font-semibold text-white break-words"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.42)' }}>
                  {item.title}
                </h2>
              </div>
            </div>
          ) : (
            <div className="relative w-full aspect-[16/10] rounded-[6px] bg-muted/50 flex items-end">
              <div className="px-3 pb-3">
                <h2 className="text-[21px] leading-[1.3] font-semibold text-foreground break-words">
                  {item.title}
                </h2>
              </div>
            </div>
          )}
        </button>

        {/* 收藏按钮 — 与主点击区同级 */}
        <BookmarkButton isBookmarked={isBookmarked} compact onClick={handleToggle} />

        {/* 图外辅助信息 */}
        {item.thumb && !imgError && (
          <div className="mt-2.5">
            <TagRow tags={tags} />
            <MetaRow time={time} count={item.count} />
          </div>
        )}
      </div>
    </div>
  )
}

// ===== 双次头条 — 标题叠加 + 收藏外置 =====

function SecondaryStories({ items, bookmarkedUrls, onClick, onToggleBookmark }: {
  items: NewsItem[]; bookmarkedUrls: Set<string>
  onClick: (item: NewsItem) => void; onToggleBookmark: (item: NewsItem) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="px-4 pb-5">
      <div className="flex gap-3">
        {items.map((item) => (
          <SecondaryCard key={item.url ?? item.title} item={item}
            isBookmarked={bookmarkedUrls.has(item.url ?? '')}
            onClick={() => onClick(item)}
            onToggleBookmark={onToggleBookmark} />
        ))}
        {items.length === 1 && <div className="flex-1" />}
      </div>
    </div>
  )
}

function SecondaryCard({ item, isBookmarked, onClick, onToggleBookmark }: {
  item: NewsItem; isBookmarked: boolean
  onClick: () => void; onToggleBookmark: (item: NewsItem) => void
}) {
  const [imgError, setImgError] = useState(false)
  const tags = pickDisplayTags(item.tags, 2)
  const time = formatNewsTime(item.time)
  const handleToggle = () => onToggleBookmark(item)

  return (
    <div className="flex-1 min-w-0 relative">
      {/* 图片 + 叠加标题 */}
      <button type="button" onClick={onClick} className="block w-full text-left no-underline bg-transparent border-0 p-0">
        {item.thumb && !imgError ? (
          <div className="relative w-full aspect-[4/3] rounded-[5px] overflow-hidden bg-muted/50">
            <img src={item.thumb} alt="" loading="lazy" referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={() => setImgError(true)} />
            <div
              className="absolute inset-x-0 bottom-0 px-2 py-[7px]"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.48) 35%)',
              }}
            >
              <h3 className="text-[13px] leading-[1.35] font-semibold text-white break-words"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.42)' }}>
                {item.title}
              </h3>
            </div>
          </div>
        ) : (
          <div className="relative w-full aspect-[4/3] rounded-[5px] bg-muted/50 flex items-end">
            <div className="px-2 pb-2">
              <h3 className="text-[13px] leading-[1.35] font-semibold text-foreground break-words">
                {item.title}
              </h3>
            </div>
          </div>
        )}
      </button>

      {/* 收藏按钮 — 与主点击区同级 */}
      <BookmarkButton isBookmarked={isBookmarked} compact onClick={handleToggle} />

      {/* 图外辅助信息 */}
      {item.thumb && !imgError && (
        <div className="mt-1.5">
          <TagRow tags={tags} />
          <MetaRow time={time} count={item.count} />
        </div>
      )}
    </div>
  )
}

// ===== 持续关注列表项 — 不变 =====

function ListItem({ item, isBookmarked, onClick, onToggleBookmark }: {
  item: NewsItem; isBookmarked: boolean
  onClick: () => void; onToggleBookmark: (item: NewsItem) => void
}) {
  const [imgError, setImgError] = useState(false)
  const tags = pickDisplayTags(item.tags, 2)
  const time = formatNewsTime(item.time)
  const hl = formatNewsHeat(item.count)
  const handleToggle = () => onToggleBookmark(item)

  return (
    <div className="relative px-4">
      <button type="button" onClick={onClick} className="block w-full text-left no-underline bg-transparent border-0 p-0">
        <div className="flex gap-3 py-3 border-b border-border/60 hover:bg-accent/5 transition-colors cursor-pointer min-h-[104px] items-start">
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 py-0.5">
            <TagRow tags={tags} />
            <h3 className="text-[15px] leading-[1.4] line-clamp-2 text-foreground">
              {item.title}
            </h3>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground/80">
              <time dateTime={item.time} className="shrink-0">{time}</time>
              {hl && <span className="shrink-0 text-[10px] text-muted-foreground/60">{hl}</span>}
            </div>
          </div>
          {item.thumb && !imgError ? (
            <div className="shrink-0 w-[96px] h-[72px] rounded-[5px] overflow-hidden bg-muted">
              <img src={item.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={() => setImgError(true)} />
            </div>
          ) : (
            <div className="shrink-0 w-[96px] h-[72px] rounded-[5px] bg-muted/50" />
          )}
        </div>
      </button>
      <BookmarkButton isBookmarked={isBookmarked} compact onClick={handleToggle} />
    </div>
  )
}

// ===== 主组件 =====

export function HotEditorialFeed({
  news, onCardClick, bookmarkedUrls, onToggleBookmark,
}: HotEditorialFeedProps) {
  const lead = news[0]
  const secondary = news.slice(1, 3)
  const rest = news.slice(3)

  return (
    <div className="pb-8">
      <SectionTitle title="近期热点" subtitle="过去 24 小时持续受到关注的报道" />

      {lead && (
        <LeadStory item={lead}
          isBookmarked={bookmarkedUrls.has(lead.url ?? '')}
          onClick={() => onCardClick(lead)}
          onToggleBookmark={onToggleBookmark} />
      )}

      {secondary.length > 0 && (
        <SecondaryStories items={secondary}
          bookmarkedUrls={bookmarkedUrls}
          onClick={onCardClick} onToggleBookmark={onToggleBookmark} />
      )}

      {rest.length > 0 && (
        <>
          <Divider />
          {rest.map((item) => (
            <ListItem key={item.url ?? item.title} item={item}
              isBookmarked={bookmarkedUrls.has(item.url ?? '')}
              onClick={() => onCardClick(item)}
              onToggleBookmark={onToggleBookmark} />
          ))}
        </>
      )}
    </div>
  )
}
