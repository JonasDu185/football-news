import { ArrowLeftIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewsList } from './NewsList'
import type { BookmarkEntry, toNewsItem } from '@/hooks/useBookmarks'

// inline conversion to avoid circular dependency
function bookmarkToNewsItem(b: BookmarkEntry): ReturnType<typeof toNewsItem> {
  return {
    title: b.title,
    time: b.time,
    source: b.source,
    thumb: b.thumb,
    url: b.url || null,
    fallbackUrl: b.fallbackUrl,
    tags: b.tags,
    count: b.count,
  }
}

interface BookmarkListProps {
  bookmarks: BookmarkEntry[]
  onBack: () => void
  onCardClick: (item: ReturnType<typeof toNewsItem>) => void
  onClearAll: () => void
}

export function BookmarkList({ bookmarks, onBack, onCardClick, onClearAll }: BookmarkListProps) {
  const items = bookmarks.map(bookmarkToNewsItem)

  return (
    <div className="fixed inset-0 z-30 bg-background flex flex-col">
      {/* 顶栏 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <Button variant="ghost" size="icon" className="size-8" onClick={onBack}>
            <ArrowLeftIcon className="size-4" />
          </Button>
          <span className="text-sm font-medium flex-1">稍后阅读 ({bookmarks.length})</span>
          {bookmarks.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={onClearAll}>
              <Trash2Icon className="size-3 mr-1" />
              清空
            </Button>
          )}
        </div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto pt-2">
        {items.length === 0 ? (
          <p className="px-4 py-12 text-center text-muted-foreground text-sm">
            还没有收藏任何文章
          </p>
        ) : (
          <NewsList columns={1} forceCompact news={items} onCardClick={onCardClick} />
        )}
      </div>
    </div>
  )
}
