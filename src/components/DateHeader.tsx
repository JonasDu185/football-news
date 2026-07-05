interface DateHeaderProps {
  date: Date
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function DateHeader({ date }: DateHeaderProps) {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekDay = WEEKDAYS[date.getDay()]
  const fullDate = `${date.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  return (
    <header role="banner" className="bg-background/95 backdrop-blur">
      {/* 票根卡片 */}
      <div className="mx-4 mt-4 rounded-t-2xl bg-card border border-border border-b-0 overflow-hidden">
        <div className="flex">
          {/* 左侧哨红 — 贯穿整个卡片 */}
          <div className="w-1.5 shrink-0 bg-primary" aria-hidden="true" />

          {/* 右侧内容区 */}
          <div className="flex-1 min-w-0 relative">
            {/* 足球水印 */}
            <span className="absolute -right-1 -top-1 text-[80px] leading-none opacity-75 select-none pointer-events-none" aria-hidden="true">⚽</span>
            {/* 日期文字 */}
            <div className="px-4 pt-1.5 pb-0.5 relative">
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-0.5">
                <time dateTime={fullDate}>{date.getFullYear()}</time>
              </p>
              <p className="font-heading text-4xl font-bold tracking-tight text-foreground leading-none">
                {month}.{day}
              </p>
              <p className="text-sm text-foreground/70 font-medium">{weekDay}</p>
            </div>

            {/* 穿孔撕扯线 — 圆从红条右侧开始 */}
            <div className="h-[16px] overflow-hidden" aria-hidden="true">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: 'radial-gradient(circle 5px at 5px 100%, var(--color-background) 5px, transparent 5px)',
                  backgroundSize: '15px 16px',
                  backgroundRepeat: 'repeat-x',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
