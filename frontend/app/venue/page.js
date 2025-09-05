'use client'

// hooks
import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

// 資料請求函式庫
import useSWR from 'swr'

// Icon
import { AlertCircle, Star, Search, BrushCleaning } from 'lucide-react'

// API 請求
import { fetchLocationOptions, fetchSportOptions } from '@/api'
import { fetchCenters } from '@/api/venue/center'

// UI 元件
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

// 自訂元件
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import HeroBanner, { SearchField } from '@/components/hero-banner'
import ScrollAreaSport from '@/components/scroll-area-sport'
import { PaginationBar } from '@/components/pagination-bar'
import { CenterCard } from '@/components/card/center-card'
import { LoadingState, ErrorState } from '@/components/loading-states'

// 將使用 useSearchParams 的邏輯抽取到單獨的組件
function VenueListContent() {
  // #region 路由和URL參數
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryParams = useMemo(() => {
    const entries = Object.fromEntries(searchParams.entries())
    return entries
  }, [searchParams])

  // #region 狀態管理
  const [locationId, setLocationId] = useState(queryParams.locationId || '')
  const [sportId, setSportId] = useState(queryParams.sportId || '')
  const [minRating, setMinRating] = useState(queryParams.minRating || '')
  const [keyword, setKeyword] = useState(queryParams.keyword || '')
  const safeKeyword = typeof keyword === 'string' ? keyword.trim() : ''

  const [locations, setLocations] = useState([])
  const [sports, setSports] = useState([])

  // #region 數據獲取
  const {
    data,
    isLoading: isDataLoading,
    error,
    mutate,
  } = useSWR(
    ['centers', queryParams],
    async ([, params]) => {
      // await new Promise((r) => setTimeout(r, 3000)) // 延遲測試載入動畫
      return fetchCenters(params)
    },
    {
      keepPreviousData: true, // 換參數時保留舊的資料
      revalidateOnFocus: false, // 切回頁面不會自動刷新
      // fallbackData: { rows: [], totalRows: 0, page: 1, totalPages: 0 }, // 提供初始數據
      fallbackData: null, // 改為 null，避免誤判為沒有數據
    }
  )

  // #region 副作用處理
  // 載入下拉選單選項
  useEffect(() => {
    const loadData = async () => {
      try {
        const locationData = await fetchLocationOptions()
        setLocations(locationData.rows || [])

        const sportData = await fetchSportOptions()
        setSports(sportData.rows || [])
      } catch (error) {
        console.error('載入選項失敗:', error)
        toast.error('載入選項失敗')
      }
    }
    loadData()
  }, [])

  // #region 事件處理函數
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
    router.push(`?${newParams.toString()}`)
  }

  const handlePagination = (targetPage) => {
    const perPage = data?.perPage || 8
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('page', String(targetPage))
    newParams.set('perPage', String(perPage))
    router.push(`?${newParams.toString()}`, { scroll: false })
  }

  // 重設篩選功能
  const handleResetFilter = () => {
    setLocationId('')
    setSportId('')
    setMinRating('')
    setKeyword('')
    // setCurrentPage(1)
    // setCourses([])
    router.push('/venue')
  }
  //  #region 載入和錯誤狀態處理

  // 只有在沒有任何數據時才顯示全屏載入
  if (isDataLoading && data === null)
    return <LoadingState message="載入場館資料中..." />
  if (error)
    return (
      <ErrorState
        title="場館資料載入失敗"
        message={`載入錯誤：${error.message}` || '找不到您要查看的場館資料'}
        onRetry={mutate}
        backUrl="/"
        backLabel="返回首頁"
      />
    )

  // #region 資料顯示選項

  // 評分系統選項
  const ratingOptions = [
    { label: <>全部</>, value: 'all' },
    ...[2, 3, 4].map((num) => ({
      label: (
        <>
          {Array.from({ length: num }).map((_, i) => (
            <Star key={i} className="text-yellow-400 fill-yellow-400" />
          ))}
          {`${num}星以上`}
        </>
      ),
      value: String(num),
    })),
  ]

  //定義 Hero Banner 搜尋欄位
  const searchFields = [
    {
      label: '地區',
      component: (
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger className="w-full !bg-accent text-accent-foreground !h-10 shadow-md border-muted-foreground">
            <SelectValue placeholder="請選擇地區" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="all" value="all">
              全部
            </SelectItem>
            {locations.length === 0 ? (
              <div className="px-3 py-2 text-gray-400">沒有符合資料</div>
            ) : (
              locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id.toString()}>
                  {loc.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      ),
    },
    {
      label: '運動',
      component: (
        <Select value={sportId} onValueChange={setSportId}>
          <SelectTrigger className="w-full !bg-accent text-accent-foreground !h-10 shadow-md border-muted-foreground">
            <SelectValue placeholder="請選擇運動" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="all" value="all">
              全部
            </SelectItem>
            {sports?.length === 0 ? (
              <div className="px-3 py-2 text-gray-400">沒有符合資料</div>
            ) : (
              sports.map((sport) => (
                <SelectItem key={sport.id} value={sport.id.toString()}>
                  {sport.name || sport.id}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      ),
    },
    {
      label: '評分',
      component: (
        <Select value={minRating} onValueChange={setMinRating}>
          <SelectTrigger className="w-full !bg-accent text-accent-foreground !h-10 shadow-md border-muted-foreground">
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
      ),
    },
    {
      label: '關鍵字',
      component: (
        <div className="relative flex items-center">
          <Search
            className="absolute left-3 text-accent-foreground/50"
            size={20}
          />
          <Input
            type="search"
            className="w-full !bg-accent text-accent-foreground !h-10 pl-10 shadow-md border-muted-foreground"
            placeholder="請輸入關鍵字"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(keyword)
            }}
          />
        </div>
      ),
    },
  ]
  // #endregion 資料顯示選項

  // #region 頁面渲染
  return (
    <>
      <Navbar />
      <BreadcrumbAuto />
      <HeroBanner
        backgroundImage="/banner/venue-banner.jpg"
        title="馬上預訂動起來"
      >
        <SearchField
          fields={searchFields}
          onSearch={() => handleSearch(keyword)}
          searchButtonText="搜尋"
        />
      </HeroBanner>
      <ScrollAreaSport
        sportItems={sports}
        onSportSelect={(id) => {
          setSportId(id.toString())
          handleSearch(keyword, id)
        }}
      />
      <main className="px-4 md:px-6 py-10">
        <div className="flex flex-col container mx-auto max-w-screen-xl gap-6">
          <div className="flex justify-between items-center">
            {/* 篩選結果資訊 */}
            <p className="text-sm mt-2 hidden lg:inline">
              {safeKeyword && (
                <>
                  <span>關鍵字</span>
                  <span className="font-bold text-highlight">
                    「{safeKeyword}」
                  </span>
                </>
              )}
              共 {data?.totalRows} 筆資料
            </p>
            <h3 className="text-center text-base md:text-lg font-normal md:tracking-[24px]">
              精·選·場·館
            </h3>
            {/* 重設篩選按鈕 */}
            <Button
              variant="outline"
              onClick={handleResetFilter}
              className="text-sm"
              disabled={!locationId && !sportId && !minRating && !safeKeyword}
            >
              <BrushCleaning />
              <span className="hidden lg:inline">清除篩選</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.rows.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-12 text-lg">
                <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">
                  沒有符合資料，請重新搜尋
                </h3>
              </div>
            ) : (
              data?.rows.map((data) => <CenterCard key={data.id} data={data} />)
            )}
          </div>
          {data?.rows.length > 0 && (
            <PaginationBar
              page={data.page}
              totalPages={data.totalPages}
              perPage={data.perPage}
              onPageChange={(targetPage) => {
                handlePagination(targetPage)
              }}
            />
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}

// 主要導出組件，包含 Suspense 邊界
export default function VenueListPage() {
  return (
    <Suspense fallback={<LoadingState message="載入場館資料中..." />}>
      <VenueListContent />
    </Suspense>
  )
}
