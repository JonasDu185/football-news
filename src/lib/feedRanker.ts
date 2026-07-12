/**
 * 智能混排引擎
 *
 * 将每日消息从纯时间倒序升级为多信号加权排序：
 *   - 时间新鲜度（指数衰减，保证"刷最新消息"的体验）
 *   - 偏好匹配（用户关注的联赛/球队上浮）
 *   - 热度信号（高热度新闻适当上浮）
 *   - 已读下沉（已读减分，但不消失）
 *   - 简单打散（避免同源/同标签连续堆积）
 *
 * 所有参数可调，方便后续 A/B 测试和参数优化。
 */

import type { NewsItem } from './newsFilter'
import type { UserPreferences } from '../components/PreferencePanel'

// ===== 配置常量 =====

/** 时间衰减半衰期（小时）——超过这个时间，时间分衰减到 0.5 */
const DEFAULT_TIME_HALF_LIFE = 6

/** 偏好匹配权重（每命中一个标签加分） */
const DEFAULT_PREFERENCE_WEIGHT = 0.35

/** 热度归一化分母（log10 参考值，对应约 1kw 热度） */
const HOT_NORM_BASE = 7

/** 热度权重 */
const DEFAULT_HOT_WEIGHT = 0.2

/** 已读扣分 */
const DEFAULT_READ_PENALTY = 0.35

/** 打散窗口：同一来源最多连续出现 N 条 */
const MAX_CONSECUTIVE_SAME_SOURCE = 2

// ===== 类型 =====

export interface RankOptions {
  preferences: UserPreferences
  readUrls: Set<string>
  timeHalfLife?: number
  preferenceWeight?: number
  hotWeight?: number
  readPenalty?: number
}

// ===== 球队别称映射 =====

/**
 * 常见球队的别称映射。
 * 每一行是同一支球队的所有常见叫法，第一个通常是标签里出现的全称。
 * 用户输入任意别称都能命中该组的标签。
 */
const TEAM_ALIAS_GROUPS: string[][] = [
  ['皇家马德里', '皇马'],
  ['巴塞罗那', '巴萨', '巴塞'],
  ['拜仁慕尼黑', '拜仁'],
  ['巴黎圣日耳曼', '大巴黎', '巴黎'],
  ['曼彻斯特城', '曼城'],
  ['曼彻斯特联', '曼联'],
  ['马德里竞技', '马竞'],
  ['尤文图斯', '尤文'],
  ['国际米兰', '国米'],
  ['AC米兰', '米兰'],
  ['阿森纳', '枪手'],
  ['切尔西', '车子', '蓝军'],
  ['利物浦', '红军'],
  ['多特蒙德', '多特'],
  ['托特纳姆热刺', '热刺'],
  ['那不勒斯', '拿波里'],
  ['山东泰山', '泰山', '鲁能'],
  ['北京国安', '国安'],
  ['上海海港', '上港', '海港'],
  ['上海申花', '申花'],
  ['广州队', '广州恒大', '恒大'],
]

/** 根据别称查找所属组，返回该组所有叫法 */
function expandAliases(keyword: string): string[] {
  const group = TEAM_ALIAS_GROUPS.find((g) => g.includes(keyword))
  return group ?? [keyword]
}

/** 解析北京时间字符串，返回距今小时数 */
function hoursSince(timeStr: string): number {
  // 直播吧数据是北京时间字符串 "YYYY-MM-DD HH:mm:ss"
  const bjTime = new Date(timeStr.replace(' ', 'T') + '+08:00')
  if (isNaN(bjTime.getTime())) return 24 // 解析失败视为 24 小时前
  return (Date.now() - bjTime.getTime()) / (1000 * 3600)
}

/** 时间新鲜度：指数衰减，0小时=1，半衰期后=0.5 */
function timeScore(hours: number, halfLife: number): number {
  if (hours < 0) hours = 0
  return Math.pow(2, -hours / halfLife)
}

/** 热度分：log10 归一化到 0~1 */
function hotScore(count: number, normBase: number): number {
  if (count <= 0) return 0
  return Math.min(Math.log10(count + 1) / normBase, 1)
}

