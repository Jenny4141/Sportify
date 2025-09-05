'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import HeroBannerMember from '@/components/hero-banner-member'
import ScrollAreaMember from '@/components/scroll-area-member'
import { useAuth } from '@/contexts/auth-context'
import { PaginationBar } from '@/components/pagination-bar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getUserReservations } from '@/api/venue/reservation'

// 將使用 useSearchParams 的邏輯抽取到單獨的組件
function VenueDataContent() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [allReservations, setAllReservations] = useState([])
  const [reservationDetails, setReservationDetails] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  // 分頁相關狀態
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10) // 預設桌面版 10 筆

  // 路由和URL參數
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryParams = useMemo(() => {
    const entries = Object.fromEntries(searchParams.entries())
    return entries
  }, [searchParams])

  // 根據螢幕寬度設定每頁資料筆數
  useEffect(() => {
    const updatePerPage = () => {
      if (window.innerWidth < 768) {
        setPerPage(6) // 手機版 6 筆
      } else {
        setPerPage(10) // 桌面版 10 筆
      }
    }

    // 初始化設定
    updatePerPage()

    // 監聽視窗大小變化
    window.addEventListener('resize', updatePerPage)

    // 清理事件監聽器
    return () => {
      window.removeEventListener('resize', updatePerPage)
    }
  }, [])

  // 處理分頁
  const handlePagination = (targetPage) => {
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('page', String(targetPage))
    newParams.set('perPage', String(perPage))
    router.push(`?${newParams.toString()}`)
  }

  const fetchReservations = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('開始獲取場地預約列表...')
      console.log('當前用戶:', user)
      console.log('用戶 ID:', user?.id)

      const result = await getUserReservations()
      console.log('場地預約列表 API 回應:', result)
      console.log('回應狀態碼:', result.code)

      if (result.code === 200) {
        console.log('場地預約列表資料:', result)
        // 後端回傳的資料直接存在 result 物件中
        const allReservationsData = Array.isArray(result.rows)
          ? result.rows
          : []
        console.log('處理後的預約資料:', allReservationsData)
        console.log('預約資料長度:', allReservationsData.length)

        // 保存所有預約資料
        setAllReservations(allReservationsData)

        // 計算分頁
        const totalItems = allReservationsData.length
        const totalPagesCount = Math.ceil(totalItems / perPage)
        setTotalPages(totalPagesCount)

        // 獲取當前頁的資料
        const startIndex = (currentPage - 1) * perPage
        const endIndex = startIndex + perPage
        const currentPageData = allReservationsData.slice(startIndex, endIndex)

        setReservations(currentPageData)
        console.log('當前頁資料:', currentPageData)
      } else {
        console.error('獲取場地預約列表失敗:', result.error)
        console.error('錯誤代碼:', result.code)
        // 處理不同的錯誤情況
        if (result.error === '請先登入' || result.code === 401) {
          setError('請先登入')
        } else if (result.error === '找不到預約列表' || result.code === 404) {
          setError('找不到預約列表')
        } else {
          setError(result.error || '獲取場地預約列表失敗')
        }
      }
    } catch (err) {
      console.error('獲取場地預約列表錯誤:', err)
      console.error('錯誤詳情:', err.response)
      if (err.response?.status === 401) {
        setError('請先登入')
      } else if (err.response?.status === 404) {
        setError('找不到預約列表')
      } else if (err.code === 'NETWORK_ERROR') {
        setError('網路連線錯誤，請檢查網路連線')
      } else {
        setError('獲取場地預約列表時發生錯誤')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 當 user 改變時重新獲取預約資料
  useEffect(() => {
    if (user) {
      fetchReservations()
    }
  }, [user])

  // 當 URL 參數改變時更新當前頁面
  useEffect(() => {
    const page = parseInt(queryParams.page) || 1
    setCurrentPage(page)
  }, [queryParams.page])

  // 當當前頁面改變時重新計算分頁資料
  useEffect(() => {
    if (allReservations.length > 0 && currentPage) {
      // 重新計算當前頁的資料
      const startIndex = (currentPage - 1) * perPage
      const endIndex = startIndex + perPage
      const currentPageData = allReservations.slice(startIndex, endIndex)
      setReservations(currentPageData)
    }
  }, [currentPage, allReservations, perPage])

  // 當 perPage 改變時重新計算分頁
  useEffect(() => {
    if (allReservations.length > 0 && perPage) {
      // 重新計算總頁數
      const totalItems = allReservations.length
      const newTotalPages = Math.ceil(totalItems / perPage)
      setTotalPages(newTotalPages)

      // 重新計算當前頁面，確保不會超出範圍
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      } else {
        // 重新計算當前頁的資料
        const startIndex = (currentPage - 1) * perPage
        const endIndex = startIndex + perPage
        const currentPageData = allReservations.slice(startIndex, endIndex)
        setReservations(currentPageData)
      }
    }
  }, [perPage, allReservations])

  return (
    <>
      <Navbar />
      <BreadcrumbAuto />
      <HeroBannerMember
        backgroundImage="/banner/member-banner.jpg"
        title="會員中心"
      ></HeroBannerMember>
      <ScrollAreaMember />
      <section className="py-10">
        <div className="container flex justify-center mx-auto max-w-screen-xl px-4">
          <div
            className="bg-card rounded-xl border bg-card py-6
          text-card-foreground shadow-sm rounded-lg p-6 w-full"
          >
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-accent-foreground">
                    場地預訂紀錄
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    管理您的場地預訂紀錄
                  </p>
                  {!isLoading && !error && (
                    <p className="text-sm text-muted-foreground mt-1">
                      共有 {allReservations.length} 筆預訂紀錄
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={fetchReservations}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  )}
                  重新整理
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-lg text-muted-foreground">
                  載入場地預約列表中...
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center py-12">
                <div className="text-red-500 text-lg mb-4">{error}</div>
                <Button
                  variant="outline"
                  onClick={fetchReservations}
                  className="flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  重試
                </Button>
              </div>
            ) : reservations.length === 0 ? (
              <div className="flex flex-col justify-center items-center py-12">
                <div className="text-muted-foreground text-lg mb-4">
                  您還沒有任何場地預約記錄
                </div>
                <div className="text-muted-foreground text-sm mb-6">
                  去預約您喜歡的場地吧！
                </div>
                <Button
                  variant="default"
                  onClick={() => window.open('/venue', '_blank')}
                  className="flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  去預約場地
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader className="border-b-2 border-card-foreground">
                      <TableRow className="text-lg">
                        <TableHead className="font-bold w-1/4 md:w-1/4 text-accent-foreground">
                          預約編號
                        </TableHead>
                        <TableHead className="font-bold w-1/4 md:w-1/4 text-accent-foreground text-start">
                          場地資訊
                        </TableHead>
                        <TableHead className="font-bold w-1/4 md:w-1/4 text-accent-foreground text-center">
                          預約日期
                        </TableHead>
                        <TableHead className="font-bold w-1/4 md:w-1/4 text-accent-foreground text-center">
                          狀態
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-foreground">
                      {reservations.map((reservation, index) => {
                        return (
                          <TableRow
                            key={reservation.id || index}
                            className="border-b border-card-foreground hover:bg-muted/50"
                          >
                            <TableCell className="font-medium text-base py-4 text-accent-foreground">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="font-base line-clamp-2 leading-tight">
                                    {reservation?.invoiceNumber ||
                                      reservation?.id ||
                                      '預約編號'}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className=" text-base py-4 text-accent-foreground text-start ">
                              <div className="grid grid-cols-1 md:grid-cols-2 md:w-[200px] gap-1">
                                {reservation?.courtTimeSlots?.map(
                                  (slot, slotIndex) => (
                                    <div key={slotIndex} className="text-sm">
                                      <span className="font-base text-primary">
                                        {slot.courtName}
                                      </span>
                                      <br />
                                      <span className="text-muted-foreground">
                                        {slot.timeLabel}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-base py-4 text-accent-foreground text-center">
                              <span className="font-base">
                                {reservation?.date || '預約日期'}
                              </span>
                            </TableCell>
                            <TableCell className="text-base py-4 text-accent-foreground text-center">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  reservation?.status?.name === '已確認'
                                    ? 'bg-green-100 text-green-800'
                                    : reservation?.status?.name === '待確認'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {reservation?.status?.name || '未知狀態'}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 分頁組件 - 移到卡片外面 */}
        {!isLoading &&
          !error &&
          allReservations.length > 0 &&
          totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <PaginationBar
                page={currentPage}
                totalPages={totalPages}
                perPage={perPage}
                onPageChange={(targetPage) => {
                  handlePagination(targetPage)
                }}
              />
            </div>
          )}
      </section>
      <Footer />
    </>
  )
}

// 主要導出組件，包含 Suspense 邊界
export default function VenueDataPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">載入場館預訂資料中...</p>
          </div>
        </div>
      }
    >
      <VenueDataContent />
    </Suspense>
  )
}
