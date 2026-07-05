import { DateHeader } from './components/DateHeader'
import { NewsList } from './components/NewsList'
import { ReaderView } from './components/ReaderView'
import { LoadMoreSentinel } from './components/LoadMoreSentinel'
import { PullToRefresh } from './components/PullToRefresh'

import { Skeleton } from './components/ui/skeleton'

import { useNewsFeed } from './hooks/useNewsFeed'
import type { NewsError } from './hooks/useNewsFeed'
import { ErrorState } from './components/ErrorState'
import { SearchBar } from './components/SearchBar'
import { BookmarkList } from './components/BookmarkList'
import { useSearch } from './hooks/useSearch'
import { useBookmarks } from './hooks/useBookmarks'
import { SearchIcon, BookmarkIcon, MenuIcon, SunIcon, MoonIcon, MonitorIcon, SettingsIcon } from 'lucide-react'
import { Button } from './components/ui/button'
import { useTheme } from './hooks/useTheme'
import { BackToTop } from './components/BackToTop'
import { Drawer } from './components/Drawer'
import { PreferencePanel } from './components/PreferencePanel'
import type { UserPreferences } from './components/PreferencePanel'
import { useToast } from './components/Toast'
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

const TABS = [
  { value: 'worldcup', label: '世界杯' },
  { value: 'daily',    label: '每日消息' },
  { value: 'hot',      label: '近期热点' },
] as const
type TabValue = (typeof TABS)[number]['value']
const TAB_VALUES = TABS.map(t => t.value)
const TAB_COUNT = TABS.length

function tabToIndex(tab: string): number {
  return TAB_VALUES.indexOf(tab as TabValue)
}

function CarouselPanel({ panelRef, width, hasMore, loadingMore, onLoadMore, onRefresh, error, onRetry, children }: {
  panelRef: React.RefObject<HTMLDivElement | null>
  width: number
  hasMore: boolean; loadingMore: boolean; onLoadMore: () => void
  onRefresh: () => Promise<void>
  error?: NewsError | null
  onRetry?: () => void
  children: React.ReactNode
}) {
  return (
    <div ref={panelRef} className="flex-shrink-0 h-full overflow-y-auto overscroll-contain"
      style={{ width: width || '100%', WebkitOverflowScrolling: 'touch' }}>
      <PullToRefresh onRefresh={onRefresh} scrollContainerRef={panelRef}>
        {error ? <ErrorState error={error} onRetry={onRetry} /> : children}
      </PullToRefresh>
      {!error && hasMore && <LoadMoreSentinel loading={loadingMore} onLoadMore={onLoadMore} rootRef={panelRef} />}
    </div>
  )
}

