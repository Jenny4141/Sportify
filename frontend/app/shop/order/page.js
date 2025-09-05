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

// 將使用 useSearchParams 的邏輯抽取到單獨的組件
function CartListContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  // ===== 路由和搜尋參數處理 =====
  const searchParams = useSearchParams()

  // ===== 組件狀態管理 =====
  const [carts, setCarts] = useState([])

  // 格式化價格，加上千分位逗號
  const formatPrice = (price) => {
    return Number(price).toLocaleString('zh-TW')
  }

  // 計算總價和總數量
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

  // ===== URL 參數處理 =====
  const queryParams = useMemo(() => {
    const entries = Object.fromEntries(searchParams.entries())
    return entries
  }, [searchParams])

  // ===== 數據獲取 =====
  const shouldFetch = isAuthenticated
  const {
    data,
    isLoading: isDataLoading,
    error,
    mutate,
  } = useSWR(
    shouldFetch ? ['carts', queryParams] : null,
    shouldFetch
      ? async ([, params]) => {
          const result = await getCarts(params)
          return result
        }
      : null
  )

  // ===== 副作用處理 =====
  const handleQuantityChange = useCallback(
    async (cartItemId, newQuantity) => {
      // 如果新數量小於 1，就刪除該項目
      if (newQuantity < 1) {
        // 先從 UI 移除項目 (樂觀更新 Optimistic Update)
        setCarts((prevCarts) =>
          prevCarts.filter((cartItem) => cartItem.id !== cartItemId)
        )

        try {
          // 呼叫 API 刪除項目
          await removeCart(cartItemId)
          // 重新獲取購物車資料確保同步
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
          // 如果 API 失敗，恢復項目到 UI
          mutate() // 重新載入資料
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
        // 呼叫 API 更新後端數量
        await updateCarts(cartItemId, newQuantity)
        // 重新獲取購物車資料確保同步
        mutate()
      } catch (error) {
        console.error('更新數量失敗:', error)
        // 如果 API 失敗，回滾 UI 狀態
        setCarts((prevCarts) =>
          prevCarts.map((cartItem) =>
            cartItem.id === cartItemId
              ? { ...cartItem, quantity: cartItem.quantity } // 回復原本數量
              : cartItem
          )
        )
        toast('更新數量失敗，請稍後再試', {
          style: { backgroundColor: '#ff671e', color: '#fff', border: 'none' },
        })
      }
    },
    [mutate]
  )

  useEffect(() => {
    if (data?.data?.cart?.cartItems) {
      setCarts(data.data.cart.cartItems)
    }
  }, [data])

  // ===== 載入和錯誤狀態處理 =====
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

  // 購物車為空時顯示無商品與前往商城首頁按鈕
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
                  <TableBody className="divide-y divide-card-foreground">
                    {carts.map((cartItem) => {
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
                              <span className="text-sm whitespace-normal text-accent-foreground">
                                {product.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-accent-foreground">
                            ${formatPrice(product.price)}
                          </TableCell>
                          <TableCell className="text-accent-foreground">
                            <div className="flex items-center justify-center gap-2">
                              <span
                                className="cursor-pointer transition-all duration-150 hover:shadow-lg hover:scale-110"
                                aria-label="Decrease quantity"
                                onClick={() =>
                                  handleQuantityChange(
                                    cartItem.id,
                                    cartItem.quantity - 1
                                  )
                                }
                              >
                                <Minus className="h-4 w-4" />
                              </span>
                              <span className="w-12 text-center select-none">
                                {cartItem.quantity}
                              </span>
                              <span
                                className="cursor-pointer transition-all duration-150 hover:shadow-lg hover:scale-110"
                                aria-label="Increase quantity"
                                onClick={() =>
                                  handleQuantityChange(
                                    cartItem.id,
                                    cartItem.quantity + 1
                                  )
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right hidden md:table-cell text-accent-foreground">
                            ${formatPrice(product.price * cartItem.quantity)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="flex-1 h-70 text-accent-foreground sticky top-32 max-h-[calc(100vh-104px)] self-start">
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
                      <TableCell>未選擇</TableCell>
                    </TableRow>
                    <TableRow className="flex justify-between">
                      <TableCell>商品小計</TableCell>
                      <TableCell>${formatPrice(totalPrice)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="flex justify-between gap-2">
                  <Link href="/shop">
                    <Button variant="default" className="w-[120px]">
                      繼續購物
                    </Button>
                  </Link>
                  <Link
                    href={`/shop/order/payment?totalPrice=${totalPrice}&itemCount=${itemCount}`}
                  >
                    <Button variant="highlight" className="w-[120px]">
                      填寫付款資訊
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}

// 主要導出組件，包含 Suspense 邊界
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
