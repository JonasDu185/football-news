import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createStorage, type NewsStore } from './storage'
import type { NewsItem } from '../lib/newsFilter'

// 生成动态时间字符串（北京时间格式），offsetHours 为距现在的小时偏移
function timeStr(offsetHours: number): string {
  const d = new Date(Date.now() + offsetHours * 3600 * 1000)
  return d.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace('T', ' ')
}

function makeSample(): NewsItem[] {
  return [
    {
      title: '德国点球出局',
      time: timeStr(-2),
      source: '直播吧',
      thumb: null,
      url: 'https://news.zhibo8.com/1',
      fallbackUrl: null,
      count: 6000099,
      tags: ['足球', '世界杯', '德国'],
    },
    {
      title: '巴西绝杀日本',
      time: timeStr(-6),
      source: '直播吧',
      thumb: 'https://example.com/brazil.jpg',
      url: 'https://news.zhibo8.com/2',
      fallbackUrl: null,
      count: 6000050,
      tags: ['足球', '世界杯', '巴西'],
    },
    {
      title: '摩洛哥淘汰荷兰',
      time: timeStr(-10),
      source: '直播吧',
      thumb: null,
      url: 'https://news.zhibo8.com/3',
      fallbackUrl: null,
      count: 5999999,
      tags: ['足球', '世界杯', '摩洛哥'],
    },
  ]
}

const TEST_DB_PATH = ':memory:'

describe('storage', () => {
  let store: NewsStore

  beforeEach(() => {
    store = createStorage(TEST_DB_PATH)
  })

  afterEach(() => {
    store.close()
  })

  it('保存新闻后能查出来', () => {
    store.saveNews(makeSample())
    const all = store.getRecentNews(72)
    expect(all).toHaveLength(3)
  })

  it('重复 URL 不重复插入', () => {
    const sample = makeSample()
    store.saveNews(sample)
    store.saveNews([sample[0]])

    const all = store.getRecentNews(72)
    expect(all).toHaveLength(3)
  })

  it('只返回指定小时内的新闻', () => {
    store.saveNews(makeSample())
    // 查最近 5 小时 —— 只应该有德国(2h前)和巴西(6h前)... 不对，巴西6h前 > 5h
    // 所以只有德国
    const recent = store.getRecentNews(5)
    expect(recent).toHaveLength(1)
  })

  it('按时间倒序', () => {
    store.saveNews(makeSample())
    const recent = store.getRecentNews(72)
    expect(recent[0].title).toBe('德国点球出局')
    expect(recent[1].title).toBe('巴西绝杀日本')
    expect(recent[2].title).toBe('摩洛哥淘汰荷兰')
  })

  it('可以限制数量', () => {
    store.saveNews(makeSample())
    const limited = store.getRecentNews(72, 2)
    expect(limited).toHaveLength(2)
  })

  it('同 URL 视为更新', () => {
    store.saveNews(makeSample())
    const updated: NewsItem = {
      title: '德国点球出局',
      time: timeStr(-2),
      source: '直播吧',
      thumb: 'https://example.com/new-thumb.jpg',
      url: 'https://news.zhibo8.com/1',
      fallbackUrl: null,
      count: 6000099,
      tags: ['足球', '世界杯', '德国'],
    }
    store.saveNews([updated])

    const all = store.getRecentNews(72)
    expect(all).toHaveLength(3)
    const germany = all.find((n) => n.title === '德国点球出局')
    expect(germany?.thumb).toBe('https://example.com/new-thumb.jpg')
  })

  it('没有新闻时返回空', () => {
    expect(store.getRecentNews(24)).toEqual([])
  })
})
