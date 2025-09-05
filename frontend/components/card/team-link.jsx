'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link' // <-- 1. 引入 Next.js 的 Link 元件
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
  { icon: VenueDataIcon, label: '租借場地', path: '/venue' },
  { icon: ClassDataIcon, label: '來點課程', path: '/course' },
  { icon: ShopDataIcon, label: '購物商城', path: '/shop' },
]

const TeamLink = () => {
  // useRouter 仍然可以保留，以備不時之需，但此處不再直接使用
  const router = useRouter()

  return (
    <div className="w-full flex justify-center">
      {/* --- 【修改點一：將 grid 改為 flex，使其排成一列】 --- */}
      <div className="flex flex-row flex-wrap justify-center gap-4 md:gap-6">
        {memberItems.map((item, index) => (
          // --- 【修改點二：用 Link 元件包住按鈕內容】 ---
          <Link
            key={index}
            href={item.path}
            className="w-40 h-40 md:w-48 md:h-48 py-2 outline outline-1 outline-offset-[-1px] outline-white flex flex-col justify-center items-center gap-1 md:gap-2 hover:bg-white/10 transition"
          >
            {/* --- 【修改點三：放大 icon 的尺寸】 --- */}
            <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
              <item.icon className="w-full h-full" />
            </div>
            <div className="w-full px-1 text-center text-white text-sm md:text-xl font-bold leading-tight md:leading-10">
              {item.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default TeamLink
