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

  // ===== URL 參數處理 =====
  const queryParams = useMemo(() => {
    const entries = Object.fromEntries(searchParams.entries())
    return entries
  }, [searchParams])

  // === SWR 資料獲取：條件式獲取購物車資料 ===
  const shouldFetch = isAuthenticated // 只有已登入的用戶才獲取購物車資料

  const {
    data, // API 回應資料
    isLoading: isDataLoading, // 載入狀態
    error, // 錯誤狀態
    mutate, // 手動重新獲取資料的函數
  } = useSWR(
    // SWR key: 只有已登入時才生成 key，未登入時為 null (不發起請求)
    shouldFetch ? ['carts', queryParams] : null,

    // 資料獲取函數：只有已登入時才定義
    shouldFetch
      ? async ([, params]) => {
          const result = await getCarts(params) // 呼叫購物車 API
          return result
        }
      : null // 未登入時不定義獲取函數
  )

  // === 核心事件處理：購物車數量調整和刪除 ===
  /**
   * 處理購物車項目數量變更的核心函數
   * 採用樂觀更新 (Optimistic Updates) 策略提升用戶體驗
   *
   * 樂觀更新流程：
   * 1. 立即更新 UI (不等待 API 回應)
   * 2. 在背景中呼叫 API
   * 3. 如果 API 成功，保持 UI 更新
   * 4. 如果 API 失敗，回滾 UI 更新
   *
   * @param {number} cartItemId - 購物車項目 ID
   * @param {number} newQuantity - 新的數量 (小於 1 時表示刪除)
   */
  const handleQuantityChange = useCallback(
    async (cartItemId, newQuantity) => {
      // === 情況A：數量小於 1，執行刪除操作 ===
      if (newQuantity < 1) {
        // 樂觀更新：立即從 UI 中移除該項目
        setCarts((prevCarts) =>
          prevCarts.filter((cartItem) => cartItem.id !== cartItemId)
        )

        try {
          // 背景 API 呼叫：刪除項目
          await removeCart(cartItemId)
          // 重新獲取資料確保資料一致性
          mutate()

          // 成功提示
          toast('商品已從購物車移除', {
            style: {
              backgroundColor: '#ff671e', // 品牌主色調
              color: '#fff',
              border: 'none',
              width: '250px',
            },
          })
        } catch (error) {
          console.error('刪除項目失敗:', error)

          // API 失敗時的回滾策略：重新獲取資料來恢復 UI
          mutate() // 這會觸發 SWR 重新獲取資料

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

      // === 情況B：正常的數量更新操作 ===
      // 步驟1：樂觀更新 - 立即更新 UI 狀態，不等待 API 回應
      setCarts((prevCarts) =>
        prevCarts.map(
          (cartItem) =>
            cartItem.id === cartItemId
              ? { ...cartItem, quantity: newQuantity } // 找到目標項目，更新數量
              : cartItem // 其他項目保持不變
        )
      )

      try {
        // 步驟2：背景 API 調用 - 同步更新後端資料
        await updateCarts(cartItemId, newQuantity)

        // 步驟3：重新獲取資料確保一致性
        // 使用 SWR 的 mutate 函數觸發重新獲取
        mutate()

        // 成功完成，無需額外提示 (保持簡潔的 UX)
      } catch (error) {
        // === API 失敗的強健的錯誤處理 ===
        console.error('更新數量失敗:', error)

        // 回滾策略：重新獲取伺服器資料來修復 UI 狀態
        // 注意：這裡我們直接使用 mutate() 來回滾，而不是手動回復狀態
        // 因為伺服器的狀態是最正確的來源
        mutate()

        // 用戶友好的錯誤提示
        toast('更新數量失敗，請稍後再試', {
          style: {
            backgroundColor: '#ff671e', // 品牌主色調
            color: '#fff',
            border: 'none',
          },
        })
      }
    },
    [mutate] // 依賴 mutate 函數
  )

  // === 資料同步勾子：當 SWR 資料更新時同步本地狀態 ===
  // 這是關鍵的資料流管理：
  // 1. SWR 從 API 獲取最新資料
  // 2. useEffect 偵測資料變化
  // 3. 同步更新本地狀態，確保 UI 與伺服器一致
  useEffect(() => {
    // 防徦性檢查：確保資料結構存在且有有效的購物車項目
    if (data?.data?.cart?.cartItems) {
      // 更新本地購物車狀態，觸發 UI 重新渲染
      setCarts(data.data.cart.cartItems)
    }
  }, [data]) // 依賴 SWR 返回的 data

  // ===== 早期返回 (Early Returns)：載入和錯誤狀態處理 =====

  // === 載入狀態：當資料或認證狀態正在載入時顯示載入畫面 ===
  if (isDataLoading || authLoading) {
    return <LoadingState message="載入購物車資料中..." />
  }

  // === 錯誤狀態：當 API 調用失敗時顯示錯誤頁面 ===
  if (error) {
    return (
      <ErrorState
        title="購物車資料載入失敗" // 錯誤標題
        message={`載入錯誤：${error.message}` || '載入購物車資料時發生錯誤'} // 錯誤詳細資訊
        onRetry={mutate} // 重試函數：再次獲取資料
        backUrl="/shop" // 返回連結位址
        backLabel="返回商品列表" // 返回按鈕文字
      />
    )
  }

  // === 認證守衛：未登入用戶的引導頁面 ===
  // 購物車功能需要登入才能使用，這裡提供友好的用戶引導
  if (!isAuthenticated) {
    return (
      <>
        <Navbar /> {/* 導航列：保持頁面一致性 */}
        {/* 中心化的登入引導区域 */}
        <section className="flex flex-col items-center justify-center min-h-[60vh] py-20">
          <div className="text-2xl font-bold mb-4">請先登入</div>
          {/* 主要訊息 */}
          {/* 登入按鈕：使用品牌主色強調重要性 */}
          <Link href="/login">
            <Button variant="highlight">前往登入</Button>
          </Link>
        </section>
        <Footer /> {/* 頁面底部：保持頁面完整性 */}
      </>
    )
  }

  // === 空狀態處理：當購物車為空時的引導介面 ===
  // 防徦性檢查：處理空資料或無商品情況
  if (!carts || carts.length === 0) {
    return (
      <>
        <Navbar /> {/* 保持導航一致性 */}
        {/* 空狀態引導区域：鼓勵用戶添加商品 */}
        <section className="flex flex-col items-center justify-center min-h-[60vh] py-20">
          <div className="text-2xl font-bold mb-4">購物車無商品</div>
          {/* 空狀態提示 */}
          {/* 購物引導按鈕：使用品牌主色吸引注意 */}
          <Link href="/shop">
            <Button variant="highlight">瀏覽商品</Button>
          </Link>
        </section>
        <Footer /> {/* 頁面完整性 */}
      </>
    )
  }

  // === 主要購物車介面渲染 ===
  return (
    <>
      {/* === 頁面結構：標準三段式佈局 === */}
      <Navbar /> {/* 導航列：全站一致性 */}
      <BreadcrumbAuto />
      {/* 面包屑：顯示當前位置和導航路徑 */}
      {/* === 主內容区域：購物車核心功能 === */}
      <section className="px-4 md:px-6 py-10 ">
        {/* RWD 外邊距：手機 16px，桌面 24px */}
        {/* 主容器：中心對齊 + 最大寬度限制 + 最小高度確保頁面充滿 */}
        <div className="flex flex-col container mx-auto max-w-screen-xl min-h-screen gap-6">
          {/* === 購物流程指示器：顯示當前購物步驟 === */}
          <Step
            steps={steps} // 步驟資料：購物車 -> 付款 -> 完成
            orientation="horizontal" // 水平佈局：適合購物流程顯示
            onStepClick={(step, index) => console.log('Clicked step:', step)} // 開發者工具：為未來功能預留
          />
          {/* === 主要內容區域：雙欄佈局 (商品清單 + 訂單摘要) === */}
          <div className="flex flex-col md:flex-row justify-between gap-5">
            {/* RWD：手機垂直，桌面水平 */}
            {/* === 左側：商品清單表格 === */}
            {/* flex-3: 佔據 3/4 寬度，self-start: 頂部對齊 (不跟右側高度) */}
            <Card className="flex-3 self-start">
              <CardContent>
                {/* === 表格結構：固定佈局 + RWD 設計 === */}
                <Table className="w-full table-fixed">
                  {/* table-fixed: 固定列寬，避免內容擠壓 */}
                  {/* === 表格標題列：定義欄位和樣式 === */}
                  <TableHeader className="border-b-2 border-card-foreground">
                    {/* 加強底部邊框強調標題 */}
                    <TableRow className="text-base font-bold">
                      {/* 標題列的基本樣式 */}
                      {/* 商品名稱欄：最寬欄位，包含圖片和文字 */}
                      <TableHead className="font-bold w-1/2 text-accent-foreground p-2">
                        商品名稱
                      </TableHead>
                      {/* 單價欄：中等寬度 */}
                      <TableHead className="font-bold w-1/4 text-accent-foreground p-2">
                        單價
                      </TableHead>
                      {/* 數量欄：中等寬度，置中對齊 (包含 +/- 按鈕) */}
                      <TableHead className="font-bold w-1/4 text-accent-foreground text-center p-2">
                        數量
                      </TableHead>
                      {/* 總計欄：右對齊 + RWD 隱藏 (手機版不顯示節省空間) */}
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
