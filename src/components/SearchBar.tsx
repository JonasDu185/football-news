import { SearchIcon, XIcon } from 'lucide-react'
import { useRef, useEffect } from 'react'

interface SearchBarProps {
  query: string
  onChange: (q: string) => void
  onClose: () => void
}

export function SearchBar({ query, onChange, onClose }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-background border-b border-border">
      <SearchIcon className="size-4 text-muted-foreground shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索标题、球队、联赛…"
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {query && (
        <button onClick={() => onChange('')} className="shrink-0 text-muted-foreground hover:text-foreground">
          <XIcon className="size-4" />
        </button>
      )}
      <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground shrink-0">
        取消
      </button>
    </div>
  )
}
