import type { RefObject } from 'react'
import type { NewsItem } from '@/lib/newsFilter'
import type { NewsError } from '@/hooks/useNewsFeed'
import { CarouselPanel } from './CarouselPanel'
import { NewsList } from './NewsList'
import { HotEditorialFeed } from './HotEditorialFeed'

/** 各频道底色通过主题变量保持亮暗模式一致 */
const PANEL_SURFACES = {
  football:   'var(--panel-realtime)',
  other:      'var(--panel-hot)',
  basketball: 'var(--panel-realtime)',
  hot:        'var(--panel-hot)',
} as const

interface FeedData {
  news: NewsItem[]
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  error?: NewsError | null
  onRetry?: () => void
}

interface NewsPanelsProps {
  panelRefs: RefObject<HTMLDivElement | null>[]
  viewportWidth: number
  onRefresh: () => Promise<void>
  feeds: {
    football: FeedData
    other: FeedData
    basketball: FeedData
    hot: FeedData
  }
  onCardClick: (item: NewsItem) => void
  readUrls: Set<string>
  bookmarkedUrls: Set<string>
  onToggleBookmark: (item: NewsItem) => void
}

export function NewsPanels({
  panelRefs,
  viewportWidth, onRefresh,
  feeds,
  onCardClick, readUrls, bookmarkedUrls, onToggleBookmark,
}: NewsPanelsProps) {
  return (
    <>
      {/* 足球 — 智能混排双列瀑布流 */}
      <CarouselPanel
        panelRef={panelRefs[0]} width={viewportWidth} surface={PANEL_SURFACES.football}
        hasMore={feeds.football.hasMore} loadingMore={feeds.football.loadingMore}
        onLoadMore={feeds.football.onLoadMore} onRefresh={onRefresh}
        error={feeds.football.error} onRetry={feeds.football.onRetry}
      >
        <NewsList columns={2} news={feeds.football.news} onCardClick={onCardClick} readUrls={readUrls}
          bookmarkedUrls={bookmarkedUrls} onToggleBookmark={onToggleBookmark} />
      </CarouselPanel>

      {/* 综合 — 智能混排双列瀑布流 */}
      <CarouselPanel
        panelRef={panelRefs[1]} width={viewportWidth} surface={PANEL_SURFACES.other}
        hasMore={feeds.other.hasMore} loadingMore={feeds.other.loadingMore}
        onLoadMore={feeds.other.onLoadMore} onRefresh={onRefresh}
        error={feeds.other.error} onRetry={feeds.other.onRetry}
      >
        <NewsList columns={2} news={feeds.other.news} onCardClick={onCardClick} readUrls={readUrls}
          bookmarkedUrls={bookmarkedUrls} onToggleBookmark={onToggleBookmark} />
      </CarouselPanel>

      {/* 篮球 — 智能混排双列瀑布流 */}
      <CarouselPanel
        panelRef={panelRefs[2]} width={viewportWidth} surface={PANEL_SURFACES.basketball}
        hasMore={feeds.basketball.hasMore} loadingMore={feeds.basketball.loadingMore}
        onLoadMore={feeds.basketball.onLoadMore} onRefresh={onRefresh}
        error={feeds.basketball.error} onRetry={feeds.basketball.onRetry}
      >
        <NewsList columns={2} news={feeds.basketball.news} onCardClick={onCardClick} readUrls={readUrls}
          bookmarkedUrls={bookmarkedUrls} onToggleBookmark={onToggleBookmark} />
      </CarouselPanel>

      {/* 热点 — 编辑首页（全项目，按热度） */}
      <CarouselPanel
        panelRef={panelRefs[3]} width={viewportWidth} surface={PANEL_SURFACES.hot}
        hasMore={feeds.hot.hasMore} loadingMore={feeds.hot.loadingMore}
        onLoadMore={feeds.hot.onLoadMore} onRefresh={onRefresh}
        error={feeds.hot.error} onRetry={feeds.hot.onRetry}
      >
        <HotEditorialFeed
          news={feeds.hot.news}
          onCardClick={onCardClick}
          bookmarkedUrls={bookmarkedUrls}
          onToggleBookmark={onToggleBookmark}
        />
      </CarouselPanel>
    </>
  )
}
