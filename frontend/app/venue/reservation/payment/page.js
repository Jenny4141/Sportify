'use client'

// hooks
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useVenue } from '@/contexts/venue-context'
import { useAuth } from '@/contexts/auth-context'

// utils
import { validateField, cn } from '@/lib/utils'
import { API_SERVER } from '@/lib/api-path'
import { toast } from 'sonner'
import { format } from 'date-fns'

// Icon
import { CreditCard } from 'lucide-react'

// API 請求
import { fetchCenter } from '@/api/venue/center'
import { getCenterImageUrl } from '@/api/venue/image'
import { createReservation } from '@/api/venue/reservation'

// next 元件
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'

// UI 元件
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

// 自訂元件
import { Navbar } from '@/components/navbar'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import Step from '@/components/step'
import Footer from '@/components/footer'
import PaymentMethodSelector, {
  paymentOptions,
} from '@/components/payment-method-selector'
import ReceiptTypeSelector, {
  receiptOptions,
} from '@/components/receipt-type-selector'
import { LoadingState, ErrorState } from '@/components/loading-states'

// 將使用 useSearchParams 的邏輯抽取到單獨的組件
function PaymentContent() {
  // #region 路由和URL參數
  const router = useRouter()
  const { user } = useAuth()

  // #region 狀態管理
  const [centerData, setCenterData] = useState(null)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false) // 建立訂單載入狀態
  const [isLoadingCenter, setIsLoadingCenter] = useState(true) // 載入場館資料狀態
  const [errors, setErrors] = useState({})

  const { venueData, setVenueData } = useVenue()
  const [centerId, setCenterId] = useState(venueData.centerId?.toString() || '')

  // 付款和發票選項狀態
  const [selectedPayment, setSelectedPayment] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState('')

  // 用戶輸入資料狀態
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    carrierId: '', // 載具號碼
    companyId: '', // 統一編號
  })
  console.log('venueData', venueData)

  // ECPay 確認對話框狀態
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentParams, setPaymentParams] = useState(null)

  // #region 副作用處理

  // #region Center資料
  useEffect(() => {
    console.log('centerId:', centerId)
    const fetchCenterData = async () => {
      try {
        setIsLoadingCenter(true)
        // await new Promise((r) => setTimeout(r, 3000)) // 延遲測試載入動畫
        const centerData = await fetchCenter(centerId)
        setCenterData(centerData.record)
        console.log('centerData', centerData)
      } catch (err) {
        console.error('Error fetching center detail:', err)
        setErrors(err.message)
        toast.error('載入場館資料失敗')
      } finally {
        setIsLoadingCenter(false)
      }
    }

    if (centerId) {
      fetchCenterData()
    }
  }, [centerId])

  // #region 事件處理函數

  // 格式化價格，加上千分位逗號
  const formatPrice = (price) => {
    return Number(price).toLocaleString('zh-TW')
  }

  // 處理表單輸入變更
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  // 獲取選中的付款和發票選項
  const getSelectedOptions = () => {
    const selectedPaymentOption = paymentOptions.find(
      (opt) => opt.id === selectedPayment
    )
    const selectedReceiptOption = receiptOptions.find(
      (opt) => opt.id === selectedReceipt
    )

    return {
      paymentMethod: selectedPaymentOption?.label || '',
      receiptType: selectedReceiptOption?.label || '',
    }
  }

  // 處理下拉選單變更
  const handleSelectChange = (field, value, setter) => {
    setter(value)
    // 如果改變發票類型，清除相關欄位
    if (field === 'receipt') {
      setFormData((prev) => ({
        ...prev,
        carrierId: '',
        companyId: '',
      }))
    }
  }

  // #region 處裡建立訂單
  const handleReservation = async () => {
    // e.preventDefault()
    setErrors({})
    setIsCreatingOrder(true)

    console.log('venueData.timeSlots 內容:', venueData.timeSlots) // 詳細除錯

    // 檢查 timeSlots 是否為空
    if (!venueData.timeSlots || venueData.timeSlots.length === 0) {
      toast.error('請選擇場地時段')
      setIsCreatingOrder(false)
      return false
    }

    // 準備 courtTimeSlotId 陣列 - 從 venueData.timeSlots 中提取 courtTimeSlotId
    const courtTimeSlotIds = []

    for (const slot of venueData.timeSlots) {
      console.log('處理時段:', slot) // 除錯

      if (slot.courtTimeSlotId) {
        const id = parseInt(slot.courtTimeSlotId)
        if (!isNaN(id)) {
          courtTimeSlotIds.push(id)
        } else {
          console.error('無效的 courtTimeSlotId:', slot.courtTimeSlotId)
          toast.error('場地時段 ID 格式錯誤')
          setIsCreatingOrder(false)
          return false
        }
      } else {
        console.error('缺少 courtTimeSlotId:', slot)
        toast.error('場地時段資料不完整')
        setIsCreatingOrder(false)
        return false
      }
    }

    if (courtTimeSlotIds.length === 0) {
      toast.error('沒有有效的場地時段')
      setIsCreatingOrder(false)
      return false
    }

    // 準備日期字串 - 轉換為 YYYY-MM-DD 格式
    const dateString = venueData.selectedDate
      ? format(venueData.selectedDate, 'yyyy-MM-dd')
      : null

    console.log(dateString)

    if (!dateString) {
      toast.error('請選擇預約日期')
      setIsCreatingOrder(false)
      return false
    }

    const reservationData = {
      memberId: user?.id || 102,
      courtTimeSlotId: courtTimeSlotIds, // 使用處理過的 ID 陣列
      date: dateString, // 使用字串格式的日期
      statusId: 1,
      price: venueData.totalPrice,
      paymentId: parseInt(selectedPayment), // 轉換為數字
      invoiceId: parseInt(selectedReceipt), // 轉換為數字
      carrier: formData.carrierId || '', // 空字串而非 null
      tax: formData.companyId || '', // 空字串而非 null
    }

    console.log('發送訂單資料:', reservationData) // 除錯用

    try {
      const result = await createReservation(reservationData)
      if (result.success) {
        // const successMessage = '新增預約成功！'
        // toast.success(successMessage)
        console.log('訂單建立成功:', result) // 除錯用
        return { success: true, reservationId: result.insertId } // 回傳成功狀態和訂單ID
      } else {
        toast.error('建立訂單失敗: ' + (result.message || '未知錯誤'))
        console.error('訂單建立失敗:', result)
        return { success: false } // 回傳失敗狀態
      }
    } catch (error) {
      console.error('建立訂單錯誤:', error) // 除錯用
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
      } else {
        const errorMessage = '新增預約失敗：'
        toast.error(errorMessage + (error.message || '未知錯誤'))
      }
      return false // 返回失敗狀態
    } finally {
      setIsCreatingOrder(false)
    }
  }

  // #region 處理付款按鈕點擊
  const handlePayment = async () => {
    // 先執行驗證並獲取錯誤
    const newErrors = {}
    newErrors.name = validateField('name', formData.name || '', true)
    newErrors.phone = validateField('phone', formData.phone || '', true)
    newErrors.payment = validateField('payment', selectedPayment || '', true)
    newErrors.receipt = validateField('receipt', selectedReceipt || '', true)
    newErrors.carrierId = validateField(
      'carrierId',
      formData.carrierId || '',
      true,
      '',
      selectedReceipt
    )
    newErrors.companyId = validateField(
      'companyId',
      formData.companyId || '',
      true,
      '',
      selectedReceipt
    )

    setErrors(newErrors)

    // 檢查是否有任何錯誤
    const hasErrors = Object.values(newErrors).some((error) => error !== '')

    if (!hasErrors) {
      // 表單驗證通過，更新 context 包含用戶資料和付款資訊
      setVenueData({
        ...venueData,
        userInfo: formData,
        ...getSelectedOptions(),
      })

      // 準備付款參數但不立即建立訂單
      const amount = venueData.totalPrice
      const itemsArray = venueData.timeSlots.map(
        (slot) => `${slot.courtName} - ${slot.timeRange}`
      )
      const items = itemsArray.join(',')

      if (selectedPayment === '1') {
        // 綠界
        setPaymentParams({
          method: 'ecpay',
          amount,
          items,
        })
        setShowPaymentDialog(true)
      } else if (selectedPayment === '2') {
        // Line Pay
        setPaymentParams({
          method: 'linepay',
          amount,
          items,
        })
        setShowPaymentDialog(true)
      } else {
        // 現金付款 - 直接建立訂單並導向成功頁面
        const reservationResult = await handleReservation()
        if (reservationResult && reservationResult.success) {
          router.push(
            `/venue/reservation/success?reservationId=${reservationResult.reservationId}`
          )
        }
      }
    } else {
      // 表單驗證失敗，滾動到第一個錯誤欄位
      const errorFields = [
        { field: 'name', selector: '#name' },
        { field: 'phone', selector: '#phone' },
        { field: 'payment', selector: '[data-field="payment"]' },
        { field: 'receipt', selector: '[data-field="receipt"]' },
        { field: 'carrierId', selector: '#carrierId' },
        { field: 'companyId', selector: '#companyId' },
      ]

      // 找到第一個有錯誤的欄位並跳轉
      setTimeout(() => {
        for (const errorField of errorFields) {
          if (newErrors[errorField.field]) {
            const element = document.querySelector(errorField.selector)
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
              // 如果是輸入框，則聚焦
              const input = element.querySelector('input') || element
              if (input && input.focus) {
                input.focus()
              }
              break
            }
          }
        }
      }, 100) // 稍微延遲確保 DOM 更新完成
    }
  }

  // #region 處理ECPay確認付款
  const handlePaymentConfirm = async () => {
    if (!paymentParams) {
      toast.error('付款參數錯誤，請重新嘗試')
      return
    }

    const { method, amount, items } = paymentParams

    // 用戶確認付款後才建立訂單
    setIsCreatingOrder(true)
    const reservationResult = await handleReservation()

    if (reservationResult && reservationResult.success) {
      const reservationId = reservationResult.reservationId

      switch (method) {
        case 'ecpay':
          window.location.href = `${API_SERVER}/payment/ecpay-test?amount=${amount}&items=${encodeURIComponent(items)}&type=venue&reservationId=${reservationId}`
          break
        case 'linepay':
          window.location.href = `${API_SERVER}/payment/line-pay-test/reserve?amount=${amount}&items=${encodeURIComponent(items)}&type=venue&reservationId=${reservationId}`
          break
        default:
          toast.error('不支援的付款方式')
          setIsCreatingOrder(false)
      }
    } else {
      // 訂單建立失敗，不跳轉付款頁面
      setIsCreatingOrder(false)
      setShowPaymentDialog(false)
    }
  }

  //  #region 載入和錯誤狀態處理
  /* if (isLoadingCenter) {
    return <LoadingState message="載入場館資料中..." />
  } */

  // #region 資料顯示選項
  const steps = [
    { id: 1, title: '選擇場地與時間', completed: true },
    { id: 2, title: '填寫付款資訊', active: true },
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
            {/* 付款流程 */}
            <section className="flex-1 lg:flex-2 min-w-0 flex flex-col">
              <h2 className="text-xl font-semibold mb-4">付款方式</h2>
              <Card>
                <CardContent className="flex flex-col gap-6">
                  {/* 預訂人資料 */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">訂單人資料</Label>
                    <div className="space-y-2 grid gap-3">
                      <div className="grid w-full items-center gap-3">
                        <Label htmlFor="name">姓名</Label>
                        <Input
                          type="text"
                          id="name"
                          placeholder="請輸入姓名"
                          className={cn(
                            'w-full',
                            errors.name &&
                              'border-destructive focus:border-destructive focus:ring-destructive'
                          )}
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange('name', e.target.value)
                          }
                          disabled
                        />
                        {errors.name && (
                          <span className="text-destructive text-sm">
                            {errors.name}
                          </span>
                        )}
                      </div>
                      <div className="grid w-full items-center gap-3">
                        <Label htmlFor="phone">電話</Label>
                        <Input
                          type="text"
                          id="phone"
                          placeholder="請填寫電話號碼(例：0912345678)"
                          className={cn(
                            'w-full',
                            errors.phone &&
                              'border-destructive focus:border-destructive focus:ring-destructive'
                          )}
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange('phone', e.target.value)
                          }
                          disabled
                        />
                        {errors.phone && (
                          <span className="text-destructive text-sm">
                            {errors.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* 付款方式 */}
                  <PaymentMethodSelector
                    selectedPayment={selectedPayment}
                    onPaymentChange={(value) =>
                      handleSelectChange('payment', value, setSelectedPayment)
                    }
                    options={[
                      paymentOptions[0],
                      paymentOptions[1],
                      paymentOptions[3],
                    ]}
                    errors={errors}
                  />

                  {/* 發票類型 */}
                  <ReceiptTypeSelector
                    selectedReceipt={selectedReceipt}
                    formData={formData}
                    onInputChange={handleInputChange}
                    onReceiptChange={(value) =>
                      handleSelectChange('receipt', value, setSelectedReceipt)
                    }
                    errors={errors}
                  />
                </CardContent>
              </Card>
            </section>

            {/* 訂單確認 */}
            <section className="flex-1 lg:max-w-sm xl:max-w-md min-w-0 w-full">
              <h2 className="text-xl font-semibold mb-4">您的訂單</h2>
              {/* 訂單摘要卡片 */}
              <Card>
                <CardHeader>
                  {/* 預約圖片 */}
                  {centerData && centerData.images && (
                    <div className="overflow-hidden rounded-lg">
                      <AspectRatio ratio={4 / 3} className="bg-muted">
                        <Image
                          alt={centerData.name}
                          className="object-cover"
                          fill
                          priority
                          sizes="(max-width: 768px) 100vw, 320px"
                          src={getCenterImageUrl(centerData.images[0])}
                        />
                      </AspectRatio>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 場館資訊 */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-accent-foreground">
                      場館資訊
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {/* <div>地區: {venueData.location || '未選擇'}</div> */}
                      <div className="text-sm text-primary">
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
                <CardFooter className="flex justify-end">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handlePayment}
                    disabled={isCreatingOrder}
                  >
                    {isCreatingOrder ? '處理中...' : '確認付款'}
                    <CreditCard />
                  </Button>
                </CardFooter>
              </Card>
            </section>
          </section>
        </div>
      </main>

      {/* ECPay 付款確認對話框 */}
      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認付款</AlertDialogTitle>
            <AlertDialogDescription>
              {paymentParams?.method === 'ecpay'
                ? '確認是否導向至 ECPay(綠界金流) 進行付款？'
                : paymentParams?.method === 'linepay'
                  ? '確認是否導向至 Line Pay 進行付款？'
                  : '確認是否進行付款？'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isCreatingOrder}
              onClick={() => {
                setShowPaymentDialog(false)
                setPaymentParams(null)
              }}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isCreatingOrder}
              onClick={() => {
                handlePaymentConfirm()
              }}
            >
              {isCreatingOrder ? '建立訂單中...' : '確認付款'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <PaymentContent />
    </Suspense>
  )
}
