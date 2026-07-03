import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DateHeader } from './DateHeader'

describe('DateHeader', () => {
  it('显示日期和星期', () => {
    render(<DateHeader date={new Date('2026-06-30')} />)

    // 年份
    expect(screen.getByText('2026')).toBeInTheDocument()
    // 月日
    expect(screen.getByText('6.30')).toBeInTheDocument()
    // 星期
    expect(screen.getByText('周二')).toBeInTheDocument()
  })

  it('包含红色圆点装饰', () => {
    const { container } = render(<DateHeader date={new Date('2026-06-30')} />)

    // 哨红圆点
    const dot = container.querySelector('.bg-primary')
    expect(dot).toBeInTheDocument()
  })
})
