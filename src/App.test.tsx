import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import App from './App'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockNewsItems(count: number, overrides: Array<Partial<{ tags: string[] }>> = []) {
  return Array.from({ length: count }, (_, i) => ({
    title: `新闻标题 ${i + 1}`,
    time: `2026-07-05 ${String(10 + i).padStart(2, '0')}:00:00`,
    source: '直播吧',
    thumb: null,
    url: `https://example.com/${i}`,
    fallbackUrl: null,
    count: 100 - i,
    tags: overrides[i]?.tags ?? ['足球'],
  }))
}

beforeEach(() => {
  mockFetch.mockReset()
  localStorage.clear()
  // 默认：featured 返回 8 条（含 1 条世界杯），hot 返回 3 条
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/api/news/featured')) {
      const items = mockNewsItems(8)
      items[0].tags = ['世界杯', '足球']
      return Promise.resolve({ ok: true, json: async () => items })
    }
    if (url.includes('/api/news/hot')) {
      return Promise.resolve({ ok: true, json: async () => mockNewsItems(3) })
    }
    return Promise.resolve({ ok: true, json: async () => [] })
  })
})

describe('App', () => {
  it('只渲染实时和热点两个 Tab', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '实时' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '热点' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '世界杯' })).not.toBeInTheDocument()
    })
  })

  it('点击 Tab 切换面板', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '实时' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: '热点' }))

    expect(screen.getByRole('button', { name: '热点' })).toHaveAttribute('aria-current', 'page')
  })

  it('显示新闻卡片', async () => {
    render(<App />)

    await waitFor(() => {
      const titles = screen.getAllByText('新闻标题 1')
      expect(titles.length).toBeGreaterThan(0)
    })
  })

  it('搜索栏可以打开和关闭', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getAllByText('新闻标题 1').length).toBeGreaterThan(0)
    })

    const newsCarousel = screen.getByTestId('news-carousel')
    expect(newsCarousel).toHaveAttribute('aria-hidden', 'false')

    // 点击搜索图标
    const searchBtn = screen.getByLabelText('搜索')
    fireEvent.click(searchBtn)

    // 搜索栏出现，原新闻流只隐藏、不重新挂载
    const input = screen.getByPlaceholderText('搜索标题、球队、联赛…')
    expect(input).toBeInTheDocument()
    expect(screen.getByTestId('news-carousel')).toBe(newsCarousel)
    expect(newsCarousel).toHaveAttribute('aria-hidden', 'true')

    // 点击取消
    fireEvent.click(screen.getByText('取消'))

    // 搜索栏消失，原新闻流和滚动状态仍然保留
    expect(screen.queryByPlaceholderText('搜索标题、球队、联赛…')).not.toBeInTheDocument()
    expect(screen.getByTestId('news-carousel')).toBe(newsCarousel)
    expect(newsCarousel).toHaveAttribute('aria-hidden', 'false')
  })

  it('卡片上有收藏按钮', async () => {
    render(<App />)

    await waitFor(() => {
      const titles = screen.getAllByText('新闻标题 1')
      expect(titles.length).toBeGreaterThan(0)
    })

    // 收藏按钮存在
    const bookmarkBtns = screen.getAllByLabelText('收藏')
    expect(bookmarkBtns.length).toBeGreaterThan(0)
  })

  it('通过抽屉菜单可打开收藏列表', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '实时' })).toBeInTheDocument()
    })

    // 打开抽屉
    fireEvent.click(screen.getByLabelText('菜单'))
    // 点击"稍后阅读"
    fireEvent.click(screen.getByText('稍后阅读'))

    await waitFor(() => {
      expect(screen.getByText('还没有收藏任何文章')).toBeInTheDocument()
    })
  })
})
