'use client'

// react
import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import Image from 'next/image'
// ui components
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
// 自定義 components
import { Navbar } from '@/components/navbar'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import Step from '@/components/step'
import Footer from '@/components/footer'
import PaymentMethodSelector, {
  paymentOptions,
} from '@/components/payment-method-selector'
import ReceiptTypeSelector from '@/components/receipt-type-selector'
import DeliveryMethodSelector, {
  DeliveryOptions,
} from '@/components/delivery-method-selector'
import { LoadingState, ErrorState } from '@/components/loading-states'
// hooks
import { useAuth } from '@/contexts/auth-context'
// api
import { getProductImageUrl } from '@/api/admin/shop/image'
import { getCarts, checkout } from '@/api'
// others
import { toast } from 'sonner'
import { validateField } from '@/lib/utils'
import { API_SERVER } from '@/lib/api-path'

const steps = [
  { id: 1, title: '確認購物車', completed: true },
  { id: 2, title: '填寫付款資訊', active: true },
  { id: 3, title: '完成訂單', completed: false },
]

export default function ProductPaymentPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  // ===== 路由和搜尋參數處理 =====
  const router = useRouter()
  const { user } = useAuth()

  // 格式化價格，加上千分位逗號
  const formatPrice = (price) => {
    return Number(price).toLocaleString('zh-TW')
  }

  // ===== 組件狀態管理 =====
  const [selectedPayment, setSelectedPayment] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState('')
  const [selectedDelivery, setSelectedDelivery] = useState('')
  const [carts, setCarts] = useState([])
  const [formData, setFormData] = useState({
    recipient: '',
    phone: '',
    address: '',
    storeName: '',
    carrierId: '', // 載具號碼
    companyId: '', // 統一編號
  })
  const [errors, setErrors] = useState({})
  const [touchedFields, setTouchedFields] = useState({}) // 追蹤欄位是否已被觸碰（用於決定是否顯示驗證錯誤）
  const [showEcpayDialog, setShowEcpayDialog] = useState(false) // ECPay 確認對話框狀態

  // ===== 數據獲取 =====
  const shouldFetch = isAuthenticated
  const {
    data: cartData,
    isLoading: isCartLoading,
    error: cartError,
    mutate,
  } = useSWR(
    shouldFetch ? ['carts-checkout'] : null,
    shouldFetch
      ? async () => {
          const result = await getCarts()
          return result
        }
      : null
  )

  // 計算總價和總數量
  const { totalPrice, itemCount, shippingFee } = useMemo(() => {
    const totalPrice = carts.reduce((sum, cartItem) => {
      return sum + cartItem.product.price * cartItem.quantity
    }, 0)
    const itemCount = carts.reduce(
      (sum, cartItem) => sum + cartItem.quantity,
      0
    )

    // 計算運費
    const selectedDeliveryOption = DeliveryOptions.find(
      (option) => option.id === selectedDelivery
    )
    const shippingFee = selectedDeliveryOption?.fee || 0

    return { totalPrice, itemCount, shippingFee }
  }, [carts, selectedDelivery])

  // ===== 副作用處理 =====
  useEffect(() => {
    if (cartData?.data?.cart?.cartItems) {
      setCarts(cartData.data.cart.cartItems)
    }
  }, [cartData])

  // 接收 7-11 選擇門市後的資料
  // useEffect(() => {
  //   const handleStoreMessage = (event) => {
  //     if (event.data?.storename) {
  //       setFormData((prev) => ({
  //         ...prev,
  //         storeName: event.data.storename,
  //       }))
  //     }
  //   }

  //   window.addEventListener('message', handleStoreMessage)

  //   return () => {
  //     window.removeEventListener('message', handleStoreMessage)
  //   }
  // }, [])

  // ===== 事件處理函數 =====
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // 如果欄位已被觸碰過，才進行即時驗證
    if (touchedFields[field]) {
      const error = validateField(field, value, false)
      setErrors((prev) => ({
        ...prev,
        [field]: error,
      }))
    } else {
      // 清除可能存在的錯誤（例如必填錯誤）
      if (value.trim() && errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: '',
        }))
      }
    }
  }

  // 處理輸入框失焦事件
  const handleInputBlur = (field, value) => {
    setTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }))

    // 失焦時進行完整驗證
    const error = validateField(field, value, true)
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }))
  }

  // 處理下拉選單變更
  const handleSelectChange = (field, value, setter) => {
    setter(value)

    // 標記為已觸碰並進行驗證
    setTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }))

    const error = validateField(field, value, true)
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }))

    // 如果改變發票類型，清除相關欄位的錯誤和觸碰狀態
    if (field === 'receipt') {
      setErrors((prev) => ({
        ...prev,
        carrierId: '',
        companyId: '',
      }))
      setTouchedFields((prev) => ({
        ...prev,
        carrierId: false,
        companyId: false,
      }))
      // 清除相關欄位的值
      setFormData((prev) => ({
        ...prev,
        carrierId: '',
        companyId: '',
      }))
    }

    // 如果改變配送方式，清除地址相關的錯誤和觸碰狀態（如果不是宅配）
    if (field === 'delivery') {
      if (value === '3') {
        // 宅配：清空 7-11 門市，避免之後直接用到舊門市
        setFormData((prev) => ({ ...prev, storeName: '' }))
        setErrors((prev) => ({ ...prev, storeName: '' }))
        setTouchedFields((prev) => ({ ...prev, storeName: false }))
      } else if (value === '1') {
        // 7-11：清空宅配地址，且強制重選門市（清空舊門市）
        setFormData((prev) => ({ ...prev, address: '', storeName: '' }))
        setErrors((prev) => ({ ...prev, address: '', storeName: '' }))
        setTouchedFields((prev) => ({
          ...prev,
          address: false,
          storeName: false,
        }))
      } else {
        // 其他超商（如果有）：清宅配地址，也清空舊門市以強制重選
        setFormData((prev) => ({ ...prev, address: '', storeName: '' }))
        setErrors((prev) => ({ ...prev, address: '', storeName: '' }))
        setTouchedFields((prev) => ({
          ...prev,
          address: false,
          storeName: false,
        }))
      }
    }
  }

  // 處理ECPay付款確認
  const handleEcpayConfirm = async () => {
    try {
      // 準備商品名稱
      const itemsArray = carts.map(
        (cartItem) => `${cartItem.product.name}x${cartItem.quantity}`
      )
      const items = itemsArray.join(',')
      const amount = totalPrice + shippingFee

      // 準備購物車項目資料（符合後端期望的格式）
      const cartItems = carts.map((cartItem) => ({
        productId: cartItem.product.id, // 使用 cartItem.product.id
        quantity: cartItem.quantity,
      }))

      const orderData = {
        ...formData, // formData 必須和後端欄位名稱一致

        // 確保數字型欄位轉型
        deliveryId: parseInt(selectedDelivery, 10),
        paymentId: parseInt(selectedPayment, 10),

        // 發票資料獨立處理
        invoiceData: {
          invoiceId: parseInt(selectedReceipt, 10),
          carrier: formData.carrierId || null,
          tax: formData.companyId || null,
        },
      }
      // Debug 用
      // console.log('送出前的 orderData', orderData)

      // 呼叫後端建立訂單，傳送會員ID、訂單資料和購物車項目
      const checkoutPayload = {
        memberId: user?.id, // 取用登入會員ID
        orderData: orderData,
        cartItems: cartItems,
      }

      const orderResult = await checkout(checkoutPayload)

      if (orderResult.success) {
        // 訂單建立成功，導向 ECPay 金流頁
        router.push(
          `${API_SERVER}/payment/ecpay-test?amount=${amount}&items=${encodeURIComponent(items)}&type=shop&orderId=${orderResult.data.id || ''}`
        )
      } else {
        toast.error('建立訂單失敗: ' + (orderResult.message || '未知錯誤'))
        console.error('訂單建立失敗:', orderResult)
      }
    } catch (error) {
      console.error('ECPay付款錯誤:', error)
      toast.error('付款過程發生錯誤，請稍後再試')
    }
  }

  // 處理ECPay付款
  const handleEcpay = async () => {
    try {
      // 暫時註解登入檢查，用於測試
      // if (!isAuthenticated || !user) {
      //   toast.error('請先登入')
      //   return
      // }

      // 檢查是否有購物車資料
      if (!carts || carts.length === 0) {
        toast.error('購物車是空的，無法進行付款')
        return
      }

      // 檢查表單必填欄位
      if (
        !formData.recipient ||
        !formData.phone ||
        !selectedDelivery ||
        !selectedPayment ||
        !selectedReceipt
      ) {
        toast.error('請填寫完整的訂單資訊')
        return
      }

      // 顯示確認對話框
      setShowEcpayDialog(true)
    } catch (error) {
      console.error('ECPay付款錯誤:', error)
      toast.error('付款過程發生錯誤，請稍後再試')
    }
  }

  // 處理付款按鈕點擊
  const handlePayment = async () => {
    // 先執行驗證並獲取錯誤
    const newErrors = {}
    // 共用必填欄位
    newErrors.recipient = validateField(
      'recipient',
      formData.recipient || '',
      true
    )
    newErrors.phone = validateField('phone', formData.phone || '', true)
    newErrors.delivery = validateField('delivery', selectedDelivery || '', true)
    newErrors.payment = validateField('payment', selectedPayment || '', true)
    newErrors.receipt = validateField('receipt', selectedReceipt || '', true)

    // 宅配 → 驗證 address
    if (selectedDelivery === '3') {
      newErrors.address = validateField(
        'address',
        formData.address || '',
        true,
        selectedDelivery
      )
    }

    // 7-11 取貨 → 驗證 storeName
    if (selectedDelivery === '1') {
      newErrors.storeName = validateField(
        'storeName',
        formData.storeName || '',
        true,
        selectedDelivery
      )
    }

    // 電子載具 → 驗證 carrierId
    if (selectedReceipt === '3') {
      newErrors.carrierId = validateField(
        'carrierId',
        formData.carrierId || '',
        true,
        '',
        selectedReceipt
      )
    }

    // 統一編號 → 驗證 companyId
    if (selectedReceipt === '2') {
      newErrors.companyId = validateField(
        'companyId',
        formData.companyId || '',
        true,
        '',
        selectedReceipt
      )
    }

    setErrors(newErrors)

    // 標記所有欄位為已觸碰
    setTouchedFields({
      recipient: true,
      phone: true,
      address: true,
      storeName: true,
      delivery: true,
      payment: true,
      receipt: true,
      carrierId: true,
      companyId: true,
    })

    // 檢查是否有任何錯誤
    const hasErrors = Object.values(newErrors).some((error) => error !== '')

    if (!hasErrors) {
      // 表單驗證通過，根據付款方式處理
      if (selectedPayment === '1') {
        // ECPay綠界金流
        await handleEcpay()
      } else {
        // 其他付款方式
        try {
          // 準備購物車項目資料
          const cartItems = carts.map((cartItem) => ({
            productId: cartItem.product.id,
            quantity: cartItem.quantity,
          }))

          // 建立訂單到資料庫
          const orderData = {
            recipient: formData.recipient,
            phone: formData.phone,
            address: formData.address || '', // 如果不是宅配可能為空
            storeName: formData.storeName || '',
            deliveryId: parseInt(selectedDelivery), // 轉換為數字
            paymentId: parseInt(selectedPayment), // 轉換為數字
            invoiceData: {
              invoiceId: parseInt(selectedReceipt), // 轉換為數字
              carrier: formData.carrierId || null,
              tax: formData.companyId || null,
            },
          }

          // 呼叫後端建立訂單
          const checkoutPayload = {
            memberId: user?.id, // 取用登入會員ID
            orderData: orderData,
            cartItems: cartItems,
          }

          // console.log('發送到後端的資料 (貨到付款):', checkoutPayload)

          const orderResult = await checkout(checkoutPayload)

          if (orderResult.success) {
            // 訂單建立成功，導向 /shop/order/success/?orderId=xxx
            router.push(`/shop/order/success/?orderId=${orderResult.data.id}`)
          } else {
            toast.error('建立訂單失敗: ' + (orderResult.message || '未知錯誤'))
            console.error('訂單建立失敗:', orderResult)
          }
        } catch (error) {
          console.error('建立訂單錯誤:', error)
          toast.error('建立訂單過程發生錯誤，請稍後再試')
        }
      }
    } else {
      // 表單驗證失敗，滾動到第一個錯誤欄位
      const errorFields = [
        { field: 'recipient', selector: '#recipient' },
        { field: 'phone', selector: '#phone' },
        { field: 'address', selector: '#address' },
        { field: 'storeName', selector: '#storeName' },
        { field: 'delivery', selector: '[data-field="delivery"]' },
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

  // ===== 載入和錯誤狀態處理 =====
  if (isCartLoading) {
    return <LoadingState message="載入購物車資料中..." />
  }
  if (cartError) {
    return (
      <ErrorState
        title="購物車資料載入失敗"
        message={`載入錯誤：${cartError.message}` || '載入購物車資料時發生錯誤'}
        onRetry={() => window.location.reload()}
        backUrl="/shop/order"
        backLabel="返回購物車"
      />
    )
  }

  // 未登入狀態
  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <section className="flex flex-col items-center justify-center min-h-[60vh] py-20">
          <div className="text-2xl font-bold mb-4">請先登入</div>
          <Link href="/login">
            <Button variant="highlight">前往登入</Button>
          </Link>
        </section>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <BreadcrumbAuto />
      <section className="px-4 md:px-6 py-10 ">
        <div className="flex flex-col container mx-auto max-w-screen-xl min-h-screen gap-6">
          <Step
            steps={steps}
            orientation="horizontal"
            onStepClick={(step, index) => console.log('Clicked step:', step)}
          />
          <div className="flex  flex-col md:flex-row gap-6">
            {/* 左側內容 */}
            <div className="flex flex-3 flex-col min-w-0 gap-5">
              <Card>
                <CardContent>
                  <Table className="w-full table-fixed">
                    <TableHeader className="border-b-2 border-card-foreground">
                      <TableRow className="text-base font-bold">
                        <TableHead className="font-bold w-1/2 text-accent-foreground">
                          商品名稱
                        </TableHead>
                        <TableHead className="font-bold w-1/4 text-accent-foreground">
                          單價
                        </TableHead>
                        <TableHead className="font-bold w-1/4 text-accent-foreground text-center">
                          數量
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-card-foreground">
                      {carts && carts.length > 0 ? (
                        carts.map((cartItem) => {
                          // 處理圖片路徑
                          const product = cartItem.product
                          const imageFileName = product.images?.[0]?.url || ''

                          return (
                            <TableRow key={cartItem.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 overflow-hidden flex-shrink-0">
                                    <Image
                                      className="object-cover w-full h-full"
                                      src={getProductImageUrl(imageFileName)}
                                      alt={product.name}
                                      width={40}
                                      height={40}
                                    />
                                  </div>
                                  <span className="text-base whitespace-normal text-accent-foreground">
                                    {product.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-accent-foreground">
                                ${formatPrice(product.price)}
                              </TableCell>
                              <TableCell className="text-accent-foreground">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="w-12 text-center select-none">
                                    {cartItem.quantity}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-8 text-muted-foreground"
                          >
                            購物車是空的
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-6">
                  {/* 收件人資訊 */}
                  <div className="space-y-3">
                    <div className="flex items-center mb-2 gap-4">
                      <Label className="text-lg font-bold mb-0">付款資訊</Label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="autoFillMember"
                          className="mr-2 accent-highlight"
                          onChange={(e) => {
                            if (e.target.checked && user) {
                              setFormData((prev) => ({
                                ...prev,
                                recipient: user.name || '',
                                phone: user.phone || '',
                              }))
                              setTouchedFields((prev) => ({
                                ...prev,
                                recipient: true,
                                phone: true,
                              }))
                              setErrors((prev) => ({
                                ...prev,
                                recipient: '',
                                phone: '',
                              }))
                            }
                          }}
                        />
                        <Label
                          htmlFor="autoFillMember"
                          className="cursor-pointer select-none text-sm mb-0"
                        >
                          同會員資料
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-2 grid gap-3">
                      <div className="grid w-full items-center gap-3">
                        <Label htmlFor="recipient">收件人</Label>
                        <Input
                          type="text"
                          id="recipient"
                          placeholder="請填寫收件人姓名"
                          className={`w-full ${errors.recipient ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}`}
                          value={formData.recipient || ''}
                          onChange={(e) =>
                            handleInputChange('recipient', e.target.value)
                          }
                          onBlur={(e) =>
                            handleInputBlur('recipient', e.target.value)
                          }
                        />
                        {errors.recipient && (
                          <span className="text-destructive text-sm">
                            {errors.recipient}
                          </span>
                        )}
                      </div>
                      <div className="grid w-full items-center gap-3">
                        <Label htmlFor="phone">手機號碼</Label>
                        <Input
                          type="text"
                          id="phone"
                          placeholder="請填寫電話號碼(例：0912345678)"
                          className={`w-full ${errors.phone ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}`}
                          value={formData.phone || ''}
                          onChange={(e) =>
                            handleInputChange('phone', e.target.value)
                          }
                          onBlur={(e) =>
                            handleInputBlur('phone', e.target.value)
                          }
                        />
                        {errors.phone && (
                          <span className="text-destructive text-sm">
                            {errors.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* 物流方式 */}
                  <div data-field="delivery">
                    <DeliveryMethodSelector
                      key={`delivery-${selectedDelivery}`}
                      selectedDelivery={selectedDelivery}
                      onDeliveryChange={(value) =>
                        handleSelectChange(
                          'delivery',
                          value,
                          setSelectedDelivery
                        )
                      }
                      errors={errors}
                      formData={formData}
                      onInputChange={handleInputChange}
                      onInputBlur={handleInputBlur}
                    />
                  </div>
                  {/* 付款方式 */}
                  <div data-field="payment">
                    <PaymentMethodSelector
                      selectedPayment={selectedPayment}
                      onPaymentChange={(value) =>
                        handleSelectChange('payment', value, setSelectedPayment)
                      }
                      options={[
                        paymentOptions[0],
                        paymentOptions[2],
                      ]}
                      errors={errors}
                    />
                  </div>
                  {/* 發票類型 */}
                  <div data-field="receipt">
                    <ReceiptTypeSelector
                      selectedReceipt={selectedReceipt}
                      formData={formData}
                      onInputChange={handleInputChange}
                      onInputBlur={handleInputBlur}
                      errors={errors}
                      onReceiptChange={(value) =>
                        handleSelectChange('receipt', value, setSelectedReceipt)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* 右側明細卡片 */}
            <div className="flex-1 text-accent-foreground sticky top-32 max-h-[calc(100vh-104px)] self-start">
              <Card className="h-70">
                <CardContent className="flex flex-col justify-between h-full">
                  <Table className="w-full table-fixed text-base">
                    <TableBody>
                      <TableRow className="flex justify-end">
                        <TableCell></TableCell>
                        <TableCell>共有{itemCount}件商品</TableCell>
                      </TableRow>
                      <TableRow className="flex justify-between">
                        <TableCell>商品金額</TableCell>
                        <TableCell>${formatPrice(totalPrice)}</TableCell>
                      </TableRow>
                      <TableRow className="flex justify-between border-b border-card-foreground">
                        <TableCell>運費</TableCell>
                        <TableCell>${formatPrice(shippingFee)}</TableCell>
                      </TableRow>
                      <TableRow className="flex justify-between">
                        <TableCell>商品小計</TableCell>
                        <TableCell>${formatPrice(totalPrice)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <div className="flex justify-between gap-2">
                    <Link href="/shop/order">
                      <Button variant="default" className="w-[120px]">
                        返回購物車
                      </Button>
                    </Link>
                    <Button
                      variant="highlight"
                      className="w-[120px]"
                      onClick={handlePayment}
                    >
                      付款
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ECPay 付款確認對話框 */}
      <AlertDialog open={showEcpayDialog} onOpenChange={setShowEcpayDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認付款</AlertDialogTitle>
            <AlertDialogDescription>
              確認是否導向至 ECPay(綠界金流) 進行付款？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowEcpayDialog(false)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowEcpayDialog(false)
                handleEcpayConfirm()
              }}
            >
              確認付款
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </>
  )
}
