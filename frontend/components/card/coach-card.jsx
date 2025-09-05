'use client'

// hooks
import React, { useState, Suspense } from 'react'

// utils
import { cn } from '@/lib/utils'

// Icon

// API 請求

// next 元件
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

// UI 元件
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// 自訂元件
import { Card, CardContent, CardFooter } from '@/components/card/card'

// 抽取使用 useSearchParams 的內容組件
function CoachCardContent({ className, data, ...props }) {
  // #region 路由和URL參數
  const searchParams = useSearchParams()
  const router = useRouter()

  // #region 組件狀態管理
  const [coachId, setCoachId] = useState('')
  const [isHovered, setIsHovered] = React.useState(false)

  // #region 事件處理函數
  const handleCoachSearch = (coachId) => {
    const newParams = new URLSearchParams(searchParams.toString())
    // 地區
    if (coachId && coachId !== 'all') {
      newParams.set('coachId', coachId)
    } else {
      newParams.delete('coachId')
    }
    newParams.set('page', '1') // 搜尋時重設分頁
    router.push(`/course?${newParams.toString()}`)
  }
  // #region 資料顯示選項

  return (
    <div className={cn('group', className)} {...props}>
      <Card
        className={cn(
          'relative h-full overflow-hidden py-0 transition-all duration-200 ease-in-out hover:shadow-md gap-0 border-none bg-background cursor-pointer',
          isHovered && 'ring-1 ring-accent'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => handleCoachSearch(data?.id)}
      >
        <div className="relative aspect-3/4 w-full h-full overflow-hidden rounded-lg">
          {data?.avatar && (
            <Image
              alt={data?.member?.name}
              className={cn(
                'object-cover transition-transform duration-300 ease-in-out rounded-lg',
                isHovered && 'scale-105'
              )}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={data?.avatar}
            />
          )}
        </div>

        <CardContent className="flex flex-col text-center text-accent justify-center gap-2 p-4">
          {/* data name with line clamp */}
          <h3
            className={`
                line-clamp-2 md:text-lg text-foreground font-bold transition-colors
                group-hover:text-highlight
              `}
          >
            {data?.member?.name}
          </h3>
          <span className="text-sm md:text-base text-muted-foreground">
            {data?.sport?.name}
          </span>
        </CardContent>
      </Card>
    </div>
  )
}

// 主要的導出組件，包裝在 Suspense 中
export function CoachCard({ className, data, ...props }) {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <CoachCardContent className={className} data={data} {...props} />
    </Suspense>
  )
}
