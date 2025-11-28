'use client'

// react
import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import Image from 'next/image'
import Link from 'next/link'
// icons
import { FaXmark, FaCheck } from 'react-icons/fa6'
import { IconLoader } from '@tabler/icons-react'
import { FaCircle } from 'react-icons/fa'
// ui components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
// 自定義 components
import { Navbar } from '@/components/navbar'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import Step from '@/components/step'
import Footer from '@/components/footer'
import { LoadingState, ErrorState } from '@/components/loading-states'
// api
import { getProductImageUrl } from '@/api/admin/shop/image'
import { getOrderDetail } from '@/api'

// ===================================================================
// 購物流程步驟配置 - 最終階段
// ===================================================================
/**
 * 訂單完成頁面的流程步驟配置
 * 所有前三個步驟都已完成，正在顯示最終的成功結果
 * 這個配置在視覺上向用戶確認整個購物流程的完成
 */
const steps = [
  { id: 1, title: '確認購物車', completed: true }, // 第一步：已完成購物車確認
  { id: 2, title: '填寫付款資訊', completed: true }, // 第二步：已完成付款資訊填寫
  { id: 3, title: '完成訂單', active: true }, // 第三步：當前步驟 - 訂單完成狀態
]

// ===================================================================
// 訂單成功頁面主內容組件
// ===================================================================
/**
 * ProductSuccessContent - 訂單完成後的詳細資訊顯示組件
 *
 * 功能特色：
 * • 根據 URL 參數獲取訂單 ID
 * • 使用 SWR 獲取訂單詳細資訊
 * • 顯示完整的訂單摘要 (收件人、配送、付款等)
 * • 列表顯示購買的商品明細
 * • 訂單狀態試覺化顯示
 * • 用戶後續操作引導 (繼續購物等)
 *
 * 設計理念：
 * • Suspense 邊界分離：將需要 useSearchParams 的邏輯獨立出來
 * • 一頁式訂單摘要：用戶不需點擊又能看到所有重要資訊
 * • 明確的成功回饋：給用戶安心感和成就感
 */
