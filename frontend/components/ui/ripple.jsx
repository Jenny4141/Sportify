'use client'
import React from 'react'

import { cn } from '@/lib/utils'

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 8,
  className,
  ...props
}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 select-none [mask-image:linear-gradient(to_bottom,white,transparent)]',
        className
      )}
      {...props}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70
        const opacity = mainCircleOpacity - i * 0.03
        const animationDelay = `${i * 0.06}s`
        const borderStyle = 'solid'

        const top = isMobile ? '50%' : '50%'
        const left = isMobile ? '50%' : '50%'

        return (
          <div
            key={i}
            className={`absolute animate-ripple rounded-full border bg-white/50 shadow-xl`}
            style={{
              '--i': i,
              width: `${size}px`,
              height: `${size}px`,
              opacity,
              animationDelay,
              borderStyle,
              borderWidth: '1px',
              borderColor: `white`,
              // backgroundColor: `var(--highlight)`,
              top,
              left,
              transform: 'translate(-50%, -50%) scale(1)',
            }}
          />
        )
      })}
    </div>
  )
})

Ripple.displayName = 'Ripple'
