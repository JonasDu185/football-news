import { BookmarkIcon } from 'lucide-react'

interface BookmarkButtonProps {
  isBookmarked: boolean
  onClick: () => void
  compact?: boolean
}

export function BookmarkButton({ isBookmarked, onClick, compact = false }: BookmarkButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`absolute z-10 transition-colors cursor-pointer ${
        compact ? 'top-1.5 right-1.5' : 'top-2 right-2'
      }`}
      aria-label={isBookmarked ? '取消收藏' : '收藏'}
    >
      <BookmarkIcon
        className={`${compact ? 'size-[16px]' : 'size-[18px]'} drop-shadow-sm ${
          isBookmarked
            ? 'fill-primary text-primary'
            : 'text-white/80 hover:text-white'
        }`}
      />
    </button>
  )
}
