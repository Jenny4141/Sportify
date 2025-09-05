'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { FaXmark, FaCheck } from 'react-icons/fa6'
import { IconCircleCheckFilled, IconLoader } from '@tabler/icons-react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

// API 請求
import { fetchBooking } from '@/api/course/booking'
import { fetchLesson } from '@/api/course/lesson'
import { getLessonImageUrl } from '@/api/course/image'

// 元件
import { LoadingState, ErrorState } from '@/components/loading-states'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import Step from '@/components/step'
import Footer from '@/components/footer'
import { AspectRatio } from '@/components/ui/aspect-ratio'
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

const steps = [
  { id: 1, title: '選擇課程', completed: true },
  { id: 2, title: '填寫付款資訊', completed: true },
  { id: 3, title: '完成訂單', active: true },
]

// 將使用 useSearchParams 的邏輯抽取到單獨的組件
function CourseSuccessContent() {
  // #region 路由和URL參數
  const searchParams = useSearchParams()

  // #region 狀態管理
  const [isSuccess, setIsSuccess] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [lessonData, setLessonData] = useState(null)
  const [lessonId, setLessonId] = useState('')
  const bookingId = searchParams.get('bookingId')
  const [bookingData, setBookingData] = useState(null)

  // 訂單資訊狀態
  /* const [bookingData, setOrderData] = useState({
    // 課程資訊
    courseName: '桌球基礎班',
    courseType: '團體課程',
    instructor: '王教練',
    duration: '一期十堂',
    schedule: '週二 18:30-19:00',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-04-08'),
    location: '體育館青少年A教室',
    courseImage: '/course-pic/volleyball-course.png',

    // 訂單資訊
    orderNumber: '1234567890',
    orderDate: new Date(),
    totalPrice: 4800,

    // 用戶資訊
    userInfo: {
      name: '張美美',
      phone: '0912345678',
      email: 'example@email.com',
    },

    // 付款資訊
    paymentMethod: '線上付款',
    receiptType: '個人發票',
  }) */

  // 從 URL 參數讀取訂單資訊
  /* useEffect(() => {
    const dataParam = searchParams.get('data')
    if (dataParam) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(dataParam))
        // 處理日期字串轉換
        if (decodedData.startDate) {
          decodedData.startDate = new Date(decodedData.startDate)
        }
        if (decodedData.endDate) {
          decodedData.endDate = new Date(decodedData.endDate)
        }
        if (decodedData.orderDate) {
          decodedData.orderDate = new Date(decodedData.orderDate)
        }

        // 生成訂單編號（如果沒有的話）
        if (!decodedData.orderNumber) {
          decodedData.orderNumber = Date.now().toString()
        }

        setOrderData((prev) => ({ ...prev, ...decodedData }))
      } catch (error) {
        console.error('解析訂單資料失敗:', error)
      }
    }
  }, [searchParams]) */

  // #region Booking 訂單資料
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!bookingId) {
        setError('未找到訂單 ID')
        setIsSuccess(false)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const result = await fetchBooking(bookingId)

        if (result.success && result.record) {
          setBookingData(result.record)
          setIsSuccess(true)

          // 提取 lessonId 並取得課程資料
          if (result.record.lessonId) {
            setLessonId(result.record.lessonId)
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
  }, [bookingId])

  // #region Lesson 中心資料
  useEffect(() => {
    const fetchLessonData = async () => {
      if (!lessonId) return

      try {
        const lessonResult = await fetchLesson(lessonId)

        if (lessonResult.success && lessonResult.record) {
          setLessonData(lessonResult.record)
        } else {
          console.error('取得 Lesson 資料失敗:', lessonResult.message)
        }
      } catch (err) {
        console.error('Error fetching lesson detail:', err)
        console.error('載入場館資料失敗')
      }
    }

    fetchLessonData()
  }, [lessonId])

  // #region 載入和錯誤狀態處理
  if (loading) {
    return <LoadingState message="載入訂單資料中..." />
  }

  if (!isSuccess || error) {
    return <ErrorState message={error || '載入訂單資料失敗'} />
  }

  // #region 資料選項
  const summaries = [
    {
      key: '訂單編號',
      value: bookingId || '未知',
    },
    {
      key: '預訂人',
      value: bookingData?.memberName || '未知',
    },
    {
      key: '電話號碼',
      value: bookingData?.member?.phone || '未知',
    },
    {
      key: '建立時間',
      value: bookingData?.createdAt || '未知',
    },
    {
      key: '發票號碼',
      value: bookingData?.invoiceNumber || '未知',
    },
    {
      key: '發票類型',
      value: (
        <>
          {bookingData?.invoice?.name || '未知'}
          {bookingData?.invoiceId === 2 && (
            <span className="ml-2 text-muted-foreground">
              {bookingData?.carrier ? `載具: ${bookingData.carrier}` : ''}
            </span>
          )}
          {bookingData?.invoiceId === 3 && (
            <span className="ml-2 text-muted-foreground">
              {bookingData?.tax ? `統編: ${bookingData.tax}` : ''}
            </span>
          )}
        </>
      ),
    },
    {
      key: '付款方式',
      value: bookingData?.payment?.name || '未知',
    },
    {
      key: '狀態',
      value: (
        <>
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {bookingData?.status?.name === '已付款' ? (
              <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
            ) : (
              <IconLoader />
            )}
            {bookingData?.status?.name || '未知'}
          </Badge>
        </>
      ),
    },
    {
      key: '訂單金額',
      value: (
        <span className="text-lg font-bold text-primary">
          NT$ {bookingData?.price.toLocaleString() || '未知'}
        </span>
      ),
    },
  ]

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
              onStepClick={(step, index) => console.log('Clicked step:', step)}
            />
          </section>

          {/* 主要內容區域 */}
          <section>
            <div className="flex flex-col items-center gap-4 py-4 md:py-8">
              {/* 成功圖標和標題 */}
              <div className="rounded-full bg-highlight p-4">
                <FaCheck className="text-4xl text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">已完成預訂</h2>
            </div>
          </section>

          {/* 訂單內容 */}
          <div className="mx-auto md:max-w-2xl gap-6">
            {/* 雙欄布局 */}
            <div className="flex flex-col gap-6">
              {/* 訂單詳情 */}
              <Card className="gap-0">
                <CardHeader>
                  <h2 className="text-lg font-semibold">訂單詳情</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Table className="w-full table-fixed">
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
                  </Table>
                </CardContent>
              </Card>
              {/* 左側：課程資訊 */}
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">課程資訊</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 課程圖片 */}
                  {lessonData?.images && (
                    <div className="w-70 min-w-0 flex-shrink-0 overflow-hidden rounded-lg">
                      <AspectRatio ratio={16 / 9} className="bg-muted">
                        <Image
                          alt={bookingData?.lesson?.title || '課程'}
                          className="object-cover rounded"
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          src={getLessonImageUrl(lessonData.images[0])}
                        />
                      </AspectRatio>
                    </div>
                  )}

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">課程名稱:</span>
                      <span className="font-medium text-blue-600">
                        {bookingData?.lesson?.title || '未知'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">運動類型:</span>
                      <span className="font-medium">
                        {bookingData?.lesson?.sport?.name || '未知'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">授課教練:</span>
                      <span className="font-medium">
                        {bookingData?.lesson?.coach?.member?.name || '未知'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">開課日期:</span>
                      <span className="font-medium">
                        {bookingData?.lesson?.startDate
                          ? new Date(
                              bookingData.lesson.startDate
                            ).toLocaleDateString('zh-TW')
                          : '未知'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">結束日期:</span>
                      <span className="font-medium">
                        {bookingData?.lesson?.endDate
                          ? new Date(
                              bookingData.lesson.endDate
                            ).toLocaleDateString('zh-TW')
                          : '未知'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">上課地點:</span>
                      <span className="font-medium">
                        {bookingData?.lesson?.court?.name || '未知'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 按鈕區域 */}
            <div className="flex justify-between gap-4 mt-8">
              <Link href="/member/class-data">
                <Button variant="outline">查看訂單</Button>
              </Link>
              <Link href="/course">
                <Button variant="highlight">返回列表頁</Button>
              </Link>
            </div>
          </div>

          {/* 提醒訊息
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 max-w-2xl mx-auto">
                <p className="text-sm text-blue-800 text-center">
                  <strong>提醒：</strong>
                  我們已將訂單確認信寄至您的電子郵件 <span className="font-medium">{bookingData.userInfo.email}</span>，
                  請查收並保留此訂單資訊。如有任何問題，請聯繫客服。
                </p>
              </div> */}
        </div>
      </main>
      <Footer />
    </>
  )
}

// 主要導出組件，包含 Suspense 邊界
export default function CourseSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">載入課程成功資料中...</p>
          </div>
        </div>
      }
    >
      <CourseSuccessContent />
    </Suspense>
  )
}
