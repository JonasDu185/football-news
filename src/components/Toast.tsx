import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'

interface Toast {
  message: string
  key: number
}

interface ToastContextValue {
  show: (message: string) => void
}

const ToastCtx = createContext<ToastContextValue>({ show: () => {} })

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const [counter, setCounter] = useState(0)

  const show = useCallback((message: string) => {
    setCounter((c) => c + 1)
    setToast({ message, key: counter })
  }, [counter])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          key={toast.key}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-foreground text-background text-sm shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-200"
        >
          {toast.message}
        </div>
      )}
    </ToastCtx.Provider>
  )
}
