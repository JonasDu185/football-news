import { SunIcon, MoonIcon, MonitorIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ThemeMode } from '@/hooks/useTheme'

interface ThemeToggleProps {
  mode: ThemeMode
  onCycle: () => void
}

const icons: Record<ThemeMode, typeof SunIcon> = {
  system: MonitorIcon,
  light: SunIcon,
  dark: MoonIcon,
}

const labels: Record<ThemeMode, string> = {
  system: '跟随系统',
  light: '浅色模式',
  dark: '深色模式',
}

export function ThemeToggle({ mode, onCycle }: ThemeToggleProps) {
  const Icon = icons[mode]

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={onCycle}
      aria-label={`当前：${labels[mode]}，点击切换`}
      title={labels[mode]}
    >
      <Icon className="size-4" />
    </Button>
  )
}
