import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface LoadMoreSentinelProps {
  loading: boolean
  onLoadMore: () => void
}

export function LoadMoreSentinel({ loading, onLoadMore }: LoadMoreSentinelProps) {
  const ref = useRef<HTMLDivElement>(null)

  // 自动检测：底部哨兵进入视野时触发加载
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          onLoadMore()
        }
      }
      // 不留 rootMargin：只有真正滚到底部哨兵进入视野时才触发
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [loading, onLoadMore])

  return (
    <div ref={ref} className="px-4 pt-2 pb-8">
      <Button
        variant="ghost"
        className="w-full text-muted-foreground"
        onClick={onLoadMore}
        disabled={loading}
      >
        {loading ? '加载中...' : '加载更多'}
      </Button>
    </div>
  )
}
