'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShopDataIcon,
  TeamDataIcon,
  VenueDataIcon,
  MemberDataIcon,
  ClassDataIcon,
  FavoriteIcon,
} from '@/components/icons/member-icons'

// 定義 Scroll Area 欄位
const memberItems = [
  { icon: MemberDataIcon, label: '個人資料', path: '/member/member-data' },
  { icon: VenueDataIcon, label: '場地預訂紀錄', path: '/member/venue-data' },
  { icon: ClassDataIcon, label: '課程報名紀錄', path: '/member/class-data' },
  { icon: ShopDataIcon, label: '商品訂單紀錄', path: '/member/shop-data' },
  { icon: TeamDataIcon, label: '揪團紀錄', path: '/member/team-data' },
  { icon: FavoriteIcon, label: '我的收藏', path: '/member/favorite-data' },
]

const MemberHomeButtons = () => {
  const router = useRouter()

  const handleButtonClick = (path) => {
    router.push(path)
  }

  return (
    <div className="w-full flex justify-center">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {memberItems.map((item, index) => (
          <button
            key={index}
            type="button"
            data-state={item.label.toLowerCase().replace(/\s+/g, '-')}
            data-type="default"
            className="w-32 h-32 md:w-40 md:h-40 py-2 outline outline-1 outline-offset-[-1px] outline-primary flex flex-col justify-center items-center gap-2 hover:bg-primary/10 transition rounded-lg cursor-pointer"
            onClick={() => handleButtonClick(item.path)}
          >
            <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
              <item.icon className="w-full h-full" />
            </div>
            <div className="w-full px-1 text-center text-foreground text-sm md:text-base font-bold leading-tight md:leading-10">
              {item.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default MemberHomeButtons
