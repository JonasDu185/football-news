import { useEffect, type ReactNode } from 'react'
import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  // 打开时禁止 body 滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* 抽屉面板 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[75%] max-w-xs bg-background shadow-2xl animate-in slide-in-from-left duration-200"
      >
        {/* 顶栏 */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <span className="text-sm font-medium flex-1">{title || '菜单'}</span>
          <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
            <XIcon className="size-4" />
          </Button>
        </div>

        {/* 内容 */}
        <div className="py-2">
          {children}
        </div>
      </div>
    </div>
  )
}
