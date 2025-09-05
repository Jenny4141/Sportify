'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toggle } from '@/components/ui/toggle'
import { Button } from '@/components/ui/button'

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const current = mounted ? (resolvedTheme ?? theme) : undefined
  const isDark = current === 'dark'

  return (
    <Toggle
      aria-label="Toggle theme"
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative"
      asChild
    >
      <Button variant="outline" size="icon">
        <Sun
          className={`h-[1.2rem] w-[1.2rem] transition-all ${isDark ? 'scale-0 -rotate-90' : 'scale-100 rotate-0'}`}
        />
        <Moon
          className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${isDark ? 'scale-100 rotate-0' : 'scale-0 rotate-90'}`}
        />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </Toggle>
  )
}
