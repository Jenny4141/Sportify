import * as React from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  BasketballIcon,
  BadmintonIcon,
  TableTennisIcon,
  TennisIcon,
  VolleyballIcon,
  TennisRacketIcon,
  SoccerIcon,
  BaseballBatIcon,
  BilliardBallIcon,
} from '@/components/icons/sport-icons'
const sportIconMap = {
  basketball: BasketballIcon,
  badminton: BadmintonIcon,
  tabletennis: TableTennisIcon,
  tennis: TennisIcon,
  volleyball: VolleyballIcon,
  squash: TennisRacketIcon,
  soccer: SoccerIcon,
  baseball: BaseballBatIcon,
  billiard: BilliardBallIcon,
}
export default function ScrollAreaSport({ sportItems, onSportSelect }) {
  return (
    <div className="w-full bg-background px-4 md:px-6">
      <div className="container mx-auto flex flex-col max-w-screen-xl items-center justify-between pt-10">
        <h3 className="text-lg">探索各類運動</h3>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-4 px-4 py-10">
            {sportItems.map((item, idx) => {
              const IconComponent = sportIconMap[item.iconKey]
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center min-w-[120px] shrink-0 py-4 rounded-lg hover:bg-foreground/10 transition-colors cursor-pointer"
                  onClick={() => onSportSelect?.(item.id)}
                >
                  <div className="w-16 h-16 bg-foreground/10 rounded-full flex items-center justify-center mb-3">
                    {IconComponent && <IconComponent className="!w-10 !h-10" />}
                  </div>
                  <span className="text-foreground text-sm text-center">
                    {item.name}
                  </span>
                </div>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  )
}
