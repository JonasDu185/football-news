/**
 * 从新闻标题中提取世界杯比赛比分
 *
 * 标题格式示例：
 *   "阿根廷加时3-1瑞士进4强"
 *   "晋级四强！英格兰加时2-1挪威"
 *   "半场-阿根廷1-0瑞士"
 *   "90分钟战报-阿根廷1-1十人瑞士"
 *   "西班牙2-1比利时全场数据"
 */

import type { NewsItem } from './newsFilter'

// ===== 世界杯参赛队中文名 =====
const TEAMS = [
  '阿根廷', '英格兰', '法国', '西班牙', '葡萄牙', '巴西', '德国',
  '比利时', '荷兰', '意大利', '挪威', '瑞士', '摩洛哥', '墨西哥',
  '美国', '加拿大', '埃及', '巴拉圭', '哥伦比亚', '佛得角', '奥地利',
  '乌拉圭', '日本', '韩国', '伊朗', '塞内加尔', '加纳', '喀麦隆',
  '澳大利亚', '克罗地亚', '丹麦', '波兰', '塞尔维亚', '瑞典', '威尔士',
  '哥斯达黎加', '突尼斯', '沙特', '卡塔尔', '厄瓜多尔', '秘鲁', '智利',
  '科特迪瓦', '尼日利亚', '阿尔及利亚', '俄罗斯', '土耳其', '希腊',
  '苏格兰', '爱尔兰', '罗马尼亚', '保加利亚',
]

// 按名称长度降序，优先匹配长队名（如"哥斯达黎加"优先于"哥"）
const SORTED_TEAMS = [...TEAMS].sort((a, b) => b.length - a.length)

export interface ParsedMatch {
  /** 主队名 */
  home: string
  /** 客队名 */
  away: string
  /** 主队进球 */
  homeScore: number
  /** 客队进球 */
  awayScore: number
  /** 比赛状态：半场 / 加时 / 点球 / 完场 */
  status: 'HT' | 'FT' | 'AET' | 'PEN' | 'LIVE'
  /** 比分文本，如 "3-1" */
  scoreText: string
  /** 来源新闻标题 */
  sourceTitle: string
  /** 新闻时间 */
  time: string
  /** 新闻 URL（可选） */
  url?: string | null
}

/**
 * 从标题中提取比分模式 (N-M)，返回比分和可能的队伍名上下文
 */
function extractScorePattern(title: string): Array<{
  full: string; home: number; away: number; index: number
}> {
  const re = /(\d+)\s*[-–—:：]\s*(\d+)/g
  const results: Array<{ full: string; home: number; away: number; index: number }> = []
  let m: RegExpExecArray | null
  while ((m = re.exec(title)) !== null) {
    results.push({
      full: m[0],
      home: parseInt(m[1], 10),
      away: parseInt(m[2], 10),
      index: m.index,
    })
  }
  return results
}

/** 在标题中查找队伍名，返回位置和名称 */
function findTeamsInTitle(title: string): Array<{ name: string; index: number }> {
  const results: Array<{ name: string; index: number }> = []
  for (const team of SORTED_TEAMS) {
    let pos = 0
    while (pos < title.length) {
      const idx = title.indexOf(team, pos)
      if (idx === -1) break

      // 跳过已被占用的位置（较短的队名被较长的队名覆盖）
      const overlap = results.some(r => idx < r.index + r.name.length && idx + team.length > r.index)
      if (!overlap) {
        results.push({ name: team, index: idx })
      }
      pos = idx + team.length
    }
  }
  results.sort((a, b) => a.index - b.index)
  return results
}

/** 推断比赛状态 */
function inferStatus(title: string): ParsedMatch['status'] {
  if (title.includes('半场') || title.includes('半场战报')) return 'HT'
  if (title.includes('加时') || title.includes('加时赛')) return 'AET'
  if (title.includes('点球')) return 'PEN'
  if (title.includes('全场') || title.includes('战报') ||
      title.includes('晋级') || title.includes('淘汰') ||
      title.includes('进4强') || title.includes('进8强') ||
      title.includes('半决赛') || title.includes('四强') ||
      title.includes('夺冠') || title.includes('出局') ||
      title.includes('结束') || title.includes('完场')) return 'FT'
  return 'FT' // 默认完场
}

/** 匹配键 —— 两队名排序后拼接，用于去重 */
function matchKey(home: string, away: string): string {
  return [home, away].sort().join('_')
}

/**
 * 从新闻列表中提取比赛比分
 */
export function parseMatches(news: NewsItem[]): ParsedMatch[] {
  const wcNews = news.filter(n => n.tags.includes('世界杯'))
  const seen = new Map<string, ParsedMatch>()

  for (const item of wcNews) {
    const scores = extractScorePattern(item.title)
    if (scores.length === 0) continue

    const teams = findTeamsInTitle(item.title)
    if (teams.length < 2) continue

    // 尝试把比分和两支队伍关联起来
    for (const score of scores) {
      // 过滤非真实比分：单队进球 > 10 几乎不可能是足球比分
      if (score.home > 10 || score.away > 10) continue
      // 过滤历史回顾（"X年前的今天"）
      if (/年前/.test(item.title)) continue

      // 找比分前后的队伍：比分左边的队伍在比分之前，右边的在之后
      const before = teams.filter(t => t.index + t.name.length <= score.index)
      const after = teams.filter(t => t.index >= score.index + score.full.length)

      const homeTeam = before.length > 0 ? before[before.length - 1] : null
      const awayTeam = after.length > 0 ? after[0] : null

      if (!homeTeam || !awayTeam) continue
      if (homeTeam.name === awayTeam.name) continue

      const home = homeTeam.name
      const away = awayTeam.name
      const key = matchKey(home, away)
      const status = inferStatus(item.title)

      // 保留最新的新闻（优先完场 > 加时 > 半场）
      const existing = seen.get(key)
      const statusRank = { FT: 4, AET: 3, PEN: 3, HT: 2, LIVE: 1 }
      const keep = !existing ||
        (statusRank[status] > statusRank[existing.status]) ||
        (statusRank[status] === statusRank[existing.status] && item.time > existing.time)

      if (keep) {
        seen.set(key, {
          home,
          away,
          homeScore: score.home,
          awayScore: score.away,
          scoreText: `${score.home}-${score.away}`,
          status,
          sourceTitle: item.title,
          time: item.time,
          url: item.url,
        })
      }
    }
  }

  return [...seen.values()].sort((a, b) => b.time.localeCompare(a.time))
}
