'use client'

// react
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import Image from 'next/image'
import Link from 'next/link'
// icons
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
import Footer from '@/components/footer'
import { LoadingState, ErrorState } from '@/components/loading-states'
// hooks
import { useAuth } from '@/contexts/auth-context'
// api
import { getProductImageUrl } from '@/api/admin/shop/image'
import { getOrderDetail } from '@/api'

// ===================================================================
// 訂單詳情頁面主組件
// ===================================================================
/**
 * OrderDetailPage - 單一訂單的詳細資訊查看頁面
 *
 * 主要功能：
 * • 根據 URL 參數的訂單 ID 獲取訂單詳情
 * • 顯示完整的訂單資訊 (收件人、配送、付款等)
 * • 列表顯示訂單中的所有商品
 * • 訂單狀態追蹤和視覺化顯示
 * • 価格計算和總金額顯示
 * • 用戶身份驗證和權限控制
 *
 * 路由系統：
 * - URL 格式：/shop/order/[id]
 * - 動態路由參數：id 為訂單的唯一識別碼
 */
export default function OrderDetailPage() {
  // === 身份驗證和權限管理 ===
  const { isAuthenticated, isLoading: authLoading } = useAuth() // 用戶登入狀態和認證加載狀態

  // === Next.js 動態路由參數解析 ===
  const { id } = useParams() // 獲取 URL 中的訂單 ID 參數

  // === React 本地狀態管理 ===
  const [order, setOrder] = useState(null) // 訂單詳情資料狀態，初始為 null

  // === SWR 條件式資料獲取：只有當用戶已登入且有有效 ID 時才獲取 ===
  const shouldFetch = isAuthenticated && !!id // 雙重檢查：登入狀態 + ID 存在

  const {
    data, // API 返回的訂單資料
    isLoading: isDataLoading, // 資料獲取加載狀態
    error, // API 錯誤狀態
    mutate, // SWR 手動重新獲取函數
  } = useSWR(
    // SWR key: 條件式 key，只有滿足條件時才發起請求
    shouldFetch ? ['order', id] : null,
    // 資料獲取函數：只有條件滿足時才定義
    shouldFetch ? () => getOrderDetail(id) : null
  )

  // === 資料同步副作用：當 SWR 資料更新時同步本地狀態 ===
  /**
   * 當 SWR 獲取到新資料時，更新本地的 order 狀態
   * 這樣設計的好處：
   * 1. 分離 SWR 的資料管理和組件的內部狀態
   * 2. 方便後續的資料處理和操作
   * 3. 避免直接依賴 SWR 的資料結構
   */
  useEffect(() => {
    if (data && data.data) {
      setOrder(data.data) // 同步訂單資料到本地狀態
      // console.log('Order loaded:', data.data)              // 開發者工具：可用於調試
    }
  }, [data]) // 依賴 SWR 返回的 data

  // === 工具函數：價格格式化 ===
  /**
   * 價格格式化函數，方便在整個組件中使用
   * 加上千分位逗號提升數字可讀性，使用台灣地區設定
   */
  const formatPrice = (price) => {
    return Number(price).toLocaleString('zh-TW')
  }

  // === 訂單摘要資訊結構化處理 ===
  let summaries = [] // 訂單摘要資訊陣列

  // 只有當訂單資料存在時才處理摘要資訊
  if (order) {
    // === 基本訂單資訊 ===
    summaries = [
      { key: '訂單編號', value: order.order_number || '未知' }, // 訂單唯一識別碼
      { key: '收件人', value: order.recipient || '未知' }, // 收貨人姓名
      { key: '手機號碼', value: order.phone || '未知' }, // 聯絡電話
    ]

    // === 條件式配送資訊 ===
    // 根據不同配送方式顯示相應資訊

    // 宅配方式：需要顯示詳細地址
    if (order.delivery_name?.includes('宅配')) {
      summaries.push({ key: '收件地址', value: order.address || '未知' })
    }

    // 7-11 便利商店取貨：需要顯示門市資訊
    if (order.delivery_name?.includes('7-11') && order.storeName) {
      summaries.push({ key: '取貨門市', value: order.storeName || '未知' })
    }

    // === 服務資訊和交易詳情 ===
    summaries = [
      ...summaries, // 展開之前的基本資訊
      { key: '物流方式', value: order.delivery_name || '未知' }, // 配送方式
      { key: '付款方式', value: order.payment_name || '未知' }, // 付款方式
      { key: '發票類型', value: order.invoice?.name || '未知' }, // 發票類型
    ]
    if (order.invoice?.name === '電子載具' && order.invoice?.carrier) {
      summaries.push({ key: '載具號碼', value: order.invoice.carrier })
    }
    if (order.invoice?.name === '統一編號' && order.invoice?.tax) {
      summaries.push({ key: '統一編號', value: order.invoice.tax })
    }
    summaries = [
      ...summaries,
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
      { key: '發票號碼', value: order.invoice?.number || '' },
      {
        key: '訂單金額',
        value: (
          <span className="text-lg font-bold text-primary">
            NT$ {formatPrice(order.total || 0)}
          </span>
        ),
      },
    ]
  }

  const products = order?.items || []

  // ===== 載入和錯誤狀態處理 =====
  if (isDataLoading) {
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

  return (
    <>
      <Navbar />
      <BreadcrumbAuto shopName="訂單詳情" />
      <section className="px-4 md:px-6 py-10 ">
        <div className="flex flex-col container mx-auto max-w-screen-xl min-h-screen gap-6">
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
                              className="border-b border-card-foreground"
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
                        {products.map((item, index) => {
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
                                      alt={product.name || `商品 ${index + 1}`}
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
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <Link href="/member/shop-data">
                <Button variant="highlight" className="w-[120px]">
                  返回我的訂單
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
