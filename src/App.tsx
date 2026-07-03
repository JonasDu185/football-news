import { DateHeader } from './components/DateHeader'
import { NewsList } from './components/NewsList'
import { ReaderView } from './components/ReaderView'
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

  // 阅读模式：优先用直播吧自己的文章，外媒原文作为底部参考链接
  if (reading) {
    const mainUrl = reading.fallbackUrl || reading.url || ''
    const sourceUrl = reading.fallbackUrl && reading.url ? reading.url : null
    return (
      <ReaderView
        url={mainUrl}
        sourceUrl={sourceUrl}
        sourceName={reading.source}
        onBack={() => setReading(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto border-x border-border">
      <DateHeader date={today} />

      <PullToRefresh onRefresh={handleRefresh}>
        <Tabs defaultValue="featured" className="mt-4">
          <div className="sticky top-[72px] z-10 bg-background/95 backdrop-blur px-4 py-2">
            <TabsList className="w-full h-10">
            <TabsTrigger value="featured" className="flex-1 text-sm">
              每日精选
            </TabsTrigger>
            <TabsTrigger value="hot" className="flex-1 text-sm">
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
              <NewsList news={featured} onCardClick={setReading} />
              {hasMore && (
                <div className="px-4 pt-2 pb-8">
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? '加载中...' : '加载更多'}
                  </Button>
                </div>
              )}
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
              <NewsList news={hot} onCardClick={setReading} />
              {hasMore && (
                <div className="px-4 pt-2 pb-8">
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? '加载中...' : '加载更多'}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
      </PullToRefresh>
    </div>
  )
}

export default App
