import type { RefObject } from 'react'
import type { NewsItem } from '@/lib/newsFilter'
import type { NewsError } from '@/hooks/useNewsFeed'
import { CarouselPanel } from './CarouselPanel'
import { NewsList } from './NewsList'
import { HotEditorialFeed } from './HotEditorialFeed'
import { ScoreBoard } from './ScoreBoard'

/** 三个频道的底色 */
const PANEL_SURFACES = {
  worldcup: '#F2F5F1',
  daily:    '#F7F7F4',
  hot:      '#F5F3EE',
} as const

interface PanelData {
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  error?: NewsError | null
  onRetry?: () => void
}

interface NewsPanelsProps {
  panel0Ref: RefObject<HTMLDivElement | null>
  panel1Ref: RefObject<HTMLDivElement | null>
  panel2Ref: RefObject<HTMLDivElement | null>
  viewportWidth: number
  onRefresh: () => Promise<void>
  featured: PanelData
  hot: PanelData
  worldcupNews: NewsItem[]
  dailyNews: NewsItem[]
  hotNews: NewsItem[]
  /** 全部新闻（用于比分解析） */
  allNews: NewsItem[]
  feedHint: string
  onCardClick: (item: NewsItem) => void
  readUrls: Set<string>
  bookmarkedUrls: Set<string>
  onToggleBookmark: (item: NewsItem) => void
}

/** 每日消息顶部提示 */
function FeedHint({ text }: { text: string }) {
  return (
    <div className="px-4 pt-2 pb-3">
      <p className="text-[11px] text-muted-foreground">{text}</p>
    </div>
  )
}

export function NewsPanels({
  panel0Ref, panel1Ref, panel2Ref,
  viewportWidth, onRefresh,
  featured, hot,
  worldcupNews, dailyNews, hotNews, allNews,
  feedHint, onCardClick, readUrls, bookmarkedUrls, onToggleBookmark,
}: NewsPanelsProps) {
  return (
    <>
      {/* 世界杯 — 比分牌 + 双列瀑布流 */}
      <CarouselPanel
        panelRef={panel0Ref} width={viewportWidth} surface={PANEL_SURFACES.worldcup}
        hasMore={featured.hasMore} loadingMore={featured.loadingMore}
        onLoadMore={featured.onLoadMore} onRefresh={onRefresh}
        error={featured.error} onRetry={featured.onRetry}
      >
        <ScoreBoard news={allNews} />
        <NewsList columns={2} news={worldcupNews} onCardClick={onCardClick} readUrls={readUrls}
          bookmarkedUrls={bookmarkedUrls} onToggleBookmark={onToggleBookmark} />
      </CarouselPanel>

      {/* 每日消息 — 智能混排双列瀑布流 */}
      <CarouselPanel
        panelRef={panel1Ref} width={viewportWidth} surface={PANEL_SURFACES.daily}
        hasMore={featured.hasMore} loadingMore={featured.loadingMore}
        onLoadMore={featured.onLoadMore} onRefresh={onRefresh}
        error={featured.error} onRetry={featured.onRetry}
      >
        <FeedHint text={feedHint} />
        <NewsList columns={2} news={dailyNews} onCardClick={onCardClick} readUrls={readUrls}
          bookmarkedUrls={bookmarkedUrls} onToggleBookmark={onToggleBookmark} />
      </CarouselPanel>

      {/* 近期热点 — 编辑首页 */}
      <CarouselPanel
        panelRef={panel2Ref} width={viewportWidth} surface={PANEL_SURFACES.hot}
        hasMore={hot.hasMore} loadingMore={hot.loadingMore}
        onLoadMore={hot.onLoadMore} onRefresh={onRefresh}
        error={hot.error} onRetry={hot.onRetry}
      >
        <HotEditorialFeed
          news={hotNews}
          onCardClick={onCardClick}
          bookmarkedUrls={bookmarkedUrls}
          onToggleBookmark={onToggleBookmark}
        />
      </CarouselPanel>
    </>
  )
}
