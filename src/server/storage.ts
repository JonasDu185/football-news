import Database from 'better-sqlite3'
import type { NewsItem } from '../lib/newsFilter'

export interface NewsStore {
  saveNews(news: NewsItem[]): void
  getRecentNews(hours: number, limit?: number, offset?: number): NewsItem[]
  close(): void
}

export function createStorage(dbPath: string): NewsStore {
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
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    -- #21 修复：time 列索引，避免全表扫描
    CREATE INDEX IF NOT EXISTS idx_news_time ON news(time);
  `)

  // 准备语句，提升性能
  const insertStmt = db.prepare(`
    INSERT INTO news (title, time, source, thumb, url, tags)
    VALUES (@title, @time, @source, @thumb, @url, @tags)
    ON CONFLICT(url) DO UPDATE SET
      title = excluded.title,
      thumb = COALESCE(excluded.thumb, news.thumb),
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
        SELECT title, time, source, thumb, url, tags
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

    close() {
      db.close()
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
    tags,
  }
}