function ProductSuccessContent() {
  // === URL 參數解析和資料獲取 ===
  const searchParams = useSearchParams() // Next.js 路由參數取得
  const orderId = searchParams.get('orderId') // 從 URL 中提取訂單 ID

  // === SWR 資料獲取：條件式獲取訂單詳情 ===
  const { data, isLoading, error, mutate } = useSWR(
    orderId ? ['order', orderId] : null, // SWR key: 有 orderId 時才發起請求
    () => getOrderDetail(orderId) // 訂單詳情 API 調用
  )

  // === 工具函數：價格格式化 ===
  /**
   * 格式化價格顯示，加上千分位逗號提升可讀性
   * @param {number} price 原始價格
   * @returns {string} 格式化後的價格字串
   */
  const formatPrice = (price) => {
    return Number(price).toLocaleString('zh-TW')
  }

  // === 訂單資料處理和結構化 ===
  let summaries = [] // 訂單摘要資訊陣列
  let products = [] // 訂單商品明細陣列
  let isSuccess = true // 訂單是否成功狀態

  // === 訂單資料存在時的處理邏輯 ===
  if (data && data.data) {
    const order = data.data // 獲取訂單詳細資料
    isSuccess = true // 成功獲取訂單資料

    // === 訂單基本資訊整理 ===
    summaries = [
      { key: '訂單編號', value: order.order_number || '未知' }, // 訂單唯一識別碼
      { key: '收件人', value: order.recipient || '未知' }, // 收件人姓名
      { key: '手機號碼', value: order.phone || '未知' }, // 聯絡電話
    ]
    // === 條件式配送資訊顯示 ===
    // 根據不同的配送方式顯示不同的資訊欄位

    // 宅配方式：顯示收件地址
    if (order.delivery_name?.includes('宅配')) {
      summaries.push({ key: '收件地址', value: order.address || '未知' })
    }

    // 7-11 取貨：顯示取貨門市資訊
    if (order.delivery_name?.includes('7-11') && order.storeName) {
      summaries.push({ key: '取貨門市', value: order.storeName || '未知' })
    }
    summaries = [
      ...summaries,
      { key: '物流方式', value: order.delivery_name || '未知' },
      { key: '付款方式', value: order.payment_name || '未知' },
      { key: '發票類型', value: order.invoice?.name || '未知' },
      {
        key: '訂單狀態',
        value: (
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {!order.status_name && <IconLoader className="mr-1" />}
            {(order.status_name === '待出貨' ||
              order.status_name === '已出貨' ||
              order.status_name === '已完成') && (
              <FaCircle className="fill-green-500 dark:fill-green-400 mr-1" />
            )}
            {order.status_name || '未知'}
          </Badge>
        ),
      },
      {
        key: '訂單金額',
        value: (
          <span className="text-lg font-bold text-primary">
            NT$ {formatPrice(order.total || 0)}
          </span>
        ),
      },
    ]
    products = order.items || []
  }
  // ===== 載入和錯誤狀態處理 =====
  if (isLoading) {
    return <LoadingState message="載入訂單資料中..." />
  }
  if (error) {
    return (
      <ErrorState
        title="訂單資料載入失敗"
        message={`載入錯誤：${error.message}` || '找不到您要查看的訂單資料'}
        onRetry={mutate}
        backUrl="/shop/order"
        backLabel="返回訂單列表"
      />
    )
  }

  return (
    <>
      <Navbar />
      <BreadcrumbAuto />
      <section className="px-4 md:px-6 py-10 ">
        <div className="flex flex-col container mx-auto max-w-screen-xl min-h-screen gap-6">
          <Step steps={steps} orientation="horizontal" onStepClick={() => {}} />
          <div className="flex flex-col items-center gap-4 py-4 md:py-8">
            {isSuccess ? (
              <>
                <div className="rounded-full bg-highlight p-4">
                  <FaCheck className="text-4xl text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  已完成訂購
                </h2>
              </>
            ) : (
              <>
                <div className="rounded-full bg-highlight p-4">
                  <FaXmark className="text-4xl text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-accent">訂單失敗</h2>
              </>
            )}
          </div>
          <div className="mx-auto md:max-w-2xl gap-6">
            <div className="flex flex-col gap-6">
              {/* 訂單詳情 */}
              <div>
                <Card className="gap-0">
                  <CardHeader>
                    <h2 className="text-lg font-semibold">訂單詳情</h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Table className="w-full table-fixed">
                      <TableBody>
                        {summaries
                          .filter(
                            (summary) =>
                              summary.value !== '' &&
                              summary.value !== null &&
                              summary.value !== undefined
                          )
                          .map((summary) => (
                            <TableRow
                              key={summary.key}
                              className="border-b border-muted-foreground/30"
                            >
                              <TableCell className="font-medium">
                                {summary.key}
                              </TableCell>
                              <TableCell className="text-right">
                                {summary.value}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
              {/* 商品明細 */}
              <div>
                <Card className="gap-0">
                  <CardHeader>
                    <h2 className="text-lg font-semibold">商品明細</h2>
                  </CardHeader>
                  <CardContent>
                    <Table className="w-full table-fixed">
                      <TableHeader className="border-b-2 border-card-foreground">
                        <TableRow className="text-base">
                          <TableHead className="font-bold w-1/2 text-accent-foreground p-2">
                            商品名稱
                          </TableHead>
                          <TableHead className="font-bold w-1/4 text-accent-foreground p-2">
                            單價
                          </TableHead>
                          <TableHead className="font-bold w-1/4 text-accent-foreground text-center p-2">
                            數量
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-card-foreground">
                        {products.length > 0 ? (
                          products.map((item, index) => {
                            const product = item.product || item
                            const imageFileName =
                              product.images?.[0]?.url ||
                              product.img ||
                              product.image
                            return (
                              <TableRow key={item.id || product.id || index}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 overflow-hidden flex-shrink-0">
                                      <Image
                                        className="object-cover w-full h-full"
                                        src={getProductImageUrl(imageFileName)}
                                        alt={
                                          product.name || `商品 ${index + 1}`
                                        }
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
                                  ${formatPrice(item.price || product.price)}
                                </TableCell>
                                <TableCell className="text-accent-foreground">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="w-12 text-center select-none">
                                      {item.quantity || 1}
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
                              沒有商品資料
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <Link href={orderId ? `/shop/order/${orderId}` : '/shop/order'}>
                <Button variant="outline">查看訂單</Button>
              </Link>
              <Link href="/shop">
                <Button variant="highlight">返回列表頁</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}

// 主要導出組件，包含 Suspense 邊界
export default function ProductSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">載入訂單資料中...</p>
          </div>
        </div>
      }
    >
      <ProductSuccessContent />
    </Suspense>
  )
}
