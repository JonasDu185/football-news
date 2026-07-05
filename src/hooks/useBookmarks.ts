import { useState, useCallback } from 'react'
import type { NewsItem } from '@/lib/newsFilter'

export interface BookmarkEntry {
  url: string
  title: string
  source: string
  thumb: string | null
  time: string
  savedAt: number
  fallbackUrl: string | null
  tags: string[]
  count: number
}

function toEntry(item: NewsItem): BookmarkEntry {
  return {
    url: item.url || '',
    title: item.title,
    source: item.source,
    thumb: item.thumb,
    time: item.time,
    savedAt: Date.now(),
    fallbackUrl: item.fallbackUrl,
    tags: item.tags,
    count: item.count,
  }
}

export function toNewsItem(entry: BookmarkEntry): NewsItem {
  return {
    title: entry.title,
    time: entry.time,
    source: entry.source,
    thumb: entry.thumb,
    url: entry.url || null,
    fallbackUrl: entry.fallbackUrl,
    tags: entry.tags,
    count: entry.count,
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('football-bookmarks') || '[]')
    } catch {
      return []
    }
  })

  const persist = (list: BookmarkEntry[]) => {
    setBookmarks(list)
    localStorage.setItem('football-bookmarks', JSON.stringify(list))
  }

  const addBookmark = useCallback((item: NewsItem) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.url === item.url)) return prev
      const next = [toEntry(item), ...prev]
      localStorage.setItem('football-bookmarks', JSON.stringify(next))
      return next
    })
  }, [])

  const removeBookmark = useCallback((url: string) => {
    setBookmarks((prev) => {
      const next = prev.filter((b) => b.url !== url)
      localStorage.setItem('football-bookmarks', JSON.stringify(next))
      return next
    })
  }, [])

  const isBookmarked = useCallback(
    (url: string | null) => {
      if (!url) return false
      return bookmarks.some((b) => b.url === url)
    },
    [bookmarks],
  )

  const toggleBookmark = useCallback(
    (item: NewsItem) => {
      if (isBookmarked(item.url)) {
        removeBookmark(item.url!)
      } else {
        addBookmark(item)
      }
    },
    [isBookmarked, addBookmark, removeBookmark],
  )

  return { bookmarks, addBookmark, removeBookmark, isBookmarked, toggleBookmark }
}