/** 偏好匹配分：统计标签/标题命中次数，支持球队别称 */
function preferenceScore(item: NewsItem, prefs: UserPreferences): number {
  const interests = [...prefs.leagues, ...prefs.teams]
  if (interests.length === 0) return 0

  // 展开所有兴趣词 → 包含别称的完整集合
  const expanded = new Set<string>()
  for (const kw of interests) {
    for (const alias of expandAliases(kw)) {
      expanded.add(alias)
    }
  }

  // 标签命中：展开后的集合 ∩ item.tags
  const tagHits = item.tags.filter((t) => expanded.has(t)).length
  // 标题命中：展开后任一关键词出现在标题中
  const titleHit = [...expanded].some((kw) => item.title.includes(kw)) ? 1 : 0
  return Math.min(tagHits + titleHit, 3)
}

/** 判断两个条目是否来自同一来源 */
function sameSource(a: NewsItem, b: NewsItem): boolean {
  return a.source === b.source && a.source !== '直播吧'
}

// ===== 主入口 =====

/**
 * 对新闻列表进行智能混排
 *
 * @param items 原始新闻列表（通常按时间倒序）
 * @param options 排名参数
 * @returns 重新排序后的列表
 */
export function rankFeed(items: NewsItem[], options: RankOptions): NewsItem[] {
  const {
    preferences,
    readUrls,
    timeHalfLife = DEFAULT_TIME_HALF_LIFE,
    preferenceWeight = DEFAULT_PREFERENCE_WEIGHT,
    hotWeight = DEFAULT_HOT_WEIGHT,
    readPenalty = DEFAULT_READ_PENALTY,
  } = options

  if (items.length === 0) return []

  // 1. 计算每条新闻的综合分
  interface ScoredItem {
    item: NewsItem
    score: number
    _timeScore: number
    _prefScore: number
    _hotScore: number
    _readPenalty: number
  }

  const scored: ScoredItem[] = items.map((item) => {
    const hours = hoursSince(item.time)
    const tScore = timeScore(hours, timeHalfLife)
    const pScore = preferenceScore(item, preferences)
    const hScore = hotScore(item.count, HOT_NORM_BASE)
    const rPenalty = readUrls.has(item.url ?? '') ? readPenalty : 0

    const score = tScore + pScore * preferenceWeight + hScore * hotWeight - rPenalty

    return { item, score, _timeScore: tScore, _prefScore: pScore, _hotScore: hScore, _readPenalty: rPenalty }
  })

  // 2. 按综合分降序
  scored.sort((a, b) => b.score - a.score)

  // 3. 简单打散：连续超过 N 条同源时，将多余的往后挪
  return diversityPass(scored, preferences)
}

// ===== 打散逻辑 =====

interface Scored {
  item: NewsItem
  score: number
}

/**
 * 扫描排序后的列表，限制同一来源连续出现的次数。
 * 策略：当连续同一来源超过阈值时，将当前条目与后面第一条不同来源的条目交换。
 */
function diversityPass(scored: Scored[], _prefs: UserPreferences): NewsItem[] {
  const result = [...scored]

  for (let i = MAX_CONSECUTIVE_SAME_SOURCE; i < result.length; i++) {
    const window = result.slice(i - MAX_CONSECUTIVE_SAME_SOURCE, i)
    const current = result[i]

    // 检查前面窗口是否全是同一来源
    const allSameSource = window.every((s) => sameSource(s.item, current.item))

    if (allSameSource) {
      // 找后面第一条不同来源的条目
      let swapIdx = -1
      for (let j = i + 1; j < result.length; j++) {
        if (!sameSource(result[j].item, current.item)) {
          swapIdx = j
          break
        }
      }
      if (swapIdx > i) {
        // 交换
        ;[result[i], result[swapIdx]] = [result[swapIdx], result[i]]
      }
    }
  }

  return result.map((s) => s.item)
}

// ===== 导出内部函数用于测试 =====

export const _internal = {
  hoursSince,
  timeScore,
  hotScore,
  preferenceScore,
  sameSource,
  expandAliases,
}
