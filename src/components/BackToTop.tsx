import { useState, useEffect } from 'react'
import { ArrowUpIcon } from 'lucide-react'

interface BackToTopProps {
  /** 滚动容器的 ref */
  scrollContainerRef: React.RefObject<HTMLElement | null>
}

export function BackToTop({ scrollContainerRef }: BackToTopProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const handler = () => setVisible(el.scrollTop > 300)
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [scrollContainerRef])

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-30 size-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      aria-label="回到顶部"
    >
      <ArrowUpIcon className="size-5" />
    </button>
  )
}
