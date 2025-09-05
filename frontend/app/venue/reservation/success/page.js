'use client'

// hooks
import React, { useState, useEffect, useMemo, Suspense } from 'react'

// Icon
import { FaXmark, FaCheck } from 'react-icons/fa6'
import { IconCircleCheckFilled, IconLoader } from '@tabler/icons-react'

// API 請求
import { fetchReservation } from '@/api/venue/reservation'
import { fetchCenter } from '@/api/venue/center'
import { getCenterImageUrl } from '@/api/venue/image'

// next 元件
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

// UI 元件
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { AspectRatio } from '@/components/ui/aspect-ratio'

// 自訂元件
import { Navbar } from '@/components/navbar'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import Step from '@/components/step'
import Footer from '@/components/footer'
import { LoadingState, ErrorState } from '@/components/loading-states'

// 將使用 useSearchParams 的邏輯抽取到單獨的組件
function SuccessPageContent() {
  // #region 路由和URL參數
  const searchParams = useSearchParams()

  // #region 狀態管理
  const [isSuccess, setIsSuccess] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [centerData, setCenterData] = useState(null)
  const [centerId, setCenterId] = useState('')
  const reservationId = searchParams.get('reservationId')
  const [reservationData, setReservationData] = useState(null)

  // #region 副作用處理

  // #region Reservation訂單資料
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!reservationId) {
        setError('未找到訂單 ID')
        setIsSuccess(false)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const result = await fetchReservation(reservationId)

        if (result.success && result.record) {
          setReservationData(result.record)
          setIsSuccess(true)

          // 提取 centerId 並取得場館資料
          const firstSlot = result.record.courtTimeSlots?.[0]
          if (firstSlot && firstSlot.centerId) {
            setCenterId(firstSlot.centerId)
          }
        } else {
          setError(result.message || '取得訂單資料失敗')
          setIsSuccess(false)
        }
      } catch (err) {
        console.error('取得訂單資料錯誤:', err)
        setError('載入訂單資料時發生錯誤')
        setIsSuccess(false)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderData()
  }, [reservationId])

  // #region Center中心資料
  useEffect(() => {
    const fetchCenterData = async () => {
      if (!centerId) return

      try {
        const centerResult = await fetchCenter(centerId)

        if (centerResult.success && centerResult.record) {
          setCenterData(centerResult.record)
        } else {
          console.error('取得 Center 資料失敗:', centerResult.message)
        }
      } catch (err) {
        console.error('Error fetching center detail:', err)
        console.error('載入場館資料失敗')
      }
    }

    fetchCenterData()
  }, [centerId])

  // #region 事件處理函數
  // 格式化價格，加上千分位逗號
  const formatPrice = (price) => {
    return Number(price).toLocaleString('zh-TW')
  }

  // 計算總金額 (從 courtTimeSlots 計算或使用 price)
  const totalPrice = reservationData?.price || 0

  // #region 載入和錯誤狀態處理
  if (loading) {
    return <LoadingState message="載入訂單資料中..." />
  }

  // #region 資料顯示選項
  const steps = [
    { id: 1, title: '選擇場地與時間', completed: true },
    { id: 2, title: '填寫付款資訊', completed: true },
    { id: 3, title: '完成訂單', active: true },
  ]

  const summaries = [
    {
      key: '訂單編號',
      value: reservationId || '未知',
    },
    {
      key: '預訂人',
      value: reservationData?.memberName || '未知',
    },
    {
      key: '電話號碼',
      value: reservationData?.member?.phone || '未知',
    },
    {
      key: '建立時間',
      value: reservationData?.createdAt || '未知',
    },
    {
      key: '發票號碼',
      value: reservationData?.invoiceNumber || '未知',
    },
    {
      key: '發票類型',
      value: (
        <>
          {reservationData?.invoice.name || '未知'}
          {reservationData?.invoiceId === 2 && (
            <span className="ml-2 text-muted-foreground">
              {reservationData?.tax ? `${reservationData.tax}` : ''}
            </span>
          )}
          {reservationData?.invoiceId === 3 && (
            <span className="ml-2 text-muted-foreground">
              {reservationData?.carrier ? `${reservationData.carrier}` : ''}
            </span>
          )}
        </>
      ),
    },
    {
      key: '付款方式',
      value: reservationData?.payment?.name || '未知',
    },
    {
      key: '狀態',
      value: (
        <>
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {reservationData?.status?.name === '已付款' ? (
              <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
            ) : (
              <IconLoader />
            )}
            {reservationData?.status?.name || '未知'}
          </Badge>
        </>
      ),
    },
    {
      key: '訂單金額',
      value: (
        <span className="text-lg font-bold text-primary">
          NT$ {formatPrice(reservationData?.price) || '未知'}
        </span>
      ),
    },
  ]

  // #region 頁面渲染
  return (
    <>
      <Navbar />
      <BreadcrumbAuto />
      <main className="px-4 md:px-6 py-10">
        <div className="flex flex-col container mx-auto max-w-screen-xl min-h-screen gap-6">
          {/* 步驟 */}
          <section>
            <Step
              steps={steps}
              orientation="horizontal"
              onStepClick={(step, index) => {}}
            />
          </section>

          {/* 預訂成功訊息 */}
          <section>
            <div className="flex flex-col items-center gap-4 py-4 md:py-8">
              {isSuccess ? (
                <>
                  <div className="rounded-full bg-highlight p-4">
                    <FaCheck className="text-4xl text-accent" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    已完成預訂
                  </h2>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-highlight p-4">
                    <FaXmark className="text-4xl text-accent" />
                  </div>
                  <h2 className="text-2xl font-bold text-accent">預訂失敗</h2>
                </>
              )}
            </div>
          </section>

          <div className="mx-auto md:max-w-2xl gap-6">
            <div className="flex flex-col gap-6">
              {/* 訂單詳細 */}
              <section className="w-full">
                {/* 訂單摘要卡片 */}
                <Card className="gap-0">
                  <CardHeader>
                    <h2 className="text-lg font-semibold">訂單詳情</h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Table className="w-full table-fixed">
                      {/* <TableCaption>
                        A list of your recent invoices.
                      </TableCaption> */}
                      <TableHeader>
                        {/* <TableRow>
                          <TableHead className="w-[100px]">Invoice</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow> */}
                      </TableHeader>
                      <TableBody>
                        {summaries.map((summary) => (
                          <TableRow
                            key={summary.key}
                            className="border-b border-muted-foreground/30"
                          >
                            <TableCell className="font-medium">
                              {summary.key}
                            </TableCell>
                            <TableCell className="text-right">
                              {summary.value}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      {/* <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3}>Total</TableCell>
                          <TableCell className="text-right">
                            $2,500.00
                          </TableCell>
                        </TableRow>
                      </TableFooter> */}
                    </Table>
                  </CardContent>
                </Card>
              </section>

              {/* 訂單確認 */}
              <section className="w-full">
                {/* 訂單摘要卡片 */}
                <Card>
                  <CardHeader className="flex flex-col md:flex-row justify-between gap-4">
                    {/* 場館資訊 */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">場館資訊</h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="text-base text-primary">
                          {centerData?.name || '載入中...'}
                        </div>
                        <div>{centerData?.address || '載入中...'}</div>
                        <div>
                          運動:{' '}
                          {reservationData?.courtTimeSlots[0]?.sportName ||
                            '載入中...'}
                        </div>
                      </div>
                    </div>
                    {/* 預約圖片 */}
                    {centerData &&
                    centerData.images &&
                    Array.isArray(centerData.images) &&
                    centerData.images.length > 0 ? (
                      <div className="w-full md:w-50 min-w-0 flex-shrink-0 overflow-hidden rounded-lg">
                        <AspectRatio ratio={4 / 3} className="bg-muted">
                          <Image
                            alt={centerData.name || '場館圖片'}
                            className="object-cover"
                            fill
                            priority
                            sizes="(max-width: 768px) 100vw, 320px"
                            src={getCenterImageUrl(centerData.images[0])}
                          />
                        </AspectRatio>
                      </div>
                    ) : (
                      <div className="w-full md:w-50 min-w-0 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 flex items-center justify-center">
                        <AspectRatio
                          ratio={4 / 3}
                          className="bg-muted flex items-center justify-center"
                        >
                          <span className="text-gray-500">無圖片</span>
                        </AspectRatio>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 預約日期 */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">預約日期</h3>
                      <div className="text-base text-primary">
                        {reservationData?.date || '未知日期'}
                      </div>
                    </div>

                    {/* 場地時段 */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">場地時段</h3>
                      {reservationData?.courtTimeSlots?.length > 0 ? (
                        <div className="space-y-2">
                          {reservationData.courtTimeSlots.map((slot, index) => (
                            <Alert
                              key={index}
                              className="text-sm text-muted-foreground bg-muted p-2 rounded"
                            >
                              <AlertTitle className="font-medium text-blue-500">
                                {slot.courtName}
                              </AlertTitle>
                              <AlertDescription className="flex justify-between">
                                <span>{slot.timeLabel}</span>
                                <span className="text-primary">
                                  NT$ {slot.price}
                                </span>
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          無場地時段資料
                        </div>
                      )}
                    </div>

                    {/* 總計 */}
                    {/* <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">
                          總計
                        </span>
                        <span className="text-lg font-bold text-primary">
                          NT$ {totalPrice}
                        </span>
                      </div>
                    </div> */}
                  </CardContent>
                </Card>
              </section>
            </div>
            {/* 按鈕區 */}
            <section className="mt-6">
              <div className="flex justify-between">
                <Link href="/member/venue-data">
                  <Button variant="outline">查看訂單</Button>
                </Link>
                <Link href="/venue">
                  <Button variant="highlight">返回列表頁</Button>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

// 主要導出組件，包含 Suspense 邊界
export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">載入預訂成功資料中...</p>
          </div>
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  )
}
