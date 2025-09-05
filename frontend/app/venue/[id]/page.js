'use client'

// hooks
import React, { useState, useEffect } from 'react'
import { useVenue } from '@/contexts/venue-context'

// utils
import { cn } from '@/lib/utils'

// Icon
import {
  Heart,
  Share,
  Star,
  ClipboardCheck,
  CircleParking,
  ShowerHead,
  MapPin,
  TrainFront,
  Bus,
} from 'lucide-react'
import {
  IconShoppingCart,
  IconBarbell,
  IconYoga,
  IconBike,
  IconTreadmill,
  IconWifi,
} from '@tabler/icons-react'
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
import {
  FacebookShareButton,
  LineShareButton,
  TwitterShareButton,
  ThreadsShareButton,
  FacebookIcon,
  LineIcon,
  XIcon,
  ThreadsIcon,
} from 'react-share'
import { FaFacebook } from 'react-icons/fa6'

// API 請求
import { fetchCenter } from '@/api/venue/center'
import { getCenterImageUrl } from '@/api/venue/image'
import { addRating, getCenterRatings } from '@/api/venue/rating'

// next 元件
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// UI 元件
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Rating, RatingButton } from '@/components/ui/rating'

// 自訂元件
import { Navbar } from '@/components/navbar'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import Footer from '@/components/footer'
import { LoadingState, ErrorState } from '@/components/loading-states'
import { CardFooter } from '@/components/card/card'

// 使用 Map 提供互動式地圖功能
const Map = dynamic(() => import('@/components/map'), {
  ssr: false,
})

const range = (length) => Array.from({ length }, (_, i) => i)