function App() {
  const today = useToday()
  // 两个独立 feed：featured（每日消息+世界杯共用），hot（近期热点独立分页）
  const featuredFeed = useNewsFeed('/api/news/featured')
  const hotFeed = useNewsFeed('/api/news/hot')
  const [reading, setReading] = useState<NewsItem | null>(null)
  const [activeTab, setActiveTab] = useState<TabValue>('worldcup')
  const { readUrls, markRead } = useReadHistory()

  // 搜索
  const [searchOpen, setSearchOpen] = useState(false)
  const allNews = useMemo(() => {
    const seen = new Set<string>()
    const combined: NewsItem[] = []
    for (const item of [...featuredFeed.items, ...hotFeed.items]) {
      const key = item.url ?? item.title
      if (!seen.has(key)) { seen.add(key); combined.push(item) }
    }
    return combined
  }, [featuredFeed.items, hotFeed.items])
  const { query, setQuery, results } = useSearch(allNews)

  // 收藏
  const { bookmarks, toggleBookmark, removeBookmark } = useBookmarks()
  const [bookmarkListOpen, setBookmarkListOpen] = useState(false)
  const bookmarkedUrls = useMemo(() => {
    return new Set(bookmarks.map((b) => b.url))
  }, [bookmarks])

  // 主题
  const { mode: themeMode, cycleTheme } = useTheme()

  // 抽屉 & 偏好
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [preferenceOpen, setPreferenceOpen] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      return JSON.parse(localStorage.getItem('football-preferences') || '{"leagues":[],"teams":[]}')
    } catch { return { leagues: [], teams: [] } }
  })
  const { show: showToast } = useToast()

  const handleSavePreferences = (prefs: UserPreferences) => {
    setPreferences(prefs)
    localStorage.setItem('football-preferences', JSON.stringify(prefs))
    showToast('已保存，新功能随后上线')
  }

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
  const activePanelRef = [panel0Ref, panel1Ref, panel2Ref][activeIndex]
  // ── 撕票根：CSS animation-delay 1s 后 DateHeader 飞走消失 ──
  const [headerGone, setHeaderGone] = useState(false)

  // 切页时清除 carousel 过渡
  const prevIndexRef = useRef(activeIndex)
  useEffect(() => {
    if (prevIndexRef.current !== activeIndex) {
      prevIndexRef.current = activeIndex
      const timer = setTimeout(() => setEnableTransition(false), 300)
      return () => clearTimeout(timer)
    }
  }, [activeIndex])

  // 标签切换逻辑（左滑 = 下一个，右滑 = 上一个，到边界停止不循环）
  const goNext = useCallback(() => {
    setActiveTab((prev) => {
      const idx = tabToIndex(prev)
      if (idx >= TAB_COUNT - 1) return prev
      return TAB_VALUES[idx + 1]
    })
  }, [])

  const goPrev = useCallback(() => {
    setActiveTab((prev) => {
      const idx = tabToIndex(prev)
      if (idx <= 0) return prev
      return TAB_VALUES[idx - 1]
    })
  }, [])

  // ── 手势处理 ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (reading || searchOpen) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwipingRef.current = false
    setSwipeOffset(0)
    setEnableTransition(false)
  }, [reading, searchOpen])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (reading || searchOpen) return
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
    for (const n of featuredFeed.items) {
      if (n.tags.includes('世界杯')) wc.push(n)
      else other.push(n)
    }
    return { worldcupNews: wc, otherNews: other }
  }, [featuredFeed.items])

  const handleRefresh = useCallback(async () => {
    await fetch('/api/news/refresh', { method: 'POST' })
    featuredFeed.retry()
    hotFeed.retry()
  }, [featuredFeed.retry, hotFeed.retry])

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
    setEnableTransition(true)
    setSwipeOffset(0)
    setActiveTab(value as TabValue)
  }, [])

  return (
    <div className="h-dvh flex flex-col bg-background max-w-md mx-auto relative">
      {/* 撕票根：CSS animation-delay 1s 后飞走 */}
      {!headerGone && (
        <div className="shrink-0 overflow-hidden" style={{ maxHeight: '200px' }}>
          <div className="animate-tear-off" onAnimationEnd={() => setHeaderGone(true)}>
            <DateHeader date={today} />
          </div>
        </div>
      )}

      {/* 搜索栏 */}
      {searchOpen && (
        <SearchBar query={query} onChange={setQuery} onClose={() => { setSearchOpen(false); setQuery('') }} />
      )}

      {/* 全局标签栏 — 左右带按钮，搜索时隐藏 */}
      {!searchOpen && (
      <div className="bg-background z-20 relative">
        <div className="flex items-center gap-1 px-2 pt-2 pb-2">
          {/* 左侧菜单按钮 */}
          <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => setDrawerOpen(true)} aria-label="菜单">
            <MenuIcon className="size-4" />
          </Button>

          {/* Tab 栏 */}
          <div className="flex-1 relative flex h-10 rounded-lg bg-muted p-1 overflow-hidden mx-auto" style={{ maxWidth: viewportWidth > 0 ? viewportWidth - 80 : 'calc(100% - 80px)' }}>
            {/* 滑动指示器 */}
            <div
              className="absolute top-1.5 h-7 rounded-lg bg-background shadow-sm"
              style={{
                width: 'calc(100% / 3 - 8px)',
                left: viewportWidth > 0
                  ? `calc(${activeIndex} * 100% / 3 + 4px - ${(swipeOffset / viewportWidth) * (100 / 3)}%)`
                  : `calc(${activeIndex} * 100% / 3 + 4px)`,
                transition: enableTransition ? 'left 0.3s ease-out' : 'none',
              }}
            />
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabClick(tab.value)}
                className={`flex-1 text-xs rounded-md transition-colors relative z-10 ${
                  activeTab === tab.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 右侧搜索按钮 */}
          <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => setSearchOpen(!searchOpen)} aria-label="搜索">
            <SearchIcon className="size-4" />
          </Button>
        </div>
      </div>
      )}

      {/* Carousel 视口 — 填满剩余高度 */}
      <div
        ref={viewportRef}
        className="flex-1 overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-y' }}
      >
        {featuredFeed.loading ? (
          <div className="h-full overflow-y-auto pt-2">
            <NewsSkeleton />
          </div>
        ) : searchOpen ? (
          /* 搜索模式：统一留空，不管有没有输入 */
          <div className="h-full overflow-y-auto pt-2">
            {query ? (
              results.length === 0 ? (
                <p className="px-4 py-12 text-center text-muted-foreground text-sm">未找到相关新闻</p>
              ) : (
                <NewsList columns={2} news={results} onCardClick={openReader} readUrls={readUrls}
                  bookmarkedUrls={bookmarkedUrls} onToggleBookmark={toggleBookmark} />
              )
            ) : (
              /* 搜索栏打开但尚未输入 → 显示不可滑动的 Carousel */
              <div
                className="flex h-full"
                style={{ transform: trackTransform, overflowAnchor: 'none' }}
              >
                <CarouselPanel panelRef={panel0Ref} width={viewportWidth} onRefresh={handleRefresh}
                  hasMore={featuredFeed.hasMore} loadingMore={featuredFeed.loadingMore}
                  onLoadMore={featuredFeed.loadMore}
                  error={featuredFeed.error} onRetry={featuredFeed.retry}>
                  <NewsList columns={2} news={worldcupNews} onCardClick={openReader} readUrls={readUrls}
                    bookmarkedUrls={bookmarkedUrls} onToggleBookmark={toggleBookmark} />
                </CarouselPanel>
                <CarouselPanel panelRef={panel1Ref} width={viewportWidth} onRefresh={handleRefresh}
                  hasMore={featuredFeed.hasMore} loadingMore={featuredFeed.loadingMore}
                  onLoadMore={featuredFeed.loadMore}
                  error={featuredFeed.error} onRetry={featuredFeed.retry}>
                  <NewsList columns={2} news={otherNews} onCardClick={openReader} readUrls={readUrls}
                    bookmarkedUrls={bookmarkedUrls} onToggleBookmark={toggleBookmark} />
                </CarouselPanel>
                <CarouselPanel panelRef={panel2Ref} width={viewportWidth} onRefresh={handleRefresh}
                  hasMore={hotFeed.hasMore} loadingMore={hotFeed.loadingMore}
                  onLoadMore={hotFeed.loadMore}
                  error={hotFeed.error} onRetry={hotFeed.retry}>
                  <NewsList columns={2} news={hotFeed.items} onCardClick={openReader} readUrls={readUrls} showFeatured
                    bookmarkedUrls={bookmarkedUrls} onToggleBookmark={toggleBookmark} />
                </CarouselPanel>
              </div>
            )}
          </div>
        ) : (
          /* 正常模式：三页横排 track */
          <div
            className="flex h-full"
            style={{
              transform: trackTransform,
              transition: enableTransition ? 'transform 0.3s ease-out' : 'none',
              willChange: isSwipingRef.current ? 'transform' : 'auto',
              overflowAnchor: 'none',
            }}
          >
            <CarouselPanel panelRef={panel0Ref} width={viewportWidth} onRefresh={handleRefresh}
              hasMore={featuredFeed.hasMore} loadingMore={featuredFeed.loadingMore}
              onLoadMore={featuredFeed.loadMore}
              error={featuredFeed.error} onRetry={featuredFeed.retry}>
              <NewsList columns={2} news={worldcupNews} onCardClick={openReader} readUrls={readUrls}
                bookmarkedUrls={bookmarkedUrls} onToggleBookmark={toggleBookmark} />
            </CarouselPanel>
            <CarouselPanel panelRef={panel1Ref} width={viewportWidth} onRefresh={handleRefresh}
              hasMore={featuredFeed.hasMore} loadingMore={featuredFeed.loadingMore}
              onLoadMore={featuredFeed.loadMore}
              error={featuredFeed.error} onRetry={featuredFeed.retry}>
              <NewsList columns={2} news={otherNews} onCardClick={openReader} readUrls={readUrls}
                bookmarkedUrls={bookmarkedUrls} onToggleBookmark={toggleBookmark} />
            </CarouselPanel>
            <CarouselPanel panelRef={panel2Ref} width={viewportWidth} onRefresh={handleRefresh}
              hasMore={hotFeed.hasMore} loadingMore={hotFeed.loadingMore}
              onLoadMore={hotFeed.loadMore}
              error={hotFeed.error} onRetry={hotFeed.retry}>
              <NewsList columns={2} news={hotFeed.items} onCardClick={openReader} readUrls={readUrls} showFeatured
                bookmarkedUrls={bookmarkedUrls} onToggleBookmark={toggleBookmark} />
            </CarouselPanel>
          </div>
        )}
      </div>

      {/* 回到顶部 */}
      <BackToTop scrollContainerRef={activePanelRef} />

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

      {/* 收藏列表 */}
      {bookmarkListOpen && (
        <BookmarkList
          bookmarks={bookmarks}
          onBack={() => setBookmarkListOpen(false)}
          onCardClick={(item) => { setBookmarkListOpen(false); openReader(item) }}
          onClearAll={() => { if (confirm('确定清空所有收藏？')) bookmarks.forEach(b => removeBookmark(b.url)) }}
        />
      )}

      {/* 左侧抽屉菜单 */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="菜单">
        {/* 深浅模式 */}
        <button
          type="button"
          onClick={() => { cycleTheme() }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors"
        >
          {themeMode === 'system' ? <MonitorIcon className="size-4 text-muted-foreground" />
           : themeMode === 'dark' ? <MoonIcon className="size-4 text-muted-foreground" />
           : <SunIcon className="size-4 text-muted-foreground" />}
          <span>
            {themeMode === 'system' ? '跟随系统' : themeMode === 'dark' ? '深色模式' : '浅色模式'}
          </span>
        </button>

        {/* 稍后阅读 */}
        <button
          type="button"
          onClick={() => { setDrawerOpen(false); setBookmarkListOpen(true) }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors"
        >
          <BookmarkIcon className="size-4 text-muted-foreground" />
          <span>稍后阅读{bookmarks.length > 0 ? ` (${bookmarks.length})` : ''}</span>
        </button>

        {/* 偏好设置 */}
        <button
          type="button"
          onClick={() => { setPreferenceOpen(true) }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors"
        >
          <SettingsIcon className="size-4 text-muted-foreground" />
          <span>偏好设置</span>
        </button>
      </Drawer>

      {/* 偏好设置面板 */}
      {preferenceOpen && (
        <PreferencePanel
          preferences={preferences}
          onSave={(prefs) => { handleSavePreferences(prefs) }}
          onClose={() => setPreferenceOpen(false)}
        />
      )}

    </div>
  )
}

export default App
