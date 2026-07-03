import { useState, useEffect, useCallback, useRef } from 'react'
import type { NewsItem } from '@/lib/newsFilter'

const PAGE_SIZE = 8

interface NewsState {
  featured: NewsItem[]
  hot: NewsItem[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadingMore: boolean
  loadMore: () => void
  retry: () => void
}

export function useNews(): NewsState {
  const [state, setState] = useState<Omit<NewsState, 'loadMore' | 'retry'>>({
    featured: [],
    hot: [],
    loading: true,
    error: null,
    hasMore: true,
    loadingMore: false,
  })
  const offsetRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const doFetch = useCallback(async (offset: number, append: boolean) => {
    // cancel previous in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const [featuredRes, hotRes] = await Promise.all([
        fetch(`/api/news/featured?limit=${PAGE_SIZE}&offset=${offset}`, { signal: controller.signal }),
        fetch(`/api/news/hot?limit=${PAGE_SIZE}&offset=${offset}`, { signal: controller.signal }),
      ])

      if (!featuredRes.ok || !hotRes.ok) throw new Error('数据加载失败')

      const featured: NewsItem[] = await featuredRes.json()
      const hot: NewsItem[] = await hotRes.json()

      setState((prev) => ({
        featured: append ? [...prev.featured, ...featured] : featured,
        hot: append ? [...prev.hot, ...hot] : hot,
        loading: false,
        loadingMore: false,
        error: null,
        hasMore: featured.length === PAGE_SIZE || hot.length === PAGE_SIZE,
      }))
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return

      setState((prev) => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: err instanceof Error ? err.message : '未知错误',
      }))
    }
  }, [])

  // 初始加载
  useEffect(() => {
    offsetRef.current = 0
    doFetch(0, false)
    return () => abortRef.current?.abort()
  }, [doFetch])

  const loadMore = useCallback(() => {
    if (state.loadingMore || !state.hasMore) return
    setState((prev) => ({ ...prev, loadingMore: true }))
    offsetRef.current += PAGE_SIZE
    doFetch(offsetRef.current, true)
  }, [doFetch, state.loadingMore, state.hasMore])

  const retry = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    offsetRef.current = 0
    doFetch(0, false)
  }, [doFetch])

  return { ...state, loadMore, retry }
}
