import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NewsList } from './NewsList'
import type { NewsItem } from '@/lib/newsFilter'

const sampleNews: NewsItem[] = [
  {
    title: '德国点球出局',
    time: '2026-06-30 07:28:42',
    source: '直播吧',
    thumb: null,
    url: 'https://example.com/1',
    fallbackUrl: null,
    count: 0,
    tags: ['足球', '世界杯'],
  },
  {
    title: '巴西绝杀日本',
    time: '2026-06-30 03:02:46',
    source: '直播吧',
    thumb: 'https://example.com/thumb.jpg',
    url: 'https://example.com/2',
    fallbackUrl: null,
    count: 0,
    tags: ['足球', '世界杯'],
  },
]

describe('NewsList', () => {
  it('有新闻时，渲染对应数量的卡片', () => {
    render(<NewsList news={sampleNews} />)

    expect(screen.getByText('德国点球出局')).toBeInTheDocument()
    expect(screen.getByText('巴西绝杀日本')).toBeInTheDocument()
  })

  it('新闻为空时，显示"暂无新闻"', () => {
    render(<NewsList news={[]} />)

    expect(screen.getByText(/暂无新闻/)).toBeInTheDocument()
  })
})
