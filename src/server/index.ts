import express from 'express'
import cron from 'node-cron'
import { fetchFootballNews } from './fetcher'
import { createStorage } from './storage'
import path from 'path'

// #14 修复：用 import.meta.dirname 代替 process.cwd()，不依赖启动目录
const ROOT_DIR = import.meta.dirname
  ? path.dirname(path.dirname(import.meta.dirname))
  : process.cwd()
const DB_PATH = process.env.DB_PATH || path.join(ROOT_DIR, 'data', 'news.db')
const DIST_PATH = path.join(ROOT_DIR, 'dist')
const PORT = Number(process.env.PORT) || 3001

const store = createStorage(DB_PATH)
const app = express()

// ===== 数据抓取 =====

// #1+2 修复：try-catch 防进程崩溃
async function fetchAndStore() {
  try {
    console.log('[cron] 开始抓取...')
    const news = await fetchFootballNews()
    if (news.length > 0) {
      store.saveNews(news)
      console.log(`[cron] 存入 ${news.length} 条新闻`)
    } else {
      console.log('[cron] 本次无新数据')
    }
  } catch (err) {
    console.error('[cron] 抓取异常:', err instanceof Error ? err.message : err)
  }
}

// ===== API 路由 =====

app.get('/api/news/featured', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 50)
  const offset = Number(req.query.offset) || 0
  const news = store.getRecentNews(24, limit, offset)
  res.json(news)
})

app.get('/api/news/hot', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 15, 50)
  const offset = Number(req.query.offset) || 0
  // 近期热点：最近 72 小时，按热度排序
  const news = store.getHotNews(72, limit, offset)
  res.json(news)
})

// 手动刷新
app.post('/api/news/refresh', async (_req, res) => {
  await fetchAndStore()
  res.json({ ok: true })
})

// 文章阅读模式：提取原文正文（带缓存）
app.get('/api/news/article', async (req, res) => {
  const url = req.query.url as string
  if (!url) {
    res.status(400).json({ error: '缺少 url 参数' })
    return
  }
  const { getArticle } = await import('./articleCache')
  const article = await getArticle(url, store)
  res.json(article)
})

// ===== 生产环境托管前端静态文件 =====
app.use(express.static(DIST_PATH))
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(DIST_PATH, 'index.html'))
})

// 每天凌晨 3 点清理 7 天前的旧新闻和缓存文章
cron.schedule('0 3 * * *', () => {
  const deletedNews = store.cleanupOldNews(7)
  const deletedArticles = store.cleanupOldArticles(7)
  if (deletedNews > 0 || deletedArticles > 0) {
    console.log(`[cleanup] 清理了 ${deletedNews} 条旧新闻，${deletedArticles} 篇缓存文章`)
  }
})

// #9 修复：优雅关闭，保存数据库
function shutdown(signal: string) {
  console.log(`[server] 收到 ${signal}，正在关闭...`)
  store.close()
  console.log('[server] 数据库已关闭')
  process.exit(0)
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// 启动时抓一次
fetchAndStore()

// 每 30 分钟
cron.schedule('*/30 * * * *', fetchAndStore)

app.listen(PORT, () => {
  console.log(`[server] 运行在 http://localhost:${PORT}`)
})
