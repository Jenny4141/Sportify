// Server-side rendering page
import React from 'react'

// icons
import { FaBaby, FaPerson, FaMedal, FaTrophy } from 'react-icons/fa6'

// utils
import { cn } from '@/lib/utils'

// API 請求
import {
  fetchLocationOptions,
  fetchSportOptions,
  fetchBrandOptions,
  fetchCoachOptions,
} from '@/api'
import { fetchCenters } from '@/api/venue/center'

// next 元件
import Link from 'next/link'
import Image from 'next/image'

// UI 元件
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Ripple } from '@/components/ui/ripple'

// 自訂元件
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import { HeroGeometric } from '@/components/shape-landing-hero'

// 客戶端互動元件
import VenueCarousel from '@/components/home/venue-carousel'
import VenueSearchForm from '@/components/home/venue-search-form'
import BrandCarousel from '@/components/home/brand-carousel'
import AnimatedFeature from '@/components/home/animated-feature'
import AnimatedSection from '@/components/home/animated-section'
import CoachSection from '@/components/home/coach-section'

// 服務端數據獲取函數
async function getHomePageData() {
  try {
    // 並行獲取所有數據
    const [centersData, locationsData, sportsData, brandsData, coachesData] =
      await Promise.all([
        fetchCenters({}),
        fetchLocationOptions(),
        fetchSportOptions(),
        fetchBrandOptions(),
        fetchCoachOptions(),
      ])

    // 創建品牌ID映射
    const brandIdMap = {}
    ;(brandsData.rows || []).forEach((brand) => {
      brandIdMap[brand.name.toLowerCase()] = brand.id
    })

    return {
      centers: centersData?.rows || [],
      locations: locationsData?.rows || [],
      sports: sportsData?.rows || [],
      brandIdMap,
      coaches: coachesData?.rows || [],
    }
  } catch (error) {
    console.error('載入首頁數據失敗:', error)
    return {
      centers: [],
      locations: [],
      sports: [],
      brandIdMap: {},
      coaches: [],
    }
  }
}

