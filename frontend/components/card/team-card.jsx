// components/TeamCard.jsx
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BasketballIcon,
  BadmintonIcon,
  TableTennisIcon,
  TennisIcon,
  VolleyballIcon,
  SoccerIcon,
  BaseballBatIcon,
  TennisRacketIcon,
} from '../icons/sport-icons'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  InfoIcon,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getTeamImageUrl } from '@/api/team/image'

const FALLBACK_IMAGE_URL =
  "data:image/svg+xml,%3Csvg width='256' height='192' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='16' fill='%23333' text-anchor='middle' dominant-baseline='middle'%3E無圖片%3C/text%3E%3C/svg%3E"

export function TeamCard({
  isExpanded,
  onToggleExpand,
  teamName = '隊伍名稱',
  sportType = '運動類型',
  sportIconKey, // <-- 1. 新增 sportIconKey prop
  currentMembers = 0,
  maxMembers = 0,
  location = '地點',
  time = '時間未定',
  skillLevel = '等級',
  isFeatured = false,
  imageUrl,
  // --- 修改開始 (1/3): 新增 props 來接收真實資料 ---
  description = '暫無描述', // 接收隊伍描述
  details, // 接收展開後的詳細資料 (包含成員)
  isDetailLoading, // 接收載入狀態
  onJoinRequest, // <-- 1. 接收新的 onJoinRequest prop
  // --- 修改結束 (1/3) ---
}) {
  // --- 修改開始 (2/3): 決定要顯示的成員和人數 ---
  // 如果詳細資料已載入，使用詳細資料中的成員，否則用 mock 或空陣列
  const membersToShow = details?.TeamMember || []
  // 如果詳細資料已載入，使用精確的成員數，否則使用列表傳來的概略人數
  const finalCurrentMembers = details
    ? details.TeamMember.length
    : currentMembers
  // --- 修改結束 (2/3) ---

  const SportIcons = {
    籃球: BasketballIcon,
    羽球: BadmintonIcon,
    桌球: TableTennisIcon,
    網球: TennisIcon,
    排球: VolleyballIcon,
    足球: SoccerIcon,
    棒球: BaseballBatIcon,
    壁球: TennisRacketIcon,
  }
  const CurrentSportIcon = SportIcons[sportType] || null

  const defaultSportImage = sportIconKey
    ? `/team-imgs/${sportIconKey}.jpg`
    : FALLBACK_IMAGE_URL

  return (
    <div data-name="team-card-container" className="relative w-full">
      <div
        className={cn(
          'w-full p-2 flex flex-col shadow-md overflow-hidden bg-card transition-all duration-300',
          isExpanded ? 'rounded-t-lg' : 'rounded-lg'
        )}
      >
        <div className="w-full p-4 flex flex-col lg:flex-row justify-start lg:items-stretch gap-4">
          <div className="w-full lg:w-64 flex-shrink-0">
            <img
              src={getTeamImageUrl(imageUrl) || defaultSportImage} // <-- 改用新的預設圖片
              alt={teamName || '隊伍圖片'}
              className="w-full h-full rounded-lg object-cover aspect-[4/3] lg:aspect-auto"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = FALLBACK_IMAGE_URL
              }}
            />
          </div>

          <div className="flex-1 flex flex-col justify-start items-start gap-2 h-auto min-w-0">
            <div className="inline-flex justify-start items-center gap-2 flex-wrap content-center">
              <div className="px-2 py-1 rounded-lg outline outline-1 outline-offset-[-1px] outline-border flex justify-center items-center gap-2 bg-foreground">
                {CurrentSportIcon && (
                  <CurrentSportIcon className="w-6 h-6 text-background" />
                )}
                <div className="justify-start text-background text-base font-normal leading-normal">
                  {sportType || '運動類型'}
                </div>
              </div>
            </div>
            <div className="self-stretch flex flex-col justify-start items-start gap-2">
              <div className="self-stretch justify-start text-card-foreground text-xl font-bold leading-7 truncate">
                {teamName || 'Team Name'}
              </div>
              <div className="w-full justify-start text-muted-foreground text-sm font-normal leading-normal truncate">
                {/* --- 修改開始 (3/3): 使用最終計算出的人數 --- */}
                {`${finalCurrentMembers} / ${maxMembers || 0} 目前隊伍人數`}
                {/* --- 修改結束 (3/3) --- */}
              </div>
              <div className="w-full justify-start text-muted-foreground text-sm font-normal leading-normal truncate">
                {location || '地點'}
              </div>
              <div className="w-full justify-start text-muted-foreground text-sm font-normal leading-normal truncate">
                {time || '時間'}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto flex flex-col justify-between items-stretch lg:items-end mt-4 lg:mt-0 gap-2">
            <div className="flex justify-end items-start gap-2.5">
              {isFeatured && (
                <Badge
                  variant="default"
                  size="lg"
                  className="bg-highlight text-highlight-foreground text-sm"
                >
                  News
                </Badge>
              )}
              <Badge
                variant="outline"
                size="lg"
                className="text-sm text-card-foreground"
              >
                {skillLevel}
              </Badge>
            </div>
            <Button
              onClick={onToggleExpand}
              variant="outline"
              className="flex-shrink-0 mt-auto text-foreground"
            >
              <span>詳細</span>
              {isExpanded ? (
                <ChevronUpIcon className="w-5 h-5 text-foreground" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-foreground" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'absolute top-full left-0 right-0 z-10 w-full overflow-hidden transition-all duration-300 ease-in-out rounded-b-lg shadow-lg bg-secondary/70 backdrop-blur-lg',
          isExpanded ? 'max-h-[30rem] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-5 space-y-4">
          {isDetailLoading ? (
            // 載入中的骨架屏效果
            <>
              <Skeleton className="h-6 w-1/2 muted-foreground" />
              <Skeleton className="h-16 w-full muted-foreground" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-8 w-full muted-foreground" />
                <Skeleton className="h-8 w-full muted-foreground" />
                <Skeleton className="h-8 w-full muted-foreground" />
              </div>
            </>
          ) : (
            // 載入完成後顯示真實資料
            <>
              <div>
                <div className="flex justify-between text-lg font-bold text-highlight mb-2 gap-2">
                  隊伍簡述
                  <Button onClick={onJoinRequest}>加入</Button>
                </div>
                <p className="text-card-foreground text-sm">
                  {details?.description || description}
                </p>
              </div>

              <div>
                <div className="flex w-full justify-between items-center mb-2">
                  <div className="text-lg font-bold text-highlight">
                    隊伍成員
                  </div>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {membersToShow.length > 0 ? (
                    membersToShow.map((member) => (
                      <li key={member.id} className="flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-muted-foreground" />
                        <span className="text-base text-card-foreground">
                          {member.member.name || '匿名成員'}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="col-span-full text-center text-muted-foreground">
                      目前尚無成員
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
