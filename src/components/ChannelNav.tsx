import { MenuIcon, SearchIcon } from 'lucide-react'

interface ChannelTab {
  value: string
  label: string
}

interface ChannelNavProps {
  tabs: readonly ChannelTab[]
  activeTab: string
  onTabChange: (value: string) => void
  onMenu: () => void
  onSearch: () => void
}

export function ChannelNav({
  tabs,
  activeTab,
  onTabChange,
  onMenu,
  onSearch,
}: ChannelNavProps) {
  return (
    <nav
      className="grid h-12 shrink-0 grid-cols-[40px_1fr_40px] items-stretch border-b border-border bg-background px-2"
      aria-label="新闻频道"
    >
      <button
        type="button"
        onClick={onMenu}
        className="editorial-icon-button self-center justify-self-start"
        aria-label="菜单"
      >
        <MenuIcon className="size-[19px]" strokeWidth={1.6} />
      </button>

      <div className="flex items-stretch justify-center gap-10">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative px-1 text-[15px] transition-colors ${
                isActive ? 'font-semibold text-primary' : 'text-muted-foreground'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-[2px] bg-primary" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onSearch}
        className="editorial-icon-button self-center justify-self-end"
        aria-label="搜索"
      >
        <SearchIcon className="size-[18px]" strokeWidth={1.6} />
      </button>
    </nav>
  )
}
