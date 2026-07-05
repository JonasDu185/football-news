import { BookmarkIcon } from 'lucide-react'

interface BookmarkButtonProps {
  isBookmarked: boolean
  onClick: (e: React.MouseEvent) => void
  compact?: boolean
}

export function BookmarkButton({ isBookmarked, onClick, compact = false }: BookmarkButtonProps) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onClick(e)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation()
          e.preventDefault()
          onClick(e as unknown as React.MouseEvent)
        }
      }}
      className={`absolute z-10 transition-colors cursor-pointer ${
        compact ? 'top-1 left-1' : 'top-2 left-2'
      }`}
      aria-label={isBookmarked ? '取消收藏' : '收藏'}
    >
      <BookmarkIcon
        className={`${compact ? 'size-4' : 'size-5'} drop-shadow ${
          isBookmarked
            ? 'fill-primary text-primary'
            : 'text-white/80 hover:text-white'
        }`}
      />
    </span>
  )
}
