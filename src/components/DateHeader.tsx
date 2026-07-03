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
    <header role="banner" className="sticky top-0 z-10 bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-xs tracking-widest text-muted-foreground mb-1">
            <time dateTime={fullDate}>{date.getFullYear()}</time>
          </p>
          <p className="font-heading text-4xl font-bold text-foreground tracking-tight">
            {month}.{day}
          </p>
        </div>
        <div className="text-right">
          <span className="block text-lg text-muted-foreground font-medium">{weekDay}</span>
          {/* 哨红圆点 — 像比赛日的标记 */}
          <span className="inline-block w-2 h-2 rounded-full bg-primary mt-1" aria-hidden="true" />
        </div>
      </div>
      <div className="mx-5 border-t border-border" />
    </header>
  )
}
