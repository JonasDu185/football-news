import { DateHeader } from './components/DateHeader'
import { NewsList } from './components/NewsList'
import { ReaderView } from './components/ReaderView'
import { LoadMoreSentinel } from './components/LoadMoreSentinel'
import { PullToRefresh } from './components/PullToRefresh'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs'
import { Skeleton } from './components/ui/skeleton'
import { Button } from './components/ui/button'
import { useNews } from './hooks/useNews'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { NewsItem } from './lib/newsFilter'

function useToday() {
  const [today, setToday] = useState(() => new Date())
  useEffect(() => {
    // 午夜自动刷新日期
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
    <div className="flex flex-col gap-3 px-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-lg p-4 space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      ))}
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

function App() {
  const today = useToday()
  const { featured, hot, loading, error, hasMore, loadingMore, loadMore, retry } = useNews()
  const [reading, setReading] = useState<NewsItem | null>(null)
  const [worldcupFilter, setWorldcupFilter] = useState(true)
  const [activeTab, setActiveTab] = useState('featured')  // 控制 Tabs 组件，配合横向滑动切换
  const { readUrls, markRead } = useReadHistory()

  // 横向滑动切换标签：世界杯 → 其他赛事 → 近期热点 → 循环（带跟手动画）
  const [swipeOffset, setSwipeOffset] = useState(0)    // 水平偏移量（px）
  const [swipeTransition, setSwipeTransition] = useState(false)  // 松手后是否开过渡动画
  const suppressAnimRef = useRef(false)  // 横滑切换时抑制卡片进场动画（ref 避免触发重渲染）
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwipingRef = useRef(false)  // 是否已进入横滑模式

  // 标签切换逻辑（左滑 = 下一个，右滑 = 上一个）
  const goNext = useCallback(() => {
    if (activeTab === 'featured' && worldcupFilter) setWorldcupFilter(false)
    else if (activeTab === 'featured' && !worldcupFilter) setActiveTab('hot')
    else { setActiveTab('featured'); setWorldcupFilter(true) }
  }, [activeTab, worldcupFilter])

  const goPrev = useCallback(() => {
    if (activeTab === 'featured' && worldcupFilter) setActiveTab('hot')
    else if (activeTab === 'featured' && !worldcupFilter) setWorldcupFilter(true)
    else { setActiveTab('featured'); setWorldcupFilter(false) }
  }, [activeTab, worldcupFilter])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (reading) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwipingRef.current = false
    setSwipeOffset(0)
    setSwipeTransition(false)
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

    // 边界阻力：世界杯左边界、近期热点右边界 → 0.3 倍阻力
    let offset = dx
    const atLeftEdge = activeTab === 'featured' && worldcupFilter
    const atRightEdge = activeTab === 'hot'
    if ((offset > 0 && atLeftEdge) || (offset < 0 && atRightEdge)) {
      offset = offset * 0.3
    }

    setSwipeTransition(false)  // 跟手阶段：无过渡
    setSwipeOffset(offset)
  }, [reading, activeTab, worldcupFilter])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isSwipingRef.current) return
    isSwipingRef.current = false

    const endX = e.changedTouches[0].clientX
    const dx = endX - touchStartX.current

    setSwipeTransition(true)  // 松手阶段：开过渡动画

    if (Math.abs(dx) > 60) {
      // 滑动距离足够 → 切换标签 + 抑制进场动画
      suppressAnimRef.current = true
      if (dx < 0) goNext()
      else goPrev()
      // 微任务在本次渲染提交后立即复位，不触发额外重渲染
      queueMicrotask(() => { suppressAnimRef.current = false })
    }
    // 偏移归零（弹性回归 / 切换后归位）
    setSwipeOffset(0)
  }, [goNext, goPrev])

  // 每日精选按世界杯/其他拆分
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

  // 打开阅读模式：推一条浏览器历史，让返回键能回退
  const openReader = useCallback((item: NewsItem) => {
    markRead(item.url)
    window.history.pushState({ reader: true }, '')
    setReading(item)
  }, [markRead])

  // 阅读模式时锁定 body 滚动，防止列表在背后滚动（列表始终保持 DOM 和滚动位置不变）
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

  // 阅读模式
  const mainUrl = reading ? (reading.fallbackUrl || reading.url || '') : ''
  const sourceUrl = reading && reading.fallbackUrl && reading.url ? reading.url : null

  return (
    <div
      className="min-h-screen bg-background max-w-md mx-auto relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 列表页——始终保留在文档流中，阅读模式下不隐藏（fixed 覆盖层盖住它） */}
      <div>
        <DateHeader date={today} />

      <PullToRefresh onRefresh={handleRefresh}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <div className="sticky top-[120px] z-10 bg-background/95 backdrop-blur px-4 py-2">
            <TabsList className="w-full h-10">
            <TabsTrigger value="featured" className="flex-1 text-sm relative data-active:text-foreground data-active:after:absolute data-active:after:bottom-0 data-active:after:left-1/4 data-active:after:w-1/2 data-active:after:h-0.5 data-active:after:bg-primary data-active:after:rounded-full">
              每日精选
            </TabsTrigger>
            <TabsTrigger value="hot" className="flex-1 text-sm relative data-active:text-foreground data-active:after:absolute data-active:after:bottom-0 data-active:after:left-1/4 data-active:after:w-1/2 data-active:after:h-0.5 data-active:after:bg-primary data-active:after:rounded-full">
              近期热点
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="featured" className="mt-2">
          {loading ? (
            <NewsSkeleton />
          ) : error ? (
            <div className="px-4 py-12 text-center space-y-3">
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={retry}>
                重新加载
              </Button>
            </div>
          ) : (
            <>
              {/* 世界杯 / 其他赛事 子标签 — 下划线式 */}
              <div className="flex justify-center gap-6 px-4 mb-3">
                <button
                  type="button"
                  onClick={() => setWorldcupFilter(true)}
                  className={`text-sm pb-1.5 transition-colors border-b-2 ${
                    worldcupFilter
                      ? 'text-foreground border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  世界杯
                </button>
                <button
                  type="button"
                  onClick={() => setWorldcupFilter(false)}
                  className={`text-sm pb-1.5 transition-colors border-b-2 ${
                    !worldcupFilter
                      ? 'text-foreground border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  其他赛事
                </button>
              </div>
              <div
                style={{
                  transform: `translateX(${swipeOffset}px)`,
                  transition: swipeTransition ? 'transform 0.3s ease-out' : 'none',
                }}
              >
                <NewsList news={worldcupFilter ? worldcupNews : otherNews} onCardClick={openReader} readUrls={readUrls} suppressAnim={suppressAnimRef.current} />
                {hasMore && <LoadMoreSentinel loading={loadingMore} onLoadMore={loadMore} />}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="hot" className="mt-4">
          {loading ? (
            <NewsSkeleton />
          ) : error ? (
            <div className="px-4 py-12 text-center space-y-3">
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={retry}>
                重新加载
              </Button>
            </div>
          ) : (
            <>
              <div
                style={{
                  transform: `translateX(${swipeOffset}px)`,
                  transition: swipeTransition ? 'transform 0.3s ease-out' : 'none',
                }}
              >
                <NewsList news={hot} onCardClick={openReader} showFeatured suppressAnim={suppressAnimRef.current} />
                {hasMore && <LoadMoreSentinel loading={loadingMore} onLoadMore={loadMore} />}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
      </PullToRefresh>
      </div>

      {/* 阅读模式——fixed 覆盖整个视口，不依赖父级定位，列表滚动位置自然保留 */}
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
