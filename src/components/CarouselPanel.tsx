import type { ReactNode, RefObject } from 'react'
import type { NewsError } from '@/hooks/useNewsFeed'
import { ErrorState } from './ErrorState'
import { PullToRefresh } from './PullToRefresh'
import { LoadMoreSentinel } from './LoadMoreSentinel'

interface CarouselPanelProps {
  panelRef: RefObject<HTMLDivElement | null>
  width: number
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  onRefresh: () => Promise<void>
  error?: NewsError | null
  onRetry?: () => void
  children: ReactNode
  /** 面板底色，用于频道差异化 */
  surface?: string
}

/** 轮播面板：可横向滑动的独立滚动区域，适配下拉刷新+无限滚动 */
export function CarouselPanel({
  panelRef, width, hasMore, loadingMore, onLoadMore, onRefresh, error, onRetry, children, surface,
}: CarouselPanelProps) {
  return (
    <div ref={panelRef} className="flex-shrink-0 h-full overflow-y-auto overscroll-contain"
      style={{ width: width || '100%', WebkitOverflowScrolling: 'touch', backgroundColor: surface }}>
      <PullToRefresh onRefresh={onRefresh} scrollContainerRef={panelRef}>
        {error ? <ErrorState error={error} onRetry={onRetry} /> : children}
      </PullToRefresh>
      {!error && hasMore && <LoadMoreSentinel loading={loadingMore} onLoadMore={onLoadMore} rootRef={panelRef} />}
    </div>
  )
}
