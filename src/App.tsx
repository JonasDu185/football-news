import { NewsList } from './components/NewsList'
import { ReaderView } from './components/ReaderView'
import { NewsSkeleton } from './components/NewsSkeleton'
import { NewsPanels } from './components/NewsPanels'
import { ChannelNav } from './components/ChannelNav'

import { useNewsFeed } from './hooks/useNewsFeed'
import { useReadHistory } from './hooks/useReadHistory'
import { SearchBar } from './components/SearchBar'
import { BookmarkList } from './components/BookmarkList'
import { useSearch } from './hooks/useSearch'
import { useBookmarks } from './hooks/useBookmarks'
import { BookmarkIcon, SunIcon, MoonIcon, MonitorIcon, SettingsIcon } from 'lucide-react'
import { useTheme } from './hooks/useTheme'
import { BackToTop } from './components/BackToTop'
import { Drawer } from './components/Drawer'
import { PreferencePanel } from './components/PreferencePanel'
import type { UserPreferences } from './components/PreferencePanel'
import { useToast } from './components/Toast'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { NewsItem } from './lib/newsFilter'
import { rankFeed } from './lib/feedRanker'

const TABS = [
  { value: 'realtime', label: '实时' },
  { value: 'hot',      label: '热点' },
] as const
type TabValue = (typeof TABS)[number]['value']
const TAB_VALUES = TABS.map(t => t.value)
const TAB_COUNT = TABS.length

function tabToIndex(tab: string): number {
  return TAB_VALUES.indexOf(tab as TabValue)
}

function App() {
  // 两个独立 feed：realtime（实时新闻智能混排），hot（热点独立分页）
  const featuredFeed = useNewsFeed('/api/news/featured', 30)
  const hotFeed = useNewsFeed('/api/news/hot')
  const [reading, setReading] = useState<NewsItem | null>(null)
  const [activeTab, setActiveTab] = useState<TabValue>('realtime')
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
    showToast('偏好已保存，每日消息将优先显示相关内容')
  }

  // 当前页索引：0=实时, 1=热点
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

  // 两个面板的滚动容器 ref
  const panel0Ref = useRef<HTMLDivElement>(null)
  const panel1Ref = useRef<HTMLDivElement>(null)
  const activePanelRef = [panel0Ref, panel1Ref][activeIndex]
  // 阅读模式滚动容器 ref（用于阅读进度条）
  const readerScrollRef = useRef<HTMLDivElement>(null)

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
    const atRightEdge = activeIndex === TAB_COUNT - 1
    if ((offset > 0 && atLeftEdge) || (offset < 0 && atRightEdge)) {
      offset = offset * 0.3
    }

    setSwipeOffset(offset)
  }, [reading, searchOpen, activeIndex])

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

  // 实时新闻统一智能混排：原世界杯内容不再独立成频道，但仍保留在实时流中
  const realtimeNews = useMemo(() => {
    return rankFeed(featuredFeed.items, { preferences, readUrls: new Set() })
  }, [featuredFeed.items, preferences])

  // 用 ref 持有 retry 函数，避免 handleRefresh 的依赖问题
  const featuredRetryRef = useRef(featuredFeed.retry)
  featuredRetryRef.current = featuredFeed.retry
  const hotRetryRef = useRef(hotFeed.retry)
  hotRetryRef.current = hotFeed.retry

  const handleRefresh = useCallback(async () => {
    await fetch('/api/news/refresh', { method: 'POST' })
    featuredRetryRef.current()
    hotRetryRef.current()
  }, [])

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
      <ChannelNav
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabClick}
        onMenu={() => setDrawerOpen(true)}
        onSearch={() => setSearchOpen(!searchOpen)}
      />

      {/* 搜索栏 */}
      {searchOpen && (
        <SearchBar query={query} onChange={setQuery} onClose={() => { setSearchOpen(false); setQuery('') }} />
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
          <div
            className={`h-full overflow-y-auto pt-2 ${searchOpen ? 'invisible pointer-events-none' : ''}`}
            aria-hidden={searchOpen}
          >
            <NewsSkeleton />
          </div>
        ) : (
          /* 正常新闻流始终保留，搜索时只隐藏，避免列表重新挂载和闪动 */
          <div
            data-testid="news-carousel"
            className={`flex h-full ${searchOpen ? 'invisible pointer-events-none' : ''}`}
            aria-hidden={searchOpen}
            style={{
              transform: trackTransform,
              transition: enableTransition ? 'transform 0.3s ease-out' : 'none',
              willChange: isSwipingRef.current ? 'transform' : 'auto',
              overflowAnchor: 'none',
            }}
          >
            <NewsPanels
              panel0Ref={panel0Ref} panel1Ref={panel1Ref}
              viewportWidth={viewportWidth} onRefresh={handleRefresh}
              featured={{ hasMore: featuredFeed.hasMore, loadingMore: featuredFeed.loadingMore, onLoadMore: featuredFeed.loadMore, error: featuredFeed.error, onRetry: featuredFeed.retry }}
              hot={{ hasMore: hotFeed.hasMore, loadingMore: hotFeed.loadingMore, onLoadMore: hotFeed.loadMore, error: hotFeed.error, onRetry: hotFeed.retry }}
              realtimeNews={realtimeNews} hotNews={hotFeed.items}
              onCardClick={openReader} readUrls={readUrls}
              bookmarkedUrls={bookmarkedUrls} onToggleBookmark={toggleBookmark}
            />
          </div>
        )}

        {/* 搜索层独立覆盖，不影响下方新闻流的状态和滚动位置 */}
        {searchOpen && (
          <div className="absolute inset-0 overflow-y-auto bg-background pt-2">
            {query ? (
              results.length === 0 ? (
                <p className="px-4 py-12 text-center text-muted-foreground text-sm">未找到相关新闻</p>
              ) : (
                <NewsList columns={2} news={results} onCardClick={openReader} readUrls={readUrls}
                  bookmarkedUrls={bookmarkedUrls} onToggleBookmark={toggleBookmark} />
              )
            ) : null}
          </div>
        )}
      </div>

      {/* 回到顶部 */}
      {!searchOpen && <BackToTop scrollContainerRef={activePanelRef} />}

      {/* 阅读模式 — fixed 覆盖层 */}
      {reading && (
        <div ref={readerScrollRef} className="fixed inset-0 z-20 bg-background flex justify-center overflow-y-auto">
          <div className="w-full max-w-md">
            <ReaderView
              url={mainUrl}
              sourceUrl={sourceUrl}
              sourceName={reading.source}
              onBack={() => window.history.back()}
              scrollContainerRef={readerScrollRef}
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
