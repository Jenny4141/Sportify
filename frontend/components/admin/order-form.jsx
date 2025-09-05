'use client'

// react
import { useState, useEffect } from 'react'
// ui components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  CardHeader,
  CardTitle,
  CardDescription,
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
} from '@/components/ui/alert-dialog'
// api
import {
  getOrderById,
  createAdminOrder,
  updateOrder,
} from '@/api/admin/shop/order'
import {
  fetchDeliveryOptions,
  fetchPaymentOptions,
  fetchInvoiceOptions,
  fetchStatusOptions,
} from '@/api/common'
import { fetchAllProductsOrder } from '@/api/admin/shop/product'
// others
import { toast } from 'sonner'
import { API_SERVER } from '@/lib/api-path'

export default function OrderForm({
  mode = 'add',
  orderId = null,
  title,
  description,
  submitButtonText,
  loadingButtonText,
  onSuccess,
  onCancel,
}) {
  // ===== 組件狀態管理 =====
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(mode === 'edit')
  const [isInitialLoad, setIsInitialLoad] = useState(true) // 防止載入時觸發運費重置
  const [errors, setErrors] = useState({})
  const [delivery, setDelivery] = useState([])
  const [payment, setPayment] = useState([])
  const [invoice, setInvoice] = useState([])
  const [orderStatus, setOrderStatus] = useState([])
  const [products, setProducts] = useState([])
  const [showEcpayDialog, setShowEcpayDialog] = useState(false)
  const [formData, setFormData] = useState({
    memberId: '',
    total: '',
    recipient: '',
    phone: '',
    address: '',
    storeName: '',
    delivery: '',
    fee: '',
    payment: '',
    invoice: '',
    invoiceNumber: '',
    invoiceCarrier: '', // 載具號碼
    invoiceTaxId: '', // 統一編號
    status: '',
    items: [], // [{ productId, name, price, quantity, ... }]
  })

  // ===== 副作用處理 =====
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [
          deliveryData,
          paymentData,
          invoiceData,
          orderStatusData,
          productData,
        ] = await Promise.all([
          fetchDeliveryOptions(),
          fetchPaymentOptions(),
          fetchInvoiceOptions(),
          fetchStatusOptions(),
          fetchAllProductsOrder(),
        ])
        setDelivery(deliveryData.rows || [])
        setPayment(paymentData.rows || [])
        setInvoice(invoiceData.rows || [])
        setOrderStatus(orderStatusData.rows || [])
        setProducts(productData.data || [])
      } catch (error) {
        console.error('載入選項失敗:', error)
        toast.error('載入選項失敗: ' + (error.message || '未知錯誤'))
      }
    }
    loadOptions()
  }, [])

  useEffect(() => {
    if (
      mode !== 'edit' ||
      !orderId ||
      payment.length === 0 ||
      invoice.length === 0
    ) {
      if (mode !== 'edit') {
        setIsDataLoading(false)
        setIsInitialLoad(false)
      }
      return
    }
    const loadOrder = async () => {
      try {
        setIsDataLoading(true)
        const orderData = await getOrderById(orderId)

        if (orderData.code === 200 && orderData.data) {
          const data = orderData.data

          // 處理商品明細，使用快照資料
          const processedItems = (data.items || []).map((item) => ({
            item_id: item.item_id,
            productId:
              item.product_id?.toString() || item.productId?.toString() || '',
            name: item.product_name || item.name || '',
            price: item.price?.toString() || '',
            quantity: item.quantity || 1,
            is_removed: item.is_removed || 0,
            item_status: item.item_status || 'active',
          }))

          const formDataToSet = {
            memberId: data.member_id?.toString() || '',
            total: data.total?.toString() || '',
            recipient: data.recipient || '',
            phone: data.phone || '',
            address: data.address || '',
            storeName: data.storeName || '',
            delivery: data.delivery_id?.toString() || '',
            fee: data.fee !== undefined ? data.fee.toString() : '',
            payment: data.payment_id?.toString() || '',
            invoice: data.invoice?.id?.toString() || '',
            invoiceNumber: data.invoice?.number || '',
            invoiceCarrier: data.invoice?.carrier || '',
            invoiceTaxId: data.invoice?.tax || '',
            status: data.status_id?.toString() || '',
            items: processedItems,
          }

          setFormData(formDataToSet)
        }
      } catch (error) {
        console.error('載入訂單資料失敗:', error)
        toast.error('載入訂單資料失敗')
      } finally {
        setIsDataLoading(false)
        setIsInitialLoad(false)
      }
    }
    loadOrder()
  }, [mode, orderId, payment, invoice])

  useEffect(() => {
    const handleStoreMessage = (event) => {
      if (event.data?.storename) {
        setFormData((prev) => ({
          ...prev,
          storeName: event.data.storename,
        }))
      }
    }

    window.addEventListener('message', handleStoreMessage)
    return () => window.removeEventListener('message', handleStoreMessage)
  }, [])

  // ===== 事件處理函數 =====
  const handleInputChange = (name, value) => {
    // 選擇物流方式時自動帶入運費
    if (name === 'delivery' && !isInitialLoad) {
      let fee = ''
      // 根據物流方式 ID 設定運費
      if (value === '1' || value === '2')
        fee = 60 // 7-11 或全家
      else if (value === '3') fee = 100 // 宅配

      // 如果不是宅配，清空地址
      const addressValue = value === '3' ? formData.address : ''
      setFormData((prev) => ({
        ...prev,
        delivery: value,
        fee,
        address: addressValue,
      }))

      // 清除地址相關錯誤
      if (value !== '3') {
        setErrors((prev) => ({ ...prev, address: '' }))
      }
    } else if (name === 'delivery') {
      const addressValue = value === '3' ? formData.address : ''
      setFormData((prev) => ({
        ...prev,
        delivery: value,
        address: addressValue,
      }))
    } else if (name === 'invoice') {
      setFormData((prev) => ({
        ...prev,
        invoice: value,
        invoiceCarrier: '',
        invoiceTaxId: '',
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  // 7-11 選擇門市
  const sevenStore = () => {
    window.open(
      'https://emap.presco.com.tw/c2cemap.ashx?eshopid=870&&servicetype=1&url=' +
        encodeURIComponent(`${API_SERVER}/shop/shipment`),
      '',
      'width=900,height=600'
    )
  }
  const handleItemChange = (idx, key, value) => {
    setFormData((prev) => {
      const items = [...prev.items]
      items[idx] = { ...items[idx], [key]: value }
      return { ...prev, items }
    })
  }
  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: '',
          name: '',
          price: '',
          quantity: 1,
          is_removed: 0,
          item_status: 'active',
        },
      ],
    }))
  }
  const handleRemoveItem = (idx) => {
    setFormData((prev) => {
      const items = [...prev.items]
      items.splice(idx, 1)
      return { ...prev, items }
    })
  }

  const handleProductSelect = (idx, productId) => {
    const product = products.find((p) => p.id.toString() === productId)
    const price = product?.price || ''

    setFormData((prev) => {
      const items = [...prev.items]
      items[idx] = {
        ...items[idx],
        productId,
        name: product?.name || '',
        price: price?.toString() || '',
        quantity: items[idx].quantity || 1,
        is_removed: 0,
        item_status: 'active',
      }
      return { ...prev, items }
    })
  }

  // 計算單項商品總價
  const calculateItemTotal = (price, quantity) => {
    const p = parseFloat(price) || 0
    const q = parseInt(quantity) || 0
    return p * q
  }
  const calculateAllItemsTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + calculateItemTotal(item.price, item.quantity)
    }, 0)
  }
  const calculateOrderTotal = () => {
    const itemsTotal = calculateAllItemsTotal()
    const fee = parseFloat(formData.fee) || 0
    return itemsTotal + fee
  }

  // ===== 共同整理送出資料 =====
  const buildSubmitPayload = () => {
    return {
      member_id: formData.memberId,
      total: calculateOrderTotal(),
      fee: Number(formData.fee),
      recipient: formData.recipient,
      phone: formData.phone,
      address: formData.delivery === '3' ? formData.address : '',
      storeName: formData.delivery === '1' ? formData.storeName : '',
      deliveryId: formData.delivery,
      paymentId: formData.payment,
      statusId: formData.status,
      invoiceId: formData.invoice,
      carrier: formData.invoice === '3' ? formData.invoiceCarrier : null,
      tax: formData.invoice === '2' ? formData.invoiceTaxId : null,
      items: formData.items
        .filter((item) => {
          if (item.item_id && item.is_removed === 1) return true
          return item.productId && item.name
        })
        .map((item) => ({
          ...(item.item_id && { item_id: item.item_id }),
          product_id: Number(item.productId),
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          is_removed: item.is_removed || 0,
          status: item.item_status || 'active',
        })),
    }
  }

  // ===== ECPay：組字串並導向 =====
  const redirectToEcpay = (newOrderId) => {
    const itemsArray =
      formData.items
        .filter((i) => i.name && i.quantity)
        .map((i) => `${i.name}x${i.quantity}`) || []
    const items = itemsArray.join(',')
    const amount = calculateOrderTotal()
    const url = `${API_SERVER}/payment/ecpay-test?amount=${amount}&items=${encodeURIComponent(items)}&type=shop&orderId=${newOrderId || ''}`
    window.location.href = url
  }

  // ===== 表單送出處理 =====
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)
    try {
      const submitData = buildSubmitPayload()

      if (mode === 'edit' && orderId) {
        const result = await updateOrder(orderId, submitData)
        if (result.success || result.code === 200) {
          toast.success('編輯訂單成功！')
          onSuccess?.()
        } else {
          toast.error(result.message || '編輯失敗')
        }
        return
      }

      if (submitData.deliveryId === '1' && !formData.storeName.trim()) {
        setErrors((prev) => ({ ...prev, storeName: '請先填寫 7-11 門市名稱' }))
        toast.error('請先填寫 7-11 門市名稱')
        setIsLoading(false)
        return
      }

      // ECPay（假設付款方式 id = '1'）
      if (submitData.paymentId === '1') {
        // 先跳出確認視窗
        setShowEcpayDialog(true)
        handleSubmit._pendingData = submitData
        return
      }

      // 貨到付款或其他非 ECPay：直接寫入訂單
      const result = await createAdminOrder(submitData)
      if (result.success || result.code === 200) {
        toast.success('新增訂單成功！')
        onSuccess?.()
      } else {
        toast.error(result.message || '新增失敗')
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
      console.error(mode === 'edit' ? '編輯訂單失敗:' : '新增訂單失敗:', error)
      toast.error(error.message || '未知錯誤')
    } finally {
      setIsLoading(false)
    }
  }

  // ===== 確認導向 ECPay：建立訂單 → 跳轉 =====
  const confirmEcpayAndRedirect = async () => {
    try {
      const submitData = handleSubmit._pendingData || buildSubmitPayload()
      const result = await createAdminOrder(submitData)
      if (result.success || result.code === 200) {
        toast.success('訂單已建立，前往 ECPay')
        const newId = result?.data?.id || result?.id
        redirectToEcpay(newId)
      } else {
        toast.error(result.message || '建立訂單失敗，未能前往 ECPay')
      }
    } catch (error) {
      console.error('ECPay 建立訂單/跳轉失敗:', error)
      toast.error('發生錯誤，未能前往 ECPay')
    } finally {
      setShowEcpayDialog(false)
    }
  }

  // ===== 載入和錯誤狀態處理 =====
  if (isDataLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>載入中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="max-w-4xl mx-auto w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="memberId">
                  會員ID<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="memberId"
                  type="text"
                  value={formData.memberId}
                  onChange={(e) =>
                    handleInputChange('memberId', e.target.value)
                  }
                  placeholder="請輸入會員ID"
                  className={errors.memberId ? 'border-red-500' : ''}
                />
                {errors.memberId && (
                  <p className="text-sm text-red-500 mt-1">{errors.memberId}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient">
                  收件人<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="recipient"
                  type="text"
                  value={formData.recipient}
                  onChange={(e) =>
                    handleInputChange('recipient', e.target.value)
                  }
                  placeholder="請輸入收件人"
                  className={errors.recipient ? 'border-red-500' : ''}
                />
                {errors.recipient && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.recipient}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  手機號碼<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="請輸入手機號碼"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery">
                  物流方式<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.delivery}
                  onValueChange={(value) =>
                    handleInputChange('delivery', value)
                  }
                >
                  <SelectTrigger
                    className={errors.delivery ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="請選擇物流方式" />
                  </SelectTrigger>
                  <SelectContent>
                    {delivery.length === 0 ? (
                      <div className="px-3 py-2 text-gray-400">
                        沒有符合資料
                      </div>
                    ) : (
                      delivery.map((item, idx) => (
                        <SelectItem
                          key={`delivery-${item.id}-${idx}`}
                          value={item.id.toString()}
                        >
                          {item.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.delivery && (
                  <p className="text-sm text-red-500 mt-1">{errors.delivery}</p>
                )}
              </div>
              {formData.delivery === '1' && (
                <div className="space-y-2">
                  <Label htmlFor="storeName">
                    門市名稱<span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="storeName"
                      type="text"
                      value={formData.storeName}
                      onChange={(e) =>
                        handleInputChange('storeName', e.target.value)
                      }
                      placeholder="請先點右側按鈕選擇門市，或手動輸入"
                      className={errors.storeName ? 'border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      variant="highlight"
                      onClick={sevenStore}
                    >
                      選擇門市
                    </Button>
                  </div>
                  {errors.storeName && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.storeName}
                    </p>
                  )}
                </div>
              )}
              {/* 只有選擇宅配時才顯示地址欄位 */}
              {formData.delivery === '3' && (
                <div className="space-y-2">
                  <Label htmlFor="address">
                    收件地址<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange('address', e.target.value)
                    }
                    placeholder="請輸入收件地址"
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.address}
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fee">運費</Label>
                <Input
                  id="fee"
                  type="number"
                  value={formData.fee}
                  onChange={(e) => handleInputChange('fee', e.target.value)}
                  placeholder="運費"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment">
                  付款方式<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.payment}
                  onValueChange={(value) => handleInputChange('payment', value)}
                >
                  <SelectTrigger
                    className={errors.payment ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="請選擇付款方式" />
                  </SelectTrigger>
                  <SelectContent>
                    {payment.length === 0 ? (
                      <div className="px-3 py-2 text-gray-400">
                        沒有符合資料
                      </div>
                    ) : (
                      payment
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
                {errors.payment && (
                  <p className="text-sm text-red-500 mt-1">{errors.payment}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice">
                  發票類型<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.invoice}
                  onValueChange={(value) => handleInputChange('invoice', value)}
                >
                  <SelectTrigger
                    className={errors.invoice ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="請選擇發票類型" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoice.length === 0 ? (
                      <div className="px-3 py-2 text-gray-400">
                        沒有符合資料
                      </div>
                    ) : (
                      invoice.map((item, idx) => (
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
                {errors.invoice && (
                  <p className="text-sm text-red-500 mt-1">{errors.invoice}</p>
                )}
              </div>

              {/* 發票詳細資訊欄位 */}
              {formData.invoice === '3' && (
                <div className="space-y-2">
                  <Label htmlFor="invoiceCarrier">
                    載具號碼<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="invoiceCarrier"
                    type="text"
                    value={formData.invoiceCarrier || ''}
                    onChange={(e) =>
                      handleInputChange('invoiceCarrier', e.target.value)
                    }
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

              {formData.invoice === '2' && (
                <div className="space-y-2">
                  <Label htmlFor="invoiceTaxId">
                    統一編號<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="invoiceTaxId"
                    type="text"
                    value={formData.invoiceTaxId || ''}
                    onChange={(e) =>
                      handleInputChange('invoiceTaxId', e.target.value)
                    }
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
                    value={formData.invoiceNumber || ''}
                    onChange={(e) =>
                      handleInputChange('invoiceNumber', e.target.value)
                    }
                    placeholder="請輸入發票號碼"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="status">
                  訂單狀態<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger
                    className={errors.status ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="請選擇訂單狀態" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatus.length === 0 ? (
                      <div className="px-3 py-2 text-gray-400">
                        沒有符合資料
                      </div>
                    ) : (
                      orderStatus.map((item, idx) => (
                        <SelectItem
                          key={`status-${item.id}-${idx}`}
                          value={item.id.toString()}
                        >
                          {item.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-500 mt-1">{errors.status}</p>
                )}
              </div>

              {/* ===== 商品明細區塊 ===== */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    訂單商品明細<span className="text-red-500">*</span>
                  </Label>
                </div>
                {errors.items && (
                  <p className="text-sm text-red-500">{errors.items}</p>
                )}
                <div className="border rounded-lg overflow-hidden">
                  {/* 表頭 */}
                  <div className="bg-gray-50 grid grid-cols-12 gap-4 p-4 font-semibold text-sm border-b">
                    <div className="col-span-4">商品名稱</div>
                    <div className="col-span-2 text-right">單價</div>
                    <div className="col-span-2 text-center">數量</div>
                    <div className="col-span-2 text-right">小計</div>
                    <div className="col-span-2 text-center">操作</div>
                  </div>

                  {/* 商品列表 */}
                  <div className="divide-y">
                    {formData.items.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        尚未新增商品，請點擊下方「新增商品」按鈕
                      </div>
                    ) : (
                      formData.items.map((item, idx) => (
                        <div
                          className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50"
                          key={`item-row-${idx}-${item.productId || 'empty'}`}
                        >
                          <div className="col-span-4">
                            {item.name ? (
                              <div className="flex items-center space-x-2">
                                <span className="flex-1 p-2">
                                  {item.name}
                                  {item.is_removed === 1 && (
                                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      已下架
                                    </span>
                                  )}
                                </span>
                              </div>
                            ) : (
                              <Select
                                key={`product-${idx}-${item.productId || 'empty'}`}
                                value={item.productId || ''}
                                onValueChange={(value) =>
                                  handleProductSelect(idx, value)
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="請選擇商品">
                                    {item.productId
                                      ? products.find(
                                          (p) =>
                                            p.id.toString() === item.productId
                                        )?.name || '未找到商品'
                                      : '請選擇商品'}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {products
                                    .filter((p) => p.id && p.id !== '')
                                    .map((p, idx) => (
                                      <SelectItem
                                        key={`product-option-${p.id}-${idx}`}
                                        value={p.id.toString()}
                                      >
                                        {p.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          {/* 單價 */}
                          <div className="col-span-2">
                            <div className="text-right font-medium p-2">
                              ${parseFloat(item.price || 0).toLocaleString()}
                            </div>
                          </div>
                          {/* 數量 */}
                          <div className="col-span-2">
                            {mode === 'edit' && item.item_id ? (
                              <div className="text-center p-2">
                                {item.quantity || 1}
                              </div>
                            ) : (
                              <Input
                                key={`quantity-${idx}`}
                                type="number"
                                min="1"
                                value={item.quantity || 1}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    'quantity',
                                    e.target.value
                                  )
                                }
                                className="text-center"
                                placeholder="1"
                              />
                            )}
                          </div>
                          {/* 小計 */}
                          <div className="col-span-2">
                            <div className="text-right font-semibold">
                              $
                              {calculateItemTotal(
                                item.price,
                                item.quantity
                              ).toLocaleString()}
                            </div>
                          </div>
                          {/* 操作按鈕 */}
                          <div className="col-span-2 text-center">
                            {mode === 'edit' && item.item_id ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                刪除
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              >
                                {mode === 'edit' ? '刪除' : '取消'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="bg-gray-50 p-4 border-t">
                    <div className="flex justify-between items-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddItem}
                      >
                        + 新增商品
                      </Button>

                      {formData.items.length > 0 && (
                        <div className="text-right space-y-1">
                          <div className="text-sm">
                            商品小計: $
                            {calculateAllItemsTotal().toLocaleString()}
                          </div>
                          <div className="text-sm">
                            運費: $
                            {parseFloat(formData.fee || 0).toLocaleString()}
                          </div>
                          <div className="text-lg font-bold">
                            訂單總金額: $
                            {calculateOrderTotal().toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                取消
              </Button>
              <Button type="submit" variant="default" disabled={isLoading}>
                {isLoading ? loadingButtonText : submitButtonText}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ECPay 付款確認對話框（後台） */}
      <AlertDialog open={showEcpayDialog} onOpenChange={setShowEcpayDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認前往 ECPay</AlertDialogTitle>
            <AlertDialogDescription>
              送出後會先建立訂單，接著導向至 ECPay（綠界金流）付款頁面。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowEcpayDialog(false)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmEcpayAndRedirect()
              }}
            >
              確認
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
