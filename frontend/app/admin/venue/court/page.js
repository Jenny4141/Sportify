// app/admin/venue/center/page.js
'use client'

// ===== 依賴項匯入 =====
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/admin/app-sidebar'
import { SiteHeader } from '@/components/admin/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { DataTable } from '@/components/admin/data-table'
import { courtColumns } from './columns'
import useSWR from 'swr'

import {
  fetchCourts,
  createCourt,
  updateCourt,
  deleteCourt,
  deleteMultipleCourts,
  fetchLocationOptions,
  fetchCenterOptions,
  fetchSportOptions,
} from '@/api'
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
  SheetTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { IconTrash } from '@tabler/icons-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'

// 將使用 useSearchParams 的邏輯抽取到單獨的組件
function CourtPageContent() {
  // ===== 路由和搜尋參數處理 =====
  const searchParams = useSearchParams()
  const router = useRouter()

  // ===== 組件狀態管理 =====
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [locationId, setLocationId] = useState('')
  const [centers, setCenters] = useState([])
  const [sports, setSports] = useState([])
  const [locations, setLocations] = useState([])
  const [errors, setErrors] = useState({})
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingCourt, setEditingCourt] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [courtToDelete, setCourtToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [courtsToDelete, setCourtsToDelete] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    centerId: '',
    sportId: '',
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
  } = useSWR(['courts', queryParams], async ([, params]) => fetchCourts(params))

  // ===== 副作用處理 =====
  useEffect(() => {
    const loadCentersAndSports = async () => {
      try {
        const locationData = await fetchLocationOptions()
        setLocations(locationData.rows || [])
        const centerData = await fetchCenterOptions()
        setCenters(centerData.rows || [])
        const sportData = await fetchSportOptions()
        setSports(sportData.rows || [])
      } catch (error) {
        console.error('載入中心/運動類型失敗:', error)
        toast.error('載入中心/運動類型失敗')
      }
    }
    loadCentersAndSports()
  }, [])

  // locationId 變動時，載入對應 center
  useEffect(() => {
    if (locationId) {
      fetchCenterOptions({ locationId: Number(locationId) }).then((data) =>
        setCenters(data.rows || [])
      )
    } else {
      setCenters([])
    }
  }, [locationId])

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
    setEditingCourt(null)
    setFormData({ name: '', centerId: '', sportId: '' })
    setErrors({})
    setIsSheetOpen(true)
  }

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Debug: 送出前 log formData
    console.log('送出前 formData:', formData)

    // 清除之前的錯誤訊息
    setErrors({})

    setIsLoading(true)

    try {
      let result

      if (isEditMode && editingCourt) {
        // 編輯模式
        result = await updateCourt(editingCourt.id, formData)
      } else {
        // 新增模式
        result = await createCourt(formData)
      }

      console.log('API 回應:', result) // Debug 用

      if (result.success) {
        toast.success(isEditMode ? '編輯場地成功！' : '新增場地成功！')
        setIsSheetOpen(false)
        setFormData({ name: '', centerId: '', sportId: '' })
        setIsEditMode(false)
        setEditingCourt(null)
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
      console.error(isEditMode ? '編輯場地失敗:' : '新增場地失敗:', error)
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
          (isEditMode ? '編輯場地失敗：' : '新增場地失敗：') +
            (error.message || '未知錯誤')
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsSheetOpen(false)
    setFormData({ name: '', centerId: '', sportId: '' })
    setErrors({}) // 清除錯誤訊息
    setIsEditMode(false)
    setEditingCourt(null)
  }

  const handleEdit = (court) => {
    console.log('編輯場地 - 完整資料:', court)
    setIsEditMode(true)
    setEditingCourt(court)
    setFormData({
      name: court.name,
      centerId:
        court.center?.id?.toString() || court.centerId?.toString() || '',
      sportId: court.sport?.id?.toString() || court.sportId?.toString() || '',
    })
    setIsSheetOpen(true)
  }

  const handleDelete = (court) => {
    console.log('準備刪除場地 - 完整資料:', court)
    setCourtToDelete(court)
    setIsDeleteDialogOpen(true)
  }

  const handleBulkDelete = async (selectedData) => {
    setCourtsToDelete(selectedData)
    setIsBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    setIsDeleting(true)
    try {
      const checkedItems = courtsToDelete.map((item) => item.id)
      const result = await deleteMultipleCourts(checkedItems)

      if (result.success) {
        toast.success(`成功刪除 ${courtsToDelete.length} 個場地！`)
        mutate() // 重新載入資料
        setIsBulkDeleteDialogOpen(false)
        setCourtsToDelete([])
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
    setCourtsToDelete([])
  }

  const confirmDelete = async () => {
    if (!courtToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteCourt(courtToDelete.id)

      if (result.success) {
        toast.success('刪除成功！')
        mutate() // 重新載入資料
        setIsDeleteDialogOpen(false)
        setCourtToDelete(null)
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
    setCourtToDelete(null)
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
        <SiteHeader title="場地管理" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DataTable
                data={data?.rows ?? []}
                columns={courtColumns}
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

      {/* ===== 新增/編輯場地表單 ===== */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="text-xl text-primary">
              {isEditMode ? '編輯場地' : '新增場地'}
            </SheetTitle>
            <SheetDescription className="text-gray-500">
              請填寫以下資訊
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-1 px-6">
            <div className="space-y-4">
              <Label htmlFor="courtId">地區</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇地區" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id.toString()}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-2">
                <Label htmlFor="centerId">
                  所屬中心<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.centerId}
                  onValueChange={(value) => {
                    handleInputChange('centerId', value)
                    // 自動組合名稱
                    let centerName =
                      centers.find((c) => c.id.toString() === value)?.name || ''
                    centerName = centerName.slice(0, 2)
                    const sportName =
                      sports.find((s) => s.id.toString() === formData.sportId)
                        ?.name || ''
                    let count = 1
                    if (data?.rows) {
                      const same = data.rows.filter(
                        (row) =>
                          row.center?.id?.toString() === value &&
                          row.sport?.id?.toString() === formData.sportId
                      )
                      count = same.length + 1
                    }
                    handleInputChange(
                      'name',
                      centerName && sportName
                        ? `${centerName} ${sportName} ${count}`
                        : ''
                    )
                  }}
                >
                  <SelectTrigger
                    className={errors.centerId ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="請選擇中心" />
                  </SelectTrigger>
                  <SelectContent>
                    {centers.map((center) => (
                      <SelectItem key={center.id} value={center.id.toString()}>
                        {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.centerId && (
                  <p className="text-sm text-red-500 mt-1">{errors.centerId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sportId">
                  運動類型
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.sportId}
                  onValueChange={(value) => {
                    handleInputChange('sportId', value)
                    // 自動組合名稱
                    let centerName =
                      centers.find((c) => c.id.toString() === formData.centerId)
                        ?.name || ''
                    centerName = centerName.slice(0, 2)
                    const sportName =
                      sports.find((s) => s.id.toString() === value)?.name || ''
                    let count = 1
                    if (data?.rows) {
                      const same = data.rows.filter(
                        (row) =>
                          row.center?.id?.toString() === formData.centerId &&
                          row.sport?.id?.toString() === value
                      )
                      count = same.length + 1
                    }
                    handleInputChange(
                      'name',
                      centerName && sportName
                        ? `${centerName} ${sportName} ${count}`
                        : ''
                    )
                  }}
                >
                  <SelectTrigger
                    className={errors.sportId ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="請選擇運動類型" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id.toString()}>
                        {sport.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sportId && (
                  <p className="text-sm text-red-500 mt-1">{errors.sportId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  場地名稱
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  readOnly
                  placeholder="將自動產生場地名稱"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
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
                    ? '編輯場地'
                    : '新增場地'}
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
                {courtToDelete?.id}. {courtToDelete?.name}
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
                {courtsToDelete.length} 項資料
              </strong>
              嗎？
            </AlertDialogDescription>
            <div className="mt-3 max-h-32 overflow-y-auto">
              {courtsToDelete.map((court, index) => (
                <div key={court.id} className="text-sm text-gray-700 py-1">
                  {court.id}. {court.name}
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

export default function VenueCourtPage() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <CourtPageContent />
    </Suspense>
  )
}
