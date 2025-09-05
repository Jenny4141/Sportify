'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Star } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      delay: i * 0.3,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
}

// 抽取使用 useSearchParams 的內容組件
function VenueSearchFormContent({ locations = [], sports = [] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [locationId, setLocationId] = useState('')
  const [sportId, setSportId] = useState('')
  const [minRating, setMinRating] = useState('')
  const [keyword, setKeyword] = useState('')

  // 評分系統
  const ratingOptions = [
    { label: <>全部</>, value: 'all' },
    ...[2, 3, 4, 5].map((num) => ({
      label: (
        <>
          {Array.from({ length: num }).map((_, i) => (
            <Star key={i} className="text-yellow-400 fill-yellow-400" />
          ))}
          {num === 5 ? '5星' : `${num}星以上`}
        </>
      ),
      value: String(num),
    })),
  ]

  const handleSearch = (keyword, customSportId) => {
    const newParams = new URLSearchParams(searchParams.toString())
    // 地區
    if (locationId && locationId !== 'all') {
      newParams.set('locationId', locationId)
    } else {
      newParams.delete('locationId')
    }
    // 運動
    const sportValue = customSportId ?? sportId
    if (sportValue && sportValue !== 'all') {
      newParams.set('sportId', sportValue)
    } else {
      newParams.delete('sportId')
    }
    // 評分
    if (minRating && minRating !== 'all') {
      newParams.set('minRating', minRating)
    } else {
      newParams.delete('minRating')
    }
    // 關鍵字
    if (keyword) {
      newParams.set('keyword', keyword)
    } else {
      newParams.delete('keyword')
    }
    newParams.set('page', '1') // 搜尋時重設分頁
    router.push(`/venue?${newParams.toString()}`)
  }

  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      custom={3}
      className="flex-1 w-full"
    >
      <Card>
        <CardHeader>
          <CardTitle>請輸入篩選條件</CardTitle>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="location">地區</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger className="w-full bg-accent text-accent-foreground !h-10">
                    <SelectValue placeholder="請選擇地區" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="all" value="all">
                      全部
                    </SelectItem>
                    {locations.length === 0 ? (
                      <div className="px-3 py-2 text-gray-400">
                        沒有符合資料
                      </div>
                    ) : (
                      locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id.toString()}>
                          {loc.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sport">運動</Label>
                <Select value={sportId} onValueChange={setSportId}>
                  <SelectTrigger className="w-full bg-accent text-accent-foreground !h-10">
                    <SelectValue placeholder="請選擇運動" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="all" value="all">
                      全部
                    </SelectItem>
                    {sports?.length === 0 ? (
                      <div className="px-3 py-2 text-gray-400">
                        沒有符合資料
                      </div>
                    ) : (
                      sports.map((sport) => (
                        <SelectItem key={sport.id} value={sport.id.toString()}>
                          {sport.name || sport.id}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rating">評分</Label>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger className="w-full bg-accent text-accent-foreground !h-10">
                    <SelectValue placeholder="請選擇評分星等" />
                  </SelectTrigger>
                  <SelectContent>
                    {ratingOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="keyword">關鍵字</Label>
                <div className="relative flex items-center">
                  <Search
                    className="absolute left-3 text-accent-foreground/50"
                    size={20}
                  />
                  <Input
                    type="search"
                    className="w-full bg-accent text-accent-foreground !h-10 pl-10"
                    placeholder="請輸入關鍵字"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch(keyword)
                    }}
                  />
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button
            variant="highlight"
            type="submit"
            className="w-full"
            onClick={() => handleSearch(keyword)}
          >
            搜尋
          </Button>
          <Button
            variant="secondary"
            type="submit"
            className="w-full"
            onClick={() => router.push(`/venue`)}
          >
            查看更多
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// 主要的導出組件，包裝在 Suspense 中
export default function VenueSearchForm({ locations = [], sports = [] }) {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <VenueSearchFormContent locations={locations} sports={sports} />
    </Suspense>
  )
}
