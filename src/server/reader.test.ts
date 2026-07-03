import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractArticle } from './reader'

const mockHTML = `<!DOCTYPE html>
<html>
<head><title>德国爆冷出局——测试文章</title></head>
<body>
  <article>
    <h1>德国爆冷出局！点球大战遭巴拉圭淘汰</h1>
    <p>北京时间6月30日，世界杯1/16决赛，德国对阵巴拉圭。</p>
    <p>常规时间1-1战平后进入点球大战，德国队三人失点。</p>
    <img src="https://example.com/photo.jpg" alt="比赛照片" />
    <p>最终德国4-5惨遭淘汰，连续三届无缘16强。</p>
  </article>
</body>
</html>`

describe('extractArticle', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('提取文章标题', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
      text: () => Promise.resolve(mockHTML),
    } as Response)

    const result = await extractArticle('https://news.zhibo8.com/article')
    expect(result.title).toContain('德国')
  })

  it('提取正文内容并去除HTML标签', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
      text: () => Promise.resolve(mockHTML),
    } as Response)

    const result = await extractArticle('https://news.zhibo8.com/article')
    expect(result.content).toContain('北京时间')
    expect(result.content).toContain('巴拉圭')
    // 不应该是原始 HTML
    expect(result.content).not.toContain('<h1>')
  })

  it('网络失败时返回通用错误信息，不泄露内部错误', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('超时'))

    const result = await extractArticle('https://news.zhibo8.com/article')
    expect(result.title).toBe('')
    expect(result.content).toBe('')
    expect(result.error).toBe('无法提取文章内容')
  })

  it('拒绝裸 IP 地址', async () => {
    const result = await extractArticle('http://127.0.0.1/admin')
    expect(result.error).toBe('无法提取文章内容')
  })

  it('拒绝非 http/https 协议', async () => {
    const result = await extractArticle('file:///etc/passwd')
    expect(result.error).toBe('无法提取文章内容')
  })
})
