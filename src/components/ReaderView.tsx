import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import DOMPurify from 'dompurify'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeftIcon, ExternalLinkIcon, Share2Icon, CheckIcon } from 'lucide-react'
import { SANITIZE_ALLOWED_TAGS, SANITIZE_ALLOWED_ATTR, addImgReferrerBypass } from '@/lib/sanitize'

interface ReaderViewProps {
  url: string           // 阅读模式提取的URL（优先直播吧）
  sourceUrl?: string | null  // 原文链接（外媒），显示在底部
  sourceName?: string   // 来源名称
  onBack: () => void
  /** 滚动容器 ref，用于阅读进度条监听 */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
}

interface Article {
  title: string
  content: string
  error: string | null
}

/** 阅读进度条 — 监听滚动容器的 scrollTop，挂载时立即计算一次 */
function ReadingProgress({ scrollRef }: { scrollRef?: React.RefObject<HTMLDivElement | null> }) {
  const [progress, setProgress] = useState(0)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef?.current
    if (!el) return

    // 挂载后立即执行一次进度计算
    const calc = () => {
      const scrollTop = el.scrollTop
      const docHeight = el.scrollHeight - el.clientHeight
      setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0)
    }
    calc()

    el.addEventListener('scroll', calc, { passive: true })
    return () => el.removeEventListener('scroll', calc)
  }, [scrollRef])

  return (
    <div className="sticky top-0 left-0 right-0 z-20 h-0.5 bg-muted/30">
      <div
        ref={barRef}
        className="h-full bg-primary transition-[width] duration-150 ease-out"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  )
}

export function ReaderView({ url, sourceUrl, sourceName, onBack, scrollContainerRef }: ReaderViewProps) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [shareFeedback, setShareFeedback] = useState<'idle' | 'copied'>('idle')
  const [enableShare, setEnableShare] = useState(false)

  // 检查分享功能是否启用
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(cfg => setEnableShare(cfg.enableShare))
      .catch(() => setEnableShare(false))
  }, [])

  // 分享处理：优先用 Web Share API（弹出系统分享面板），不支持时复制链接
  const handleShare = useCallback(async () => {
    // 开发环境 Vite 代理 /share，生产环境 nginx 代理 /football/share
    const sharePath = import.meta.env.DEV
      ? `/share?url=${encodeURIComponent(url)}`
      : `${import.meta.env.BASE_URL}share?url=${encodeURIComponent(url)}`
    const shareUrl = `${window.location.origin}${sharePath}`
    const shareTitle = article?.title || '分享一篇足球新闻'
    const shareText = article?.title
      ? `${article.title} — 来自足球新闻`
      : '来自足球新闻的分享'

    // 尝试 Web Share API（需要 HTTPS 或 localhost）
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl })
        return
      } catch (err) {
        // 用户取消分享 (AbortError) 不处理；其他错误降级到剪贴板
        if (!(err instanceof Error) || err.name === 'AbortError') return
        console.warn('[share] Web Share 失败，降级剪贴板:', err.message)
      }
    }

    // 降级：复制链接到剪贴板
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareFeedback('copied')
      setTimeout(() => setShareFeedback('idle'), 2000)
    } catch {
      // 剪贴板也不可用，弹窗显示链接
      window.prompt('复制链接分享：', shareUrl)
      setShareFeedback('idle')
    }
  }, [url, article?.title])

  // 消毒 HTML，防止 XSS；给图片加防盗链绕过
  const cleanContent = useMemo(() => {
    if (!article?.content) return ''
    const sanitized = DOMPurify.sanitize(article.content, {
      ALLOWED_TAGS: SANITIZE_ALLOWED_TAGS,
      ALLOWED_ATTR: SANITIZE_ALLOWED_ATTR,
    })
    return addImgReferrerBypass(sanitized)
  }, [article?.content])

  useEffect(() => {
    setLoading(true)
    const controller = new AbortController()

    fetch(`/api/news/article?url=${encodeURIComponent(url)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setArticle(data)
        setLoading(false)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setArticle({ title: '', content: '', error: '加载失败' })
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [url])

  return (
    <div className="min-h-full bg-background">
      {/* 阅读导航栏 — 52px，返回 + 居中标题 + 分享 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="flex items-center h-[52px] px-3 border-b border-border/60">
          {/* 左侧返回 */}
          <Button variant="ghost" size="icon" className="size-9 shrink-0" onClick={onBack}>
            <ArrowLeftIcon className="size-[18px]" />
          </Button>
          {/* 中央标题 */}
          <span className="flex-1 text-center text-[13px] text-muted-foreground font-medium select-none">阅读</span>
          {/* 右侧分享 — 不可用时保持空位 */}
          <div className="size-9 shrink-0 flex items-center justify-center">
            {enableShare ? (
              <Button variant="ghost" size="icon" className="size-9" onClick={handleShare} aria-label="分享">
                {shareFeedback === 'copied'
                  ? <CheckIcon className="size-[18px] text-green-500" />
                  : <Share2Icon className="size-[18px]" />}
              </Button>
            ) : null}
          </div>
        </div>
        {/* 进度条 — 紧贴导航栏下方 */}
        <ReadingProgress scrollRef={scrollContainerRef} />
      </div>

      {/* 内容 */}
      <div className="max-w-md mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : article?.error ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground text-sm">无法提取文章内容</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary"
            >
              <ExternalLinkIcon className="size-3" />
              在浏览器中打开
            </a>
          </div>
        ) : article ? (
          <article>
            {sourceName && (
              <p className="text-xs text-muted-foreground mb-3">来源：{sourceName}</p>
            )}
            <h1 className="text-[22px] font-semibold leading-[1.35] text-foreground mb-4" style={{ fontFamily: 'var(--font-heading)' }}>{article.title}</h1>
            <div
              className="text-foreground/85 leading-relaxed text-[17px] reader-content"
              dangerouslySetInnerHTML={{ __html: cleanContent }}
            />
            {/* 底部：原文链接 */}
            {sourceUrl && (
              <div className="mt-8 pt-4 border-t border-border">
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLinkIcon className="size-3" />
                  查看原文（{sourceName || '原始来源'}）
                </a>
              </div>
            )}
          </article>
        ) : null}
      </div>
    </div>
  )
}
