'use client'
// hooks
import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCourse } from '@/contexts/course-context'

// 資料請求函式庫
import useSWR from 'swr'

// API 請求
import { fetchCoachOptions, fetchSportOptions } from '@/api'
import { fetchLessons } from '@/api/course/lesson'

// Icon
import { AlertCircle, BrushCleaning } from 'lucide-react'

// UI 元件
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// 自訂元件
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import HeroBanner, { SearchField } from '@/components/hero-banner'
import ScrollAreaSport from '@/components/scroll-area-sport'
import CourseCard from '@/components/card/course-card'
import { LoadingState, ErrorState } from '@/components/loading-states'

// 將使用 useSearchParams 的邏輯抽取到單獨的組件
function CourseListContent() {
  // #region 路由和URL參數
  const searchParams = useSearchParams()
  const queryParams = useMemo(() => {
    const entries = Object.fromEntries(searchParams.entries())
    return entries
  }, [searchParams])
  const router = useRouter()
  const { setCourseData } = useCourse()

  // #region 狀態管理
  const [coachId, setCoachId] = useState('')
  const [sportId, setSportId] = useState('')
  const [coaches, setCoaches] = useState([])
  const [sports, setSports] = useState([])

  // ===== 新增：關鍵字搜尋狀態 =====
  const [keyword, setKeyword] = useState('')

  // ===== 課程資料狀態 =====
  const [courses, setCourses] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRows, setTotalRows] = useState(0)

  // #region 數據獲取
  const {
    data,
    isLoading: isDataLoading,
    error,
    mutate,
  } = useSWR(
    ['lessons', { ...queryParams, page: currentPage }],
    async ([, params]) => {
      // await new Promise((r) => setTimeout(r, 3000)) // 延遲測試載入動畫
      return fetchLessons(params)
    },
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      fallbackData: null, // 改為 null，避免誤判為沒有數據
    }
  )

  // 當數據更新時，處理分頁邏輯
  useEffect(() => {
    if (data) {
      if (currentPage === 1) {
        // 第一頁：直接設置課程
        setCourses(data.rows || [])
      } else {
        // 其他頁：追加到現有課程
        setCourses((prev) => [...prev, ...(data.rows || [])])
      }
      setTotalPages(data.totalPages || 1)
      setTotalRows(data.totalRows || 0)
    }
  }, [data, currentPage])

  // #region 副作用處理
  // ===== 載入資料 =====
  useEffect(() => {
    const loadData = async () => {
      try {
        const coachData = await fetchCoachOptions()
        setCoaches(coachData.rows || [])

        const sportData = await fetchSportOptions()
        setSports(sportData.rows || [])
      } catch (error) {
        console.error('載入資料失敗:', error)
      }
    }
    loadData()
  }, [])

  // #region 事件處理函數
  // ===== 搜尋和篩選功能 =====
  const handleSearch = (kw = keyword, customSportId) => {
    const searchKeyword = typeof kw === 'string' ? kw.trim() : ''
    console.log('搜尋:', {
      coachId,
      sportId,
      keyword: searchKeyword,
      customSportId,
    })

    // 重置到第一頁
    setCurrentPage(1)
    setCourses([]) // 清空現有課程

    // 更新 URL 參數，觸發 SWR 重新請求
    const params = new URLSearchParams()
    if (coachId) params.set('coachId', coachId)
    const sportParam = customSportId || sportId
    if (sportParam) params.set('sportId', sportParam)
    if (searchKeyword) params.set('keyword', searchKeyword)
    params.set('page', '1')

    router.push(`/course?${params.toString()}`)
  }

  // ===== 重設篩選功能 =====
  const handleResetFilter = () => {
    setCoachId('')
    setSportId('')
    setKeyword('')
    setCurrentPage(1)
    setCourses([])
    router.push('/course')
  }

  const handleBooking = (e) => {
    e.preventDefault()
    setCourseData((prev) => ({
      ...prev,
      lessonId: id,
    }))
    // 跳轉到預約頁面
    router.push('/course/payment')
  }

  // ===== 載入更多課程功能 =====
  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  //  #region 載入和錯誤狀態處理
  if (isDataLoading && data === null)
    return <LoadingState message="載入課程資料中..." />
  if (error)
    return (
      <ErrorState
        title="課程資料載入失敗"
        message={`載入錯誤：${error.message}` || '找不到您要查看的課程資料'}
        onRetry={mutate}
        backUrl="/"
        backLabel="返回首頁"
      />
    )

  // #region 資料顯示選項
  // ===== 檢查是否還有更多課程可載入 =====
  const hasMoreCourses = currentPage < totalPages

  // 定義 Hero Banner 搜尋欄位
  const searchFields = [
    {
      label: '教練',
      component: (
        <Select value={coachId} onValueChange={setCoachId}>
          <SelectTrigger className="w-full !bg-accent !h-10 shadow-md border-muted-foreground text-accent-foreground">
            <SelectValue placeholder="請選擇教練" />
          </SelectTrigger>
          <SelectContent>
            {coaches.length === 0 ? (
              <div className="px-3 py-2 text-gray-400">沒有符合資料</div>
            ) : (
              coaches.map((coa) => (
                <SelectItem key={coa.id} value={coa.id.toString()}>
                  {coa.member.name}
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
          <SelectTrigger className="w-full !bg-accent !h-10 shadow-md border-muted-foreground text-accent-foreground">
            <SelectValue placeholder="請選擇運動" />
          </SelectTrigger>
          <SelectContent>
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
      label: '快速查詢',
      component: (
        <Input
          type="text"
          placeholder="請輸入課程名稱或關鍵字"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full h-10 !bg-accent text-black shadow-md border-muted-foreground"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch()
            }
          }}
        />
      ),
    },
  ]

  // #region 頁面渲染
  return (
    <>
      <Navbar />
      <BreadcrumbAuto />
      <HeroBanner
        backgroundImage="/banner/class-banner.jpg"
        title="您的完美課程，就在這裡"
      >
        <SearchField
          fields={searchFields}
          onSearch={handleSearch}
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

      <section className="py-10">
        <div className="container mx-auto max-w-screen-xl px-4">
          <div className="flex justify-between items-center mb-6">
            {/* 篩選結果資訊 */}
            <p className="text-sm mt-2 hidden lg:inline">
              {keyword.trim() && (
                <>
                  <span>關鍵字</span>
                  <span className="text-highlight">「{keyword}」</span>
                </>
              )}
              共 {courses.length} 門課程
            </p>
            <h3 className="text-center text-base md:text-lg font-normal md:tracking-[24px]">
              精·選·課·程
            </h3>
            {/* 重設篩選按鈕 */}
            <Button
              variant="outline"
              onClick={handleResetFilter}
              className="text-sm"
              disabled={!coachId && !sportId && !keyword.trim()}
            >
              <BrushCleaning />
              <span className="hidden lg:inline">清除篩選</span>
            </Button>
          </div>

          {/* 動態顯示課程卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {courses.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-12 text-lg">
                <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">
                  沒有符合資料，請重新搜尋
                </h3>
              </div>
            ) : (
              courses.map((course, index) => (
                <CourseCard key={index} course={course} />
              ))
            )}
          </div>

          {/* 載入更多按鈕 */}
          {hasMoreCourses && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isDataLoading}
                className="px-8 py-3"
              >
                {isDataLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    載入中...
                  </>
                ) : (
                  <>
                    載入更多課程
                    <span className="ml-2 text-sm text-gray-500">
                      ({totalRows - courses.length} 門課程待載入)
                    </span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* 已載入完所有課程的提示 */}
          {courses.length > 0 && !hasMoreCourses && totalRows > 6 && (
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm">
                已載入全部 {totalRows} 門課程
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}

// 主要導出組件，包含 Suspense 邊界
export default function VenueListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">載入課程資料中...</p>
          </div>
        </div>
      }
    >
      <CourseListContent />
    </Suspense>
  )
}
