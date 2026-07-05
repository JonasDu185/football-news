import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNewsFeed } from './useNewsFeed'

// Mock fetch 全局
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockResponse(data: unknown[], ok = true) {
  return {
    ok,
    json: async () => data,
  }
}

function makeItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    title: `新闻 ${i + 1}`,
    time: `2026-07-05 ${String(10 + i).padStart(2, '0')}:00:00`,
    source: '直播吧',
    thumb: null,
    url: `https://example.com/${i}`,
    fallbackUrl: null,
    count: 100 - i,
    tags: ['足球'],
  }))
}

beforeEach(() => {
  mockFetch.mockReset()
  localStorage.clear()
})

describe('useNewsFeed', () => {
  it('初始加载时 loading 为 true，加载完成后返回数据', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(makeItems(8)))

    const { result } = renderHook(() => useNewsFeed('/api/news/featured', 8))

    expect(result.current.loading).toBe(true)
    expect(result.current.items).toEqual([])

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.items).toHaveLength(8)
    expect(result.current.hasMore).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('返回少于 pageSize 条时 hasMore 为 false', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(makeItems(5)))

    const { result } = renderHook(() => useNewsFeed('/api/news/hot', 8))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.hasMore).toBe(false)
  })

  it('loadMore 追加数据', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(makeItems(8)))
      .mockResolvedValueOnce(mockResponse(makeItems(4)))

    const { result } = renderHook(() => useNewsFeed('/api/news/featured', 8))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.items).toHaveLength(8)

    act(() => result.current.loadMore())

    await waitFor(() => {
      expect(result.current.items).toHaveLength(12)
    })

    expect(result.current.hasMore).toBe(false) // 第二批只返回4条
  })

  it('两个独立 feed 各自维护分页', async () => {
    mockFetch
      // featured 第一批
      .mockResolvedValueOnce(mockResponse(makeItems(8)))
      // hot 第一批
      .mockResolvedValueOnce(mockResponse(makeItems(3)))

    const featured = renderHook(() => useNewsFeed('/api/news/featured', 8))
    const hot = renderHook(() => useNewsFeed('/api/news/hot', 8))

    await waitFor(() => {
      expect(featured.result.current.loading).toBe(false)
      expect(hot.result.current.loading).toBe(false)
    })

    expect(featured.result.current.items).toHaveLength(8)
    expect(hot.result.current.items).toHaveLength(3)
    expect(featured.result.current.hasMore).toBe(true)
    expect(hot.result.current.hasMore).toBe(false)
  })

  it('网络错误时返回 network 类型错误', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const { result } = renderHook(() => useNewsFeed('/api/news/featured', 8))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error?.type).toBe('network')
    expect(result.current.error?.message).toContain('网络')
  })

  it('空数据时返回 empty 类型错误', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([]))

    const { result } = renderHook(() => useNewsFeed('/api/news/featured', 8))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error?.type).toBe('empty')
  })

  it('retry 重新加载数据', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(mockResponse(makeItems(8)))

    const { result } = renderHook(() => useNewsFeed('/api/news/featured', 8))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).not.toBeNull()

    act(() => result.current.retry())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.items).toHaveLength(8)
  })
})
