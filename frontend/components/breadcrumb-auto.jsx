'use client'
import * as React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'

const pageNameMap = {
  venue: '場地預訂',
  reservation: '選擇場地與時間',
  payment: '填寫付款資訊',
  success: '完成訂單',
  shop: '購物商城',
  order: '確認購物車',
  team: '揪團組隊',
  create: '創建隊伍',
  ourteam: '我的隊伍',
  course: '課程報名',
  member: '會員中心',
  'member-data': '個人資料',
  'venue-data': '場地預訂紀錄',
  'class-data': '課程報名紀錄',
  'shop-data': '商品訂單紀錄',
  'team-data': '揪團紀錄',
  'favorite-data': '我的收藏',
}

export default function BreadcrumbAuto({
  venueName,
  shopName,
  teamName,
  courseName,
}) {
  const pathname = usePathname() ?? '/'
  const parts = pathname.split('/').filter(Boolean)
  // 假設 params 是 /team/ourteam/58
  // parts = ["team", "ourteam", "58"]

  const dynamicNameMap = {
    venue: venueName,
    shop: shopName,
    team: teamName,
    course: courseName,
  }

  return (
    <div
      className={cn(
        'sticky top-16 z-50 w-full bg-background-dark/95 backdrop-blur supports-[backdrop-filter]:bg-background-dark/60 px-4 md:px-6 [&_*]:no-underline'
      )}
    >
      <div className="container mx-auto flex h-12 max-w-screen-xl items-center justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">首頁</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {parts.map((part, idx) => {
              // 判斷是否為動態內容的條件：
              // 1. 是最後一個部分 (idx === parts.length - 1)
              // 2. 前面有對應的動態名稱 (如 team -> teamName)
              // 3. 不是純數字 ID (避免顯示 58 這種 ID)
              const isDynamicContent =
                idx === parts.length - 1 &&
                dynamicNameMap[parts[0]] &&
                dynamicNameMap[parts[0]] !== undefined

              // 如果是純數字且為最後一個部分，使用動態名稱替代
              const isNumericId = /^\d+$/.test(part)

              let displayName
              if (isDynamicContent && isNumericId) {
                displayName = dynamicNameMap[parts[0]]
              } else {
                displayName = pageNameMap[part] || part
              }

              return (
                <React.Fragment key={`${part}-${idx}`}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {idx === parts.length - 1 ? (
                      <BreadcrumbPage>{displayName}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={`/${parts.slice(0, idx + 1).join('/')}`}>
                          {displayName}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  )
}
