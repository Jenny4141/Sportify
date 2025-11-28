'use client'

/**
 * 商品詳情頁面 - 單一商品的完整資訊展示
 *
 * 主要功能：
 * - 商品基本資訊展示 (名稱、價格、品牌、運動類型)
 * - 商品圖片輪播展示
 * - 商品規格表格顯示
 * - 數量選擇和加入購物車功能
 * - 收藏/取消收藏功能 (愛心按鈕)
 * - 響應式設計 (桌面/手機版適配)
 * - 錯誤處理和載入狀態
 *
 * 路由: /shop/[id] (動態路由，id 為商品 ID)
 */

// === React 核心依賴 ===
import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation' // Next.js 13+ 路由鉤子
import useSWR from 'swr' // 資料獲取和快取管理
import Image from 'next/image' // Next.js 優化圖片組件

// === 圖示組件 ===
import { Minus, Plus, Heart } from 'lucide-react' // 數量調整和收藏按鈕圖示

// === UI 組件庫 ===
import { Button } from '@/components/ui/button'
// 圖片輪播組件
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
// 分頁標籤組件 (商品圖片/規格切換)
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// 表格組件 (商品規格顯示)
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

// === 自定義佈局組件 ===
import { Navbar } from '@/components/navbar' // 頂部導航列
import Footer from '@/components/footer' // 頁尾
import BreadcrumbAuto from '@/components/breadcrumb-auto' // 自動麵包屑導航
import { LoadingState, ErrorState } from '@/components/loading-states' // 載入和錯誤狀態組件

// === 應用鉤子 ===
import { useAuth } from '@/contexts/auth-context' // 身份驗證上下文

// === API 呼叫函數 ===
import { getProductDetail, toggleFavorite, addProductCart } from '@/api' // 商品相關 API
import { getProductImageUrl } from '@/api/admin/shop/image' // 圖片 URL 處理
// 選項資料獲取 (品牌、運動類型等)
import {
  fetchMemberOptions,
  fetchSportOptions,
  fetchBrandOptions,
} from '@/api/common'

// === 其他工具 ===
import { toast } from 'sonner' // 通知提示組件

