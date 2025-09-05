'use client'

// hooks
import { useState, useEffect } from 'react'
import { useVenue } from '@/contexts/venue-context'

// utils
import { format as formatDate } from 'date-fns'
import { cn, validateVenueField } from '@/lib/utils'
import { format } from 'date-fns'

// Icon
import { ClipboardCheck, CalendarCheck } from 'lucide-react'

// API 請求
import {
  fetchLocationOptions,
  fetchCenterOptions,
  fetchSportOptions,
} from '@/api'
import { fetchCenter } from '@/api/venue/center'
import {
  fetchAvailableTimeSlotsDate,
  fetchAvailableTimeSlotsRange,
} from '@/api/venue/court-time-slot'
import { getCenterImageUrl } from '@/api/venue/image'

// next 元件
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

// UI 元件
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/date-calendar'
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status'
import { toast } from 'sonner'

// 自訂元件
import { Navbar } from '@/components/navbar'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import Step from '@/components/step'
import Footer from '@/components/footer'
import { TimeSlotTable } from '@/components/timeslot-table'

export default function ReservationPage() {
  // #region 路由和URL參數
  const router = useRouter()
  const { venueData, setVenueData } = useVenue()

  // #region 組件狀態管理
  const [centerData, setCenterData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({}) // 用於存放驗證錯誤

  const [locationId, setLocationId] = useState(
    venueData.locationId?.toString() || ''
  )
  const [centerId, setCenterId] = useState(venueData.centerId?.toString() || '')
  const [sportId, setSportId] = useState(venueData.sportId?.toString() || '')

  const [locations, setLocations] = useState([])
  const [centers, setCenters] = useState([])
  const [sports, setSports] = useState([])
  const [courtTimeSlots, setCourtTimeSlots] = useState([])
  const [date, setDate] = useState(null)
  const [monthlyAvailability, setMonthlyAvailability] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // 計算今天的日期字串 (YYYY-MM-DD) - 用於查詢可預約時段
  const today = new Date().toISOString().split('T')[0]

  // #region 副作用處理

  // #region Center資料
  useEffect(() => {
    const fetchCenterData = async () => {
      try {
        setLoading(true)
        // await new Promise((r) => setTimeout(r, 3000)) // 延遲測試載入動畫
        const centerData = await fetchCenter(centerId)
        setCenterData(centerData.record)
      } catch (err) {
        console.error('Error fetching center detail:', err)
        setError(err.message)
        toast.error('載入場館資料失敗')
      } finally {
        setLoading(false)
      }
    }

    if (centerId) {
      fetchCenterData()
    }
  }, [centerId])

  // #region 訂單摘要
  useEffect(() => {
    const selectedCenter = centers.find(
      (center) => center.id.toString() === centerId
    )
    const newCenterName = selectedCenter?.name || ''

    setVenueData((prev) => {
      if (prev.center !== newCenterName || prev.centerId !== centerId) {
        return { ...prev, center: newCenterName, centerId }
      }
      return prev
    })
  }, [centerId, centers])

  useEffect(() => {
    const selectedSport = sports.find(
      (sport) => sport.id.toString() === sportId
    )
    const newSportName = selectedSport?.name || ''

    setVenueData((prev) => {
      if (prev.sport !== newSportName || prev.sportId !== sportId) {
        return { ...prev, sport: newSportName, sportId }
      }
      return prev
    })
  }, [sportId, sports])

  // #region 下拉選單
  useEffect(() => {
    const loadData = async () => {
      try {
        const locationData = await fetchLocationOptions()
        setLocations(locationData.rows || [])
        const centerData = await fetchCenterOptions()
        setCenters(centerData.rows || [])
        const sportData = await fetchSportOptions()
        setSports(sportData.rows || [])
      } catch (error) {
        console.error('載入選項失敗:', error)
        toast.error('載入選項失敗')
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        let centerData
        if (locationId) {
          centerData = await fetchCenterOptions({
            locationId: Number(locationId),
          })
        } else {
          centerData = await fetchCenterOptions()
        }
        setCenters(centerData.rows || [])
        if (
          centerId &&
          !centerData.rows?.some((center) => center.id.toString() === centerId)
        ) {
          setCenterId('')
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setCenters([])
        } else {
          setCenters([])
        }
      }
    }
    loadData()
  }, [locationId])

  // #region 中心、運動與日期篩選可選時段
  useEffect(() => {
    const loadData = async () => {
      try {
        let courtTimeSlotData
        if (centerId && sportId && date) {
          // 將選擇的日期轉換為 YYYY-MM-DD 格式
          const dateStr = date ? formatDate(date, 'yyyy-MM-dd') : ''
          courtTimeSlotData = await fetchAvailableTimeSlotsDate(
            Number(centerId),
            Number(sportId),
            dateStr
          )
          // 從 API 回應中取得 rows，這些資料包含預約狀態
          setCourtTimeSlots(courtTimeSlotData.rows || [])
        } else {
          setCourtTimeSlots([])
        }
      } catch (err) {
        console.error('載入場地時段失敗:', err)
        if (err.response && err.response.status === 404) {
          setCourtTimeSlots([])
        } else {
          setCourtTimeSlots([])
        }
      }
    }
    loadData()
  }, [centerId, sportId, date])

  // #region 獲取從今天起 30 天的可預約數據
  useEffect(() => {
    const loadRangeData = async () => {
      try {
        if (centerId && sportId && today) {
          const rangeData = await fetchAvailableTimeSlotsRange(
            Number(centerId),
            Number(sportId),
            today,
            30 // 查詢 30 天
          )
          setMonthlyAvailability(rangeData.rows || [])
        } else {
          setMonthlyAvailability([])
        }
      } catch (err) {
        console.error('載入可預約資料失敗:', err)
        setMonthlyAvailability([])
      }
    }
    loadRangeData()
  }, [centerId, sportId, today])

  // #region 事件處理函數

  // 格式化價格，加上千分位逗號
  const formatPrice = (price) => {
    return Number(price).toLocaleString('zh-TW')
  }

  // 處理預訂按鈕點擊
  const handleReservation = () => {
    const newErrors = {}

    newErrors.center = validateVenueField('center', centerId)
    newErrors.sport = validateVenueField('sport', sportId)
    newErrors.selectedDate = validateVenueField('selectedDate', date)
    newErrors.timeSlots = validateVenueField(
      'timeSlots',
      '',
      venueData.timeSlots
    )

    setErrors(newErrors)

    const hasErrors = Object.values(newErrors).some((error) => error !== '')
    if (!hasErrors) {
      router.push('/venue/reservation/payment')
    } else {
      // 驗證失敗，滾動到第一個錯誤欄位
      const errorFields = [
        { field: 'center', selector: '[data-testid="center-select"]' },
        { field: 'sport', selector: '[data-testid="sport-select"]' },
        { field: 'selectedDate', selector: '[data-testid="calendar"]' },
        { field: 'timeSlots', selector: '[data-testid="timeslot-table"]' },
      ]

      setTimeout(() => {
        for (const errorField of errorFields) {
          if (newErrors[errorField.field]) {
            const element = document.querySelector(errorField.selector)
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
              break
            }
          }
        }
      }, 100)
    }
  }

  // 獲取特定日期的可預約數量
  const getAvailableCount = (date) => {
    if (!date || !monthlyAvailability.length) return null

    const dateStr = date ? formatDate(date, 'yyyy-MM-dd') : ''
    const dayData = monthlyAvailability.find((day) => day.date === dateStr)
    return dayData ? dayData.availableCount : null
  }

  // 處理場地時段選擇
  const handleTimeSlotSelection = (selectionData) => {
    setVenueData((prev) => {
      // 檢查是否真的有變化
      if (
        JSON.stringify(prev.timeSlots) !==
          JSON.stringify(selectionData.details) ||
        prev.totalPrice !== selectionData.totalPrice
      ) {
        return {
          ...prev,
          timeSlots: selectionData.details,
          totalPrice: selectionData.totalPrice,
        }
      }
      return prev
    })
  }

  // #region 資料顯示選項
  // 步驟選項設定
  const steps = [
    { id: 1, title: '選擇場地與時間', active: true },
    { id: 2, title: '填寫付款資訊', completed: false },
    { id: 3, title: '完成訂單', completed: false },
  ]

  // #endregion 資料顯示選項

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
              onStepClick={(step, index) => console.log('Clicked step:', step)}
            />
          </section>

          <section className="flex flex-col md:flex-row gap-6">
            {/* 訂單選擇 */}
            <section className="flex-1 md:flex-2 min-w-0 flex flex-col gap-6">
              {/* 選擇場館與運動 */}
              <section>
                <h2 className="text-xl font-semibold mb-4">選擇場館與運動</h2>
                <div className="flex flex-col lg:flex-row gap-2">
                  <div className="space-y-2 flex-1">
                    <Label>地區</Label>
                    <Select value={locationId} onValueChange={setLocationId}>
                      <SelectTrigger className="w-full !bg-card text-accent-foreground !h-10">
                        <SelectValue placeholder="全部地區" />
                      </SelectTrigger>
                      <SelectContent>
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
                  <div className="space-y-2 flex-1">
                    <Label>中心</Label>
                    <Select value={centerId} onValueChange={setCenterId}>
                      <SelectTrigger
                        className={cn(
                          'w-full !bg-card text-accent-foreground !h-10',
                          errors.center &&
                            'border-destructive focus:border-destructive focus:ring-destructive'
                        )}
                        data-testid="center-select"
                      >
                        {centers.length === 0 ? (
                          <SelectValue placeholder="沒有符合資料" />
                        ) : (
                          <SelectValue placeholder="請選擇中心" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {centers.length === 0 ? (
                          <div className="px-3 py-2 text-gray-400">
                            沒有符合資料
                          </div>
                        ) : (
                          centers.map((center) => (
                            <SelectItem
                              key={center.id}
                              value={center.id.toString()}
                            >
                              {center.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.center && (
                      <span className="text-destructive text-sm">
                        {errors.center}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label>運動</Label>
                    <Select
                      value={sportId}
                      onValueChange={setSportId}
                      disabled={!centerId}
                    >
                      <SelectTrigger
                        className={cn(
                          'w-full !bg-card text-accent-foreground !h-10',
                          errors.sport &&
                            'border-destructive focus:border-destructive focus:ring-destructive',
                          !centerId && 'cursor-not-allowed'
                        )}
                        data-testid="sport-select"
                        style={!centerId ? { opacity: 0.9 } : undefined}
                      >
                        <SelectValue
                          placeholder={
                            !centerId ? '請先選擇中心' : '請選擇運動'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {!centerId ? (
                          <div className="px-3 py-2 text-gray-400">
                            請先選擇中心
                          </div>
                        ) : centerData &&
                          centerData.centerSports &&
                          centerData.centerSports.length === 0 ? (
                          <div className="px-3 py-2 text-gray-400">
                            沒有符合資料
                          </div>
                        ) : (
                          centerData &&
                          centerData.centerSports &&
                          centerData.centerSports.map((cs) => (
                            <SelectItem
                              key={cs.sportId}
                              value={cs.sportId.toString()}
                            >
                              {cs.sport.name || cs.sport.id}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.sport && (
                      <span className="text-destructive text-sm">
                        {errors.sport}
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* 選擇預約日期 */}
              <section>
                <h2 className="text-xl font-semibold mb-4">選擇預約日期</h2>
                <div
                  data-testid="calendar"
                  className={cn(
                    'bg-card border rounded-lg p-6',
                    errors.selectedDate && 'border-destructive'
                  )}
                >
                  <Calendar
                    mode="single"
                    selected={date}
                    captionLayout="dropdown"
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    onSelect={(selectedDate) => {
                      setDate(selectedDate)
                      // 更新訂單摘要中的選擇日期
                      setVenueData((prev) => ({
                        ...prev,
                        selectedDate: selectedDate,
                      }))
                    }}
                    disabled={(date) => {
                      // 禁用今天之前的日期
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      // 禁用沒有可預約時段的日期
                      const availableCount = getAvailableCount(date)
                      return date < today || !availableCount
                    }}
                    className={cn(
                      'w-full bg-card text-accent-foreground rounded [--cell-size:3.5rem] aspect-3/2 object-cover p-0'
                    )}
                    components={{
                      DayButton: ({ day, modifiers, ...props }) => {
                        const date = day.date
                        const availableCount = getAvailableCount(date)
                        const hasData = centerId && sportId
                        const isPast = date < new Date().setHours(0, 0, 0, 0)
                        return (
                          <button
                            {...props}
                            className={cn(
                              'aspect-[3/2] flex flex-col md:gap-1 items-center justify-center w-full h-full p-1 text-base rounded-md transition-colors',
                              modifiers.selected
                                ? 'bg-primary text-primary-foreground'
                                : modifiers.today
                                  ? 'bg-muted'
                                  : '',
                              !modifiers.selected && 'hover:bg-muted',
                              modifiers.disabled
                                ? 'opacity-50 cursor-not-allowed'
                                : 'cursor-pointer'
                            )}
                            disabled={modifiers.disabled}
                          >
                            <span className="font-medium">
                              {format(date, 'd')}
                            </span>
                            {hasData && availableCount !== null && !isPast && (
                              <span
                                className={cn(
                                  'flex justify-center text-xs md:text-sm w-full font-medium md:py-1 rounded',
                                  modifiers.selected &&
                                    'text-primary-foreground',
                                  !modifiers.selected &&
                                    availableCount === 0 &&
                                    'text-red',
                                  !modifiers.selected &&
                                    availableCount > 0 &&
                                    'text-green'
                                )}
                              >
                                {modifiers.selected ? (
                                  <Status
                                    status="maintenance"
                                    className="bg-background"
                                  >
                                    <StatusIndicator />
                                    <StatusLabel className="hidden lg:inline">
                                      已選擇
                                    </StatusLabel>
                                  </Status>
                                ) : availableCount === 0 ? (
                                  <Status
                                    status="offline"
                                    className="bg-background"
                                  >
                                    <StatusIndicator />
                                    <StatusLabel className="hidden lg:inline">
                                      已額滿
                                    </StatusLabel>
                                  </Status>
                                ) : (
                                  <Status
                                    status="online"
                                    className="bg-background"
                                  >
                                    <StatusIndicator />
                                    <StatusLabel className="hidden lg:inline">
                                      {availableCount}
                                    </StatusLabel>
                                  </Status>
                                )}
                              </span>
                            )}
                          </button>
                        )
                      },
                    }}
                  />

                  {/* 狀態說明 */}
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Status status="online" className="bg-transparent">
                        <StatusIndicator />
                      </Status>
                      <span>可預約時段數</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Status status="offline" className="bg-transparent">
                        <StatusIndicator />
                      </Status>
                      <span>已額滿</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Status status="maintenance" className="bg-transparent">
                        <StatusIndicator />
                      </Status>
                      <span>已選擇</span>
                    </div>
                  </div>
                </div>
                {errors.selectedDate && (
                  <span className="text-destructive text-sm mt-2 block">
                    {errors.selectedDate}
                  </span>
                )}
              </section>

              {/* 選擇場地與時段 */}
              <section>
                <h2 className="text-xl font-semibold mb-4">選擇場地與時段</h2>
                <div
                  data-testid="timeslot-table"
                  className={cn(
                    '',
                    errors.selectedDate &&
                      'border border-destructive rounded-lg'
                  )}
                >
                  <TimeSlotTable
                    courtTimeSlots={courtTimeSlots}
                    onSelectionChange={handleTimeSlotSelection}
                  />
                </div>
                {errors.timeSlots && (
                  <span className="text-destructive text-sm mt-2 block">
                    {errors.timeSlots}
                  </span>
                )}
              </section>
            </section>

            {/* 訂單確認 */}
            <section className="flex-1 lg:max-w-sm xl:max-w-md min-w-0 w-full">
              <h2 className="text-xl font-semibold mb-4">您的訂單</h2>
              {/* 訂單摘要卡片 */}
              <Card>
                <CardHeader>
                  {/* 預約圖片 */}
                  <div className="overflow-hidden rounded-lg">
                    <AspectRatio ratio={4 / 3} className="bg-muted">
                      {centerData && centerData.images && (
                        <Image
                          alt={centerData.name}
                          className="object-cover"
                          fill
                          priority
                          sizes="(max-width: 768px) 100vw, 320px"
                          src={getCenterImageUrl(centerData.images[0])}
                        />
                      )}
                    </AspectRatio>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 場館資訊 */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-accent-foreground">
                      場館資訊
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {/* <div>地區: {venueData.location || '未選擇'}</div> */}
                      <div className="text-primary">
                        {venueData.center || '未選擇'}
                      </div>
                      <div>運動: {venueData.sport || '未選擇'}</div>
                    </div>
                  </div>

                  {/* 預約日期 */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-accent-foreground">
                      預約日期
                    </h4>
                    <div className="text-sm text-primary">
                      {venueData.selectedDate
                        ? venueData.selectedDate.toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long',
                          })
                        : '未選擇'}
                    </div>
                  </div>

                  {/* 場地時段 */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-accent-foreground">
                      場地時段
                    </h4>
                    {venueData.timeSlots?.length > 0 ? (
                      <div className="space-y-2">
                        {venueData.timeSlots.map((slot, index) => (
                          <Alert
                            key={index}
                            className="text-sm text-muted-foreground bg-muted p-2 rounded"
                          >
                            <AlertTitle className="font-medium text-blue-500">
                              {slot.courtName}
                            </AlertTitle>
                            <AlertDescription className="flex justify-between">
                              <span>{slot.timeRange}</span>
                              <span className="text-primary">
                                NT$ {formatPrice(slot.price)}
                              </span>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        未選擇
                      </div>
                    )}
                  </div>

                  {/* 總計 */}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">總計</span>
                      <span className="text-lg font-bold text-primary">
                        NT$ {formatPrice(venueData.totalPrice) || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleReservation}
                  >
                    預訂
                    <ClipboardCheck />
                  </Button>
                </CardFooter>
              </Card>
            </section>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}
