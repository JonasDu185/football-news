import { useState, useEffect, useCallback, useRef } from 'react'
import type { NewsItem } from '@/lib/newsFilter'

const PAGE_SIZE = 8

/** 结构化错误类型，便于UI区分展示 */
export type NewsError =
  | { type: 'network'; message: string }
  | { type: 'server'; message: string }
  | { type: 'empty'; message: string }
  | { type: 'unknown'; message: string }

export interface NewsFeedState {
  items: NewsItem[]
  loading: boolean
  error: NewsError | null
  hasMore: boolean
  loadingMore: boolean
  loadMore: () => void
  retry: () => void
}

function classifyError(err: unknown, isEmpty: boolean): NewsError {
  // 网络/超时错误优先于空数据判断
  if (err instanceof TypeError) {
    return { type: 'network', message: '网络连接失败，请检查网络' }
  }
  if (err instanceof DOMException && err.name === 'AbortError') {
    return { type: 'network', message: '请求超时，请检查网络' }
  }
  if (isEmpty) {
    return { type: 'empty', message: '暂无新闻' }
  }
  return { type: 'unknown', message: err instanceof Error ? err.message : '未知错误' }
}

/**
 * 新闻列表数据 hook——每个端点独立分页
 *
 * @param endpoint API 路径，如 '/api/news/featured'
 * @param pageSize 每页条数，默认 8
 */
export function useNewsFeed(endpoint: string, pageSize = PAGE_SIZE): NewsFeedState {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<NewsError | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const offsetRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  // 用 ref 追踪 items 最新值，避免在 doFetch 依赖中加入 items.length
  const itemsRef = useRef(items)
  itemsRef.current = items

  const doFetch = useCallback(
    async (offset: number, append: boolean) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch(`${endpoint}?limit=${pageSize}&offset=${offset}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          throw new Error(`服务器返回 ${res.status}`)
        }

        const data: NewsItem[] = await res.json()

        if (!append && data.length === 0) {
          setError({ type: 'empty', message: '暂无新闻' })
        } else {
          setError(null)
        }

        setItems((prev) => (append ? [...prev, ...data] : data))
        setHasMore(data.length === pageSize)
        setLoading(false)
        setLoadingMore(false)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return

        setError(classifyError(err, !append && itemsRef.current.length === 0))
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [endpoint, pageSize],
  )

  // 初始加载
  useEffect(() => {
    offsetRef.current = 0
    setLoading(true)
    setError(null)
    doFetch(0, false)
    return () => abortRef.current?.abort()
  }, [doFetch])

  // 加载更多
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    offsetRef.current += pageSize
    doFetch(offsetRef.current, true)
  }, [doFetch, loadingMore, hasMore, pageSize])

  // 重试
  const retry = useCallback(() => {
    setLoading(true)
    setError(null)
    offsetRef.current = 0
    doFetch(0, false)
  }, [doFetch])

  return { items, loading, error, hasMore, loadingMore, loadMore, retry }
}
