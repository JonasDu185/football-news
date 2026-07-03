import { DateHeader } from './components/DateHeader'
import { NewsList } from './components/NewsList'
import { ReaderView } from './components/ReaderView'
import { LoadMoreSentinel } from './components/LoadMoreSentinel'
import { PullToRefresh } from './components/PullToRefresh'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs'
import { Skeleton } from './components/ui/skeleton'
import { Button } from './components/ui/button'
import { useNews } from './hooks/useNews'
import { useState, useEffect, useCallback } from 'react'
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

function App() {
  const today = useToday()
  const { featured, hot, loading, error, hasMore, loadingMore, loadMore, retry } = useNews()
  const [reading, setReading] = useState<NewsItem | null>(null)

  const handleRefresh = useCallback(async () => {
    await fetch('/api/news/refresh', { method: 'POST' })
    retry()
  }, [retry])

  // 打开阅读模式：推一条浏览器历史，让返回键能回退
  const openReader = useCallback((item: NewsItem) => {
    window.history.pushState({ reader: true }, '')
    setReading(item)
  }, [])

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
    <div className="min-h-screen bg-background max-w-md mx-auto relative overflow-x-hidden">
      {/* 列表页——始终渲染，阅读模式下隐藏但保留 DOM 和滚动位置 */}
      <div className={reading ? 'hidden' : ''}>
        <DateHeader date={today} />

      <PullToRefresh onRefresh={handleRefresh}>
        <Tabs defaultValue="featured" className="mt-4">
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

        <TabsContent value="featured" className="mt-4">
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
              <NewsList news={featured} onCardClick={openReader} />
              {hasMore && <LoadMoreSentinel loading={loadingMore} onLoadMore={loadMore} />}
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
              <NewsList news={hot} onCardClick={openReader} showFeatured />
              {hasMore && <LoadMoreSentinel loading={loadingMore} onLoadMore={loadMore} />}
            </>
          )}
        </TabsContent>
      </Tabs>
      </PullToRefresh>
      </div>

      {/* 阅读模式——覆盖在列表页上方 */}
      {reading && (
        <div className="absolute inset-0 bg-background z-20">
          <ReaderView
            url={mainUrl}
            sourceUrl={sourceUrl}
            sourceName={reading.source}
            onBack={() => window.history.back()}
          />
        </div>
      )}
    </div>
  )
}

export default App
