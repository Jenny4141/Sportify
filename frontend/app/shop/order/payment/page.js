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
  // === 路由和搜尋參數處理 ===
  const router = useRouter()
  const { user } = useAuth()

  // 價格格式化
  const formatPrice = (price) => {
    return Number(price).toLocaleString('zh-TW')
  }
  // === 狀態管理 ===
  const [selectedPayment, setSelectedPayment] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState('')
  const [selectedDelivery, setSelectedDelivery] = useState('')
  const [carts, setCarts] = useState([])
  const [formData, setFormData] = useState({
    recipient: '',
    phone: '',
    address: '',
    storeName: '',
    carrierId: '',
    companyId: '',
  })
  const [errors, setErrors] = useState({})
  const [touchedFields, setTouchedFields] = useState({})
  const [showEcpayDialog, setShowEcpayDialog] = useState(false)

  // === SWR資料獲取 ===
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

  // 即時計算總價和總數量
  const { totalPrice, itemCount, shippingFee } = useMemo(() => {
    const totalPrice = carts.reduce((sum, cartItem) => {
      return sum + cartItem.product.price * cartItem.quantity
    }, 0)
    const itemCount = carts.reduce(
      (sum, cartItem) => sum + cartItem.quantity,
      0
    )
    // 運費計算
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

  // ===== 事件處理函數 =====
  // 表單輸入變更
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (touchedFields[field]) {
      const error = validateField(field, value, false)
      setErrors((prev) => ({
        ...prev,
        [field]: error,
      }))
    } else {
      if (value.trim() && errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: '',
        }))
      }
    }
  }
  // 輸入框失焦
  const handleInputBlur = (field, value) => {
    setTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }))
    const error = validateField(field, value, true)
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }))
  }
  // 下拉選單變更
  const handleSelectChange = (field, value, setter) => {
    setter(value)
    setTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }))
    const error = validateField(field, value, true)
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }))
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
      setFormData((prev) => ({
        ...prev,
        carrierId: '',
        companyId: '',
      }))
    }
    if (field === 'delivery') {
      if (value === '3') {
        // 宅配
        setFormData((prev) => ({ ...prev, storeName: '' }))
        setErrors((prev) => ({ ...prev, storeName: '' }))
        setTouchedFields((prev) => ({ ...prev, storeName: false }))
      } else if (value === '1') {
        // 7-11
        setFormData((prev) => ({ ...prev, address: '', storeName: '' }))
        setErrors((prev) => ({ ...prev, address: '', storeName: '' }))
        setTouchedFields((prev) => ({
          ...prev,
          address: false,
          storeName: false,
        }))
      } else {
        // 其他
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
  // ECPay付款確認
  const handleEcpayConfirm = async () => {
    try {
      const itemsArray = carts.map(
        (cartItem) => `${cartItem.product.name}x${cartItem.quantity}`
      )
      const items = itemsArray.join(',')
      const amount = totalPrice + shippingFee

      // 購物車項目資料
      const cartItems = carts.map((cartItem) => ({
        productId: cartItem.product.id,
        quantity: cartItem.quantity,
      }))

      const orderData = {
        ...formData,
        deliveryId: parseInt(selectedDelivery, 10),
        paymentId: parseInt(selectedPayment, 10),
        invoiceData: {
          invoiceId: parseInt(selectedReceipt, 10),
          carrier: formData.carrierId || null,
          tax: formData.companyId || null,
        },
      }
      // console.log('送出前的 orderData', orderData) // Debug 用

      // 後端建立訂單，傳送會員ID、訂單資料和購物車項目
      const checkoutPayload = {
        memberId: user?.id,
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

  // ECPay付款檢查
  const handleEcpay = async () => {
    try {
      // 測試用
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

      setShowEcpayDialog(true)
    } catch (error) {
      console.error('ECPay付款錯誤:', error)
      toast.error('付款過程發生錯誤，請稍後再試')
    }
  }

  // 付款按鈕點擊
  const handlePayment = async () => {
    const newErrors = {}
    newErrors.recipient = validateField(
      'recipient',
      formData.recipient || '',
      true
    )
    newErrors.phone = validateField('phone', formData.phone || '', true)
    newErrors.delivery = validateField('delivery', selectedDelivery || '', true)
    newErrors.payment = validateField('payment', selectedPayment || '', true)
    newErrors.receipt = validateField('receipt', selectedReceipt || '', true)

    // 宅配
    if (selectedDelivery === '3') {
      newErrors.address = validateField(
        'address',
        formData.address || '',
        true,
        selectedDelivery
      )
    }
    // 7-11
    if (selectedDelivery === '1') {
      newErrors.storeName = validateField(
        'storeName',
        formData.storeName || '',
        true,
        selectedDelivery
      )
    }

    // 電子載具
    if (selectedReceipt === '3') {
      newErrors.carrierId = validateField(
        'carrierId',
        formData.carrierId || '',
        true,
        '',
        selectedReceipt
      )
    }

    // 統一編號
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
      if (selectedPayment === '1') {
        // ECPay
        await handleEcpay()
      } else {
        // 其他付款方式
        try {
          const cartItems = carts.map((cartItem) => ({
            productId: cartItem.product.id,
            quantity: cartItem.quantity,
          }))

          // 建立訂單到資料庫
          const orderData = {
            recipient: formData.recipient,
            phone: formData.phone,
            address: formData.address || '',
            storeName: formData.storeName || '',
            deliveryId: parseInt(selectedDelivery),
            paymentId: parseInt(selectedPayment),
            invoiceData: {
              invoiceId: parseInt(selectedReceipt),
              carrier: formData.carrierId || null,
              tax: formData.companyId || null,
            },
          }

          // 呼叫後端建立訂單
          const checkoutPayload = {
            memberId: user?.id,
            orderData: orderData,
            cartItems: cartItems,
          }

          // console.log('發送到後端的資料 (貨到付款):', checkoutPayload)

          const orderResult = await checkout(checkoutPayload)

          if (orderResult.success) {
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
      // 表單驗證失敗
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
      setTimeout(() => {
        for (const errorField of errorFields) {
          if (newErrors[errorField.field]) {
            const element = document.querySelector(errorField.selector)
            if (element) {
              // 如果是輸入框，則聚焦
              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
              const input = element.querySelector('input') || element
              if (input && input.focus) {
                input.focus()
              }
              break
            }
          }
        }
      }, 100)
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

  // 未登入
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
                  <div data-field="payment">
                    <PaymentMethodSelector
                      selectedPayment={selectedPayment}
                      onPaymentChange={(value) =>
                        handleSelectChange('payment', value, setSelectedPayment)
                      }
                      options={[paymentOptions[0], paymentOptions[2]]}
                      errors={errors}
                    />
                  </div>
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
