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
  QuestionIcon,
  PackageCarIcon,
  PhoneIcon,
  FileDockIcon,
  ArrowRightIcon,
} from '@/components/icons/member-icons'

// 定義 Scroll Area 欄位
const memberItems = [
  { icon: MemberDataIcon, label: '會員資料' },
  { icon: VenueDataIcon, label: '場館租借紀錄' },
  { icon: ClassDataIcon, label: '課程紀錄' },
  { icon: ShopDataIcon, label: '商品訂單紀錄' },
  { icon: TeamDataIcon, label: '糾團紀錄' },
  { icon: FavoriteIcon, label: '收藏紀錄' },
  { icon: PackageCarIcon, label: '退貨/退款程序說明' },
  { icon: QuestionIcon, label: '會員常見問題' },
  { icon: FileDockIcon, label: '客服聯絡紀錄' },
  { icon: PhoneIcon, label: '聯繫客服' },
  { icon: ArrowRightIcon, label: '更多' },
]

const MemberSubCard = () => {
  return (
    <div className="inline-flex flex-col justify-start items-start w-full max-w-[1012px]">
      <div className="w-full px-8 py-4 border-b-4 border-primary inline-flex justify-between items-center">
        <div className="flex-1 flex justify-start items-center gap-4">
          <div className="justify-start text-foreground text-base font-bold font-['Noto_Sans_TC'] leading-9">
            服務與支援
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-start items-start w-full">
        <div className="w-full px-8 py-4 border-b border-primary inline-flex justify-between items-center">
          <div className="flex-1 flex justify-start items-center gap-4">
            <div className="w-6 h-6 relative">
              <PackageCarIcon />
            </div>
            <div className="justify-start text-foreground text-base font-normal font-['Noto_Sans_TC'] leading-9">
              退貨/退款程序說明{' '}
            </div>
          </div>
          <div className="w-6 h-6 relative flex items-center justify-center">
            <ArrowRightIcon />
          </div>
        </div>
        <div className="w-full px-8 py-4 border-b border-primary inline-flex justify-between items-center">
          <div className="flex-1 flex justify-start items-center gap-4">
            <div className="w-6 h-6 relative">
              <QuestionIcon />
            </div>
            <div className="justify-start text-foreground text-base font-normal font-['Noto_Sans_TC'] leading-9">
              會員常見問題{' '}
            </div>
          </div>
          <div className="w-6 h-6 relative flex items-center justify-center">
            <ArrowRightIcon />
          </div>
        </div>
        <div className="w-full px-8 py-4 border-b border-primary inline-flex justify-between items-center">
          <div className="flex-1 flex justify-start items-center gap-4">
            <div className="w-6 h-6 relative">
              <FileDockIcon />
            </div>
            <div className="justify-start text-foreground text-base font-normal font-['Noto_Sans_TC'] leading-9">
              客服聯絡紀錄
            </div>
          </div>
          <div className="w-6 h-6 relative flex items-center justify-center">
            <ArrowRightIcon />
          </div>
        </div>
        <div className="w-full px-8 py-4 border-b border-primary inline-flex justify-between items-center">
          <div className="flex-1 flex justify-start items-center gap-4">
            <div className="w-6 h-6 relative">
              <PhoneIcon />
            </div>
            <div className="justify-start text-foreground text-base font-normal font-['Noto_Sans_TC'] leading-9">
              聯繫客服
            </div>
          </div>
          <div className="w-6 h-6 relative flex items-center justify-center">
            <ArrowRightIcon />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberSubCard
