import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchFootballNews } from './fetcher'

const mockZhibo8Response = {
  news: [
    {
      title: '德国点球出局——完整标题',
      shortTitle: '德国点球出局',
      type: 'zuqiu',
      createtime: '2026-06-30 07:28:42',
      thumbnail: 'https://example.com/germany.jpg',
      from_name: '直播吧',
      lable: '足球,世界杯,德国',
    },
    {
      title: '莫兰特交易',
      shortTitle: '莫兰特交易',
      type: 'lanqiu',
      createtime: '2026-06-30 10:00:00',
      lable: '篮球,NBA',
    },
    {
      title: '巴西绝杀日本',
      shortTitle: '巴西绝杀日本',
      type: 'zuqiu',
      createtime: '2026-06-30 03:02:46',
      lable: '足球,世界杯,巴西,日本',
    },
  ],
}

describe('fetchFootballNews', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('成功获取并过滤足球新闻', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockZhibo8Response),
    } as Response)

    const result = await fetchFootballNews()
    expect(result).toHaveLength(2)
    expect(result.map((n) => n.title)).toContain('德国点球出局')
    expect(result.map((n) => n.title)).not.toContain('莫兰特交易')
  })

  it('时间倒序', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockZhibo8Response),
    } as Response)

    const result = await fetchFootballNews()
    expect(result[0].title).toBe('德国点球出局')
  })

  it('网络失败返回空数组', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))
    expect(await fetchFootballNews()).toEqual([])
  })

  it('非 200 状态返回空', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)
    expect(await fetchFootballNews()).toEqual([])
  })

  it('数据格式异常返回空', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ unexpected: true }),
    } as Response)
    expect(await fetchFootballNews()).toEqual([])
  })
})
