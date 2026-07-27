import { MenuIcon, SearchIcon } from 'lucide-react'

interface EditorialTab {
  value: string
  label: string
}

interface EditorialHeaderProps {
  date: Date
  tabs: readonly EditorialTab[]
  activeTab: string
  onTabChange: (value: string) => void
  onMenu: () => void
  onSearch: () => void
}

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

export function EditorialHeader({
  date,
  tabs,
  activeTab,
  onTabChange,
  onMenu,
  onSearch,
}: EditorialHeaderProps) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return (
    <header className="editorial-header shrink-0 bg-background" role="banner">
      <div className="grid min-h-[130px] grid-cols-[minmax(0,1fr)_100px] gap-2 px-4 pt-6 pb-2">
        <div className="flex min-w-0 items-center">
          <h1 className="-ml-2 -translate-y-1 font-heading text-[clamp(60px,19vw,76px)] leading-[0.88] font-semibold tracking-[-0.09em] text-foreground">
            足球志
          </h1>
        </div>

        <div className="flex translate-y-1 flex-col items-start text-left">
          <p className="w-full text-[8px] leading-[1.45] tracking-[0.12em] text-muted-foreground">
            / 记录每一次
            <br />
            触动人心的绿茵瞬间
          </p>
          <p className="mt-3 w-full text-center font-heading text-[80px] leading-[0.66] font-normal tracking-[-0.08em] text-primary">
            {day}
          </p>
          <p className="mt-3 w-full whitespace-nowrap text-center font-heading text-[14px] leading-none tracking-[0.04em] text-foreground">
            {month}月{day}日&nbsp;&nbsp;{WEEKDAYS[date.getDay()]}
          </p>
        </div>
      </div>

      <nav className="grid grid-cols-[36px_1fr_36px] items-end border-b border-border px-3" aria-label="新闻频道">
        <button
          type="button"
          onClick={onMenu}
          className="editorial-icon-button mb-1 justify-self-start"
          aria-label="菜单"
        >
          <MenuIcon className="size-[19px]" strokeWidth={1.6} />
        </button>

        <div className="flex items-end justify-center gap-10">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onTabChange(tab.value)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative pb-3 pt-1 text-[16px] transition-colors ${
                  isActive ? 'font-semibold text-primary' : 'text-muted-foreground'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-[2px] bg-primary" aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onSearch}
          className="editorial-icon-button mb-1 justify-self-end"
          aria-label="搜索"
        >
          <SearchIcon className="size-[18px]" strokeWidth={1.6} />
        </button>
      </nav>
    </header>
  )
}
