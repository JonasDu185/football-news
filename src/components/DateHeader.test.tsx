import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DateHeader } from './DateHeader'

describe('DateHeader', () => {
  it('显示票根格式的日期和星期', () => {
    render(<DateHeader date={new Date('2026-06-30')} />)

    // 年份
    expect(screen.getByText('2026')).toBeInTheDocument()
    // 月日大号
    expect(screen.getByText('6.30')).toBeInTheDocument()
    // 星期
    expect(screen.getByText('周二')).toBeInTheDocument()
  })

  it('包含票根特征：圆角卡片 + 哨红标记条', () => {
    const { container } = render(<DateHeader date={new Date('2026-06-30')} />)

    // 票根圆角
    expect(container.querySelector('.rounded-t-2xl')).toBeInTheDocument()
    // 哨红左侧标记条
    const accent = container.querySelector('.bg-primary')
    expect(accent).toBeInTheDocument()
  })
})
