import { describe, it, expect } from 'vitest'
import { filterFootballNews, type RawNewsItem } from './newsFilter'

describe('filterFootballNews', () => {
  it('只保留足球相关的（zuqiu type 或 lable 含足球/英超等），扔掉篮球', () => {
    const raw: RawNewsItem[] = [
      {
        title: '德国点球出局',
        shortTitle: '德国点球出局',
        type: 'zuqiu',
        createtime: '2026-06-30 07:28:42',
        lable: '足球,世界杯,德国',
      },
      {
        title: '莫兰特交易到开拓者',
        shortTitle: '莫兰特交易',
        type: 'lanqiu',
        createtime: '2026-06-30 04:33:07',
        lable: '篮球,NBA,开拓者',
      },
      {
        title: '摩洛哥淘汰荷兰',
        shortTitle: '摩洛哥淘汰荷兰',
        type: 'zuqiu',
        createtime: '2026-06-30 11:53:49',
        lable: '足球,世界杯,荷兰,摩洛哥',
      },
    ]

    const result = filterFootballNews(raw)

    expect(result).toHaveLength(2)
    expect(result.map((n) => n.title)).not.toContain('莫兰特交易')
    expect(result.map((n) => n.title)).toContain('德国点球出局')
    expect(result.map((n) => n.title)).toContain('摩洛哥淘汰荷兰')
  })

  it('按发布时间倒序排列', () => {
    const raw: RawNewsItem[] = [
      { title: '早上的', shortTitle: '早上的', type: 'zuqiu', createtime: '2026-06-30 07:28:42', lable: '足球' },
      { title: '下午的', shortTitle: '下午的', type: 'zuqiu', createtime: '2026-06-30 15:00:00', lable: '足球' },
      { title: '中午的', shortTitle: '中午的', type: 'zuqiu', createtime: '2026-06-30 12:00:00', lable: '足球' },
    ]

    const result = filterFootballNews(raw)
    expect(result[0].title).toBe('下午的')
    expect(result[1].title).toBe('中午的')
    expect(result[2].title).toBe('早上的')
  })

  it('空数组返回空数组', () => {
    expect(filterFootballNews([])).toEqual([])
  })

  it('全是篮球时返回空', () => {
    const raw: RawNewsItem[] = [
      { title: 'NBA', shortTitle: 'NBA', type: 'lanqiu', createtime: '2026-06-30 10:00:00', lable: '篮球' },
    ]
    expect(filterFootballNews(raw)).toEqual([])
  })

  it('字段标准化：缺失字段用默认值', () => {
    const raw: RawNewsItem[] = [
      {
        title: '完整新闻',
        shortTitle: '完整',
        type: 'zuqiu',
        createtime: '2026-06-30 14:00:00',
        thumbnail: 'https://example.com/thumb.jpg',
        from_name: '新浪体育',
        from_url: 'https://sports.sina.com/article/123',
        lable: '足球,中超',
      },
      {
        title: '缺字段的',
        shortTitle: '缺字段',
        type: 'zuqiu',
        createtime: '2026-06-30 10:00:00',
      },
    ]

    const result = filterFootballNews(raw)

    expect(result[0].title).toBe('完整')
    expect(result[0].source).toBe('新浪体育')
    expect(result[0].thumb).toBe('https://example.com/thumb.jpg')
    expect(result[0].url).toBe('https://sports.sina.com/article/123')
    expect(result[0].tags).toEqual(['足球', '中超'])

    expect(result[1].title).toBe('缺字段')
    expect(result[1].source).toBe('直播吧')
    expect(result[1].thumb).toBeNull()
  })
})
