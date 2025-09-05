'use client'

// hooks
import React, { useState, useEffect, Suspense } from 'react'
import { useCourse } from '@/contexts/course-context'
import { useAuth } from '@/contexts/auth-context'

// utils
import { validateField, cn } from '@/lib/utils'
import { API_SERVER } from '@/lib/api-path'
import { toast } from 'sonner'

// API 請求
import { fetchLesson } from '@/api/course/lesson'
import { createBooking } from '@/api/course/booking'

// Icon
import { CreditCard } from 'lucide-react'

// next 元件
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'

// UI 元件
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { AspectRatio } from '@/components/ui/aspect-ratio'
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

const steps = [
  { id: 1, title: '選擇課程', completed: true },
  { id: 2, title: '填寫付款資訊', active: true },
  { id: 3, title: '完成訂單', completed: false },
]

// 將使用 useSearchParams 的邏輯抽取到單獨的組件
function CoursePaymentContent() {
  // #region 路由和URL參數
  const router = useRouter()
  const { user } = useAuth()

  // #region 狀態管理
  const [lessonData, setLessonData] = useState(null)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false) // 建立訂單載入狀態
  const [isLoadingLesson, setIsLoadingLesson] = useState(true) // 載入課程資料狀態
  const [errors, setErrors] = useState({})

  const { courseData, setCourseData } = useCourse()
  const [lessonId, setLessonId] = useState(
    courseData.lessonId?.toString() || ''
  )

  // 付款和發票選項狀態
  const [selectedPayment, setSelectedPayment] = useState('1')
  const [selectedReceipt, setSelectedReceipt] = useState('1')

  // 用戶輸入資料狀態
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    carrierId: '', // 載具號碼
    companyId: '', // 統一編號
  })

  // ECPay 確認對話框狀態
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentParams, setPaymentParams] = useState(null)
  // 錯誤對話框狀態（建立訂單失敗時使用）
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorDialogMessage, setErrorDialogMessage] = useState('')

  // #region Lesson 資料
  useEffect(() => {
    console.log('lessonId:', lessonId)
    const fetchLessonData = async () => {
      try {
        setIsLoadingLesson(true)
        const lessonData = await fetchLesson(lessonId)
        setLessonData(lessonData.record)
        console.log('lessonData', lessonData)
      } catch (err) {
        console.error('Error fetching lesson detail:', err)
        setErrors(err.message)
        toast.error('載入課程資料失敗')
      } finally {
        setIsLoadingLesson(false)
      }
    }

    if (lessonId) {
      fetchLessonData()
    }
  }, [lessonId])

  // #region 事件處理函數
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

  /* // 表單驗證
  const validateForm = () => {
    const newErrors = {}

    // 基本資料驗證
    if (!formData.name.trim()) {
      newErrors.name = '請輸入姓名'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '請輸入電話號碼'
    } else if (!validateField('phone', formData.phone)) {
      newErrors.phone = '請輸入有效的電話號碼'
    }

    // 發票相關驗證
    if (selectedReceipt === '2' && !formData.carrierId.trim()) {
      newErrors.carrierId = '請輸入載具號碼'
    }

    if (selectedReceipt === '3' && !formData.companyId.trim()) {
      newErrors.companyId = '請輸入統一編號'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  } */

  // #region 處裡建立訂單
  // 主要預訂處理函數
  const handleBooking = async () => {
    setErrors({})
    setIsCreatingOrder(true)

    if (!lessonData) {
      setErrorDialogMessage('課程資料載入中，請稍後再試')
      setShowErrorDialog(true)
      setIsCreatingOrder(false)
      return { success: false }
    }

    setIsCreatingOrder(true)

    const bookingData = {
      memberId: user?.id || 102,
      lessonId: parseInt(lessonId),
      price: lessonData.price,
      statusId: 1,
      paymentId: parseInt(selectedPayment), // 轉換為數字
      invoiceId: parseInt(selectedReceipt), // 轉換為數字
      carrier: formData.carrierId || '', // 空字串而非 null
      tax: formData.companyId || '', // 空字串而非 null
    }

    console.log('Creating booking with data:', bookingData)

    try {
      const result = await createBooking(bookingData)

      if (result.success) {
        console.log('Booking created successfully:', result)
        return { success: true, bookingId: result.insertId }
        // 根據付款方式處理後續流程
      }

      const message = result?.message || '建立預約失敗'

      // 顯示後端錯誤訊息或 zod issues 在 AlertDialog
      if (result?.issues && Array.isArray(result.issues)) {
        const issueMsg = result.issues.map((i) => i.message).join('，')
        setErrorDialogMessage(issueMsg || message)
      } else {
        setErrorDialogMessage(message)
      }
      setShowErrorDialog(true)

      return { success: false }
    } catch (error) {
      console.error('Booking error:', error)
      setErrorDialogMessage(error?.message || '預約失敗，請稍後再試')
      setShowErrorDialog(true)
      return { success: false }
    } finally {
      setIsCreatingOrder(false)
    }
  }

  // 點擊「確認預約」：先建立訂單，建立成功才顯示付款確認對話框
  const handlePayment = async () => {
    try {
      setIsCreatingOrder(true)
      const bookingResult = await handleBooking()
      if (!bookingResult || !bookingResult.success) {
        // handleBooking 已設定錯誤訊息並開啟錯誤對話框
        setIsCreatingOrder(false)
        return
      }

      const bookingId = bookingResult.bookingId
      const amount = lessonData.price
      const items = lessonData.title

      if (selectedPayment === '1') {
        setPaymentParams({ method: 'ecpay', amount, items, bookingId })
        setShowPaymentDialog(true)
      } else if (selectedPayment === '2') {
        setPaymentParams({ method: 'linepay', amount, items, bookingId })
        setShowPaymentDialog(true)
      } else {
        // 現金或其他：已建立訂單，直接導向成功頁
        router.push(`/course/success?bookingId=${bookingId}`)
      }
    } catch (error) {
      console.error('Payment error:', error)
      setErrorDialogMessage('付款處理失敗，請稍後再試')
      setShowErrorDialog(true)
    } finally {
      setIsCreatingOrder(false)
    }
  }
  // #region 處理ECPay確認付款
  // 確認付款（此時訂單已建立，只負責跳轉第三方）
  const handlePaymentConfirm = async () => {
    if (!paymentParams) {
      setErrorDialogMessage('付款參數錯誤，請重新嘗試')
      setShowErrorDialog(true)
      return
    }

    const { method, amount, items, bookingId } = paymentParams
    setShowPaymentDialog(false)
    setIsCreatingOrder(true)

    try {
      switch (method) {
        case 'ecpay':
          window.location.href = `${API_SERVER}/payment/ecpay-test?amount=${amount}&items=${encodeURIComponent(items)}&type=course&bookingId=${bookingId}`
          break
        case 'linepay':
          window.location.href = `${API_SERVER}/payment/line-pay-test/reserve?amount=${amount}&items=${encodeURIComponent(items)}&type=course&bookingId=${bookingId}`
          break
        default:
          setErrorDialogMessage('不支援的付款方式')
          setShowErrorDialog(true)
          setIsCreatingOrder(false)
      }
    } catch (err) {
      console.error(err)
      setErrorDialogMessage('付款跳轉失敗，請稍後重試')
      setShowErrorDialog(true)
      setIsCreatingOrder(false)
    }
  }

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
            <section className="order-2 md:order-1 flex-2 w-full">
              <h2 className="text-xl font-semibold mb-4">付款方式</h2>
              <Card>
                <CardContent className="flex flex-col gap-6 pt-6">
                  {/* 預訂人資料 */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">訂購人資料</Label>
                    <div className="space-y-2 grid gap-3">
                      <div className="grid w-full items-center gap-3">
                        <Label htmlFor="name">姓名</Label>
                        <Input
                          type="text"
                          id="name"
                          placeholder="請輸入姓名"
                          className={cn(
                            'w-full',
                            errors.name && 'border-red-500'
                          )}
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange('name', e.target.value)
                          }
                          disabled
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500">{errors.name}</p>
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
                    onPaymentChange={setSelectedPayment}
                    options={[
                      paymentOptions[0],
                      paymentOptions[1],
                      paymentOptions[3],
                    ]}
                  />

                  {/* 發票類型 */}
                  <ReceiptTypeSelector
                    selectedReceipt={selectedReceipt}
                    onReceiptChange={setSelectedReceipt}
                  />

                  {/* 載具號碼 - 當選擇電子發票載具時顯示 */}
                  {selectedReceipt === '2' && (
                    <div className="grid w-full items-center gap-3">
                      <Label htmlFor="carrierId">載具號碼</Label>
                      <Input
                        type="text"
                        id="carrierId"
                        placeholder="請輸入載具號碼"
                        className={cn(
                          'w-full',
                          errors.carrierId && 'border-red-500'
                        )}
                        value={formData.carrierId}
                        onChange={(e) =>
                          handleInputChange('carrierId', e.target.value)
                        }
                      />
                      {errors.carrierId && (
                        <p className="text-sm text-red-500">
                          {errors.carrierId}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 統一編號 - 當選擇公司發票時顯示 */}
                  {selectedReceipt === '3' && (
                    <div className="grid w-full items-center gap-3">
                      <Label htmlFor="companyId">統一編號</Label>
                      <Input
                        type="text"
                        id="companyId"
                        placeholder="請輸入統一編號"
                        className={cn(
                          'w-full',
                          errors.companyId && 'border-red-500'
                        )}
                        value={formData.companyId}
                        onChange={(e) =>
                          handleInputChange('companyId', e.target.value)
                        }
                      />
                      {errors.companyId && (
                        <p className="text-sm text-red-500">
                          {errors.companyId}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* 訂單確認 */}
            <section className="order-1 md:order-2 flex-1 w-full">
              <h2 className="text-xl font-semibold mb-4">課程訂單摘要</h2>

              {/* 訂單摘要卡片 */}
              <Card>
                <CardHeader>
                  {/* 課程圖片 */}
                  {isLoadingLesson ? (
                    <div className="overflow-hidden rounded-lg">
                      <AspectRatio
                        ratio={4 / 3}
                        className="bg-muted animate-pulse"
                      />
                    </div>
                  ) : lessonData?.image ? (
                    <div className="overflow-hidden rounded-lg">
                      <AspectRatio ratio={4 / 3}>
                        <Image
                          alt={lessonData.title}
                          className="object-cover"
                          fill
                          priority
                          sizes="(max-width: 768px) 100vw, 320px"
                          src={lessonData.image}
                        />
                      </AspectRatio>
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 課程資訊 */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-accent-foreground">
                      課程資訊
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>課程名稱:</span>
                        <span className="font-medium">
                          {isLoadingLesson ? (
                            <div className="h-4 bg-muted animate-pulse rounded w-20" />
                          ) : (
                            lessonData?.title || '載入中...'
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>運動類型:</span>
                        <span>
                          {isLoadingLesson ? (
                            <div className="h-4 bg-muted animate-pulse rounded w-16" />
                          ) : (
                            lessonData?.sport_name || '載入中...'
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>授課教練:</span>
                        <span>
                          {isLoadingLesson ? (
                            <div className="h-4 bg-muted animate-pulse rounded w-16" />
                          ) : (
                            lessonData?.coach_name || '載入中...'
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>上課地點:</span>
                        <span>
                          {isLoadingLesson ? (
                            <div className="h-4 bg-muted animate-pulse rounded w-24" />
                          ) : (
                            lessonData?.court_name || '載入中...'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 上課時間 */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-accent-foreground">
                      上課時間
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>上課日:</span>
                        <span>
                          {isLoadingLesson ? (
                            <div className="h-4 bg-muted animate-pulse rounded w-16" />
                          ) : (
                            lessonData?.dayOfWeek || '載入中...'
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>課程期間:</span>
                        <span>
                          {isLoadingLesson ? (
                            <div className="h-4 bg-muted animate-pulse rounded w-32" />
                          ) : lessonData?.startDate && lessonData?.endDate ? (
                            `${new Date(lessonData.startDate).toLocaleDateString('zh-TW')} - ${new Date(lessonData.endDate).toLocaleDateString('zh-TW')}`
                          ) : (
                            '載入中...'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 課程描述 */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-accent-foreground">
                      課程描述
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      {isLoadingLesson ? (
                        <div className="space-y-2">
                          <div className="h-4 bg-muted animate-pulse rounded w-full" />
                          <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                        </div>
                      ) : (
                        lessonData?.description || '載入中...'
                      )}
                    </div>
                  </div>

                  {/* 報名人數 */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-accent-foreground">
                      報名人數
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>目前報名人數:</span>
                        <span className="font-medium">
                          {isLoadingLesson ? (
                            <div className="h-4 bg-muted animate-pulse rounded w-8" />
                          ) : (
                            `${lessonData?.currentCount || 0} 人`
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>剩餘名額:</span>
                        <span className="font-medium">
                          {isLoadingLesson ? (
                            <div className="h-4 bg-muted animate-pulse rounded w-8" />
                          ) : (
                            `${lessonData ? lessonData.maxCapacity - lessonData.currentCount : 0} 人`
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>課程上限:</span>
                        <span className="font-medium">
                          {isLoadingLesson ? (
                            <div className="h-4 bg-muted animate-pulse rounded w-8" />
                          ) : (
                            `${lessonData?.maxCapacity || 0} 人`
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 費用明細 */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">總計</span>
                      <span className="text-lg font-bold text-primary">
                        {isLoadingLesson ? (
                          <div className="h-6 bg-muted animate-pulse rounded w-16" />
                        ) : (
                          `NT$ ${lessonData?.price.toLocaleString() || 0}`
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-3">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handlePayment}
                    disabled={isCreatingOrder}
                  >
                    {isCreatingOrder ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        處理中...
                      </>
                    ) : (
                      <>
                        確認預約
                        <CreditCard />
                      </>
                    )}
                  </Button>

                  {/* 付款確認對話框（受控） */}
                  <AlertDialog
                    open={showPaymentDialog}
                    onOpenChange={setShowPaymentDialog}
                  >
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>確認課程預約</AlertDialogTitle>
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
                          onClick={() => setShowPaymentDialog(false)}
                        >
                          取消
                        </AlertDialogCancel>
                        <AlertDialogAction
                          disabled={isCreatingOrder}
                          onClick={() => {
                            handlePaymentConfirm()
                          }}
                        >
                          確認預約
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* 錯誤對話框：建立訂單失敗時顯示 */}
                  <AlertDialog
                    open={showErrorDialog}
                    onOpenChange={setShowErrorDialog}
                  >
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">
                          訂單建立失敗
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {errorDialogMessage}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          onClick={() => setShowErrorDialog(false)}
                        >
                          關閉
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            setShowErrorDialog(false)
                            router.push(`/course/${lessonId}`)
                          }}
                        >
                          返回課程頁
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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

export default function CoursePaymentPage() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <CoursePaymentContent />
    </Suspense>
  )
}
