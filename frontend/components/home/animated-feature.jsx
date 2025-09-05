'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, useMotionValue, animate, useInView } from 'framer-motion'
import { School, ShoppingCart, Users, BookOpen } from 'lucide-react'

// 圖標映射
const iconMap = {
  School,
  ShoppingCart,
  Users,
  BookOpen,
}

export default function AnimatedFeature({ iconName, count, label }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const motionValue = useMotionValue(0)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (inView) {
      const controls = animate(motionValue, count, {
        duration: 1.2,
        ease: 'easeOut',
        onUpdate: (latest) => setDisplay(Math.floor(latest)),
      })
      return controls.stop
    }
  }, [inView, count, motionValue])

  const Icon = iconMap[iconName]

  if (!Icon) {
    console.warn(`Icon "${iconName}" not found in iconMap`)
    return null
  }

  return (
    <div ref={ref} className="flex items-center gap-4">
      <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center border border-accent rounded">
        <Icon className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1} />
      </div>
      <div>
        <span className="text-xs md:text-sm">{label}超過</span>
        <div className="flex items-center">
          <motion.span className="font-bold text-highlight text-3xl md:text-5xl min-w-[2em]">
            {display}
          </motion.span>
        </div>
      </div>
    </div>
  )
}
