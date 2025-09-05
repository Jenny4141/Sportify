'use client'

// react
import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import Image from 'next/image'
// icons
import { Minus, Plus, Heart } from 'lucide-react'
// ui components
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
// 自定義 components
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import { LoadingState, ErrorState } from '@/components/loading-states'
// hooks
import { useAuth } from '@/contexts/auth-context'
// api
import { getProductDetail, toggleFavorite, addProductCart } from '@/api'
import { getProductImageUrl } from '@/api/admin/shop/image'
import {
  fetchMemberOptions,
  fetchSportOptions,
  fetchBrandOptions,
} from '@/api/common'
// others
import { toast } from 'sonner'

export default function ProductDetailPage() {
  const { isAuthenticated } = useAuth()
  // ===== 路由和搜尋參數處理 =====
  const router = useRouter()
  const { id } = useParams()

  // ===== 組件狀態管理 =====
  const [quantity, setQuantity] = useState(1)
  const [sports, setSports] = useState([])
  const [brands, setBrands] = useState([])
  const [product, setProduct] = useState(null)
  const [members, setMembers] = useState([])
  const [isFavorited, setIsFavorited] = useState(false)

  // ===== 數據獲取 =====
  const {
    data,
    isLoading: isDataLoading,
    error,
    mutate,
  } = useSWR(id ? ['product', id] : null, () => getProductDetail(id))

  // ===== 載入選項 =====
  useEffect(() => {
    const loadData = async () => {
      try {
        const [memberData, sportData, brandData] = await Promise.all([
          fetchMemberOptions(),
          fetchSportOptions(),
          fetchBrandOptions(),
        ])
        setMembers(memberData.rows || [])
        setSports(sportData.rows || [])
        setBrands(brandData.rows || [])
      } catch (error) {
        console.error('載入失敗:', error)
        toast.error('載入失敗')
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (data && data.data) {
      setProduct(data.data)
      setIsFavorited(data.data.favorite || false)
      // console.log('Product loaded:', data.data) // Debug用
    }
  }, [data])

  const totalImages = product?.images?.length || 0

  // ===== 輔助函數 =====
  const getSportName = (sportId) => {
    const sport = sports.find((s) => s.id === sportId)
    return sport ? sport.name : sportId
  }

  const getBrandName = (brandId) => {
    const brand = brands.find((b) => b.id === brandId)
    return brand ? brand.name : brandId
  }

  const spec = [
    { key: 'name', label: '商品名稱', value: product?.name },
    {
      key: 'sportId',
      label: '運動類型',
      value: getSportName(product?.sportId),
    },
    { key: 'brandId', label: '品牌', value: getBrandName(product?.brandId) },
    { key: 'size', label: '尺寸', value: product?.size },
    { key: 'weight', label: '重量', value: product?.weight },
    { key: 'material', label: '材質', value: product?.material },
    { key: 'origin', label: '產地', value: product?.origin },
  ]

  // ===== 事件處理函數 =====
  const handleQuantityChange = React.useCallback((newQty) => {
    setQuantity((prev) => (newQty >= 1 ? newQty : prev))
  }, [])

  const handleAddToWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast('請先登入會員才能收藏商品', {
        action: {
          label: '前往登入',
          onClick: () => router.push('/login'),
        },
      })
      return
    }
    const result = await toggleFavorite(productId)
    mutate()
    if (result?.favorited) {
      setIsFavorited(true)
      toast('已加入我的收藏', {
        style: {
          backgroundColor: '#ff671e',
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

  const handleAddToCart = async (productId, quantity) => {
    if (!isAuthenticated) {
      toast('請先登入會員才能加入購物車', {
        action: {
          label: '前往登入',
          onClick: () => router.push('/login'),
        },
      })
      return
    }
    const result = await addProductCart(productId, quantity)
    mutate()
    if (result?.success) {
      setQuantity(1) // 重置數量為1
      toast('已加入購物車', {
        style: {
          backgroundColor: '#ff671e',
          color: '#fff',
          border: 'none',
          width: '250px',
        },
        action: {
          label: '查看',
          onClick: () => router.push('/shop/order'),
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
                  {getSportName(product.sportId)} /{' '}
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
                <TabsTrigger value="imgs" className="text-sm text-muted-foreground">
                  商品圖片
                </TabsTrigger>
                <TabsTrigger value="spec" className="text-sm text-muted-foreground">
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
