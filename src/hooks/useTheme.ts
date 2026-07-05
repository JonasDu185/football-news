import { useState, useEffect } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('football-theme') as ThemeMode) || 'system'
  })

  useEffect(() => {
    const root = document.documentElement

    const apply = () => {
      if (mode === 'dark') {
        root.classList.add('dark')
      } else if (mode === 'light') {
        root.classList.remove('dark')
      } else {
        // system: 跟随系统
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.classList.toggle('dark', prefersDark)
      }
    }

    apply()
    localStorage.setItem('football-theme', mode)

    // 监听系统偏好变化（仅在 mode === 'system' 时生效）
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => { if (mode === 'system') apply() }
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [mode])

  // 三态循环：跟随系统 → 深色 → 浅色 → 跟随系统
  const cycleTheme = () => {
    setMode((prev) => (prev === 'system' ? 'dark' : prev === 'dark' ? 'light' : 'system'))
  }

  return { mode, setMode, cycleTheme }
}