// #region 評論區元件
function RatingSection({ centerId }) {
  const [userRating, setUserRating] = React.useState(0)
  const [comment, setComment] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // 分頁評論相關狀態
  const [ratings, setRatings] = React.useState([])
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalRows, setTotalRows] = React.useState(0)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [initialLoading, setInitialLoading] = React.useState(true)

  // 初次載入評論
  React.useEffect(() => {
    const fetchInitialRatings = async () => {
      try {
        setInitialLoading(true)
        const result = await getCenterRatings(centerId, {
          page: 1,
          perPage: 5,
        })
        setRatings(result.ratings || [])
        setPage(result.page || 1)
        setTotalPages(result.totalPages || 1)
        setTotalRows(result.totalRows || 0)
      } catch (error) {
        console.error('載入評論失敗:', error)
        toast.error('載入評論失敗')
      } finally {
        setInitialLoading(false)
      }
    }

    if (centerId) {
      fetchInitialRatings()
    }
  }, [centerId])

  // 載入更多評論
  const handleLoadMore = async () => {
    if (page >= totalPages) return

    setLoadingMore(true)
    try {
      const nextPage = +page + 1
      const result = await getCenterRatings(centerId, {
        page: nextPage,
        perPage: 5,
      })
      setRatings((prev) => [...prev, ...(result.ratings || [])])
      setPage(nextPage)
    } catch (error) {
      console.error('載入更多評論失敗:', error)
      toast.error('載入更多評論失敗')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleSubmitRating = async () => {
    if (userRating === 0) {
      toast.error('請選擇評分')
      return
    }

    setIsSubmitting(true)
    try {
      await addRating(centerId, {
        rating: userRating,
        comment: comment || null,
      })
      toast.success('評分提交成功')
      setUserRating(0)
      setComment('')

      // 重新載入第一頁評論
      const result = await getCenterRatings(centerId, { page: 1, perPage: 5 })
      setRatings(result.ratings || [])
      setPage(1)
      setTotalPages(result.totalPages || 1)
      setTotalRows(result.totalRows || 0)
    } catch (error) {
      console.error('評分提交失敗:', error)
      toast.error('評分提交失敗')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <section>
      <h2 className="mb-6 text-xl font-bold">評價與評論</h2>

      {/* 評分輸入區 */}
      <Card className="mb-6">
        {/* <CardHeader>
          <h3 className="text-lg font-semibold">留下您的評價</h3>
        </CardHeader> */}
        <CardContent className="space-y-4">
          {/* 星星評分 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">評分</label>
            <div className="flex items-center gap-1">
              <Rating
                value={userRating}
                onValueChange={(v) => setUserRating(v)}
                className="text-yellow-400"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <RatingButton key={i} size={25} />
                ))}
              </Rating>
              <span className="ml-2 text-sm text-muted-foreground">
                {userRating > 0 && `${userRating} 星`}
              </span>
            </div>
          </div>

          {/* 評論輸入 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">評論 (選填)</label>
            <Textarea
              placeholder="分享您的使用體驗..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmitRating}
            disabled={isSubmitting || userRating === 0}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? '提交中...' : '提交評價'}
          </Button>
        </CardContent>
      </Card>

      {/* 其他人的評論 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">其他評價 ({totalRows || 0})</h3>

        {initialLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>載入評價中...</p>
          </div>
        ) : ratings && ratings.length > 0 ? (
          <div className="space-y-4">
            {ratings.map((rating, index) => (
              <Card key={rating.id || index} className="gap-2">
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={rating.member?.avatar} />
                      <AvatarFallback>
                        {(
                          rating.member?.name ||
                          rating.member_name ||
                          '匿名用戶'
                        ).charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm md:text-base">
                            {rating.member?.name ||
                              rating.member_name ||
                              '匿名用戶'}
                          </span>
                          <div className="flex items-center">
                            {range(5).map((i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-4 w-4',
                                  i < rating.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-yellow-400'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs md:text-sm text-muted-foreground ">
                          {formatDate(rating.created_at || rating.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                {rating.comment && (
                  <CardFooter>
                    <p className="pl-12 text-sm text-muted-foreground leading-relaxed">
                      {rating.comment}
                    </p>
                  </CardFooter>
                )}
              </Card>
            ))}

            {/* 載入更多按鈕 */}
            {page < totalPages && (
              <div className="text-center pt-4">
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {loadingMore
                    ? '載入中...'
                    : `載入更多評價 (剩餘 ${totalRows - ratings.length} 則)`}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="mx-auto mb-2 text-muted-foreground/50" />
            <p>尚無評價，成為第一個評價的人吧！</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default function CenterDetailPage() {
  // #region 路由和URL參數
  const { id } = useParams()
  const router = useRouter()
  const { setVenueData } = useVenue()

  // #region 組件狀態管理
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // #region 副作用處理
  useEffect(() => {
    const fetchCenterData = async () => {
      try {
        setLoading(true)
        // await new Promise((r) => setTimeout(r, 3000)) // 延遲測試載入動畫
        const centerData = await fetchCenter(id)
        setData(centerData.record)
      } catch (err) {
        console.error('Error fetching center detail:', err)
        setError(err.message)
        toast.error('載入場館資料失敗')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchCenterData()
    }
  }, [id])

  // #region 事件處理函數
  const handleReservation = (e) => {
    e.preventDefault()
    setVenueData((prev) => ({
      ...prev,
      center: data.name,
      location: data.location.name,
      centerId: data.id,
      locationId: data.location.id,
    }))
    // 跳轉到預約頁面
    router.push('/venue/reservation')
  }

  const handleSportButton = (item) => {
    setVenueData((prev) => ({
      ...prev,
      center: data.name,
      centerId: data.id,
      location: data.location.name,
      locationId: data.location.id,
      sport: item.name,
      sportId: item.id,
    }))
    // 跳轉到預約頁面
    router.push('/venue/reservation')
  }

  //  #region 載入和錯誤狀態處理
  if (loading) {
    return <LoadingState message="載入場館資料中..." />
  }

  if (error || !data) {
    const retryFetch = () => {
      const fetchCenterData = async () => {
        try {
          setLoading(true)
          setError(null)
          const centerData = await fetchCenter(id)
          setData(centerData.record)
        } catch (err) {
          console.error('Error fetching center detail:', err)
          setError(err.message)
          toast.error('載入場館資料失敗')
        } finally {
          setLoading(false)
        }
      }
      fetchCenterData()
    }

    return (
      <ErrorState
        title="場館資料載入失敗"
        message={error || '找不到您要查看的場館資料'}
        onRetry={retryFetch}
        backUrl="/venue"
        backLabel="返回場館列表"
      />
    )
  }

  // #region 資料顯示選項
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

  const facilityItems = [
    { icon: CircleParking, label: '停車場' },
    { icon: ShowerHead, label: '淋浴間' },
    { icon: IconShoppingCart, label: '運動用品店' },
    { icon: IconBarbell, label: '健身房' },
    { icon: IconYoga, label: '瑜珈教室' },
    { icon: IconBike, label: '飛輪教室' },
    { icon: IconTreadmill, label: '體適能教室' },
    { icon: IconWifi, label: 'Wi-Fi' },
  ]

  const businessHours = {
    星期一: '08:00-20:00',
    星期二: '08:00-20:00',
    星期三: '08:00-20:00',
    星期四: '08:00-20:00',
    星期五: '08:00-20:00',
    星期六: '08:00-20:00',
    星期日: '休館',
  }
  // 使用 API 資料的位置，如果沒有則使用預設位置
  const position =
    data &&
    typeof data.latitude === 'number' &&
    typeof data.longitude === 'number'
      ? [data.latitude, data.longitude]
      : [25.034053953650112, 121.54344508654384]
  // #endregion 資料顯示選項

  // #region 頁面渲染
  return (
    <>
      <Navbar />
      <BreadcrumbAuto venueName={data?.name} />
      <main className="px-4 md:px-6 py-10">
        <div className="flex flex-col container mx-auto max-w-screen-xl min-h-screen">
          {/* 標題與按鈕 */}
          <section className="flex flex-col md:flex-row justify-between items-start gap-6">
            {/* Title & rating */}
            <div>
              <h1 className="text-3xl font-bold">{data.name}</h1>

              <div className="mt-2 flex items-center gap-2">
                {/* Stars */}
                <div
                  aria-label={`Rating ${data.averageRating || 0} out of 5`}
                  className="flex items-center"
                >
                  {range(5).map((i) => (
                    <Star
                      className={`
                          h-5 w-5
                          ${
                            i < Math.floor(data.averageRating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : i < (data.averageRating || 0)
                                ? 'fill-yellow-400/50 text-yellow-400'
                                : 'text-yellow-400'
                          }
                        `}
                      key={`star-${i}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({Number(data.averageRating || 0).toFixed(1)})
                </span>
              </div>
            </div>
            {/* Buttons */}
            <div className="flex flex-col md:flex-row gap-2 w-full sm:w-auto">
              <Link href={`/venue/reservation`} className="w-full sm:w-auto">
                <Button
                  onClick={handleReservation}
                  variant="highlight"
                  size="lg"
                  className="w-full"
                >
                  預訂
                  <ClipboardCheck />
                </Button>
              </Link>
              <div className="flex flex-row gap-2 w-full sm:w-auto">
                <div className="w-1/2 sm:w-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full md:w-auto"
                        size="lg"
                      >
                        分享
                        <Share />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-fit px-2 py-2">
                      <div className="flex flex-row gap-2 w-full sm:w-auto">
                        <FacebookShareButton url={window.location.href}>
                          {/* <FaFacebook size={30} color="#1f7bf2" /> */}
                          <FacebookIcon size={32} round />
                        </FacebookShareButton>
                        <LineShareButton url={window.location.href}>
                          <LineIcon size={32} round />
                        </LineShareButton>
                        <TwitterShareButton url={window.location.href}>
                          <XIcon size={32} round />
                        </TwitterShareButton>
                        <ThreadsShareButton url={window.location.href}>
                          <ThreadsIcon size={32} round />
                        </ThreadsShareButton>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Link href="#" className="w-1/2 sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full">
                    收藏
                    <Heart />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* 圖片 */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Main image */}
            <div className="overflow-hidden rounded-lg">
              <AspectRatio ratio={4 / 3} className="bg-muted">
                <Image
                  alt={data.name || '場館圖片'}
                  className="object-cover"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  src={
                    data.images && data.images[0]
                      ? getCenterImageUrl(data.images[0])
                      : 'https://images.unsplash.com/photo-1626158610593-687879be50b7?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                  }
                />
              </AspectRatio>
            </div>
            {/* 2x2 grid image */}
            <div className="grid grid-cols-2 gap-2">
              <div className="overflow-hidden rounded-lg">
                <AspectRatio ratio={4 / 3} className="bg-muted">
                  <Image
                    alt={`${data.name} - 圖片 1`}
                    className="object-cover"
                    fill
                    priority
                    sizes="(max-width: 768px) 50vw, 25vw"
                    src={
                      data.images && data.images[1]
                        ? getCenterImageUrl(data.images[1])
                        : 'https://images.unsplash.com/photo-1494199505258-5f95387f933c?q=80&w=1173&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                    }
                  />
                </AspectRatio>
              </div>
              <div className="overflow-hidden rounded-lg">
                <AspectRatio ratio={4 / 3} className="bg-muted">
                  <Image
                    alt={`${data.name} - 圖片 2`}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    src={
                      data.images && data.images[2]
                        ? getCenterImageUrl(data.images[2])
                        : 'https://images.unsplash.com/photo-1708312604073-90639de903fc?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                    }
                  />
                </AspectRatio>
              </div>
              <div className="overflow-hidden rounded-lg">
                <AspectRatio ratio={4 / 3} className="bg-muted">
                  <Image
                    alt={`${data.name} - 圖片 3`}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    src={
                      data.images && data.images[3]
                        ? getCenterImageUrl(data.images[3])
                        : 'https://images.unsplash.com/photo-1708268418738-4863baa9cf72?q=80&w=1214&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                    }
                  />
                </AspectRatio>
              </div>
              <div className="overflow-hidden rounded-lg">
                <AspectRatio ratio={4 / 3} className="bg-muted">
                  <Image
                    alt={`${data.name} - 圖片 4`}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    src={
                      data.images && data.images[4]
                        ? getCenterImageUrl(data.images[4])
                        : 'https://images.unsplash.com/photo-1627314387807-df615e8567de?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                    }
                  />
                </AspectRatio>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* 資訊 */}
          <section
            className={`
              grid grid-cols-1 gap-8
              md:grid-cols-2
            `}
          >
            {/* 左半部 */}
            <section className="flex flex-col gap-6">
              {/* 場館運動項目 */}
              <div className="flex flex-col">
                <h2 className="mb-4 text-xl font-bold">場館運動項目</h2>

                <div className="flex flex-wrap gap-2">
                  {data.sports.map((item, idx) => {
                    const IconComponent = sportIconMap[item.iconKey]
                    return (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleSportButton(item)
                        }}
                      >
                        {IconComponent && (
                          <IconComponent className="!w-6 !h-6" />
                        )}
                        {item.name}
                        <span className="text-muted-foreground">3個場地</span>
                      </Button>
                    )
                  })}
                </div>
              </div>
              {/* 場館設施 */}
              <div className="flex flex-col">
                <h2 className="mb-4 text-xl font-bold">場館設施</h2>
                <div className="flex flex-wrap gap-4">
                  {facilityItems.map((item, idx) => {
                    const IconComponent = item.icon
                    return (
                      <div className="flex gap-2" key={idx}>
                        <IconComponent className="!w-6 !h-6 text-highlight" />
                        <span>{item.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* 營業時間 */}
            <section>
              <h2 className="mb-4 text-xl font-bold">營業時間</h2>
              <div className="space-y-2">
                {data.businessHours ? (
                  Object.entries(data.businessHours).map(
                    ([key, value], idx, arr) => (
                      <div
                        className={cn(
                          'flex justify-between pb-2 text-sm',
                          idx !== arr.length - 1 && 'border-b'
                        )}
                        key={key}
                      >
                        <span className="font-medium capitalize">{key}</span>
                        <span>{value}</span>
                      </div>
                    )
                  )
                ) : businessHours ? (
                  Object.entries(businessHours).map(
                    ([key, value], idx, arr) => (
                      <div
                        className={cn(
                          'flex justify-between pb-2 text-sm',
                          idx !== arr.length - 1 && 'border-b'
                        )}
                        key={key}
                      >
                        <span className="font-medium capitalize">{key}</span>
                        <span>{value}</span>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-muted-foreground">
                    營業時間資料載入中...
                  </div>
                )}
              </div>
            </section>
          </section>

          <Separator className="my-8" />

          {/* 地理位置 */}
          <section>
            <h2 className="mb-4 text-xl font-bold">地理位置</h2>
            <div className="space-y-2 mb-4">
              <div className="flex pb-2 gap-2">
                <MapPin className="text-highlight" />
                <Link
                  href={`https://www.google.com/maps/place/${data.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="underline">{data.address}</span>
                </Link>
              </div>
              <div className="flex pb-2 gap-2">
                <TrainFront className="text-highlight" />
                <span>距離最近的捷運站</span>
                <span className="text-highlight text-bold">200</span>
                <span>公尺</span>
              </div>
              <div className="flex pb-2 gap-2">
                <Bus className="text-highlight" />
                <span>距離最近的公車站</span>
                <span className="text-highlight text-bold">150</span>
                <span>公尺</span>
              </div>
            </div>
            <div className="w-full h-[400px] rounded-lg overflow-hidden relative z-0">
              <Map position={position} dataName={data.name || '場館位置'} />
            </div>
          </section>

          <Separator className="my-8" />

          {/* 評論區 */}
          <RatingSection centerId={data.id} />
        </div>
      </main>
      <Footer />
    </>
  )
}
