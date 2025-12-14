'use client'

// react
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from 'react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import Image from 'next/image'
import Link from 'next/link'
//icons
import { Minus, Plus } from 'lucide-react'
// components/ui
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
// 自定義 components
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import Step from '@/components/step'
import { LoadingState, ErrorState } from '@/components/loading-states'
// hooks
import { useAuth } from '@/contexts/auth-context'
// api
import { getProductImageUrl } from '@/api/admin/shop/image'
import { getCarts, updateCarts, removeCart } from '@/api'

const steps = [
  { id: 1, title: '確認購物車', active: true },
  { id: 2, title: '填寫付款資訊', completed: false },
  { id: 3, title: '完成訂單', completed: false },
]

// 購物車主內容組件
function CartListContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  // === 路由和搜尋參數處理 ===
  const searchParams = useSearchParams()

  // === 狀態管理 ===
  const [carts, setCarts] = useState([])

  // 價格格式化
  const formatPrice = (price) => {
    return Number(price).toLocaleString('zh-TW')
  }

  // 即時計算總價和總數量
  const { totalPrice, itemCount } = useMemo(() => {
    const totalPrice = carts.reduce((sum, cartItem) => {
      return sum + cartItem.product.price * cartItem.quantity
    }, 0)
    const itemCount = carts.reduce(
      (sum, cartItem) => sum + cartItem.quantity,
      0
    )
    return { totalPrice, itemCount }
  }, [carts])

  // === URL狀態管理 ===
  const queryParams = useMemo(() => {
    const entries = Object.fromEntries(searchParams.entries())
    return entries
  }, [searchParams])

  // === SWR資料獲取 ===
  const shouldFetch = isAuthenticated // 只有已登入的用戶才獲取購物車資料

  const {
    data,
    isLoading: isDataLoading,
    error,
    mutate,
  } = useSWR(
    // SWR key: 只有已登入時才生成 key，未登入時為 null
    shouldFetch ? ['carts', queryParams] : null,

    shouldFetch
      ? async ([, params]) => {
          const result = await getCarts(params)
          return result
        }
      : null
  )

  // ===== 事件處理函數 =====
  // 商品數量變動
  const handleQuantityChange = useCallback(
    async (cartItemId, newQuantity) => {
      if (newQuantity < 1) {
        setCarts((prevCarts) =>
          prevCarts.filter((cartItem) => cartItem.id !== cartItemId)
        )
        try {
          await removeCart(cartItemId)
          mutate()
          toast('商品已從購物車移除', {
            style: {
              backgroundColor: '#ff671e',
              color: '#fff',
              border: 'none',
              width: '250px',
            },
          })
        } catch (error) {
          console.error('刪除項目失敗:', error)
          mutate()
          toast('刪除商品失敗，請稍後再試', {
            style: {
              backgroundColor: '#ff671e',
              color: '#fff',
              border: 'none',
            },
          })
        }
        return
      }

      setCarts((prevCarts) =>
        prevCarts.map((cartItem) =>
          cartItem.id === cartItemId
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        )
      )
      try {
        await updateCarts(cartItemId, newQuantity)
        mutate()
      } catch (error) {
        console.error('更新數量失敗:', error)
        mutate()
        toast('更新數量失敗，請稍後再試', {
          style: {
            backgroundColor: '#ff671e',
            color: '#fff',
            border: 'none',
          },
        })
      }
    },
    [mutate]
  )

  // ===== 副作用處理 =====
  useEffect(() => {
    if (data?.data?.cart?.cartItems) {
      setCarts(data.data.cart.cartItems)
    }
  }, [data])

  // ===== 載入或錯誤處理 =====
  if (isDataLoading || authLoading) {
    return <LoadingState message="載入購物車資料中..." />
  }

  if (error) {
    return (
      <ErrorState
        title="購物車資料載入失敗"
        message={`載入錯誤：${error.message}` || '載入購物車資料時發生錯誤'}
        onRetry={mutate}
        backUrl="/shop"
        backLabel="返回商品列表"
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
  // 購物車為空
  if (!carts || carts.length === 0) {
    return (
      <>
        <Navbar />
        <section className="flex flex-col items-center justify-center min-h-[60vh] py-20">
          <div className="text-2xl font-bold mb-4">購物車無商品</div>
          <Link href="/shop">
            <Button variant="highlight">瀏覽商品</Button>
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
          <div className="flex flex-col md:flex-row justify-between gap-5">
            <Card className="flex-3 self-start">
              <CardContent>
                <Table className="w-full table-fixed">
                  <TableHeader className="border-b-2 border-card-foreground">
                    <TableRow className="text-base font-bold">
                      <TableHead className="font-bold w-1/2 text-accent-foreground p-2">
                        商品名稱
                      </TableHead>
                      <TableHead className="font-bold w-1/4 text-accent-foreground p-2">
                        單價
                      </TableHead>
                      <TableHead className="font-bold w-1/4 text-accent-foreground text-center p-2">
                        數量
                      </TableHead>
                      <TableHead className="font-bold w-1/4 text-right hidden md:table-cell text-accent-foreground p-2">
                        總計
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  {/* === 表格主體：動態商品列表 === */}
                  <TableBody className="divide-y divide-card-foreground">
                    {/* 水平分隔線區分各個商品列 */}
                    {/* === 遍歷購物車中的每個商品項目 === */}
                    {carts.map((cartItem) => {
                      // === 商品資料預處理 ===
                      const product = cartItem.product // 獲取商品詳細資訊
                      const imageFileName = product.images?.[0]?.url || '' // 安全獲取第一張圖片，預設為空字串

                      return (
                        // === 單個商品列：使用唯一性 key 優化 React 渲染 ===
                        <TableRow key={cartItem.id}>
                          {/* === 商品資訊欄：圖片 + 名稱 === */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {/* 水平佈局 + 小間距 */}
                              {/* 商品縮圖：固定尺寸 + 溝出隱藏 */}
                              <div className="w-10 h-10 overflow-hidden flex-shrink-0">
                                {/* flex-shrink-0: 防止圖片被壓縮 */}
                                <Image
                                  className="object-cover w-full h-full" // 保持比例裁切充滿容器
                                  src={getProductImageUrl(imageFileName)} // 使用工具函數產生完整 URL
                                  alt={product.name} // 無障礙替代文字
                                  width={40} // 優化效能的尺寸提示
                                  height={40}
                                />
                              </div>
                              {/* 商品名稱：可換行 + 主題色彩 */}
                              <span className="text-sm whitespace-normal text-accent-foreground">
                                {product.name}
                              </span>
                            </div>
                          </TableCell>

                          {/* === 單價欄：格式化價格顯示 === */}
                          <TableCell className="text-accent-foreground">
                            ${formatPrice(product.price)}
                            {/* 使用工具函數格式化價格 (千分位逗號) */}
                          </TableCell>
                          {/* === 數量控制欄：互動式 +/- 控件 === */}
                          <TableCell className="text-accent-foreground">
                            <div className="flex items-center justify-center gap-2">
                              {/* 中心對齊 + 小間距 */}
                              {/* 減少數量按鈕：點擊減少 1 或刪除項目 */}
                              <span
                                className="cursor-pointer transition-all duration-150 hover:shadow-lg hover:scale-110" // 互動效果：滑鼠懸停放大 + 陰影
                                aria-label="Decrease quantity" // 無障礙標籤
                                onClick={() =>
                                  handleQuantityChange(
                                    cartItem.id,
                                    cartItem.quantity - 1 // 減少 1，小於 1 時在函數內處理刪除
                                  )
                                }
                              >
                                <Minus className="h-4 w-4" /> {/* 減號圖示 */}
                              </span>
                              {/* 數量顯示：中心對齊 + 不可選擇 */}
                              <span className="w-12 text-center select-none">
                                {/* 固定寬度保持對齊 */}
                                {cartItem.quantity}
                              </span>
                              {/* 增加數量按鈕：點擊增加 1 */}
                              <span
                                className="cursor-pointer transition-all duration-150 hover:shadow-lg hover:scale-110" // 相同的互動效果
                                aria-label="Increase quantity"
                                onClick={() =>
                                  handleQuantityChange(
                                    cartItem.id,
                                    cartItem.quantity + 1 // 增加 1
                                  )
                                }
                              >
                                <Plus className="h-4 w-4" /> {/* 加號圖示 */}
                              </span>
                            </div>
                          </TableCell>

                          {/* === 總計欄：右對齊 + RWD 隱藏 === */}
                          <TableCell className="text-right hidden md:table-cell text-accent-foreground">
                            {/* 手機版隱藏節省空間 */}$
                            {formatPrice(product.price * cartItem.quantity)}
                            {/* 動態計算：單價 × 數量 */}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            {/* === 右側：訂單摘要區域 === */}
            {/* flex-1: 佔據剩餘寬度，sticky: 滾動固定，max-h: 限制高度不超過視窗 */}
            <Card className="flex-1 h-70 text-accent-foreground sticky top-32 max-h-[calc(100vh-104px)] self-start">
              {/* === 卡片內容：垂直佈局，上下對齊 === */}
              <CardContent className="flex flex-col justify-between h-full">
                {/* 上方摘要 + 下方按鈕 */}
                {/* === 訂單摘要表格：不使用標題，只顯示資料 === */}
                <Table className="w-full table-fixed text-base">
                  <TableBody>
                    {/* 商品数量統計：右對齊顯示 */}
                    <TableRow className="flex justify-end">
                      <TableCell></TableCell>
                      <TableCell>共有{itemCount}件商品</TableCell>
                      {/* 動態計算的總數量 */}
                    </TableRow>

                    {/* 商品金額行：左右對齊 */}
                    <TableRow className="flex justify-between">
                      <TableCell>商品金額</TableCell>
                      <TableCell>${formatPrice(totalPrice)}</TableCell>
                      {/* 格式化的總價格 */}
                    </TableRow>

                    {/* 運費行：未來功能，目前顯示未選擇 + 底部分隔線 */}
                    <TableRow className="flex justify-between border-b border-card-foreground">
                      <TableCell>運費</TableCell>
                      <TableCell>未選擇</TableCell>
                    </TableRow>

                    {/* 總計行：最終金額 (目前等於商品金額) */}
                    <TableRow className="flex justify-between">
                      <TableCell>商品小計</TableCell>
                      <TableCell>${formatPrice(totalPrice)}</TableCell>
                      {/* 總金額，未來加上運費 */}
                    </TableRow>
                  </TableBody>
                </Table>
                {/* === 底部操作按鈕區域：雙按鈕佈局 === */}
                <div className="flex justify-between gap-2">
                  {/* 左右對齊 + 小間距 */}
                  {/* 繼續購物按鈕：返回商品列表頁 */}
                  <Link href="/shop">
                    <Button variant="default" className="w-[120px]">
                      {/* 次要按鈕 + 固定寬度 */}
                      繼續購物
                    </Button>
                  </Link>
                  {/* 結帳按鈕：進入付款流程 + 傳遞訂單資訊 */}
                  <Link
                    href={`/shop/order/payment?totalPrice=${totalPrice}&itemCount=${itemCount}`} // URL 參數傳遞訂單摘要
                  >
                    <Button variant="highlight" className="w-[120px]">
                      {/* 主要按鈕 (品牌色) + 固定寬度 */}
                      填寫付款資訊
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* 結束雙欄佈局 */}
        </div>
        {/* 結束主容器 */}
      </section>
      {/* 結束主內容区域 */}
      <Footer /> {/* 頁面底部：全站一致性 */}
    </>
  )
}

// 主要導出組件(首次進入頁面))
export default function CartListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">載入購物車資料中...</p>
          </div>
        </div>
      }
    >
      <CartListContent />
    </Suspense>
  )
}
