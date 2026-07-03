import type { ReactNode } from 'react'

interface SectionTitleProps {
  icon: string
  children: ReactNode
}

export function SectionTitle({ icon, children }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2 px-4 pt-6 pb-3">
      <span className="text-lg" aria-hidden="true">
        {icon}
      </span>
      <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
        {children}
      </h2>
    </div>
  )
}
