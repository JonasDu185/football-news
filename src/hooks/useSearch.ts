import { useState, useMemo } from 'react'
import type { NewsItem } from '@/lib/newsFilter'

export function useSearch(items: NewsItem[]) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        item.source.toLowerCase().includes(q),
    )
  }, [items, query])

  return { query, setQuery, results }
}
