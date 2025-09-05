// app/admin/venue/time-slot/page.js
'use client'

// ===== 依賴項匯入 =====
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/admin/app-sidebar'
import { SiteHeader } from '@/components/admin/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { DataTable } from '@/components/admin/data-table'
import { timeSlotColumns } from './columns'
import useSWR from 'swr'
import {
  fetchTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  deleteMultipleTimeSlots,
  fetchTimePeriodOptions,
} from '@/api'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { IconTrash } from '@tabler/icons-react'
import { toast } from 'sonner'

// 將使用 useSearchParams 的邏輯抽取到單獨的組件
function TimeSlotContent() {
  // ===== 路由和搜尋參數處理 =====
  const searchParams = useSearchParams()
  const router = useRouter()

  // ===== 組件狀態管理 =====
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [timePeriods, setTimePeriods] = useState([])
  const [errors, setErrors] = useState({})
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingTimeSlot, setEditingTimeSlot] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [timeSlotToDelete, setTimeSlotToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [timeSlotsToDelete, setTimeSlotsToDelete] = useState([])
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    timePeriodId: '',
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
  } = useSWR(['time-slots', queryParams], async ([, params]) =>
    fetchTimeSlots(params)
  )

  // ===== 副作用處理 =====
  useEffect(() => {
    const loadTimePeriods = async () => {
      try {
        const data = await fetchTimePeriodOptions()
        setTimePeriods(data.rows || [])
      } catch (error) {
        console.error('載入時間區段失敗:', error)
        toast.error('載入時間區段失敗')
      }
    }
    loadTimePeriods()
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
    setIsEditMode(false)
    setEditingTimeSlot(null)
    setFormData({ startTime: '', endTime: '', timePeriodId: '' })
    setErrors({})
    setIsSheetOpen(true)
  }

  // 根據 startTime 自動判斷時段名稱並對應 timePeriodId
  const getTimePeriodIdByTime = (start, periods) => {
    if (!start || !periods?.length) return ''
    const [h] = start.split(':').map(Number)
    let label = ''
    if (h >= 8 && h < 12) label = '早上'
    else if (h >= 12 && h < 18) label = '下午'
    else if (h >= 18 && h < 22) label = '晚上'
    const found = periods.find((p) => p.name === label)
    return found ? String(found.id) : ''
  }

  const handleInputChange = (name, value) => {
    setFormData((prev) => {
      let next = { ...prev, [name]: value }
      // 自動判斷 timePeriodId
      if (
        (name === 'startTime' || name === 'endTime') &&
        value &&
        timePeriods.length
      ) {
        const autoId = getTimePeriodIdByTime(
          name === 'startTime' ? value : next.startTime,
          timePeriods
        )
        if (autoId) next.timePeriodId = autoId
      }
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 清除之前的錯誤訊息
    setErrors({})

    setIsLoading(true)

    try {
      let result

      if (isEditMode && editingTimeSlot) {
        // 編輯模式
        result = await updateTimeSlot(editingTimeSlot.id, formData)
      } else {
        // 新增模式
        result = await createTimeSlot(formData)
      }

      console.log('API 回應:', result) // Debug 用

      if (result.success) {
        toast.success(isEditMode ? '編輯時段成功！' : '新增時段成功！')
        setIsSheetOpen(false)
        setFormData({ startTime: '', endTime: '', timePeriodId: '' })
        setIsEditMode(false)
        setEditingTimeSlot(null)
        mutate()
      }
    } catch (error) {
      // axios 400 驗證錯誤處理
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data
      ) {
        const result = error.response.data
        const errs = {}
        const shown = {}
        result.issues?.forEach((issue) => {
          const field = issue.path[0]
          if (shown[field]) return
          errs[field] = issue.message
          shown[field] = true
        })
        setErrors(errs)
        if (Object.keys(errs).length === 0) {
          toast.error(result.message || '輸入資料有誤')
        }
        return
      }
      console.error(isEditMode ? '編輯時段失敗:' : '新增時段失敗:', error)
      // 根據不同的錯誤類型顯示不同的訊息
      if (
        error.message.includes('network') ||
        error.message.includes('fetch')
      ) {
        toast.error('網路連線錯誤，請檢查網路狀態')
      } else if (error.message.includes('400')) {
        toast.error('輸入資料有誤，請檢查後重試')
      } else if (error.message.includes('500')) {
        toast.error('伺服器錯誤，請稍後再試')
      } else {
        toast.error(
          (isEditMode ? '編輯時段失敗：' : '新增時段失敗：') +
            (error.message || '未知錯誤')
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsSheetOpen(false)
    setFormData({ startTime: '', endTime: '', timePeriodId: '' })
    setErrors({}) // 清除錯誤訊息
    setIsEditMode(false)
    setEditingTimeSlot(null)
  }

  const handleEdit = (slot) => {
    console.log('編輯時段 - 完整資料:', slot)
    setIsEditMode(true)
    setEditingTimeSlot(slot)
    setFormData({
      startTime: slot.startTime || '',
      endTime: slot.endTime || '',
      timePeriodId: slot.timePeriodId ? String(slot.timePeriodId) : '',
    })
    setIsSheetOpen(true)
  }

  const handleDelete = (slot) => {
    console.log('準備刪除時段 - 完整資料:', slot)
    setTimeSlotToDelete(slot)
    setIsDeleteDialogOpen(true)
  }

  const handleBulkDelete = (selectedData) => {
    setTimeSlotsToDelete(selectedData)
    setIsBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    setIsDeleting(true)
    try {
      const checkedItems = timeSlotsToDelete.map((item) => item.id)
      const result = await deleteMultipleTimeSlots(checkedItems)

      if (result.success) {
        toast.success(`成功刪除 ${timeSlotsToDelete.length} 個時段！`)
        mutate() // 重新載入資料
        setIsBulkDeleteDialogOpen(false)
        setTimeSlotsToDelete([])
      } else {
        toast.error(result.message || '批量刪除失敗')
      }
    } catch (error) {
      console.error('批量刪除失敗:', error)
      toast.error('批量刪除失敗：' + (error.message || '未知錯誤'))
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelBulkDelete = () => {
    setIsBulkDeleteDialogOpen(false)
    setTimeSlotsToDelete([])
  }

  const confirmDelete = async () => {
    if (!timeSlotToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteTimeSlot(timeSlotToDelete.id)

      if (result.success) {
        toast.success('刪除成功！')
        mutate() // 重新載入資料
        setIsDeleteDialogOpen(false)
        setTimeSlotToDelete(null)
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
    setTimeSlotToDelete(null)
  }

  // ===== 載入和錯誤狀態處理 =====
  if (isDataLoading) return <p>載入中...</p>
  if (error) return <p>載入錯誤：{error.message}</p>

  // ===== Debug 資料格式 =====
  /* console.log('完整資料:', data)
  console.log('資料結構:', JSON.stringify(data, null, 2))
  if (data?.rows && data.rows.length > 0) {
    console.log('第一筆資料:', data.rows[0])
    console.log('第一筆資料的 keys:', Object.keys(data.rows[0]))
  } */

  // ===== 頁面渲染 =====
  return (
    <SidebarProvider
      style={{
        '--sidebar-width': 'calc(var(--spacing) * 72)',
        '--header-height': 'calc(var(--spacing) * 12)',
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="開放時間管理" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DataTable
                data={data?.rows ?? []}
                columns={timeSlotColumns}
                totalRows={data?.totalRows}
                totalPages={data?.totalPages}
                onPaginationChange={handlePaginationChange}
                currentPage={parseInt(queryParams.page) || 1}
                pageSize={parseInt(queryParams.perPage) || 10}
                onAddNew={handleAddNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                onSearch={handleSearch}
                initialKeyword={queryParams.keyword || ''}
                onOrderBy={handleOrderBy}
                initialOrderBy={queryParams.orderby || ''}
              />
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* ===== 新增/編輯時段表單 ===== */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="text-xl text-primary">
              {isEditMode ? '編輯時段' : '新增時段'}
            </SheetTitle>
            <SheetDescription className="text-gray-500">
              請填寫以下資訊
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-1 px-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">
                  開始時間<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    handleInputChange('startTime', e.target.value)
                  }
                  className={errors.startTime ? 'border-red-500' : ''}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.startTime}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">
                  結束時間<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className={errors.endTime ? 'border-red-500' : ''}
                />
                {errors.endTime && (
                  <p className="text-sm text-red-500 mt-1">{errors.endTime}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="timePeriod">
                  時間區段<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.timePeriodId}
                  onValueChange={(value) =>
                    handleInputChange('timePeriodId', value)
                  }
                >
                  <SelectTrigger
                    className={errors.timePeriodId ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="請選擇時間區段" />
                  </SelectTrigger>
                  <SelectContent>
                    {timePeriods.map((period) => (
                      <SelectItem key={period.id} value={period.id.toString()}>
                        {period.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.timePeriodId && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.timePeriodId}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                取消
              </Button>
              <Button type="submit" variant="default" disabled={isLoading}>
                {isLoading
                  ? isEditMode
                    ? '編輯中...'
                    : '新增中...'
                  : isEditMode
                    ? '編輯時段'
                    : '新增時段'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

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
              您確定要刪除
              <strong className="text-red-500">
                {timeSlotToDelete?.id}. {timeSlotToDelete?.startTime} -{' '}
                {timeSlotToDelete?.endTime}
              </strong>
              嗎？
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

      {/* ===== 批量刪除確認對話框 ===== */}
      <AlertDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold my-2 flex items-baseline gap-2">
              <IconTrash className="h-6 w-6 text-red-500 translate-y-0.5" />
              確認批量刪除
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-gray-600">
              您確定要刪除以下
              <strong className="text-red-500">
                {timeSlotsToDelete.length} 項資料
              </strong>
              嗎？
            </AlertDialogDescription>
            <div className="mt-3 max-h-32 overflow-y-auto">
              {timeSlotsToDelete.map((slot, index) => (
                <div key={slot.id} className="text-sm text-gray-700 py-1">
                  {slot.id}. {slot.startTime} - {slot.endTime}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">此操作無法復原。</p>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel onClick={cancelBulkDelete} className="text-base">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
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

export default function TimeSlotPage() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <TimeSlotContent />
    </Suspense>
  )
}
