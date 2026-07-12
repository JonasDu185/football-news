import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ===== 新闻展示共享工具 =====

/** 时间格式化：YYYY-MM-DD HH:mm:ss → M.D */
export function formatNewsTime(time: string): string {
  const m = time.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return time.length >= 10 ? time.slice(5, 10) : time
  return `${parseInt(m[2], 10)}.${parseInt(m[3], 10)}`
}

/** 热度数值 → 可读文本（纯数字，不带"热度"后缀） */
export function formatNewsHeat(count: number): string | null {
  if (count <= 0) return null
  if (count >= 10000) return `${(count / 10000).toFixed(0)}万`
  return `${count}`
}

/** 大类标签排除列表 */
const EXCLUDED_TAGS = new Set([
  '足球', '世界杯', '欧冠', '英超', '西甲', '德甲', '意甲', '法甲',
  '国家队', '转载', '话题',
])

/** 过滤掉大类标签，保留细粒度赛事/球队/人物标签 */
export function pickDisplayTags(tags: string[], max: number): string[] {
  return tags.filter((t) => !EXCLUDED_TAGS.has(t)).slice(0, max)
}
