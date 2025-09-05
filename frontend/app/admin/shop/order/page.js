'use client'

// react
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
// icons
import { IconTrash } from '@tabler/icons-react'
// ui components
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
// 自定義 components
import { AppSidebar } from '@/components/admin/app-sidebar'
import { SiteHeader } from '@/components/admin/site-header'
import { DataTable } from '@/components/admin/data-table'
import { orderColumns } from './columns'
// api
import {
  getAllOrders,
  createAdminOrder,
  updateOrder,
  deleteOrder,
} from '@/api/admin/shop/order'
import {
  fetchDeliveryOptions,
  fetchPaymentOptions,
  fetchInvoiceOptions,
  fetchStatusOptions,
} from '@/api/common'
// others
import { toast } from 'sonner'

// 將使用 useSearchParams 的邏輯抽取到單獨的組件
function OrderPageContent() {
  // ===== 路由和搜尋參數處理 =====
  const searchParams = useSearchParams()
  const router = useRouter()

  // ===== 組件狀態管理 =====
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [delivery, setDelivery] = useState([])
  const [payment, setPayment] = useState([])
  const [invoiceTypes, setInvoiceTypes] = useState([])
  const [orderStatus, setOrderStatus] = useState([])
  const [formData, setFormData] = useState({
    memberId: '',
    total: '',
    fee: '',
    recipient: '',
    phone: '',
    address: '',
    delivery: '',
    payment: '',
    invoice: '',
    invoiceNumber: '',
    status: '',
    items: [],
  })

  // ===== URL 參數處理 =====
  const queryParams = useMemo(() => {
    const entries = Object.fromEntries(searchParams.entries())
    return entries
  }, [searchParams])

  // ===== 數據獲取 =====
  const {
    data,
    isLoading: isDataLoading,
    error,
    mutate,
  } = useSWR(['orders', queryParams], async ([, params]) => {
    return getAllOrders(params)
  })

  // ===== 副作用處理 =====
  useEffect(() => {
    const loadData = async () => {
      try {
        const deliveryData = await fetchDeliveryOptions()
        setDelivery(deliveryData.rows || [])

        const paymentData = await fetchPaymentOptions()
        setPayment(paymentData.rows || [])

        const invoiceData = await fetchInvoiceOptions()
        setInvoiceTypes(invoiceData.rows || [])

        const orderStatusData = await fetchStatusOptions()
        setOrderStatus(orderStatusData.rows || [])
      } catch (error) {
        console.error('載入選項失敗:', error)
        toast.error('載入選項失敗')
      }
    }
    loadData()
  }, [])

  // ===== 事件處理函數 =====
  const handlePaginationChange = (paginationState) => {
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('page', String(paginationState.pageIndex + 1))
    newParams.set('perPage', String(paginationState.pageSize))
    router.push(`?${newParams.toString()}`)
  }

  const handleSearch = (keyword) => {
    const newParams = new URLSearchParams(searchParams.toString())
    if (keyword) {
      newParams.set('keyword', keyword)
      newParams.set('page', '1')
    } else {
      newParams.delete('keyword')
      newParams.set('page', '1')
    }
    router.push(`?${newParams.toString()}`)
  }

  const handleOrderBy = (orderby) => {
    const newParams = new URLSearchParams(searchParams.toString())
    if (orderby) {
      newParams.set('orderby', orderby)
    } else {
      newParams.delete('orderby')
    }
    newParams.set('page', '1') // 排序時回到第一頁
    router.push(`?${newParams.toString()}`)
  }

  const handleAddNew = () => {
    router.push('/admin/shop/order/add')
  }

  const handleEdit = (order) => {
    // 跳轉到編輯頁面
    router.push(`/admin/shop/order/edit/${order.id}`)
  }

  const handleDelete = (order) => {
    setOrderToDelete(order)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!orderToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteOrder(orderToDelete.id)

      if (result.code === 200) {
        toast.success('刪除成功！')
        mutate() // 重新載入資料
        setIsDeleteDialogOpen(false)
        setOrderToDelete(null)
      } else {
        toast.error(result.message || '刪除失敗')
      }
    } catch (error) {
      console.error('刪除失敗:', error)
      toast.error('刪除失敗：' + (error.message || '未知錯誤'))
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setOrderToDelete(null)
  }

  // ===== 載入和錯誤狀態處理 =====
  if (isDataLoading) return <p>載入中...</p>
  if (error) return <p>載入錯誤：{error.message}</p>

  return (
    <SidebarProvider
      style={{
        '--sidebar-width': 'calc(var(--spacing) * 72)',
        '--header-height': 'calc(var(--spacing) * 12)',
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="訂單管理" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DataTable
                data={data?.data ?? []}
                columns={orderColumns}
                totalRows={data?.totalRows}
                totalPages={data?.totalPages}
                onPaginationChange={handlePaginationChange}
                currentPage={parseInt(queryParams.page) || 1}
                pageSize={parseInt(queryParams.perPage) || 10}
                onAddNew={handleAddNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSearch={handleSearch}
                initialKeyword={queryParams.keyword || ''}
                onOrderBy={handleOrderBy}
                initialOrderBy={queryParams.orderby || ''}
                invoiceTypes={invoiceTypes}
                invoiceNumber={formData.invoiceNumber}
                setFormData={setFormData}
                isEditMode={isEditMode}
              />
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* ===== 刪除確認對話框 ===== */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold my-2 flex items-baseline gap-2">
              <IconTrash className="h-6 w-6 text-red-500 translate-y-0.5" />
              確認刪除
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-gray-600">
              您確定要刪除此筆訂單嗎？
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                此操作無法復原。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel onClick={cancelDelete} className="text-base">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-700 text-base"
            >
              {isDeleting ? '刪除中...' : '確定刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}

// 主要導出組件，包含 Suspense 邊界
export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">載入訂單管理資料中...</p>
          </div>
        </div>
      }
    >
      <OrderPageContent />
    </Suspense>
  )
}
