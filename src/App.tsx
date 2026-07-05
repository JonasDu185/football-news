import { DateHeader } from './components/DateHeader'
import { NewsList } from './components/NewsList'
import { ReaderView } from './components/ReaderView'
import { LoadMoreSentinel } from './components/LoadMoreSentinel'
import { PullToRefresh } from './components/PullToRefresh'

import { Skeleton } from './components/ui/skeleton'
import { Button } from './components/ui/button'
import { useNews } from './hooks/useNews'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { NewsItem } from './lib/newsFilter'

function useToday() {
  const [today, setToday] = useState(() => new Date())
  useEffect(() => {
    const now = new Date()
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime()
    const timer = setTimeout(() => setToday(new Date()), msUntilMidnight + 1000)
    return () => clearTimeout(timer)
  }, [])
  return today
}

function NewsSkeleton() {
  return (
    <div className="flex gap-3 px-4">
      <div className="flex-1 flex flex-col gap-3">
        {[1, 3].map((i) => (
          <div key={i} className="bg-card rounded-lg p-3 space-y-2">
            <Skeleton className="h-28 w-full rounded-md" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
            <div className="flex gap-1">
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-3">
        {[2, 4].map((i) => (
          <div key={i} className="bg-card rounded-lg p-3 space-y-2">
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-1/2" />
            <div className="flex gap-1">
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 已读记录 hook — 持久化到 localStorage
function useReadHistory() {
  const [readUrls, setReadUrls] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('football-read')
      return new Set(saved ? JSON.parse(saved) : [])
    } catch { return new Set() }
  })

  const markRead = useCallback((url: string | null) => {
    if (!url) return
    setReadUrls((prev) => {
      const next = new Set(prev)
      next.add(url)
      localStorage.setItem('football-read', JSON.stringify([...next]))
      return next
    })
  }, [])

  return { readUrls, markRead }
}

// 标签值 → 索引映射
const TAB_ORDER = ['worldcup', 'daily', 'hot'] as const
type TabValue = typeof TAB_ORDER[number]

function tabToIndex(tab: string): number {
  return TAB_ORDER.indexOf(tab as TabValue)
}

function App() {
  const today = useToday()
  const { featured, hot, loading, error, hasMore, loadingMore, loadMore, retry } = useNews()
  const [reading, setReading] = useState<NewsItem | null>(null)
  const [activeTab, setActiveTab] = useState<TabValue>('worldcup')
  const { readUrls, markRead } = useReadHistory()

  // 当前页索引：0=世界杯, 1=每日消息, 2=近期热点
  const activeIndex = tabToIndex(activeTab)

  // 横滑状态
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [enableTransition, setEnableTransition] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwipingRef = useRef(false)

  // 视口宽度测量（避免 flex 中 w-full 百分比解析的循环依赖问题）
  const viewportRef = useRef<HTMLDivElement>(null)
  const [viewportWidth, setViewportWidth] = useState(0)
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setViewportWidth(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 三个面板的滚动容器 ref
  const panel0Ref = useRef<HTMLDivElement>(null)
  const panel1Ref = useRef<HTMLDivElement>(null)
  const panel2Ref = useRef<HTMLDivElement>(null)
  const panelRefs = [panel0Ref, panel1Ref, panel2Ref] as const

  // ── 票根翻折：DateHeader 在面板内，scrollTop 跳过它 = 自然消失 ──
  const activeIndexRef = useRef(activeIndex)
  useEffect(() => { activeIndexRef.current = activeIndex }, [activeIndex])
  const rafRef = useRef(0)

  const handlePanelScroll = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      const panel = panelRefs[activeIndexRef.current].current
      if (!panel) return
      // 从当前面板内找 DateHeader（每个面板各有一个）
      const foldEl = panel.querySelector('[data-header-fold]') as HTMLElement | null
      if (!foldEl) return
      const st = panel.scrollTop
      const h = foldEl.offsetHeight
      const progress = Math.max(0, Math.min(st / h, 1))
      foldEl.style.transform = progress > 0 ? `perspective(600px) rotateX(${progress * 50}deg)` : ''
      foldEl.style.opacity = progress > 0 ? `${1 - progress}` : ''
      foldEl.style.transformOrigin = 'bottom center'
    })
  }, [])

  // 切页时：目标面板 scrollTop = 面板内 DateHeader 高度，跳过日期卡，新闻从顶端开始
  const prevIndexRef = useRef(activeIndex)
  useEffect(() => {
    if (prevIndexRef.current !== activeIndex) {
      prevIndexRef.current = activeIndex
      const panel = panelRefs[activeIndex].current
      if (panel) {
        // 测量该面板内 DateHeader 高度（不受折叠影响，因为面板刚挂载 scrollTop=0）
        const h = panel.querySelector('[data-header-fold]')?.offsetHeight || 100
        panel.scrollTop = h
      }
      const timer = setTimeout(() => setEnableTransition(false), 300)
      return () => clearTimeout(timer)
    }
  }, [activeIndex])

  // 标签切换逻辑（左滑 = 下一个，右滑 = 上一个）
  const goNext = useCallback(() => {
    setActiveTab((prev) => {
      const idx = tabToIndex(prev)
      return TAB_ORDER[(idx + 1) % 3]
    })
  }, [])

  const goPrev = useCallback(() => {
    setActiveTab((prev) => {
      const idx = tabToIndex(prev)
      return TAB_ORDER[(idx + 2) % 3]
    })
  }, [])

  // ── 手势处理 ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (reading) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwipingRef.current = false
    setSwipeOffset(0)
    setEnableTransition(false)
  }, [reading])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (reading) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current

    // 水平位移 > 10px 且大于垂直位移时，进入横滑模式
    if (!isSwipingRef.current) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        isSwipingRef.current = true
      } else return
    }

    // 进入横滑后阻止页面默认行为（防止面板纵向滚动）
    e.preventDefault()

    // 边界阻力：左边界、右边界 → 0.3 倍阻力
    let offset = dx
    const atLeftEdge = activeIndex === 0
    const atRightEdge = activeIndex === 2
    if ((offset > 0 && atLeftEdge) || (offset < 0 && atRightEdge)) {
      offset = offset * 0.3
    }

    setSwipeOffset(offset)
  }, [reading, activeIndex])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isSwipingRef.current) return
    isSwipingRef.current = false

    const endX = e.changedTouches[0].clientX
    const dx = endX - touchStartX.current

    setEnableTransition(true)

    if (Math.abs(dx) > 60) {
      if (dx < 0) goNext()
      else goPrev()
    }
    // 偏移归零（弹性回归 / 切换后归位）
    setSwipeOffset(0)
  }, [goNext, goPrev])

  // ── 数据拆分 ──
  const { worldcupNews, otherNews } = useMemo(() => {
    const wc: NewsItem[] = []
    const other: NewsItem[] = []
    for (const n of featured) {
      if (n.tags.includes('世界杯')) wc.push(n)
      else other.push(n)
    }
    return { worldcupNews: wc, otherNews: other }
  }, [featured])

  const handleRefresh = useCallback(async () => {
    await fetch('/api/news/refresh', { method: 'POST' })
    retry()
  }, [retry])

  // 打开阅读模式
  const openReader = useCallback((item: NewsItem) => {
    markRead(item.url)
    window.history.pushState({ reader: true }, '')
    setReading(item)
  }, [markRead])

  // 阅读模式时锁定 body（body 始终 overflow:hidden，但加一层保险）
  useEffect(() => {
    if (reading) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [reading])

  // 监听系统返回键 / 侧滑手势
  useEffect(() => {
    const handler = () => {
      if (reading) setReading(null)
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [reading])

  // ── Carousel transform（全部用像素，避免 flex 中百分比解析不可靠）──
  const trackTransform = viewportWidth > 0
    ? `translateX(${-activeIndex * viewportWidth + swipeOffset}px)`
    : 'translateX(0px)'

  const mainUrl = reading ? (reading.fallbackUrl || reading.url || '') : ''
  const sourceUrl = reading && reading.fallbackUrl && reading.url ? reading.url : null

  // 点击标签（先开过渡，再切页——React 18 批量合并，一次渲染同时生效）
  const handleTabClick = useCallback((value: string) => {
    if (value === activeTab) return
    setEnableTransition(true)
    setSwipeOffset(0)
    setActiveTab(value as TabValue)
  }, [activeTab])

  return (
    <div className="h-dvh flex flex-col bg-background max-w-md mx-auto relative">

      {/* Carousel 视口 — 填满剩余高度 */}
      <div
        ref={viewportRef}
        className="flex-1 overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-y' }}
      >
        {loading ? (
          <div className="h-full overflow-y-auto pt-2">
            <NewsSkeleton />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="px-4 py-12 text-center space-y-3">
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={retry}>
                重新加载
              </Button>
            </div>
          </div>
        ) : (
          /* 三页横排 track */
          <div
            className="flex h-full"
            style={{
              transform: trackTransform,
              transition: enableTransition ? 'transform 0.3s ease-out' : 'none',
              willChange: isSwipingRef.current ? 'transform' : 'auto',
              overflowAnchor: 'none',
            }}
          >
            {/* Page 0: 世界杯 */}
            <div
              ref={panel0Ref}
              onScroll={handlePanelScroll}
              className="flex-shrink-0 h-full overflow-y-auto overscroll-contain"
              style={{ width: viewportWidth || '100%', WebkitOverflowScrolling: 'touch' }}
            >
              {/* DateHeader + sticky 标签栏：两段式滚动 + 翻折 */}
              <div data-header-fold>
                <DateHeader date={today} />
              </div>
              <div className="sticky top-0 z-20 bg-background">
                <div className="px-4 pt-2 pb-2">
                  <div className="flex h-10 rounded-lg bg-muted p-1">
                    {(['worldcup', 'daily', 'hot'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => handleTabClick(tab)}
                        className={`flex-1 text-sm rounded-md transition-all ${
                          activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {{ worldcup: '世界杯', daily: '每日消息', hot: '近期热点' }[tab]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <PullToRefresh onRefresh={handleRefresh} scrollContainerRef={panel0Ref}>
                <NewsList columns={2} news={worldcupNews} onCardClick={openReader} readUrls={readUrls} />
              </PullToRefresh>
              {hasMore && <LoadMoreSentinel loading={loadingMore} onLoadMore={loadMore} rootRef={panel0Ref} />}
            </div>

            {/* Page 1: 每日消息 */}
            <div
              ref={panel1Ref}
              onScroll={handlePanelScroll}
              className="flex-shrink-0 h-full overflow-y-auto overscroll-contain"
              style={{ width: viewportWidth || '100%', WebkitOverflowScrolling: 'touch' }}
            >
              <div data-header-fold>
                <DateHeader date={today} />
              </div>
              <div className="sticky top-0 z-20 bg-background">
                <div className="px-4 pt-2 pb-2">
                  <div className="flex h-10 rounded-lg bg-muted p-1">
                    {(['worldcup', 'daily', 'hot'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => handleTabClick(tab)}
                        className={`flex-1 text-sm rounded-md transition-all ${
                          activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {{ worldcup: '世界杯', daily: '每日消息', hot: '近期热点' }[tab]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <PullToRefresh onRefresh={handleRefresh} scrollContainerRef={panel1Ref}>
                <NewsList columns={2} news={otherNews} onCardClick={openReader} readUrls={readUrls} />
              </PullToRefresh>
              {hasMore && <LoadMoreSentinel loading={loadingMore} onLoadMore={loadMore} rootRef={panel1Ref} />}
            </div>

            {/* Page 2: 近期热点 */}
            <div
              ref={panel2Ref}
              onScroll={handlePanelScroll}
              className="flex-shrink-0 h-full overflow-y-auto overscroll-contain"
              style={{ width: viewportWidth || '100%', WebkitOverflowScrolling: 'touch' }}
            >
              <div data-header-fold>
                <DateHeader date={today} />
              </div>
              <div className="sticky top-0 z-20 bg-background">
                <div className="px-4 pt-2 pb-2">
                  <div className="flex h-10 rounded-lg bg-muted p-1">
                    {(['worldcup', 'daily', 'hot'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => handleTabClick(tab)}
                        className={`flex-1 text-sm rounded-md transition-all ${
                          activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {{ worldcup: '世界杯', daily: '每日消息', hot: '近期热点' }[tab]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <PullToRefresh onRefresh={handleRefresh} scrollContainerRef={panel2Ref}>
                <NewsList columns={2} news={hot} onCardClick={openReader} readUrls={readUrls} showFeatured />
              </PullToRefresh>
              {hasMore && <LoadMoreSentinel loading={loadingMore} onLoadMore={loadMore} rootRef={panel2Ref} />}
            </div>
          </div>
        )}
      </div>

      {/* 阅读模式 — fixed 覆盖层 */}
      {reading && (
        <div className="fixed inset-0 z-20 bg-background flex justify-center overflow-y-auto">
          <div className="w-full max-w-md">
            <ReaderView
              url={mainUrl}
              sourceUrl={sourceUrl}
              sourceName={reading.source}
              onBack={() => window.history.back()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
