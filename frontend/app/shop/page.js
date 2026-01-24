'use client'

// react
import React, { useState, useEffect, useMemo, Suspense } from 'react'
// icons
import {
  Search,
  AlignLeft,
  Funnel,
  AlertCircle,
  BrushCleaning,
} from 'lucide-react'
import { IoIosArrowDown } from 'react-icons/io'
import { useSearchParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
// ui components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
// 自定義 components
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import { ProductCard } from '@/components/card/product-card'
import { PaginationBar } from '@/components/pagination-bar'
import { LoadingState, ErrorState } from '@/components/loading-states'
// hooks
import { useAuth } from '@/contexts/auth-context'
// api
import {
  getProducts,
  fetchMemberOptions,
  fetchSportOptions,
  fetchBrandOptions,
  toggleFavorite,
  addProductCart,
} from '@/api'
// others
import { toast } from 'sonner'

// 手機版側邊欄
const MobileSidebar = ({
  open,
  onClose, // 由父組件控制顯示狀態
  sports,
  brands,
  selectedSports,
  selectedBrands,
  priceRange,
  clearAllFilters,
  onApplyFilters,
}) => {
  // 管理篩選狀態：初始值來自父組件
  const [localSports, setLocalSports] = useState(selectedSports)
  const [localBrands, setLocalBrands] = useState(selectedBrands)
  const [localPrice, setLocalPrice] = useState(priceRange)

  // 副作用：當父組件的篩選狀態改變時，同步更新側邊欄的本地狀態
  useEffect(() => {
    setLocalSports(selectedSports)
  }, [selectedSports])

  useEffect(() => {
    setLocalBrands(selectedBrands)
  }, [selectedBrands])

  useEffect(() => {
    setLocalPrice(priceRange)
  }, [priceRange])

  // === 事件處理函數 ===
  // 處理運動類型選擇改變
  const handleSportChange = (id, checked) => {
    setLocalSports((prev) =>
      checked ? [...prev, id] : prev.filter((sportId) => sportId !== id)
    )
  }
  // 處理品牌選擇改變
  const handleBrandChange = (id, checked) => {
    setLocalBrands((prev) =>
      checked ? [...prev, id] : prev.filter((brandId) => brandId !== id)
    )
  }
  // 應用篩選設定並關閉側邊欄
  const handleApply = () => {
    onApplyFilters({
      sports: localSports,
      brands: localBrands,
      price: localPrice,
    })
    onClose(false)
  }
  // 清除所有篩選設定並關閉側邊欄
  const handleClear = () => {
    setLocalSports([])
    setLocalBrands([])
    setLocalPrice([0, 1000])
    clearAllFilters()
    onClose(false)
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-60 gap-0">
        <SheetHeader className="pb-0">
          <SheetTitle>商品分類</SheetTitle>
          <SheetDescription>選擇運動種類、品牌、價格區間</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <Accordion
            type="multiple"
            defaultValue={['sport-type', 'brand']}
            className="w-full"
          >
            {/* 運動類型篩選區域 */}
            <AccordionItem value="sport-type" className="border-b-0">
              <AccordionTrigger className="text-lg font-bold text-foreground hover:no-underline">
                運動類型
              </AccordionTrigger>
              {/* 運動類型選項清單 */}
              <AccordionContent className="p-2 space-y-2">
                {sports.map((sport) => (
                  <label
                    key={sport.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={localSports.includes(sport.id)}
                      onCheckedChange={(checked) =>
                        handleSportChange(sport.id, checked)
                      }
                    />
                    <span className="text-base font-normal text-foreground hover:text-primary">
                      {sport.name}
                    </span>
                  </label>
                ))}
              </AccordionContent>
            </AccordionItem>
            {/* 品牌篩選區域 */}
            <AccordionItem value="brand" className="border-b-0">
              <AccordionTrigger className="text-lg font-bold text-foreground hover:no-underline">
                品牌
              </AccordionTrigger>
              <AccordionContent className="p-2 space-y-2">
                {brands.map((brand) => (
                  <label
                    key={brand.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={localBrands.includes(brand.id)}
                      onCheckedChange={(checked) =>
                        handleBrandChange(brand.id, checked)
                      }
                    />
                    <span className="text-base font-normal text-foreground hover:text-primary">
                      {brand.name}
                    </span>
                  </label>
                ))}
              </AccordionContent>
            </AccordionItem>

            {/* 價格範圍篩選器 */}
            <div className="my-6 flex flex-col gap-5">
              <span className="text-lg font-bold mb-4 text-foreground">
                價格區間
              </span>
              <Slider
                value={localPrice}
                onValueChange={setLocalPrice}
                min={0}
                max={1000}
                step={10}
              />
              <div className="flex justify-between text-sm">
                <span>${localPrice[0]}</span>
                <span>${localPrice[1]}</span>
              </div>
            </div>
          </Accordion>
        </div>
        {/* 手機側邊欄操作按鈕區 */}
        <div className="p-4 flex flex-col gap-2">
          <Button variant="outline" onClick={handleClear} className="flex-1">
            清除篩選
          </Button>
          <Button onClick={handleApply} className="w-full" variant="highlight">
            套用篩選
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// 商品列表主內容組件
function ProductListContent() {
  // === 路由和搜尋參數處理 ===
  const searchParams = useSearchParams()
  const router = useRouter()

  const { isAuthenticated } = useAuth()

  // === 狀態管理 ===
  const [members, setMembers] = useState([]) 
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sports, setSports] = useState([])
  const [brands, setBrands] = useState([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState({
    name: '',
    count: 0,
  })
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [selectedSports, setSelectedSports] = useState([])
  const [selectedBrands, setSelectedBrands] = useState([])

  // === URL狀態管理 ===
  const queryParams = useMemo(() => {
    const entries = Object.fromEntries(searchParams.entries())
    return entries
  }, [searchParams])

  // 排序方式
  const sortLabel = useMemo(() => {
    switch (queryParams.sort) {
      case 'price-asc':
        return '價格：由低到高'
      case 'price-desc':
        return '價格：由高到低'
      default:
        return '請選擇排序'
    }
  }, [queryParams.sort])

  // ===== API資料獲取 =====
  const { data, error, mutate } = useSWR(
    ['products', queryParams],
    async ([, params]) => {
      const result = await getProducts(params)
      // console.log('Products API response:', result) // debug用
      return result
    },
    {
      keepPreviousData: true, // 保留舊資料避免閃爍
      revalidateOnFocus: false, // 切回頁面時不自動重新獲取資料
    }
  )
  const products = data?.data ?? [] 

  // ===== 副作用處理 =====
  // 搜尋
  useEffect(() => {
    setSearchKeyword(queryParams.keyword || '')
  }, [queryParams.keyword])

  // 獲取會員、運動、品牌資料
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
        console.error('載入資料失敗:', error)
        toast.error('載入失敗')
      }
    }
    loadData()
  }, [])

  // 商品總筆數
  useEffect(() => {
    if (!data) return
    const count =
      data.totalRows ?? (Array.isArray(products) ? products.length : 0)
    setSelectedCategory((prev) => ({ ...prev, count }))
  }, [data, products])

  // 是否有篩選（用於顯示清除篩選）
  const hasActiveFilters = Boolean(
    queryParams.keyword ||
      queryParams.sportId ||
      queryParams.brandId ||
      (queryParams.minPrice && Number(queryParams.minPrice) > 0) ||
      (queryParams.maxPrice && Number(queryParams.maxPrice) < 1000) ||
      queryParams.sort
  )

  // ===== 事件處理函數 =====
  // 搜尋
  const handleSearch = (event) => {
    if (event.key === 'Enter') {
      const keyword = event.target.value.trim()
      setSelectedSports([])
      setSelectedBrands([])
      const newParams = new URLSearchParams()
      if (keyword) {
        newParams.set('keyword', keyword)
      }
      newParams.set('page', '1')
      router.push(`?${newParams.toString()}`, { scroll: false })
    }
  }
  // 搜尋按鈕
  const handleSearchClick = () => {
    const keyword = searchKeyword.trim()
    // 清空 checkbox 狀態
    setSelectedSports([])
    setSelectedBrands([])
    const newParams = new URLSearchParams()
    if (keyword) {
      newParams.set('keyword', keyword)
    }
    newParams.set('page', '1')
    router.push(`?${newParams.toString()}`, { scroll: false })
  }
  // 排序變動
  const handleSortChange = (sortValue) => {
    const newParams = new URLSearchParams(searchParams.toString())
    if (sortValue) {
      newParams.set('sort', sortValue)
    } else {
      newParams.delete('sort')
    }
    newParams.set('page', '1')
    router.push(`?${newParams.toString()}`, { scroll: false })
  }
  // 分頁切換
  const handlePagination = (targetPage) => {
    const perPage = data?.perPage || 8
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('page', String(targetPage))
    newParams.set('perPage', String(perPage))
    router.push(`?${newParams.toString()}`, { scroll: false })
  }
  // 商品收藏
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
    mutate() // 更新收藏狀態

    if (result?.favorited) {
      toast('已加入我的收藏', {
        style: {
          backgroundColor: '#ff671e',
          color: '#fff',
          border: 'none',
          width: '250px',
        },
      })
    } else {
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
  // 加入購物車
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
  // 運動類型篩選
  const handleSportChange = (id, checked) => {
    const updated = checked
      ? [...selectedSports, id]
      : selectedSports.filter((sportId) => sportId !== id)
    setSelectedSports(updated)
    const newParams = new URLSearchParams(searchParams.toString())
    if (updated.length > 0) {
      newParams.set('sportId', updated.join(','))
    } else {
      newParams.delete('sportId')
    }
    newParams.set('page', '1')
    router.push(`?${newParams.toString()}`, { scroll: false })
  }
  // 品牌篩選
  const handleBrandChange = (id, checked) => {
    const updated = checked
      ? [...selectedBrands, id]
      : selectedBrands.filter((brandId) => brandId !== id)
    setSelectedBrands(updated)
    const newParams = new URLSearchParams(searchParams.toString())
    if (updated.length > 0) {
      newParams.set('brandId', updated.join(','))
    } else {
      newParams.delete('brandId')
    }
    newParams.set('page', '1')
    router.push(`?${newParams.toString()}`, { scroll: false })
  }
  // 價格區間篩選
  const handlePriceRange = (values) => {
    const [minPrice, maxPrice] = values
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('minPrice', minPrice)
    newParams.set('maxPrice', maxPrice)
    newParams.set('page', '1')
    router.push(`?${newParams.toString()}`, { scroll: false })
  }
  // 手機版篩選
  const handleApplyMobileFilters = ({ sports, brands, price }) => {
    setSelectedSports(sports)
    setSelectedBrands(brands)
    setPriceRange(price)
    const newParams = new URLSearchParams()
    if (sports.length > 0) newParams.set('sportId', sports.join(','))
    if (brands.length > 0) newParams.set('brandId', brands.join(','))
    if (price[0] !== 0) newParams.set('minPrice', price[0])
    if (price[1] !== 1000) newParams.set('maxPrice', price[1])
    newParams.set('page', '1')
    router.push(`?${newParams.toString()}`, { scroll: false })
  }
  // 清除篩選
  const clearAllFilters = () => {
    setSelectedSports([])
    setSelectedBrands([])
    setPriceRange([0, 1000])
    setSearchKeyword('')
    const newParams = new URLSearchParams()
    router.push(`?${newParams.toString()}`, { scroll: false })
  }

  return (
    <>
      <Navbar />
      <BreadcrumbAuto />
      <section className="px-4 md:px-6 py-3 md:py-10">
        <div className="flex container mx-auto max-w-screen-xl min-h-screen">
          {/* 桌機側邊欄 */}
          <div className="w-48 pr-8 hidden md:block">
            <div className="mb-8">
              <p className="text-xl font-bold mb-4 text-foreground">運動類型</p>
              <div className="space-y-2">
                {sports.map((sport) => (
                  <label
                    key={sport.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedSports.includes(sport.id)}
                      onCheckedChange={(checked) =>
                        handleSportChange(sport.id, checked)
                      }
                    />
                    <span className="text-base font-normal text-foreground hover:text-primary">
                      {sport.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <p className="text-xl font-bold mb-4 text-foreground">品牌</p>
              <div className="space-y-2">
                {brands.map((brand) => (
                  <label
                    key={brand.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedBrands.includes(brand.id)}
                      onCheckedChange={(checked) =>
                        handleBrandChange(brand.id, checked)
                      }
                    />
                    <span className="text-base font-normal text-foreground hover:text-primary">
                      {brand.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-8 flex flex-col gap-5">
              <span className="text-xl font-bold mb-4 text-foreground">
                價格區間
              </span>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                min={0}
                max={1000}
                step={10}
                onValueCommit={handlePriceRange}
              />
              <div className="flex justify-between text-sm">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            {/* 商品列表上方功能列 */}
            <div className="flex justify-between items-center gap-3 w-full">
              <div className="hidden md:block">
                {data && (
                  <p className="text-base text-foreground whitespace-nowrap">
                    共有{selectedCategory.count}筆商品
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between md:justify-end w-full md:gap-3">
                {/* 手機版側邊欄按鈕 */}
                <Button
                  variant="secondary"
                  onClick={() => setSidebarOpen(true)}
                  className="!h-10 flex items-center gap-2 md:hidden"
                >
                  <AlignLeft size={16} />
                </Button>
                {/* 桌機版清除篩選 */}
                <div className="hidden md:flex">
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="text-sm"
                    disabled={!hasActiveFilters}
                  >
                    <BrushCleaning />
                    <span>清除篩選</span>
                  </Button>
                </div>
                {/* 搜尋 */}
                <div className="relative flex items-center w-[200px]">
                  <Input
                    type="search"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={handleSearch}
                    className="w-full bg-accent text-accent-foreground !h-10 pr-10"
                    placeholder="請輸入關鍵字"
                  />
                  <Button
                    variant="highlight"
                    onClick={handleSearchClick}
                    className="h-8 w-8 absolute right-2 flex items-center justify-center"
                  >
                    <Search size={20} />
                  </Button>
                </div>
                {/* 排序 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      className="!h-10 flex items-center gap-2"
                    >
                      {/* 手機版排序按鈕 */}
                      <Funnel size={16} className="block md:hidden" />
                      <span className="hidden md:inline">{sortLabel}</span>
                      <IoIosArrowDown size={16} className="hidden md:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleSortChange('')}>
                      請選擇排序
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSortChange('price-asc')}
                    >
                      價格：由低到高
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSortChange('price-desc')}
                    >
                      價格：由高到低
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {/* 商品列表 */}
            <div className="flex flex-col gap-6">
              {!data && !error ? (
                <LoadingState message="載入商品資料中..." />
              ) : error ? (
                <ErrorState
                  title="商品資料載入失敗"
                  message={
                    error?.message
                      ? `載入錯誤：${error.message}`
                      : '找不到您要查看的商品資料'
                  }
                  onRetry={mutate}
                  backUrl="/"
                  backLabel="返回首頁"
                />
              ) : products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="compact"
                      isFavorited={product?.favorite}
                      onAddToWishlist={() => handleAddToWishlist(product.id)}
                      onAddToCart={() => handleAddToCart(product.id, 1)}
                    />
                  ))}
                </div>
              ) : (
                <div className="col-span-full text-center text-muted-foreground py-12 text-lg">
                  <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">
                    沒有符合資料，請重新搜尋
                  </h3>
                </div>
              )}
              {/* 分頁 */}
              <div className="mt-auto">
                {data && (
                  <PaginationBar
                    page={data.page}
                    totalPages={data.totalPages}
                    perPage={data.perPage}
                    onPageChange={(targetPage) => {
                      handlePagination(targetPage)
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 手機側邊欄 */}
          <MobileSidebar
            open={sidebarOpen}
            onClose={setSidebarOpen}
            sports={sports}
            brands={brands}
            selectedSports={selectedSports}
            selectedBrands={selectedBrands}
            priceRange={priceRange}
            clearAllFilters={clearAllFilters}
            queryParams={queryParams}
            selectedCategory={selectedCategory}
            onApplyFilters={handleApplyMobileFilters}
          />
        </div>
      </section>
      <Footer />
    </>
  )
}

// 主要導出組件(首次進入頁面))
export default function ProductListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">載入商品資料中...</p>
          </div>
        </div>
      }
    >
      <ProductListContent />
    </Suspense>
  )
}
