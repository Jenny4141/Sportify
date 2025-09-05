'use client'

// hooks
import React, { useState, useEffect } from 'react'
import { useCourse } from '@/contexts/course-context'

// Icon

// API 請求
import { fetchLesson } from '@/api/course/lesson'
import { getLessonImageUrl } from '@/api/course/image'

// next 元件
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'

// UI 元件
import { Button } from '@/components/ui/button'

// 自訂元件
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import CourseImg from '../_compoents/course-img'
import { LoadingState, ErrorState } from '@/components/loading-states'

export default function CourseDetailPage() {
  // #region 路由和URL參數
  const { id } = useParams()
  const router = useRouter()
  const { setCourseData } = useCourse()

  // #region 組件狀態管理
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // #region 副作用處理
  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        setLoading(true)
        // await new Promise((r) => setTimeout(r, 3000)) // 延遲測試載入動畫
        const lessonData = await fetchLesson(id)
        setData(lessonData.record)
      } catch (err) {
        console.error('Error fetching lesson detail:', err)
        setError(err.message)
        toast.error('載入場館資料失敗')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchLessonData()
    }
  }, [id])

  // #region 事件處理函數
  const handleBooking = (e) => {
    e.preventDefault()
    setCourseData((prev) => ({
      ...prev,
      lessonId: id,
    }))
    // 跳轉到預約頁面
    router.push('/course/payment')
  }

  //  #region 載入和錯誤狀態處理
  if (loading) {
    return <LoadingState message="載入場館資料中..." />
  }

  // #region 資料顯示選項
  const courseImages = [
    { id: 1, src: getLessonImageUrl(data.images[1]), alt: '桌球教學 1' },
    { id: 2, src: getLessonImageUrl(data.images[2]), alt: '桌球教學 2' },
    { id: 3, src: getLessonImageUrl(data.images[3]), alt: '桌球教學 3' },
    { id: 4, src: getLessonImageUrl(data.images[4]), alt: '桌球教學 4' },
  ]

  return (
    <>
      <Navbar />
      <BreadcrumbAuto courseName={data?.title} />

      {/* 課程資訊區域 */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* 主標題 */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-foreground mb-12 sm:mb-16 lg:mb-20">
            {data.title}
          </h1>

          {/* 主要內容區域 - 響應式並排 */}
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 lg:gap-12 mb-12 sm:mb-16 lg:mb-20">
            {/* 左側 - 主圖片 (桌機版左側，手機版上方) */}
            <div className="md:w-1/2">
              <img
                src={getLessonImageUrl(data.images[0])}
                alt="桌球教學主圖"
                className="w-full h-48 sm:h-64 lg:h-auto rounded-lg object-cover"
              />
            </div>

            {/* 右側 - 課程資訊 (桌機版右側，手機版下方) */}
            <div className="text-foreground md:w-1/2">
              <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6">
                課程簡介說明:
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8 text-primary">
                {data.description}
              </p>

              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                課程特色:
              </h3>
              <ul className="space-y-1 text-xs sm:text-sm text-primary mb-6 sm:mb-8">
                <li>• 小班教學，精緻化人數規劃</li>
                <li>• 豐富經驗，具備豐富教學心得</li>
                <li>• 專業師資，擁有專業訓練與認證</li>
                <li>• 完善設備，提供標準比賽設備規格</li>
              </ul>

              {/* 課程詳細資訊 */}
              <div className="text-sm leading-relaxed space-y-1 mb-6 sm:mb-8 text-popover-foreground bg-popover p-3 sm:p-4 rounded border shadow">
                <p>適合年齡：中學-高中、國小中學年以上</p>
                <p>
                  課程日期：{data.startDate} ~ {data.endDate}
                </p>
                <p>課程時間：{data.dayOfWeek}18:00-20:00</p>
                <p>上課人數：最大人數{data.maxCapacity}名以內完美學員</p>
                <p>上課教練：{data.coach_name}</p>
                <p>上課地點：{data.court_name}</p>
              </div>

              {/* 報名區域 */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <span className="text-primary text-xs sm:text-sm">
                    一期十堂
                  </span>
                  <span className="text-foreground text-lg sm:text-xl font-bold">
                    {data.price.toLocaleString()}
                  </span>
                </div>
                <Link href={`/course/payment`} className="w-full sm:w-auto">
                  <Button
                    onClick={handleBooking}
                    variant="highlight"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    立即報名
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 圖片區域 */}
      <div className="px-4 sm:px-20 flex w-full justify-center pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-4 lg:gap-6 w-full max-w-[1148px] mx-auto px-4 sm:px-0">
          {courseImages.map((img, index) => {
            return (
              <div
                key={img.id}
                className="w-full overflow-hidden rounded-lg shadow-lg sm:shadow-none"
              >
                <Image
                  width={540}
                  height={350}
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, 540px"
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-center pb-16">
        <Button asChild variant="outline" size="lg">
          <Link href="/course">返回課程總覽</Link>
        </Button>
      </div>

      <Footer />
    </>
  )
}
