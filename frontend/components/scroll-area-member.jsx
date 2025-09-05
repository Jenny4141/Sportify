import * as React from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  ShopDataIcon,
  TeamDataIcon,
  VenueDataIcon,
  MemberDataIcon,
  ClassDataIcon,
  FavoriteIcon,
} from '@/components/icons/member-icons'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

// 定義 Scroll Area 欄位
const memberItems = [
  { icon: MemberDataIcon, label: '個人資料', path: '/member/member-data' },
  { icon: VenueDataIcon, label: '場地預訂紀錄', path: '/member/venue-data' },
  { icon: ClassDataIcon, label: '課程報名紀錄', path: '/member/class-data' },
  { icon: ShopDataIcon, label: '商品訂單紀錄', path: '/member/shop-data' },
  { icon: TeamDataIcon, label: '揪團紀錄', path: '/member/team-data' },
  { icon: FavoriteIcon, label: '我的收藏', path: '/member/favorite-data' },
]

export default function ScrollAreaMember() {
  const pathname = usePathname()

  return (
    <div className="w-full bg-background px-4 md:px-6">
      <div className="container mx-auto flex flex-col max-w-screen-xl items-center ">
        {/* <h3 className="text-lg text-white mb-8">GUEST</h3> */}
        <ScrollArea className="w-full">
          <div className="grid grid-cols-3 md:flex md:justify-center items-center justify-items-center px-4 py-10 w-full gap-4 md:gap-2">
            {memberItems.map((item, idx) => {
              const IconComponent = item.icon
              const isActive = pathname === item.path
              return (
                <Link
                  key={idx}
                  href={item.path}
                  className="flex flex-col items-center min-w-[120px] shrink-0 py-4 rounded-lg hover:bg-foreground/10 transition-colors cursor-pointer"
                >
                  <div
                    className={`w-16 h-16 bg-foreground/10 rounded-full flex items-center justify-center mb-3 ${
                      isActive ? 'bg-orange-500' : 'bg-foreground/10'
                    }`}
                  >
                    <IconComponent
                      className={`!w-10 !h-10 ${
                        isActive ? 'text-white' : 'text-foreground'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-sm text-center ${
                      isActive ? 'text-orange-500' : 'text-foreground'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  )
}
