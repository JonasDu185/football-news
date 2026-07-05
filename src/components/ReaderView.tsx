import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import DOMPurify from 'dompurify'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeftIcon, ExternalLinkIcon } from 'lucide-react'

interface ReaderViewProps {
  url: string           // 阅读模式提取的URL（优先直播吧）
  sourceUrl?: string | null  // 原文链接（外媒），显示在底部
  sourceName?: string   // 来源名称
  onBack: () => void
}

interface Article {
  title: string
  content: string
  error: string | null
}

/** 阅读进度条 */
function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <div className="sticky top-0 left-0 right-0 h-0.5 bg-muted z-20">
      <div
        className="h-full bg-primary transition-[width] duration-150 ease-out"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  )
}

export function ReaderView({ url, sourceUrl, sourceName, onBack }: ReaderViewProps) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  // 消毒 HTML，防止 XSS；给图片加防盗链绕过
  const cleanContent = useMemo(() => {
    if (!article?.content) return ''
    const sanitized = DOMPurify.sanitize(article.content, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'video', 'source', 'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'em', 'br', 'figure', 'figcaption'],
      ALLOWED_ATTR: ['src', 'alt', 'href', 'target', 'rel', 'loading', 'referrerpolicy', 'controls', 'preload', 'poster', 'style'],
    })
    // 给所有 img 加上 referrerpolicy="no-referrer"，绕过 CDN 防盗链
    return sanitized.replace(/<img /g, '<img referrerpolicy="no-referrer" loading="lazy" ')
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
      {/* 顶栏 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" className="size-8" onClick={onBack}>
            <ArrowLeftIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* 阅读进度条 */}
      <ReadingProgress />

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
            <h1 className="text-xl font-bold text-foreground font-heading mb-4">{article.title}</h1>
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
