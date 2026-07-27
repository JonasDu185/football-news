import { Skeleton } from './ui/skeleton'

/** 双列瀑布流骨架屏，用于初始加载 */
export function NewsSkeleton() {
  return (
    <div className="flex gap-5 px-4 pt-4">
      <div className="flex-1 flex flex-col gap-8">
        {[1, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-44 w-full rounded-[2px]" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-0.5 w-5" />
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-8 pt-8">
        {[2, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-36 w-full rounded-[2px]" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-0.5 w-5" />
          </div>
        ))}
      </div>
    </div>
  )
}
