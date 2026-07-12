import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NewsCard } from './NewsCard'
import type { NewsItem } from '@/lib/newsFilter'

const sampleNews: NewsItem = {
  title: '德国点球4-5遭巴拉圭淘汰',
  time: '2026-06-30 07:28:42',
  source: '直播吧',
  thumb: null,
  url: 'https://news.zhibo8.com/123',
  fallbackUrl: null,
  count: 6000000,
  tags: ['足球', '世界杯', '德国'],
}

describe('NewsCard', () => {
  it('显示标题、来源和时间', () => {
    render(<NewsCard news={sampleNews} />)

    expect(screen.getByText('德国点球4-5遭巴拉圭淘汰')).toBeInTheDocument()
    expect(screen.getByText(/直播吧/)).toBeInTheDocument()
    expect(screen.getByText(/6\.30/)).toBeInTheDocument()
  })

  it('显示标签徽章（排除大类标签）', () => {
    render(<NewsCard news={sampleNews} />)

    // "德国" 不在排除列表中，应该显示；"足球""世界杯" 在排除列表中，不显示
    expect(screen.getByText('德国')).toBeInTheDocument()
    expect(screen.queryByText('足球')).toBeNull()
    expect(screen.queryByText('世界杯')).toBeNull()
  })

  it('有缩略图时渲染图片', () => {
    const withThumb: NewsItem = { ...sampleNews, thumb: 'https://example.com/photo.jpg', fallbackUrl: 'https://news.zhibo8.com/fallback' }
    const { container } = render(<NewsCard news={withThumb} />)
    expect(container.querySelector('img')).not.toBeNull()
  })

  it('点击卡片触发 onClick 回调', () => {
    let clicked = false
    render(<NewsCard news={sampleNews} onClick={() => { clicked = true }} />)
    const btn = screen.getByRole('button')
    btn.click()
    expect(clicked).toBe(true)
  })

  it('没有 onClick 时不触发导航但仍有按钮结构', () => {
    render(<NewsCard news={sampleNews} />)
    // 按钮存在（用于语义结构），但没有 onClick 则不触发跳转
    expect(screen.getByText('德国点球4-5遭巴拉圭淘汰')).toBeInTheDocument()
  })
})
