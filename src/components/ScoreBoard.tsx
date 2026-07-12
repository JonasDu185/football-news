import { useMemo } from 'react'
import type { NewsItem } from '@/lib/newsFilter'
import { parseMatches, type ParsedMatch } from '@/lib/matchParser'

interface ScoreBoardProps {
  news: NewsItem[]
}

/** 比赛状态标签 */
function StatusBadge({ status }: { status: ParsedMatch['status'] }) {
  const label: Record<string, string> = {
    HT: '半场',
    FT: '完场',
    AET: '加时',
    PEN: '点球',
    LIVE: '进行中',
  }
  const isLive = status === 'LIVE' || status === 'HT'
  return (
    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-[3px] leading-none ${
      isLive ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'
    }`}>
      {label[status] || status}
    </span>
  )
}

/** 单场比分条 */
function MatchRow({ match }: { match: ParsedMatch }) {
  const isHomeWin = match.homeScore > match.awayScore
  const isAwayWin = match.awayScore > match.homeScore

  return (
    <div className="flex items-center justify-between py-2.5 px-4 border-b border-border/50 last:border-b-0">
      {/* 主队 */}
      <div className="flex-1 text-right">
        <span className={`text-[14px] ${isHomeWin ? 'text-foreground font-semibold' : 'text-foreground/80'}`}>
          {match.home}
        </span>
      </div>

      {/* 比分 + 状态 */}
      <div className="flex flex-col items-center mx-3 min-w-[64px]">
        <span className="text-[17px] font-bold text-foreground tabular-nums tracking-wide leading-none">
          {match.scoreText}
        </span>
        <StatusBadge status={match.status} />
      </div>

      {/* 客队 */}
      <div className="flex-1 text-left">
        <span className={`text-[14px] ${isAwayWin ? 'text-foreground font-semibold' : 'text-foreground/80'}`}>
          {match.away}
        </span>
      </div>
    </div>
  )
}

export function ScoreBoard({ news }: ScoreBoardProps) {
  const matches = useMemo(() => {
    if (!news || news.length === 0) return []
    // 只取最近 7 天、世界杯标签的新闻
    const recent = news.filter(n => {
      if (!n.tags || !n.tags.includes('世界杯')) return false
      // 仅保留 7 天内的
      const t = new Date(n.time.replace(' ', 'T') + '+08:00')
      return Date.now() - t.getTime() < 7 * 24 * 3600 * 1000
    })
    return parseMatches(recent).slice(0, 6)
  }, [news])

  if (matches.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
        暂无比赛数据
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* 标题 */}
      <div className="px-4 pt-3 pb-2">
        <h3 className="text-[13px] text-muted-foreground font-medium">比分</h3>
      </div>

      {/* 比分列表 */}
      <div className="mx-4 bg-card/60 rounded-[6px] border border-border/40 overflow-hidden">
        {matches.map((m) => (
          <MatchRow key={`${m.home}_${m.away}_${m.time}`} match={m} />
        ))}
      </div>
    </div>
  )
}
