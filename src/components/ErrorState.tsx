import { WifiOffIcon, ServerCrashIcon, NewspaperIcon, AlertTriangleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NewsError } from '@/hooks/useNewsFeed'

interface ErrorStateProps {
  error: NewsError
  onRetry?: () => void
}

const iconClass = 'size-10 text-muted-foreground/50 mb-2'

function ErrorIcon({ type }: { type: NewsError['type'] }) {
  switch (type) {
    case 'network':
      return <WifiOffIcon className={iconClass} />
    case 'server':
      return <ServerCrashIcon className={iconClass} />
    case 'empty':
      return <NewspaperIcon className={iconClass} />
    default:
      return <AlertTriangleIcon className={iconClass} />
  }
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <ErrorIcon type={error.type} />
      <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
      {error.type !== 'empty' && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          重新加载
        </Button>
      )}
    </div>
  )
}
