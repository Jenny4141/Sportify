'use client'

// hooks
import { useState, useEffect } from 'react'

// utils
import { cn } from '@/lib/utils'
import { format as formatDate, format } from 'date-fns'

// icons
import { ChevronDownIcon } from 'lucide-react'
import {
  FaRegCircleCheck,
  FaCircleCheck,
  FaCircleXmark,
  FaCircleMinus,
} from 'react-icons/fa6'

// next 元件
import { useRouter } from 'next/navigation'

// API 請求
import { fetchCenter } from '@/api/venue/center'
import {
  createReservation,
  fetchReservation,
  updateReservation,
  fetchMemberOptions,
  fetchLocationOptions,
  fetchTimePeriodOptions,
  fetchCenterOptions,
  fetchSportOptions,
  fetchCourtOptions,
  fetchTimeSlotOptions,
  fetchCourtTimeSlotOptions,
  fetchStatusOptions,
  fetchPaymentOptions,
  fetchInvoiceOptions,
} from '@/api'
import {
  fetchAvailableTimeSlotsDate,
  fetchAvailableTimeSlotsRange,
} from '@/api/venue/court-time-slot'

// UI 元件
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/combobox'
import { toast } from 'sonner'

export default function ReservationForm({
  mode = 'add', // 'add' 或 'edit'
  reservationId = null,
  title,
  description,
  submitButtonText,
  loadingButtonText,
}) {
  const router = useRouter()

  // #region 狀態管理
  const [centerData, setCenterData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(mode === 'edit')
  const [isInitialDataSet, setIsInitialDataSet] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')

  const [memberId, setMemberId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [centerId, setCenterId] = useState('')
  const [sportId, setSportId] = useState('')
  const [courtId, setCourtIds] = useState('')
  const [timePeriodId, setTimePeriodId] = useState('')
  const [timeSlotId, setTimeSlotIds] = useState('')
  const [courtTimeSlotId, setCourtTimeSlotIds] = useState('')
  const [statusId, setStatusId] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const [invoiceId, setInvoiceId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceTaxId, setInvoiceTaxId] = useState('')
  const [invoiceCarrier, setInvoiceCarrier] = useState('')
  const [date, setDate] = useState(null)
  const [price, setPrice] = useState('')

  const [members, setMembers] = useState([])
  const [locations, setLocations] = useState([])
  const [centers, setCenters] = useState([])
  const [sports, setSports] = useState([])
  const [courts, setCourts] = useState([])
  const [timePeriods, setTimePeriods] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [courtTimeSlots, setCourtTimeSlots] = useState([])
  const [status, setStatus] = useState([])
  const [payments, setPayments] = useState([])
  const [invoices, setInvoices] = useState([])

  const [errors, setErrors] = useState({})
  const [open, setOpen] = useState(false)

  const [selectedTimeSlots, setSelectedTimeSlots] = useState([])
  const [originalReservationSlots, setOriginalReservationSlots] = useState([]) // 新增：追踪原始預約時段
  const [monthlyAvailability, setMonthlyAvailability] = useState([])

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

  // ===== 載入下拉選單選項 =====
  useEffect(() => {
    const loadData = async () => {
      try {
        const memberData = await fetchMemberOptions()
        setMembers(memberData.rows || [])

        const locationData = await fetchLocationOptions()
        setLocations(locationData.rows || [])

        const sportData = await fetchSportOptions()
        setSports(sportData.rows || [])

        const timePeriodData = await fetchTimePeriodOptions()
        setTimePeriods(timePeriodData.rows || [])

        const statusData = await fetchStatusOptions()
        setStatus(statusData.rows || [])

        const paymentData = await fetchPaymentOptions()
        setPayments(paymentData.rows || [])

        const invoiceData = await fetchInvoiceOptions()
        setInvoices(invoiceData.rows || [])
      } catch (error) {
        console.error('載入選項資料失敗:', error)
        toast.error('載入選項資料失敗')
      }
    }
    loadData()
  }, [])

  // ===== 載入現有預約資料（僅編輯模式） =====
  useEffect(() => {
    if (mode !== 'edit' || !reservationId) {
      setIsDataLoading(false)
      return
    }

    const loadReservationData = async () => {
      try {
        setIsDataLoading(true)
        const reservationData = await fetchReservation(reservationId)

        if (reservationData.success && reservationData.record) {
          const data = reservationData.record

          // 設定表單資料
          setMemberId(data.memberId?.toString() || '')
          setLocationId(
            data.courtTimeSlots?.[0]?.courtTimeSlot?.court?.center?.locationId?.toString() ||
              ''
          )
          setCenterId(data.courtTimeSlots?.[0]?.centerId?.toString() || '')
          setSportId(data.courtTimeSlots?.[0]?.sportId?.toString() || '')
          setTimePeriodId(
            data.courtTimeSlots?.[0]?.courtTimeSlot?.timeSlot?.timePeriodId?.toString() ||
              ''
          )
          setStatusId(data.statusId?.toString() || '')
          setPaymentId(data.paymentId?.toString() || '')
          setInvoiceId(data.invoiceId?.toString() || '')
          setInvoiceNumber(data.invoiceNumber || '')
          setInvoiceTaxId(data.tax || '')
          setInvoiceCarrier(data.carrier || '')

          // 設定選中的時段
          if (data.courtTimeSlots && data.courtTimeSlots.length > 0) {
            const selectedSlots = data.courtTimeSlots.map((item) => ({
              courtId: item.courtId,
              timeSlotId: item.timeSlotId,
            }))
            setSelectedTimeSlots(selectedSlots)
            setOriginalReservationSlots(selectedSlots) // 記錄原始預約時段
          }

          // 設定日期
          if (data.date) {
            setDate(new Date(data.date))
          }

          // 標記初始資料已設定
          setIsInitialDataSet(true)
        } else {
          // 處理沒有資料的情況
        }
      } catch (error) {
        console.error('載入預約資料失敗:', error)
        toast.error('載入預約資料失敗')
        router.push('/admin/venue/reservation')
      } finally {
        setIsDataLoading(false)
      }
    }

    loadReservationData()
  }, [mode, reservationId, router])

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

          // 編輯模式時傳入 reservationId 來排除自己的預約
          const excludeReservationId = mode === 'edit' ? reservationId : null

          courtTimeSlotData = await fetchAvailableTimeSlotsDate(
            Number(centerId),
            Number(sportId),
            dateStr,
            excludeReservationId
          )

          // 從 API 回應中取得 rows，這些資料包含預約狀態
          setCourtTimeSlots(courtTimeSlotData.rows || [])

          // 從 courtTimeSlots 中提取 courts 和 timeSlots
          const uniqueCourts = []
          const uniqueTimeSlots = []
          const courtMap = new Map()
          const timeSlotMap = new Map()

          courtTimeSlotData.rows?.forEach((item) => {
            // 提取球場資訊
            if (item.court && !courtMap.has(item.court.id)) {
              courtMap.set(item.court.id, item.court)
              uniqueCourts.push(item.court)
            }

            // 提取時段資訊
            if (item.timeSlot && !timeSlotMap.has(item.timeSlot.id)) {
              timeSlotMap.set(item.timeSlot.id, item.timeSlot)
              uniqueTimeSlots.push(item.timeSlot)
            }
          })

          // 依照時間排序時段
          uniqueTimeSlots.sort((a, b) => {
            const timeA = a.startTime || a.label
            const timeB = b.startTime || b.label
            return timeA.localeCompare(timeB)
          })

          setCourts(uniqueCourts)
          setTimeSlots(uniqueTimeSlots)

          // 編輯模式：確保原始預約時段被正確選取
          if (mode === 'edit' && originalReservationSlots.length > 0) {
            // 檢查原始預約時段是否在當前可用時段中
            const validOriginalSlots = originalReservationSlots.filter(
              ({ courtId, timeSlotId }) => {
                const courtTimeSlot = courtTimeSlotData.rows?.find(
                  (item) =>
                    item.court?.id === courtId &&
                    item.timeSlot?.id === timeSlotId
                )
                return courtTimeSlot && courtTimeSlot.isAvailable
              }
            )

            // 如果當前選取的時段為空或與原始時段不同，則重新設定
            const currentSlotKeys = selectedTimeSlots
              .map((s) => `${s.courtId}-${s.timeSlotId}`)
              .sort()
            const originalSlotKeys = validOriginalSlots
              .map((s) => `${s.courtId}-${s.timeSlotId}`)
              .sort()

            if (currentSlotKeys.join(',') !== originalSlotKeys.join(',')) {
              setSelectedTimeSlots(validOriginalSlots)
            }
          }
        } else {
          setCourtTimeSlots([])
          setCourts([])
          setTimeSlots([])
        }
      } catch (err) {
        console.error('載入場地時段失敗:', err)
        if (err.response && err.response.status === 404) {
          setCourtTimeSlots([])
          setCourts([])
          setTimeSlots([])
        } else {
          setCourtTimeSlots([])
          setCourts([])
          setTimeSlots([])
        }
      }
    }
    loadData()
  }, [centerId, sportId, date, mode, reservationId, originalReservationSlots])

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
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    // 驗證是否有選擇時段
    if (selectedTimeSlots.length === 0) {
      setErrors({ timeSlots: '請至少選擇一個時段' })
      setIsLoading(false)
      return
    }

    // 將選中的時段轉換為 courtTimeSlotId 陣列
    const courtTimeSlotIds = selectedTimeSlots
      .map(({ courtId, timeSlotId }) => {
        const courtTimeSlot = courtTimeSlots.find(
          (cts) => cts.court?.id === courtId && cts.timeSlot?.id === timeSlotId
        )
        return courtTimeSlot?.id
      })
      .filter((id) => id !== undefined) // 過濾掉 undefined 的值

    const submitData = {
      memberId: Number(memberId),
      courtTimeSlotId: courtTimeSlotIds,
      date: date ? formatDate(date, 'yyyy-MM-dd') : '',
      statusId: Number(statusId),
      paymentId: Number(paymentId),
      invoiceId: Number(invoiceId),
      invoiceNumber: invoiceNumber || null,
      tax: invoiceTaxId || null,
      carrier: invoiceCarrier || null,
    }

    try {
      let result
      if (mode === 'edit') {
        result = await updateReservation(reservationId, submitData)
      } else {
        result = await createReservation(submitData)
      }

      if (result.success) {
        const successMessage =
          mode === 'edit' ? '修改預約成功！' : '新增預約成功！'
        toast.success(successMessage)
        router.push('/admin/venue/reservation')
      }
    } catch (error) {
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data
      ) {
        const result = error.response.data
        const errs = {}
        const shown = {}
        result.issues?.forEach((issue) => {
          const field = issue.path[0]
          if (shown[field]) return
          errs[field] = issue.message
          shown[field] = true
        })
        setErrors(errs)
        if (Object.keys(errs).length === 0) {
          toast.error(result.message || '輸入資料有誤')
        }
        return
      }
      const errorMessage = mode === 'edit' ? '修改預約失敗：' : '新增預約失敗：'
      toast.error(errorMessage + (error.message || '未知錯誤'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/venue/reservation')
  }

  // 切換選擇狀態（只允許選擇可預約的時段）
  const toggleTimeSlot = (courtId, timeSlotId) => {
    const slotInfo = getSlotInfo(courtId, timeSlotId)

    // 只有可預約的時段才能被選擇
    if (!slotInfo || !slotInfo.isAvailable) {
      return
    }

    setSelectedTimeSlots((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.courtId === courtId && item.timeSlotId === timeSlotId
      )

      if (existingIndex >= 0) {
        // 如果已選中，則移除
        return prev.filter((_, index) => index !== existingIndex)
      } else {
        // 檢查是否已達到最大選擇數量（4個時段）
        // if (prev.length >= 4) {
        //   setShowLimitDialog(true)
        //   return prev
        // }
        // 如果未選中，則添加
        return [...prev, { courtId, timeSlotId }]
      }
    })
  }

  // 檢查是否已選中
  const isSelected = (courtId, timeSlotId) => {
    return selectedTimeSlots.some(
      (item) => item.courtId === courtId && item.timeSlotId === timeSlotId
    )
  }

  // 獲取場地時間段的價格和預約狀態
  const getSlotInfo = (courtId, timeSlotId) => {
    const courtTimeSlot = courtTimeSlots.find(
      (item) => item.court?.id === courtId && item.timeSlot?.id === timeSlotId
    )

    if (!courtTimeSlot) {
      return null
    }

    return {
      price: courtTimeSlot.price,
      isAvailable: courtTimeSlot.isAvailable === true, // 確保只有明確可用的時段才能選擇
      status:
        courtTimeSlot.isAvailable === true
          ? '可預約'
          : courtTimeSlot.status || '已被預約',
    }
  }

  // 獲取場地時間段的價格（保持向後兼容）
  const getPrice = (courtId, timeSlotId) => {
    const slotInfo = getSlotInfo(courtId, timeSlotId)
    return slotInfo ? slotInfo.price : null
  }

  // 計算總價格
  const getTotalPrice = () => {
    return selectedTimeSlots.reduce((total, { courtId, timeSlotId }) => {
      const price = Number(getPrice(courtId, timeSlotId))
      return total + (price || 0)
    }, 0)
  }

  // 獲取特定日期的可預約數量
  const getAvailableCount = (date) => {
    if (!date || !monthlyAvailability.length) return null

    const dateStr = date ? formatDate(date, 'yyyy-MM-dd') : ''
    const dayData = monthlyAvailability.find((day) => day.date === dateStr)
    return dayData ? dayData.availableCount : null
  }

  // #region資料選項
  const comboboxData = members.map((m) => ({
    value: m.id?.toString?.() ?? String(m.id),
    label: `${m.id}.${m.name}` ?? `${m.id}`,
  }))

  // #region 頁面渲染
  return (
    <Card className="max-w-2xl mx-auto w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isDataLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-lg">載入中...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-6">
              {/* 使用者 */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="memberId">
                  使用者
                  <span className="text-red-500">*</span>
                </Label>
                <Combobox
                  data={comboboxData}
                  value={memberId}
                  onOpenChange={() => {}}
                  onValueChange={(newValue) => setMemberId(newValue)}
                  type="會員"
                >
                  <ComboboxTrigger className="w-full" />
                  <ComboboxContent>
                    <ComboboxInput />
                    <ComboboxEmpty />
                    <ComboboxList>
                      <ComboboxGroup>
                        {comboboxData.map((cbd) => (
                          <ComboboxItem key={cbd.value} value={cbd.value}>
                            {cbd.label}
                          </ComboboxItem>
                        ))}
                      </ComboboxGroup>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {errors.memberId && (
                  <p className="text-sm text-red-500 mt-1">{errors.memberId}</p>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                {/* 地區 */}
                <div className="flex-1 space-y-2">
                  <Label>地區</Label>
                  <Select value={locationId} onValueChange={setLocationId}>
                    <SelectTrigger
                      className={cn(
                        'w-full',
                        errors.locationId && 'border-red-500'
                      )}
                    >
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

                {/* 中心 */}
                <div className="flex-1 space-y-2">
                  <Label>中心</Label>
                  <Select value={centerId} onValueChange={setCenterId}>
                    <SelectTrigger
                      className={cn(
                        'w-full',
                        errors.centerId && 'border-red-500'
                      )}
                    >
                      <SelectValue placeholder="全部中心" />
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
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                {/* 運動 */}
                <div className="flex-1 space-y-2">
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
                        placeholder={!centerId ? '請先選擇中心' : '請選擇運動'}
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

                {/* 日期 */}
                <div className="flex-1 space-y-2">
                  <Label htmlFor="date">
                    日期
                    <span className="text-red-500">*</span>
                  </Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date"
                        className={`w-full justify-between font-normal${
                          !date ? ' text-muted-foreground' : ''
                        }`}
                      >
                        {date ? date.toLocaleDateString() : '請選擇預訂日期'}
                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          setDate(date)
                          setOpen(false)
                        }}
                        disabled={(date) => {
                          // 禁用今天之前的日期
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          // 禁用沒有可預約時段的日期
                          const availableCount = getAvailableCount(date)
                          return date < today || !availableCount
                        }}
                        className={
                          errors.date ? 'border border-red-500 rounded-md' : ''
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.date && (
                    <p className="text-sm text-red-500 mt-1">{errors.date}</p>
                  )}
                </div>
              </div>

              {/* 球場、時間、價格 */}
              <div className="space-y-2">
                <Label>球場、時間、價格</Label>

                {/* 檢查是否有必要的篩選條件 */}
                {!centerId || !sportId || !date ? (
                  <div
                    className={cn(
                      'text-center p-4 text-muted-foreground border rounded-lg',
                      errors.timeSlots && 'border-red-500'
                    )}
                  >
                    <p>請先選擇中心、運動和日期</p>
                  </div>
                ) : courts.length === 0 || timeSlots.length === 0 ? (
                  <div
                    className={cn(
                      'text-center py-8 text-muted-foreground border rounded-lg',
                      errors.timeSlots && 'border-red-500'
                    )}
                  >
                    <p>該日期沒有可預約的時段</p>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'text-center p-4 text-muted-foreground border rounded-lg',
                      errors.timeSlots && 'border-red-500'
                    )}
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">時間</TableHead>
                          {courts.map((court) => (
                            <TableHead
                              key={court.id}
                              className="text-muted-foreground text-center"
                            >
                              {court.name}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timeSlots.map((timeSlot) => (
                          <TableRow key={timeSlot.id}>
                            <TableCell className="font-medium w-[100px]">
                              {timeSlot.label}
                            </TableCell>
                            {courts.map((court) => {
                              const slotInfo = getSlotInfo(
                                court.id,
                                timeSlot.id
                              )
                              const selected = isSelected(court.id, timeSlot.id)

                              return (
                                <TableCell
                                  key={court.id}
                                  className="text-center"
                                >
                                  {slotInfo ? (
                                    slotInfo.isAvailable ? (
                                      // 可預約的時段
                                      <Button
                                        variant={
                                          selected ? 'default' : 'secondary'
                                        }
                                        size="sm"
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          toggleTimeSlot(court.id, timeSlot.id)
                                        }}
                                        className={cn(
                                          'w-full',
                                          'hover:bg-primary/20',
                                          'dark:hover:bg-primary/50',
                                          selected &&
                                            'bg-primary text-primary-foreground hover:bg-primary/90'
                                        )}
                                      >
                                        <div className="flex gap-2">
                                          <span className="text-xs">
                                            NT$ {slotInfo.price}
                                          </span>
                                          <span
                                            style={{
                                              width: 20,
                                              display: 'inline-block',
                                            }}
                                          >
                                            {selected ? (
                                              <FaCircleCheck className="text-chart-2" />
                                            ) : (
                                              <span className="text-chart-2">
                                                <FaRegCircleCheck />
                                              </span>
                                            )}
                                          </span>
                                        </div>
                                      </Button>
                                    ) : (
                                      // 已被預約的時段
                                      <div className="flex justify-center items-center gap-2 cursor-not-allowed w-full py-2 px-3 text-xs text-muted-foreground bg-muted rounded-md">
                                        {/* <span>NT$ {slotInfo.price}</span> */}
                                        <span className="text-destructive">
                                          {slotInfo.status}
                                        </span>
                                        <span className="text-destructive text-base">
                                          <FaCircleXmark />
                                        </span>
                                      </div>
                                    )
                                  ) : (
                                    // 沒有資料的時段
                                    <div className="flex justify-center items-center gap-2 cursor-not-allowed w-full py-2 px-3 text-xs text-muted-foreground bg-muted rounded-md">
                                      <span className="text-muted-foreground text-sm">
                                        不可預約
                                      </span>
                                      <span className="text-muted-foreground text-sm">
                                        <FaCircleMinus />
                                      </span>
                                    </div>
                                  )}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell
                            colSpan={courts.length}
                            className="text-left"
                          >
                            <span>
                              已選擇: {selectedTimeSlots.length} 個時段
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            總計 NT$ {getTotalPrice().toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                )}
                {errors.timeSlots && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.timeSlots}
                  </p>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                {/* 付款方式 */}
                <div className="flex-1 space-y-2">
                  <Label htmlFor="payment">
                    付款方式<span className="text-red-500">*</span>
                  </Label>
                  <Select value={paymentId} onValueChange={setPaymentId}>
                    <SelectTrigger
                      className={cn(
                        'w-full',
                        errors.paymentId && 'border-red-500'
                      )}
                    >
                      <SelectValue placeholder="請選擇付款方式" />
                    </SelectTrigger>
                    <SelectContent>
                      {payments.length === 0 ? (
                        <div className="px-3 py-2 text-gray-400">
                          沒有符合資料
                        </div>
                      ) : (
                        payments
                          .filter((item) => item.id && item.id !== '')
                          .map((item, idx) => (
                            <SelectItem
                              key={`payment-${item.id}-${idx}`}
                              value={item.id.toString()}
                            >
                              {item.name}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.paymentId && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.paymentId}
                    </p>
                  )}
                </div>
                {/* 狀態 */}
                <div className="flex-1 space-y-2">
                  <Label htmlFor="status">
                    狀態
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select value={statusId} onValueChange={setStatusId}>
                    <SelectTrigger
                      className={cn(
                        'w-full',
                        errors.statusId && 'border-red-500'
                      )}
                    >
                      <SelectValue placeholder="請選擇狀態" />
                    </SelectTrigger>
                    <SelectContent>
                      {status.map((sta) => (
                        <SelectItem key={sta.id} value={sta.id.toString()}>
                          {sta.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.statusId && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.statusId}
                    </p>
                  )}
                </div>
              </div>

              {/* 發票類型 */}
              <div className="space-y-2">
                <Label htmlFor="invoice">
                  發票類型<span className="text-red-500">*</span>
                </Label>
                <Select value={invoiceId} onValueChange={setInvoiceId}>
                  <SelectTrigger
                    className={cn(
                      'w-full',
                      errors.invoiceId && 'border-red-500'
                    )}
                  >
                    <SelectValue placeholder="請選擇發票類型" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.length === 0 ? (
                      <div className="px-3 py-2 text-gray-400">
                        沒有符合資料
                      </div>
                    ) : (
                      invoices.map((item, idx) => (
                        <SelectItem
                          key={`invoice-${item.id}-${idx}`}
                          value={item.id.toString()}
                        >
                          {item.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.invoiceId && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.invoiceId}
                  </p>
                )}
              </div>

              {/* 發票詳細資訊欄位 */}
              {invoiceId === '3' && (
                <div className="space-y-2">
                  <Label htmlFor="invoiceCarrier">
                    載具號碼<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="invoiceCarrier"
                    type="text"
                    value={invoiceCarrier || ''}
                    onChange={(e) => setInvoiceCarrier(e.target.value)}
                    placeholder="請輸入載具號碼 (如手機條碼)"
                    className={errors.invoiceCarrier ? 'border-red-500' : ''}
                  />
                  {errors.invoiceCarrier && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.invoiceCarrier}
                    </p>
                  )}
                </div>
              )}

              {invoiceId === '2' && (
                <div className="space-y-2">
                  <Label htmlFor="invoiceTaxId">
                    統一編號<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="invoiceTaxId"
                    type="text"
                    value={invoiceTaxId || ''}
                    onChange={(e) => setInvoiceTaxId(e.target.value)}
                    placeholder="請輸入8位數統一編號"
                    className={errors.invoiceTaxId ? 'border-red-500' : ''}
                    maxLength={8}
                  />
                  {errors.invoiceTaxId && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.invoiceTaxId}
                    </p>
                  )}
                </div>
              )}

              {mode === 'edit' && (
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">發票號碼</Label>
                  <Input
                    id="invoiceNumber"
                    type="text"
                    value={invoiceNumber || ''}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="請輸入發票號碼"
                  />
                </div>
              )}
            </div>

            {/* 按鈕區域 */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading || isDataLoading}
              >
                取消
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={isLoading || isDataLoading}
              >
                {isLoading ? loadingButtonText : submitButtonText}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
