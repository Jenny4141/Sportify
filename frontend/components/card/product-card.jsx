'use client'

// react
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
// icons
import { Heart, ShoppingCart } from 'lucide-react'
// ui components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/card/card'
import { AspectRatio } from '@/components/ui/aspect-ratio'
// api
import { getProductImageUrl } from '@/api/admin/shop/image'
// others
import { cn } from '@/lib/utils'

export function ProductCard({
  className,
  onAddToCart,
  onAddToWishlist,
  product,
  isFavorited: initialIsFavorited,
  variant = 'default',
  ...props
}) {
  // ===== 組件狀態管理 =====
  const [isHovered, setIsHovered] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(initialIsFavorited || false) // 初始狀態從 props 傳入
  const [isMounted, setIsMounted] = useState(false)

  // 格式化價格，加上千分位逗號
  const formatPrice = (price) => {
    return Number(price).toLocaleString('zh-TW')
  }

  // ===== 副作用處理 =====
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    setIsInWishlist(initialIsFavorited || false)
  }, [initialIsFavorited])

  // 處理圖片路徑：如果 img 是物件，取出 url 屬性；如果是字串，直接使用
  const image = product?.img || product?.image // 支援 img 和 image 兩種屬性名稱
  const imageFileName =
    product?.image_url ||
    (typeof image === 'object' && image !== null ? image.url : image)

  // ===== 事件處理函數 =====
  const handleAddToCart = async (e) => {
    e.preventDefault()
    if (onAddToCart) {
      setIsAddingToCart(true) // 設定正在加入購物車的狀態
      const result = await onAddToCart(product?.id, 1)
      setIsAddingToCart(false)
    }
  }

  const handleAddToWishlist = async (e) => {
    e.preventDefault()
    if (onAddToWishlist) {
      const result = await onAddToWishlist(product?.id)
      setIsInWishlist(!!result?.favorited) // 根據後端回傳結果設定狀態
    }
  }

  return (
    <div className={cn('group', className)} {...props}>
      {/* <Link href={`/shop/1`}> */}
      <Link href={`/shop/${product?.id}`}>
        <Card
          className={cn(
            `
              relative h-full overflow-hidden rounded py-0 transition-all
              duration-200 ease-in-out
              hover:shadow-md gap-3
            `,
            isHovered && 'ring-1 ring-primary/20'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AspectRatio ratio={4 / 3} className="overflow-hidden relative">
            <Image
              alt={product?.name || '商品圖片'}
              className={cn(
                'object-cover transition-transform duration-300 ease-in-out w-full h-full rounded-t',
                isHovered && 'scale-105'
              )}
              src={getProductImageUrl(imageFileName)}
              width={300}
              height={300}
            />
          </AspectRatio>

          <CardContent className="px-4 md:px-6">
            {/* 運動和品牌 */}
            <div className="flex items-center justify-between my-2">
              <span className="text-sm text-muted-foreground">
                {product?.brand_name || product?.brand || '—'}
              </span>
              {product?.sport_name && (
                <span className="text-sm outline rounded-sm px-2 py-0.5">
                  {product?.sport_name}
                </span>
              )}
            </div>
            {/* Product name with line clamp */}
            <h3
              className={`
                line-clamp-2 text-base font-medium transition-colors
                group-hover:text-primary
              `}
            >
              {product?.name}
            </h3>

            {variant === 'default' && (
              <>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="font-medium text-base text-destructive">
                    NTD${formatPrice(product?.price)}
                  </span>
                </div>
              </>
            )}
          </CardContent>

          {variant === 'default' && (
            <CardFooter className="p-4 pt-0">
              <Button
                className={cn(
                  'w-full gap-1 transition-all',
                  isAddingToCart && 'opacity-70',
                  'cursor-pointer'
                )}
                disabled={!isMounted || isAddingToCart}
                onClick={handleAddToCart}
              >
                {isMounted && isAddingToCart ? (
                  <div
                    className={`
                      h-4 w-4 animate-spin rounded-full border-2
                      border-background border-t-transparent
                    `}
                  />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                加入購物車
              </Button>
            </CardFooter>
          )}

          {variant === 'compact' && (
            <CardFooter className="px-4 md:px-6 pt-0 pb-4">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-base text-destructive">
                    NTD${formatPrice(product?.price)}
                  </span>
                </div>
                <div className="flex">
                  {/* 愛心 icon */}
                  {isMounted && (
                    <span
                      className={cn(
                        'inline-flex items-center justify-center cursor-pointer',
                        !isMounted ? 'opacity-60 pointer-events-none' : ''
                      )}
                      onClick={handleAddToWishlist}
                      title="加入收藏"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ')
                          handleAddToWishlist(e)
                      }}
                    >
                      <Heart
                        className={cn(
                          'h-4 w-4 md:h-5 md:w-5 transition mr-1 md:mr-3',
                          isInWishlist
                            ? 'fill-destructive text-destructive scale-110'
                            : 'text-muted-foreground hover:text-destructive'
                        )}
                      />
                      <span className="sr-only">加入收藏</span>
                    </span>
                  )}
                  {/* 購物車 icon */}
                  <span
                    className={cn(
                      'inline-flex items-center justify-center cursor-pointer',
                      !isMounted || isAddingToCart
                        ? 'opacity-60 pointer-events-none'
                        : ''
                    )}
                    onClick={handleAddToCart}
                    title="加入購物車"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (
                        (e.key === 'Enter' || e.key === ' ') &&
                        isMounted &&
                        !isAddingToCart
                      )
                        handleAddToCart(e)
                    }}
                  >
                    {isMounted && isAddingToCart ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground hover:text-primary transition" />
                    )}
                    <span className="sr-only">加入購物車</span>
                  </span>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      </Link>
    </div>
  )
}
