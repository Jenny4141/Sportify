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

export default function OrderDetailPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  // ===== 路由和搜尋參數處理 =====
  const { id } = useParams()

  // ===== 組件狀態管理 =====
  const [order, setOrder] = useState(null)

  // ===== 數據獲取 =====
  const shouldFetch = isAuthenticated && !!id
  const {
    data,
    isLoading: isDataLoading,
    error,
    mutate,
  } = useSWR(
    shouldFetch ? ['order', id] : null,
    shouldFetch ? () => getOrderDetail(id) : null
  )

  // ===== 副作用處理 =====
  useEffect(() => {
    if (data && data.data) {
      setOrder(data.data)
      // console.log('Order loaded:', data.data) // Debug用
    }
  }, [data])

  // 格式化價格，加上千分位逗號
  const formatPrice = (price) => {
    return Number(price).toLocaleString('zh-TW')
  }

  let summaries = []
  if (order) {
    summaries = [
      { key: '訂單編號', value: order.order_number || '未知' },
      { key: '收件人', value: order.recipient || '未知' },
      { key: '手機號碼', value: order.phone || '未知' },
    ]
    if (order.delivery_name?.includes('宅配')) {
      summaries.push({ key: '收件地址', value: order.address || '未知' })
    }
    if (order.delivery_name?.includes('7-11') && order.storeName) {
      summaries.push({ key: '取貨門市', value: order.storeName || '未知' })
    }
    summaries = [
      ...summaries,
      { key: '物流方式', value: order.delivery_name || '未知' },
      { key: '付款方式', value: order.payment_name || '未知' },
      { key: '發票類型', value: order.invoice?.name || '未知' },
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
