import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface LoadMoreSentinelProps {
  loading: boolean
  onLoadMore: () => void
  /** 滚动容器的 ref，作为 IntersectionObserver 的 root。不传则用 viewport */
  rootRef?: React.RefObject<HTMLElement | null>
}

export function LoadMoreSentinel({ loading, onLoadMore, rootRef }: LoadMoreSentinelProps) {
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
      },
      // 指定 root 为面板滚动容器，确保只有可见面板的哨兵才触发
      { root: rootRef?.current ?? null }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [loading, onLoadMore, rootRef])

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