export default function ProductDetailPage() {
  // === 身份驗證狀態 ===
  const { isAuthenticated } = useAuth() // 檢查用戶是否已登入

  // === Next.js 路由處理 ===
  const router = useRouter() // 用於程式化導航 (跳轉到其他頁面)
  const { id } = useParams() // 從 URL 中提取商品 ID (動態路由參數)

  // === React 本地狀態管理 ===
  const [quantity, setQuantity] = useState(1) // 用戶選擇的購買數量，預設為 1
  const [sports, setSports] = useState([]) // 所有運動類型選項 (用於顯示商品所屬運動類型)
  const [brands, setBrands] = useState([]) // 所有品牌選項 (用於顯示商品品牌)
  const [product, setProduct] = useState(null) // 當前商品的完整資訊
  const [members, setMembers] = useState([]) // 會員選項 (通常用於管理功能，這裡可能不需要)
  const [isFavorited, setIsFavorited] = useState(false) // 當前商品是否已被用戶收藏

  // === SWR 資料獲取：商品詳情 ===
  // SWR 提供自動快取、重新驗證、錯誤重試等功能
  const {
    data, // API 回應資料
    isLoading: isDataLoading, // 載入狀態
    error, // 錯誤狀態
    mutate, // 手動重新獲取資料的函數
  } = useSWR(
    id ? ['product', id] : null, // SWR key：有 id 時才發起請求
    () => getProductDetail(id) // 資料獲取函數
  )

  // === 頁面初始化：載入選項資料 ===
  // 載入品牌、運動類型等基礎資料，用於顯示商品分類資訊
  useEffect(() => {
    const loadData = async () => {
      try {
        // 並行載入多個選項資料，提升載入速度
        const [memberData, sportData, brandData] = await Promise.all([
          fetchMemberOptions(), // 會員選項 (可能用於管理功能)
          fetchSportOptions(), // 運動類型選項
          fetchBrandOptions(), // 品牌選項
        ])

        // 安全地設置資料，避免 undefined 錯誤
        setMembers(memberData.rows || [])
        setSports(sportData.rows || [])
        setBrands(brandData.rows || [])
      } catch (error) {
        console.error('載入選項資料失敗:', error)
        toast.error('載入失敗') // 向用戶顯示錯誤提示
      }
    }
    loadData()
  }, []) // 空依賴陣列，僅在組件掛載時執行一次

  // === 商品資料更新處理 ===
  // 當 SWR 獲取到商品資料時，更新本地狀態
  useEffect(() => {
    if (data && data.data) {
      setProduct(data.data) // 設置商品資訊
      setIsFavorited(data.data.favorite || false) // 設置收藏狀態
      // console.log('Product loaded:', data.data) // 開發除錯用，可查看載入的商品資料
    }
  }, [data]) // 當 data 變更時觸發

  // === 計算商品圖片數量 ===
  const totalImages = product?.images?.length || 0

  // === 輔助函數：資料轉換 ===
  /**
   * 根據運動類型 ID 獲取運動類型名稱
   * @param {number} sportId - 運動類型 ID
   * @returns {string} 運動類型名稱，找不到時返回 ID
   */
  const getSportName = (sportId) => {
    const sport = sports.find((s) => s.id === sportId)
    return sport ? sport.name : sportId
  }

  /**
   * 根據品牌 ID 獲取品牌名稱
   * @param {number} brandId - 品牌 ID
   * @returns {string} 品牌名稱，找不到時返回 ID
   */
  const getBrandName = (brandId) => {
    const brand = brands.find((b) => b.id === brandId)
    return brand ? brand.name : brandId
  }

  // === 商品規格表格配置 ===
  // 定義商品規格表格的欄位和對應的資料來源
  const spec = [
    { key: 'name', label: '商品名稱', value: product?.name },
    {
      key: 'sportId',
      label: '運動類型',
      value: getSportName(product?.sportId), // 使用轉換函數獲取運動類型名稱
    },
    { key: 'brandId', label: '品牌', value: getBrandName(product?.brandId) }, // 使用轉換函數獲取品牌名稱
    { key: 'size', label: '尺寸', value: product?.size },
    { key: 'weight', label: '重量', value: product?.weight },
    { key: 'material', label: '材質', value: product?.material },
    { key: 'origin', label: '產地', value: product?.origin },
  ]

  // === 事件處理函數 ===
  /**
   * 處理購買數量變更
   * 使用 useCallback 優化效能，避免不必要的重新渲染
   * @param {number} newQty - 新的數量
   */
  const handleQuantityChange = React.useCallback((newQty) => {
    setQuantity((prev) => (newQty >= 1 ? newQty : prev)) // 確保數量不小於 1
  }, [])

  /**
   * 處理商品收藏/取消收藏功能
   * 愛心按鈕的核心邏輯，支援切換收藏狀態
   *
   * 流程：
   * 1. 檢查用戶登入狀態
   * 2. 呼叫後端 API 切換收藏狀態
   * 3. 更新本地收藏狀態
   * 4. 重新獲取商品資料確保同步
   * 5. 顯示操作結果提示
   *
   * @param {number} productId - 商品 ID
   * @returns {Promise} API 操作結果
   */
  const handleAddToWishlist = async (productId) => {
    // === 登入狀態檢查 ===
    if (!isAuthenticated) {
      toast('請先登入會員才能收藏商品', {
        action: {
          label: '前往登入',
          onClick: () => router.push('/login'), // 提供快速登入入口
        },
      })
      return
    }

    // === 執行收藏切換 ===
    const result = await toggleFavorite(productId)
    mutate() // 重新獲取商品資料，確保收藏狀態同步

    // === 根據操作結果更新 UI 和提示 ===
    if (result?.favorited) {
      setIsFavorited(true) // 更新本地收藏狀態
      toast('已加入我的收藏', {
        style: {
          backgroundColor: '#ff671e', // 品牌主色調橘色
          color: '#fff',
          border: 'none',
          width: '250px',
        },
      })
    } else {
      setIsFavorited(false)
      toast('已從我的收藏移除', {
        style: {
          backgroundColor: '#ff671e',
          color: '#fff',
          border: 'none',
          width: '250px',
        },
      })
    }
    return result
  }

  /**
   * 處理加入購物車功能
   * 商品詳情頁的核心購買功能
   *
   * 流程：
   * 1. 檢查用戶登入狀態
   * 2. 呼叫後端 API 將商品加入購物車
   * 3. 重置購買數量為 1
   * 4. 更新商品資料 (可能影響庫存顯示)
   * 5. 顯示成功提示和快速查看入口
   *
   * @param {number} productId - 商品 ID
   * @param {number} quantity - 購買數量
   * @returns {Promise} API 操作結果
   */
  const handleAddToCart = async (productId, quantity) => {
    // === 登入狀態檢查 ===
    if (!isAuthenticated) {
      toast('請先登入會員才能加入購物車', {
        action: {
          label: '前往登入',
          onClick: () => router.push('/login'),
        },
      })
      return
    }

    // === 執行加入購物車 ===
    const result = await addProductCart(productId, quantity)
    mutate() // 重新獲取商品資料，更新任何可能的狀態變化

    // === 操作成功後的處理 ===
    if (result?.success) {
      setQuantity(1) // 重置購買數量為 1，提供更好的用戶體驗

      toast('已加入購物車', {
        style: {
          backgroundColor: '#ff671e', // 品牌主色調
          color: '#fff',
          border: 'none',
          width: '250px',
        },
        // 提供快速查看購物車的入口
        action: {
          label: '查看',
          onClick: () => router.push('/shop/order'), // 跳轉到購物車頁面
        },
        actionButtonStyle: {
          background: 'transparent',
          color: '#fff',
          border: '1px solid #fff',
          borderRadius: 4,
          fontWeight: 500,
        },
      })
      return result
    }
  }

  //  #region 載入和錯誤狀態處理
  if (isDataLoading) return <LoadingState message="載入商品資料中..." />
  if (error)
    return (
      <ErrorState
        title="商品資料載入失敗"
        message={`載入錯誤：${error.message}` || '找不到您要查看的商品資料'}
        onRetry={mutate}
        backUrl="/shop"
        backLabel="返回商品列表"
      />
    )

  if (!product) return <div>載入中...</div>
  return (
    <>
      <Navbar />
      <BreadcrumbAuto shopName={product?.name} />
      <section className="px-4 md:px-6 py-10">
        <div className="flex flex-col container mx-auto max-w-5xl gap-8 mb-10">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 左側商品圖片區塊 */}
            <div className="lg:w-2/5 flex flex-col items-center justify-center">
              <Carousel className="w-full max-w-sm relative">
                <CarouselContent>
                  {product?.images && product.images.length > 0 ? (
                    product.images.map((img, idx) => (
                      <CarouselItem key={idx} className="flex justify-center">
                        <Image
                          src={getProductImageUrl(img.url)}
                          alt={product.name}
                          width={380}
                          height={380}
                          className="object-contain"
                        />
                      </CarouselItem>
                    ))
                  ) : (
                    <CarouselItem className="flex justify-center">
                      <div className="w-[380px] h-[380px] flex items-center justify-center bg-gray-100 text-gray-400">
                        無商品圖片
                      </div>
                    </CarouselItem>
                  )}
                </CarouselContent>
                <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-ring hover:bg-muted-foreground border shadow-md" />
                <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-ring hover:bg-muted-foreground border shadow-md" />
              </Carousel>
            </div>
            {/* 右側商品資訊區*/}
            <div className="lg:w-3/5 flex flex-col justify-center space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl lg:text-3xl font-bold">
                    {product.name}
                  </h1>
                  <Heart
                    className={`h-6 w-6 cursor-pointer transition-colors
                      ${
                        isFavorited
                          ? 'fill-destructive text-destructive'
                          : 'text-destructive hover:fill-destructive hover:text-destructive'
                      }
                    `}
                    onClick={() => handleAddToWishlist(product.id)}
                  />
                </div>
                <p className="text-lg text-muted-foreground">
                  {getSportName(product.sportId)} /
                  {getBrandName(product.brandId)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-destructive">
                    NT${product.price?.toLocaleString('zh-TW') || '0'}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-lg font-bold">配送方式</h2>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span>宅配</span>
                    <span className="text-muted-foreground">NT$100</span>
                  </div>
                  <div className="flex gap-2">
                    <span>7-11取貨</span>
                    <span className="text-muted-foreground">NT$60</span>
                  </div>
                  <div className="flex gap-2">
                    <span>全家取貨</span>
                    <span className="text-muted-foreground">NT$60</span>
                  </div>
                </div>
              </div>
              {/* 數量和購物車按鈕 */}
              <div className="flex items-center gap-4">
                <div className="flex flex-1 items-center justify-between bg-muted rounded-lg p-1">
                  <Button
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() => handleQuantityChange(quantity - 1)}
                    size="icon"
                    variant="secondary"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-base text-muted-foreground">
                    {quantity}
                  </span>
                  <Button
                    aria-label="Increase quantity"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    size="icon"
                    variant="secondary"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  onClick={() => handleAddToCart(product.id, quantity)}
                  className="flex flex-1 h-full text-base"
                  variant="highlight"
                >
                  加入購物車
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col container mx-auto max-w-5xl gap-6 px-4">
          <Tabs defaultValue="imgs" className="w-full">
            <div className="flex justify-center">
              <TabsList className="mb-6 md:mb-8">
                <TabsTrigger
                  value="imgs"
                  className="text-sm text-muted-foreground"
                >
                  商品圖片
                </TabsTrigger>
                <TabsTrigger
                  value="spec"
                  className="text-sm text-muted-foreground"
                >
                  詳細規格
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="imgs">
              <div className="flex flex-col gap-4">
                {product && product.images && product.images.length > 0 ? (
                  product.images.map((img, idx) => (
                    <div key={idx} className="flex justify-center">
                      <Image
                        src={getProductImageUrl(img.url)}
                        alt={`${product.name} - 圖片 ${idx + 1}`}
                        width={450}
                        height={450}
                        className="object-contain"
                      />
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    此商品暫無圖片
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="spec">
              <div className="bg-card rounded-lg p-4 md:p-8">
                <Table className="w-full">
                  <TableBody className="divide-y divide-card-foreground">
                    {spec.map(({ key, label, value }) => (
                      <TableRow
                        key={key}
                        className="border-b border-card-foreground"
                      >
                        <TableCell className="font-bold text-sm md:text-base text-card-foreground w-1/3 md:w-1/5 py-3 px-2 md:px-4">
                          {label}
                        </TableCell>
                        <TableCell className="text-sm md:text-base text-card-foreground w-2/3 md:w-4/5 py-3 px-2 md:px-4 break-words">
                          {value || ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      <Footer />
    </>
  )
}