export default async function HomePage() {
  // 服務端獲取數據
  const { centers, locations, sports, brandIdMap, coaches } =
    await getHomePageData()

  // 統計數據 - 使用字符串名稱而不是函數
  const stats = [
    { iconName: 'School', count: 100, label: '場館' },
    { iconName: 'ShoppingCart', count: 50, label: '商品' },
    { iconName: 'Users', count: 200, label: '隊伍' },
    { iconName: 'BookOpen', count: 80, label: '課程' },
  ]

  // 頁面渲染
  return (
    <>
      <Navbar />

      {/* Banner */}
      <section className="w-full h-[300px] md:h-[618px] relative">
        <Image
          src="/banner/home-banner.jpg"
          alt="Banner"
          fill
          className="object-cover"
          priority
        />
        <HeroGeometric
          badge="Sport + Simplify"
          title1="SPORTIFY"
          title2="使運動變得簡單"
          description="你將不再有藉口"
          className="h-full"
        />
      </section>

      {/* 數字紀錄 */}
      <section className="container mx-auto max-w-screen-xl px-4 md:px-6 py-12 md:py-20">
        <section className="grid grid-cols-2 md:grid-cols-4 justify-around md:justify-between gap-6 place-items-center">
          {stats.map((stat, idx) => (
            <AnimatedFeature
              key={idx}
              iconName={stat.iconName}
              count={stat.count}
              label={stat.label}
            />
          ))}
        </section>
      </section>

      {/* 快速預訂場地 */}
      <section className="bg-background-dark px-4 md:px-6 py-12 md:py-20">
        <div className="flex flex-col gap-8 container mx-auto max-w-screen-xl">
          <div className="flex flex-col gap-4 max-w-3xl mx-auto text-center">
            <AnimatedSection custom={0}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                運動場地預訂
              </h2>
            </AnimatedSection>
            <AnimatedSection custom={1}>
              <h3 className="italic text-highlight text-base sm:text-lg md:text-xl font-medium">
                「想打就打，場地先幫你訂好！」
              </h3>
            </AnimatedSection>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            {/* 精選場館 */}
            <VenueCarousel centers={centers} />

            {/* 快速搜尋 */}
            <VenueSearchForm locations={locations} sports={sports} />
          </div>
        </div>
      </section>

      {/* 商城品牌（自動輪播） */}
      <section className="px-4 md:px-6 py-12 md:py-20">
        <div className="flex flex-col gap-8 container mx-auto max-w-screen-xl">
          <div className="flex flex-col gap-4 max-w-3xl mx-auto text-center">
            <AnimatedSection custom={0}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                運動用品商城
              </h2>
            </AnimatedSection>
            <AnimatedSection custom={1}>
              <h3 className="italic text-highlight text-base sm:text-lg md:text-xl font-medium">
                「裝備到位，運動更盡興。」
              </h3>
            </AnimatedSection>
          </div>
          <BrandCarousel brandIdMap={brandIdMap} />
        </div>
      </section>

      {/* 組隊簡介 */}
      <section className="relative px-4 md:px-6 py-12 md:py-20 bg-[url('/banner/team-hero.jpg')] bg-cover bg-center bg-fixed">
        {/* 遮罩層 */}
        <div className="absolute inset-0 bg-black/60 pointer-events-none z-0" />
        <div className="relative flex flex-col lg:flex-row justify-between container mx-auto max-w-screen-xl gap-6">
          {/* 標題區域 */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-4">
              <AnimatedSection custom={0}>
                <h3 className="italic text-highlight text-base sm:text-lg md:text-xl font-medium">
                  「沒隊友？這裡就是你的球隊！」
                </h3>
              </AnimatedSection>
              <AnimatedSection custom={1}>
                <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold">
                  組隊找人打球
                </h2>
              </AnimatedSection>
              <AnimatedSection custom={2}>
                <p className="text-white text-base max-w-md mb-4">
                  快速配對有相同興趣與水平的球友，不管是臨時湊人還是長期戰隊，都能輕鬆組成團隊，一起享受運動的樂趣。
                </p>
              </AnimatedSection>
              <AnimatedSection custom={3} className="hidden md:block">
                <Button variant="highlight" size="lg">
                  立即報名
                </Button>
              </AnimatedSection>
            </div>
          </div>

          {/* 程度卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { title: '新手', icon: <FaBaby /> },
              { title: '中手', icon: <FaPerson /> },
              { title: '熟手', icon: <FaMedal /> },
              { title: '老手', icon: <FaTrophy /> },
            ].map((level, index) => (
              <AnimatedSection key={level.title} custom={index + 4}>
                <Card className="bg-background text-gray-900 h-full p-0 md:p-2">
                  <CardContent className="flex flex-col items-center justify-center p-8 h-full">
                    <div className="text-primary text-6xl mb-4 text-background">
                      {level.icon}
                    </div>
                    <h3 className="text-accent-foreground md:text-lg font-bold mb-4 text-center">
                      {level.title}
                    </h3>
                    <Button
                      variant="ghost"
                      className="text-primary hover:primary/90 font-medium"
                    >
                      查看更多
                    </Button>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>

          {/* 手機版 立即報名 按鈕 */}
          <div className="md:hidden flex justify-center">
            <Button variant="highlight" className="w-full">
              立即報名
            </Button>
          </div>
        </div>
      </section>

      {/* 教練簡介 */}
      <section className="bg-background px-4 md:px-6 py-12 md:pt-20 md:pb-30">
        <div className="flex flex-col gap-8 container mx-auto max-w-screen-xl">
          <div className="flex flex-col gap-4 max-w-3xl mx-auto text-center">
            <AnimatedSection custom={0}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                找教練上課
              </h2>
            </AnimatedSection>
            <AnimatedSection custom={1}>
              <h3 className="italic text-highlight text-base sm:text-lg md:text-xl font-medium">
                「專業教練，帶你突破極限。」
              </h3>
            </AnimatedSection>
          </div>
          <CoachSection coaches={coaches.length ? coaches : coachs} />
        </div>
      </section>

      {/* 立即加入 */}
      <section className="relative bg-[url('/banner/join-us.jpg')] bg-cover bg-top bg-fixed text-white overflow-visible">
        <div className="container mx-auto max-w-screen-xl pt-10 md:pt-0 px-4 md:px-6">
          <div className="absolute inset-0 bg-black/60 pointer-events-none z-0" />
          <div className="flex flex-col-reverse lg:flex-row items-center gap-30 md:gap-20">
            {/* 運動員圖片 */}
            <AnimatedSection
              custom={0}
              className="relative -mt-20 md:-mt-32 lg:-mt-40 w-full max-w-none overflow-visible lg:w-2/5 z-10"
            >
              <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px]">
                <Image
                  src="/banner/player.png"
                  alt="Professional Athlete"
                  fill
                  className="object-contain object-bottom"
                />
              </div>
            </AnimatedSection>
            {/* 文字內容 */}
            <AnimatedSection
              custom={1}
              className="relative flex flex-col items-center justify-center gap-6 lg:pl-8 lg:w-3/5 z-10 md:min-h-[340px]"
            >
              {/* Ripple 絕對定位在中央 */}
              <Ripple className="hidden md:inline-block" />
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  <span
                    className={cn(
                      'bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-white/90 to-purple-600'
                    )}
                  >
                    立即加入
                  </span>
                  SPORTIFY
                </h2>
              </div>
              <AnimatedSection custom={2} className="relative z-10">
                <Link href="/register">
                  <div className="p-[1px] sm:p-[2px] bg-gradient-to-r from-orange-600 to-purple-600 rounded-full">
                    <div className="bg-background transition-colors hover:bg-background/50 px-3 sm:px-8 py-1 sm:py-4 h-8 sm:h-12 rounded-full text-foreground text-xs sm:text-sm flex items-center justify-center whitespace-nowrap">
                      註冊會員
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
