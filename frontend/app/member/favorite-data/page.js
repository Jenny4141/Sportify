'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import HeroBannerMember from '@/components/hero-banner-member'
import ScrollAreaMember from '@/components/scroll-area-member'
import { useAuth } from '@/contexts/auth-context'
import { memberFavorite, toggleFavorite } from '@/api/shop/favorite'
import { getProductImageUrl } from '@/api/admin/shop/image'
import { PaginationBar } from '@/components/pagination-bar'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

// 將使用 useSearchParams 的邏輯抽取到單獨的組件
function FavoriteDataContent() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [allFavorites, setAllFavorites] = useState([]) // 保存所有收藏資料
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // 分頁相關狀態
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10) // 預設桌面版 10 筆

  // 路由和URL參數
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryParams = useMemo(() => {
    const entries = Object.fromEntries(searchParams.entries())
    return entries
  }, [searchParams])

  // 根據螢幕寬度設定每頁資料筆數
  useEffect(() => {
    const updatePerPage = () => {
      if (window.innerWidth < 768) {
        setPerPage(6) // 手機版 6 筆
      } else {
        setPerPage(10) // 桌面版 10 筆
      }
    }

    // 初始化設定
    updatePerPage()

    // 監聽視窗大小變化
    window.addEventListener('resize', updatePerPage)

    // 清理事件監聽器
    return () => {
      window.removeEventListener('resize', updatePerPage)
    }
  }, [])

  // 處理分頁
  const handlePagination = (targetPage) => {
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('page', String(targetPage))
    newParams.set('perPage', String(perPage))
    router.push(`?${newParams.toString()}`)
  }

  // 獲取收藏列表
  const fetchFavorites = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('開始獲取收藏列表...')
      console.log('當前用戶:', user)

      const result = await memberFavorite()
      console.log('收藏列表 API 回應:', result)
      console.log('回應狀態碼:', result.code)
      console.log('回應資料:', result.data)

      if (result.code === 200) {
        console.log('收藏列表資料:', result.data)
        // 後端回傳的是直接的商品陣列，不是包在 favorites 物件中
        const allFavoritesData = Array.isArray(result.data) ? result.data : []
        console.log('處理後的收藏資料:', allFavoritesData)

        // 保存所有收藏資料
        setAllFavorites(allFavoritesData)

        // 計算分頁
        const totalItems = allFavoritesData.length
        const totalPagesCount = Math.ceil(totalItems / perPage)
        setTotalPages(totalPagesCount)

        // 獲取當前頁的資料
        const startIndex = (currentPage - 1) * perPage
        const endIndex = startIndex + perPage
        const currentPageData = allFavoritesData.slice(startIndex, endIndex)

        setFavorites(currentPageData)
      } else {
        console.error('獲取收藏列表失敗:', result.error)
        console.error('錯誤代碼:', result.code)
        // 處理不同的錯誤情況
        if (result.error === '請先登入' || result.code === 401) {
          setError('請先登入')
        } else if (result.error === '找不到收藏列表' || result.code === 404) {
          setError('找不到收藏列表')
        } else {
          setError(result.error || '獲取收藏列表失敗')
        }
      }
    } catch (err) {
      console.error('獲取收藏列表錯誤:', err)
      console.error('錯誤詳情:', err.response)
      if (err.response?.status === 401) {
        setError('請先登入')
      } else if (err.response?.status === 404) {
        setError('找不到收藏列表')
      } else if (err.code === 'NETWORK_ERROR') {
        setError('網路連線錯誤，請檢查網路連線')
      } else {
        setError('獲取收藏列表時發生錯誤')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 取消收藏
  const handleRemoveFavorite = async (productId, productName) => {
    if (!productId) {
      alert('商品 ID 無效')
      return
    }

    /* // 確認對話框
    const isConfirmed = window.confirm(
      `確定要取消收藏「${productName || '這個商品'}」嗎？`
    )
    if (!isConfirmed) {
      return
    } */

    try {
      console.log('取消收藏商品 ID:', productId)
      const result = await toggleFavorite(productId)
      console.log('取消收藏 API 回應:', result)

      if (result.code === 200) {
        console.log('取消收藏成功，重新獲取列表')
        // 顯示成功訊息
        toast.success(`已成功取消收藏「${productName || '商品'}」`)
        // 重新獲取收藏列表
        await fetchFavorites()
      } else {
        alert(result.error || `取消收藏「${productName || '商品'}」失敗`)
      }
    } catch (err) {
      console.error('取消收藏錯誤:', err)
      toast.error(`取消收藏「${productName || '商品'}」時發生錯誤`)
    }
  }

  // 組件載入時獲取收藏列表
  useEffect(() => {
    if (user) {
      fetchFavorites()
    }
  }, [user])

  // 當 URL 參數改變時更新當前頁面
  useEffect(() => {
    const page = parseInt(queryParams.page) || 1
    setCurrentPage(page)
  }, [queryParams.page])

  // 當當前頁面改變時重新計算分頁資料
  useEffect(() => {
    if (allFavorites.length > 0 && currentPage) {
      // 重新計算當前頁的資料
      const startIndex = (currentPage - 1) * perPage
      const endIndex = startIndex + perPage
      const currentPageData = allFavorites.slice(startIndex, endIndex)
      setFavorites(currentPageData)
    }
  }, [currentPage, allFavorites, perPage])

  // 當 perPage 改變時重新計算分頁
  useEffect(() => {
    if (allFavorites.length > 0 && perPage) {
      // 重新計算總頁數
      const totalItems = allFavorites.length
      const newTotalPages = Math.ceil(totalItems / perPage)
      setTotalPages(newTotalPages)

      // 重新計算當前頁面，確保不會超出範圍
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      } else {
        // 重新計算當前頁的資料
        const startIndex = (currentPage - 1) * perPage
        const endIndex = startIndex + perPage
        const currentPageData = allFavorites.slice(startIndex, endIndex)
        setFavorites(currentPageData)
      }
    }
  }, [perPage, allFavorites])

  return (
    <>
      <Navbar />
      <BreadcrumbAuto />
      <HeroBannerMember
        backgroundImage="/banner/member-banner.jpg"
        title="會員中心"
      ></HeroBannerMember>
      <ScrollAreaMember />
      <section className="py-10">
        <div className="container flex justify-center mx-auto max-w-screen-xl px-4">
          <div
            className="bg-card rounded-xl border bg-card py-6
          text-card-foreground shadow-sm rounded-lg p-6 w-full"
          >
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-accent-foreground">
                    我的收藏
                  </h2>
                  <p className="text-muted-foreground mt-2">管理您收藏的商品</p>
                  {!isLoading && !error && (
                    <p className="text-sm text-muted-foreground mt-1">
                      共收藏 {allFavorites.length} 件商品
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={fetchFavorites}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  )}
                  重新整理
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-lg text-muted-foreground">
                  載入收藏列表中...
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center py-12">
                <div className="text-red-500 text-lg mb-4">{error}</div>
                <Button
                  variant="outline"
                  onClick={fetchFavorites}
                  className="flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  重試
                </Button>
              </div>
            ) : favorites.length === 0 ? (
              <div className="flex flex-col justify-center items-center py-12">
                <div className="text-muted-foreground text-lg mb-4">
                  您還沒有收藏任何商品
                </div>
                <div className="text-muted-foreground text-sm mb-6">
                  去發現更多精彩商品吧！
                </div>
                <Button
                  variant="default"
                  onClick={() => window.open('/shop', '_blank')}
                  className="flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  去購物
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader className="border-b-2 border-card-foreground">
                      <TableRow className="text-lg">
                        <TableHead className="font-bold w-1/2 md:w-1/2 text-accent-foreground">
                          商品名稱
                        </TableHead>
                        <TableHead className="font-bold w-1/4 md:w-1/4 text-accent-foreground">
                          商品價格
                        </TableHead>
                        <TableHead className="font-bold w-1/4 md:w-1/4 text-accent-foreground text-center">
                          操作
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-foreground">
                      {favorites.map((product, index) => {
                        // 使用與 ProductCard 相同的圖片處理方式
                        const imageFileName = product?.image_url
                        const productImageUrl =
                          getProductImageUrl(imageFileName)

                        return (
                          <TableRow
                            key={product.id || index}
                            className="border-b border-card-foreground hover:bg-muted/50"
                          >
                            <TableCell className="font-medium text-base py-4 text-accent-foreground">
                              <div className="flex items-center gap-3">
                                {productImageUrl ? (
                                  <img
                                    src={productImageUrl}
                                    alt={product?.name || '商品圖片'}
                                    className="w-12 h-12 object-cover rounded"
                                    onError={(e) => {
                                      e.target.style.display = 'none'
                                      // 顯示預設圖片
                                      const defaultImg =
                                        document.createElement('div')
                                      defaultImg.className =
                                        'w-12 h-12 bg-muted rounded flex items-center justify-center'
                                      defaultImg.innerHTML =
                                        '<span class="text-xs text-muted-foreground">無圖</span>'
                                      e.target.parentNode.insertBefore(
                                        defaultImg,
                                        e.target
                                      )
                                    }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">
                                      無圖
                                    </span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-base line-clamp-2 leading-tight">
                                    {product?.name || '商品名稱'}
                                  </div>
                                  {/* 後端沒有回傳 description，所以這裡不顯示 */}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-base py-4 text-accent-foreground">
                              <span className="font-semibold text-primary">
                                NTD ${(product?.price || 0).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              <div className="flex flex-col md:flex-row justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full md:w-[80px] hover:bg-primary/90 hover:text-white"
                                  onClick={() => {
                                    if (product?.id) {
                                      window.open(
                                        `/shop/${product.id}`,
                                        '_blank'
                                      )
                                    } else {
                                      alert('商品資訊不完整，無法查看詳細資訊')
                                    }
                                  }}
                                >
                                  查看
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="w-full md:w-[80px] hover:bg-primary/10"
                                  onClick={() => {
                                    setSelectedProduct(product)
                                    setShowDialog(true)
                                  }}
                                >
                                  取消收藏
                                </Button>
                                <AlertDialog
                                  open={showDialog}
                                  onOpenChange={setShowDialog}
                                >
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        取消收藏
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        確認是否取消收藏「
                                        {selectedProduct?.name || '這個商品'}
                                        」？
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel
                                        onClick={() => {
                                          setShowDialog(false)
                                          setSelectedProduct(null)
                                        }}
                                      >
                                        取消
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          handleRemoveFavorite(
                                            selectedProduct?.id,
                                            selectedProduct?.name
                                          )
                                          setShowDialog(false)
                                          setSelectedProduct(null)
                                        }}
                                      >
                                        確認
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 分頁組件 - 移到卡片外面 */}
        {!isLoading && !error && allFavorites.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <PaginationBar
              page={currentPage}
              totalPages={totalPages}
              perPage={perPage}
              onPageChange={(targetPage) => {
                handlePagination(targetPage)
              }}
            />
          </div>
        )}
      </section>
      <Footer />
    </>
  )
}

// 主要導出組件，包含 Suspense 邊界
export default function FavoriteDataPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">載入收藏資料中...</p>
          </div>
        </div>
      }
    >
      <FavoriteDataContent />
    </Suspense>
  )
}
