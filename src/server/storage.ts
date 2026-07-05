import Database from 'better-sqlite3'
import type { NewsItem } from '../lib/newsFilter'

export interface NewsStore {
  saveNews(news: NewsItem[]): void
  getRecentNews(hours: number, limit?: number, offset?: number): NewsItem[]
  getHotNews(hours: number, limit?: number, offset?: number): NewsItem[]
  cleanupOldNews(days: number): number
  close(): void
}

/** 缓存的文章 */
export interface CachedArticle {
  title: string
  content: string
  excerpt: string | null
  byline: string | null
}

export interface ArticleCacheStore {
  getCachedArticle(url: string): CachedArticle | null
  cacheArticle(url: string, article: CachedArticle): void
  cleanupOldArticles(days: number): number
}

export function createStorage(dbPath: string): NewsStore & ArticleCacheStore {
  const db = new Database(dbPath)

  // 启用 WAL 模式提升并发性能
  db.pragma('journal_mode = WAL')

  // 建表：url 唯一，重复插入时更新
  db.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      time TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT '直播吧',
      thumb TEXT,
      url TEXT UNIQUE,
      fallback_url TEXT,
      count INTEGER NOT NULL DEFAULT 0,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    -- #21 修复：time 列索引，避免全表扫描
    CREATE INDEX IF NOT EXISTS idx_news_time ON news(time);

    -- 文章正文缓存表
    CREATE TABLE IF NOT EXISTS article_cache (
      url TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      byline TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_article_cache_created ON article_cache(created_at);
  `)

  // 准备语句，提升性能
  const insertStmt = db.prepare(`
    INSERT INTO news (title, time, source, thumb, url, fallback_url, count, tags)
    VALUES (@title, @time, @source, @thumb, @url, @fallbackUrl, @count, @tags)
    ON CONFLICT(url) DO UPDATE SET
      title = excluded.title,
      source = COALESCE(excluded.source, news.source),
      thumb = COALESCE(excluded.thumb, news.thumb),
      fallback_url = COALESCE(excluded.fallback_url, news.fallback_url),
      count = MAX(excluded.count, news.count),
      tags = excluded.tags,
      time = excluded.time
  `)

  return {
    saveNews(newsList: NewsItem[]) {
      const insertMany = db.transaction((items: NewsItem[]) => {
        for (const item of items) {
          insertStmt.run({
            title: item.title,
            time: item.time,
            source: item.source,
            thumb: item.thumb,
            url: item.url,
            fallbackUrl: item.fallbackUrl,
            count: item.count,
            tags: JSON.stringify(item.tags),
          })
        }
      })

      insertMany(newsList)
    },

    getRecentNews(hours: number, limit?: number, offset?: number): NewsItem[] {
      // 用 Intl API 直接生成北京时间字符串，不做手动时区换算
      const cutoff = new Date(Date.now() - hours * 3600 * 1000)
      const cutoffStr = cutoff.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace('T', ' ')

      let sql = `
        SELECT title, time, source, thumb, url, fallback_url, count, tags
        FROM news
        WHERE time >= ?
        ORDER BY time DESC
      `
      const params: (string | number)[] = [cutoffStr]

      if (limit !== undefined) {
        sql += ' LIMIT ?'
        params.push(limit)
      }
      if (offset !== undefined) {
        sql += ' OFFSET ?'
        params.push(offset)
      }

      return (db.prepare(sql).all(...params) as Record<string, unknown>[]).map(rowToNewsItem)
    },

    getHotNews(hours: number, limit?: number, offset?: number): NewsItem[] {
      const cutoff = new Date(Date.now() - hours * 3600 * 1000)
      const cutoffStr = cutoff.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace('T', ' ')

      let sql = `
        SELECT title, time, source, thumb, url, fallback_url, count, tags
        FROM news
        WHERE time >= ?
        ORDER BY count DESC
      `
      const params: (string | number)[] = [cutoffStr]

      if (limit !== undefined) {
        sql += ' LIMIT ?'
        params.push(limit)
      }
      if (offset !== undefined) {
        sql += ' OFFSET ?'
        params.push(offset)
      }

      return (db.prepare(sql).all(...params) as Record<string, unknown>[]).map(rowToNewsItem)
    },

    cleanupOldNews(days: number): number {
      const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000)
      const cutoffStr = cutoff.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace('T', ' ')
      const result = db.prepare('DELETE FROM news WHERE time < ?').run(cutoffStr)
      return result.changes
    },

    close() {
      db.close()
    },

    // ===== 文章缓存 =====

    getCachedArticle(url: string): CachedArticle | null {
      const row = db.prepare('SELECT title, content, excerpt, byline FROM article_cache WHERE url = ?').get(url) as Record<string, unknown> | undefined
      if (!row) return null
      return {
        title: row.title as string,
        content: row.content as string,
        excerpt: (row.excerpt as string) || null,
        byline: (row.byline as string) || null,
      }
    },

    cacheArticle(url: string, article: CachedArticle): void {
      db.prepare(`
        INSERT OR REPLACE INTO article_cache (url, title, content, excerpt, byline)
        VALUES (?, ?, ?, ?, ?)
      `).run(url, article.title, article.content, article.excerpt, article.byline)
    },

    cleanupOldArticles(days: number): number {
      const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000)
      const cutoffStr = cutoff.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace('T', ' ')
      const result = db.prepare('DELETE FROM article_cache WHERE created_at < ?').run(cutoffStr)
      return result.changes
    },
  }
}

function rowToNewsItem(row: Record<string, unknown>): NewsItem {
  let tags: string[] = []
  try {
    const raw = row.tags as string
    tags = JSON.parse(raw)
  } catch {
    tags = []
  }

  return {
    title: row.title as string,
    time: row.time as string,
    source: (row.source as string) || '直播吧',
    thumb: (row.thumb as string) || null,
    url: (row.url as string) || null,
    fallbackUrl: (row.fallback_url as string) || null,
    count: (row.count as number) || 0,
    tags,
  }
}
