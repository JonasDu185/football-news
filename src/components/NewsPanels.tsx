import type { RefObject } from 'react'
import type { NewsItem } from '@/lib/newsFilter'
import type { NewsError } from '@/hooks/useNewsFeed'
import { CarouselPanel } from './CarouselPanel'
import { NewsList } from './NewsList'
import { HotEditorialFeed } from './HotEditorialFeed'

/** 两个频道的底色通过主题变量保持亮暗模式一致 */
const PANEL_SURFACES = {
  realtime: 'var(--panel-realtime)',
  hot:      'var(--panel-hot)',
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
  viewportWidth: number
  onRefresh: () => Promise<void>
  featured: PanelData
  hot: PanelData
  realtimeNews: NewsItem[]
  hotNews: NewsItem[]
  onCardClick: (item: NewsItem) => void
  readUrls: Set<string>
  bookmarkedUrls: Set<string>
  onToggleBookmark: (item: NewsItem) => void
}

export function NewsPanels({
  panel0Ref, panel1Ref,
  viewportWidth, onRefresh,
  featured, hot,
  realtimeNews, hotNews,
  onCardClick, readUrls, bookmarkedUrls, onToggleBookmark,
}: NewsPanelsProps) {
  return (
    <>
      {/* 实时 — 智能混排双列瀑布流 */}
      <CarouselPanel
        panelRef={panel0Ref} width={viewportWidth} surface={PANEL_SURFACES.realtime}
        hasMore={featured.hasMore} loadingMore={featured.loadingMore}
        onLoadMore={featured.onLoadMore} onRefresh={onRefresh}
        error={featured.error} onRetry={featured.onRetry}
      >
        <NewsList columns={2} news={realtimeNews} onCardClick={onCardClick} readUrls={readUrls}
          bookmarkedUrls={bookmarkedUrls} onToggleBookmark={onToggleBookmark} />
      </CarouselPanel>

      {/* 热点 — 编辑首页 */}
      <CarouselPanel
        panelRef={panel1Ref} width={viewportWidth} surface={PANEL_SURFACES.hot}
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
