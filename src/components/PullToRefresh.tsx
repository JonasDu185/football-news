import { useState, useRef, useCallback, type ReactNode, type TouchEvent } from 'react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startX = useRef(0)
  const startY = useRef(0)
  const pullingRef = useRef(false)

  const THRESHOLD = 60

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // 只在页面滚动到顶部时才触发下拉
    if (window.scrollY > 5) return
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    pullingRef.current = true
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pullingRef.current) return
      const dx = e.touches[0].clientX - startX.current
      const dy = e.touches[0].clientY - startY.current
      // 仅当竖向位移 > 10px 且明显大于水平位移时才触发下拉（防止横滑误触发）
      if (dy > 10 && dy > Math.abs(dx)) {
        setPulling(true)
        setPullDistance(Math.min(dy * 0.5, 80))
      }
    },
    []
  )

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return
    pullingRef.current = false

    if (pullDistance > THRESHOLD) {
      setRefreshing(true)
      setPullDistance(0)
      setPulling(false)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    } else {
      setPullDistance(0)
      setPulling(false)
    }
  }, [pullDistance, onRefresh])

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: pulling ? `translateY(${pullDistance}px)` : 'none',
        transition: pulling ? 'none' : 'transform 0.3s ease',
      }}
    >
      {/* 下拉指示器 */}
      {(pulling || refreshing) && (
        <div className="flex items-center justify-center h-12 -mt-12">
          <span className="text-xs text-muted-foreground">
            {refreshing
              ? '刷新中...'
              : pullDistance > 60
                ? '松开刷新'
                : '继续下拉刷新'}
          </span>
        </div>
      )}
      {children}
    </div>
  )
}
