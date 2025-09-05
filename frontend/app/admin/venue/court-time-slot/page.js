// app/admin/venue/court-time-slot/page.js
'use client'

// hooks
import { useState, useEffect, useMemo, Suspense } from 'react'

// 資料請求函式庫
import useSWR from 'swr'

// Icon
import { IconTrash, IconSearch, IconX } from '@tabler/icons-react'

// API 請求
import {
  fetchCourtTimeSlots,
  deleteCourtTimeSlot,
  deleteMultipleCourtTimeSlots,
  fetchLocationOptions,
  fetchTimePeriodOptions,
  fetchCenterOptions,
  fetchSportOptions,
  fetchCourtOptions,
  fetchTimeSlotOptions,
  batchSetCourtTimeSlotPrice,
} from '@/api'

// next 元件
import { useSearchParams, useRouter } from 'next/navigation'

// UI 元件
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/admin/app-sidebar'
import { SiteHeader } from '@/components/admin/site-header'
import { DataTable } from '@/components/admin/data-table'
import { courtTimeSlotColumns } from './columns'
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
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

// 將使用 useSearchParams 的邏輯抽取到單獨的組件
function CourtTimeSlotContent() {
  // #region 路由和URL參數
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryParams = useMemo(() => {
    const entries = Object.fromEntries(searchParams.entries())
    return entries
  }, [searchParams])

  // #region 狀態管理
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [locationId, setLocationId] = useState('')
  const [centerId, setCenterId] = useState('')
  const [sportId, setSportId] = useState('')
  const [courtIds, setCourtIds] = useState([])
  const [timePeriodId, setTimePeriodId] = useState('')
  const [timeSlotIds, setTimeSlotIds] = useState([])

  const [locations, setLocations] = useState([])
  const [centers, setCenters] = useState([])
  const [sports, setSports] = useState([])
  const [courts, setCourts] = useState([])
  const [timePeriods, setTimePeriods] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [price, setPrice] = useState('')

  const [errors, setErrors] = useState({})
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState([])

  const [filters, setFilters] = useState({
    locationId: queryParams.locationId || '',
    centerId: queryParams.centerId || '',
    sportId: queryParams.sportId || '',
    timePeriodId: queryParams.timePeriodId || '',
  })

  // #region 數據獲取
  const {
    data,
    isLoading: isDataLoading,
    error,
    mutate,
  } = useSWR(['courtTimeSlots', queryParams], async ([, params]) =>
    fetchCourtTimeSlots(params)
  )

  // #region 副作用處理

  useEffect(() => {
    const loadData = async () => {
      try {
        const locationData = await fetchLocationOptions()
        setLocations(locationData.rows || [])

        const timePeriodData = await fetchTimePeriodOptions()
        setTimePeriods(timePeriodData.rows || [])
      } catch (error) {
        console.error('載入基礎資料失敗:', error)
        toast.error('載入基礎資料失敗')
      }
    }
    loadData()
  }, [])

  // 載入運動項目選項（依場館篩選）
  useEffect(() => {
    const loadData = async () => {
      try {
        let sportData
        if (filters.centerId) {
          sportData = await fetchSportOptions({
            centerId: Number(filters.centerId),
          })
        } else {
          sportData = await fetchSportOptions()
        }
        setSports(sportData.rows || [])

        // 如果當前選擇的運動項目不在新的運動清單中，清空選擇
        if (filters.sportId && sportData.rows && sportData.rows.length > 0) {
          const sportExists = sportData.rows.some(
            (sport) => sport.id.toString() === filters.sportId
          )
          if (!sportExists) {
            setFilters((prev) => ({ ...prev, sportId: '' }))
          }
        }
      } catch (error) {
        console.error('載入運動項目失敗:', error)
        setSports([])
      }
    }
    loadData()
  }, [filters.centerId])

  // 同步篩選狀態與 URL 參數
  useEffect(() => {
    setFilters({
      locationId: queryParams.locationId || '',
      centerId: queryParams.centerId || '',
      sportId: queryParams.sportId || '',
      timePeriodId: queryParams.timePeriodId || '',
    })
  }, [
    queryParams.locationId,
    queryParams.centerId,
    queryParams.sportId,
    queryParams.timePeriodId,
  ])

  useEffect(() => {
    const loadData = async () => {
      try {
        let centerData
        if (filters.locationId) {
          centerData = await fetchCenterOptions({
            locationId: Number(filters.locationId),
          })
        } else {
          centerData = await fetchCenterOptions()
        }
        setCenters(centerData.rows || [])
        if (
          filters.centerId &&
          !centerData.rows?.some(
            (center) => center.id.toString() === filters.centerId
          )
        ) {
          setFilters((prev) => ({ ...prev, centerId: '' }))
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setCenters([])
        } else {
          setCenters([])
        }
      }
    }
    loadData()
  }, [filters.locationId])

  useEffect(() => {
    const loadData = async () => {
      try {
        let courtData
        if (centerId || sportId) {
          courtData = await fetchCourtOptions({
            centerId: centerId ? Number(centerId) : undefined,
            sportId: sportId ? Number(sportId) : undefined,
          })
        } else {
          courtData = await fetchCourtOptions()
        }
        setCourts(courtData.rows || [])
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setCourts([])
        } else {
          setCourts([])
        }
      }
    }
    loadData()
  }, [centerId, sportId])

  useEffect(() => {
    const loadData = async () => {
      try {
        let timeSlotData
        if (timePeriodId) {
          timeSlotData = await fetchTimeSlotOptions({
            timePeriodId: Number(timePeriodId),
          })
        } else {
          timeSlotData = await fetchTimeSlotOptions()
        }
        setTimeSlots(timeSlotData.rows || [])
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setTimeSlots([])
        } else {
          setTimeSlots([])
        }
      }
    }
    loadData()
  }, [timePeriodId])

  // 載入表單中的運動項目（依場館篩選）
  useEffect(() => {
    const loadFormSports = async () => {
      try {
        let sportData
        if (centerId) {
          sportData = await fetchSportOptions({ centerId: Number(centerId) })
        } else {
          sportData = await fetchSportOptions()
        }

        // 更新運動項目清單（這會影響表單中的運動選擇）
        const formSports = sportData.rows || []

        // 如果當前選擇的運動項目不在新清單中，清空選擇
        if (sportId && formSports.length > 0) {
          const sportExists = formSports.some(
            (sport) => sport.id.toString() === sportId
          )
          if (!sportExists) {
            setSportId('')
          }
        }
      } catch (error) {
        console.error('載入表單運動項目失敗:', error)
      }
    }
    loadFormSports()
  }, [centerId])

  // #region 事件處理函數
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

  // 處理篩選變更
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [filterName]: value }

      // 如果變更地區，清空場館選擇
      if (filterName === 'locationId') {
        newFilters.centerId = ''
        newFilters.sportId = '' // 同時清空運動項目選擇
      }

      // 如果變更場館，清空運動項目選擇（會由 useEffect 重新載入適合的運動項目）
      if (filterName === 'centerId') {
        newFilters.sportId = ''
      }

      return newFilters
    })
  }

  // 清除所有篩選
  const handleClearFilters = () => {
    setFilters({
      locationId: '',
      centerId: '',
      sportId: '',
      timePeriodId: '',
    })

    // 清除 URL 中的篩選參數
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.delete('locationId')
    newParams.delete('centerId')
    newParams.delete('sportId')
    newParams.delete('timePeriodId')
    newParams.set('page', '1')

    router.push(`?${newParams.toString()}`)
  }

  // 套用篩選
  const handleApplyFilters = () => {
    const newParams = new URLSearchParams(searchParams.toString())

    // 設置篩選參數
    if (filters.locationId) {
      newParams.set('locationId', filters.locationId)
    } else {
      newParams.delete('locationId')
    }

    if (filters.centerId) {
      newParams.set('centerId', filters.centerId)
    } else {
      newParams.delete('centerId')
    }

    if (filters.sportId) {
      newParams.set('sportId', filters.sportId)
    } else {
      newParams.delete('sportId')
    }

    if (filters.timePeriodId) {
      newParams.set('timePeriodId', filters.timePeriodId)
    } else {
      newParams.delete('timePeriodId')
    }

    // 重置到第一頁
    newParams.set('page', '1')

    // 更新 URL
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

    // 清空所有欄位
    setLocationId('')
    setCenterId('')
    setSportId('')
    setCourtIds([])
    setTimePeriodId('')
    setTimeSlotIds([])
    setPrice('')

    setErrors({})
    setIsSheetOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)
    const data = {
      locationId: locationId ? Number(locationId) : undefined,
      centerId: centerId ? Number(centerId) : undefined,
      sportId: sportId ? Number(sportId) : undefined,
      courtIds: courtIds.length > 0 ? courtIds.map(Number) : undefined,
      timePeriodId: timePeriodId ? Number(timePeriodId) : undefined,
      timeSlotIds: timeSlotIds.length > 0 ? timeSlotIds.map(Number) : undefined,
      price: price === '' ? undefined : Number(price),
    }
    try {
      const result = await batchSetCourtTimeSlotPrice(data)
      if (result.success) {
        toast.success(
          isEditMode
            ? '編輯價格成功！'
            : `成功批次設定 ${result.affectedRows} 筆價格！`
        )
        handleCancel()
        mutate && mutate()
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
      toast.error(
        (isEditMode ? '編輯預約失敗：' : '新增預約失敗：') +
          (error.message || '未知錯誤')
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsSheetOpen(false)
    setIsEditMode(false)

    setLocationId('')
    setCenterId('')
    setSportId('')
    setCourtIds([])
    setTimePeriodId('')
    setTimeSlotIds([])
    setPrice('')

    setErrors({})
  }

  const handleEdit = (item) => {
    console.log('編輯 item:', item) // 這行會在你點擊編輯時印出 item 結構
    setIsEditMode(true)

    // 帶入該筆資料
    setCenterId(item.court?.centerId?.toString() || '')
    setSportId(item.court?.sportId?.toString() || '')
    setCourtIds(item.courtId ? [item.courtId.toString()] : [])
    setTimePeriodId(item.timeSlot?.timePeriodId?.toString() || '')
    setTimeSlotIds(item.timeSlotId ? [item.timeSlotId.toString()] : [])
    setPrice(item.price?.toString() || '')
    setErrors({})

    setIsSheetOpen(true)
  }

  const handleDelete = (item) => {
    setItemToDelete(item)
    setIsDeleteDialogOpen(true)
  }

  const handleBulkDelete = async (selectedData) => {
    setItemsToDelete(selectedData)
    setIsBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    setIsDeleting(true)
    try {
      const checkedItems = itemsToDelete.map((item) => item.id)
      const result = await deleteMultipleCourtTimeSlots(checkedItems)

      if (result.success) {
        toast.success(`成功刪除 ${itemsToDelete.length} 筆時段！`)
        mutate() // 重新載入資料
        setIsBulkDeleteDialogOpen(false)
        setItemsToDelete([])
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
    setItemsToDelete([])
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteCourtTimeSlot(itemToDelete.id)

      if (result.success) {
        toast.success('刪除成功！')
        mutate() // 重新載入資料
        setIsDeleteDialogOpen(false)
        setItemToDelete(null)
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
    setItemToDelete(null)
  }

  //  #region 載入和錯誤狀態處理
  if (isDataLoading) return <p>載入中...</p>
  if (error) return <p>載入錯誤：{error.message}</p>

  // ===== Debug 資料格式 =====
  /* console.log('完整資料:', data)
  console.log('資料結構:', JSON.stringify(data, null, 2))
  if (data?.rows && data.rows.length > 0) {
    console.log('第一筆資料:', data.rows[0])
    console.log('第一筆資料的 keys:', Object.keys(data.rows[0]))
  } */

  // #region 頁面渲染

  return (
    <SidebarProvider
      style={{
        '--sidebar-width': 'calc(var(--spacing) * 72)',
        '--header-height': 'calc(var(--spacing) * 12)',
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="場地價格管理" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {/* 篩選表單 */}
            <div className="flex flex-col gap-4 px-4 md:px-6 py-4 md:gap-6 md:py-6">
              <Card className="shadow-none">
                {/* <CardHeader>
                  <CardTitle>篩選條件</CardTitle>
                </CardHeader> */}
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 地區篩選 */}
                    <div className="space-y-2">
                      <Label>地區</Label>
                      <Select
                        value={filters.locationId || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'locationId',
                            value === 'all' ? '' : value
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="選擇地區" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部地區</SelectItem>
                          {locations.map((location) => (
                            <SelectItem
                              key={location.id}
                              value={location.id.toString()}
                            >
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 場館篩選 */}
                    <div className="space-y-2">
                      <Label>場館</Label>
                      <Select
                        value={filters.centerId || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'centerId',
                            value === 'all' ? '' : value
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="選擇場館" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部場館</SelectItem>
                          {centers
                            .filter(
                              (center) =>
                                !filters.locationId ||
                                center.locationId === +filters.locationId
                            )
                            .map((center) => (
                              <SelectItem
                                key={center.id}
                                value={center.id.toString()}
                              >
                                {center.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 運動項目篩選 */}
                    <div className="space-y-2">
                      <Label>運動項目</Label>
                      <Select
                        value={filters.sportId || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'sportId',
                            value === 'all' ? '' : value
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="選擇運動項目" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部運動</SelectItem>
                          {sports.map((sport) => (
                            <SelectItem
                              key={sport.id}
                              value={sport.id.toString()}
                            >
                              {sport.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 時段類型篩選 */}
                    <div className="space-y-2">
                      <Label>時段類型</Label>
                      <Select
                        value={filters.timePeriodId || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'timePeriodId',
                            value === 'all' ? '' : value
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="選擇時段類型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部時段</SelectItem>
                          {timePeriods.map((period) => (
                            <SelectItem
                              key={period.id}
                              value={period.id.toString()}
                            >
                              {period.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  {/* 篩選按鈕 */}
                  <div className="flex flex-col md:flex-row w-full justify-end gap-4">
                    <Button
                      onClick={() => handleApplyFilters()}
                      variant="default"
                      className="w-full md:w-auto"
                    >
                      <IconSearch />
                      套用篩選
                    </Button>
                    <Button
                      onClick={handleClearFilters}
                      variant="outline"
                      className="w-full md:w-auto"
                    >
                      <IconX />
                      清除篩選
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DataTable
                data={data?.rows ?? []}
                columns={courtTimeSlotColumns}
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

      {/* ===== 批量設定價錢表單 ===== */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="text-xl text-primary">
              {isEditMode ? '編輯價格' : '新增價格'}
            </SheetTitle>
            <SheetDescription className="text-gray-500">
              請選擇條件與價格，未選的條件代表全部
            </SheetDescription>
          </SheetHeader>

          <form className="space-y-6 mt-1 px-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>地區</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部地區" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.length === 0 ? (
                      <div className="px-3 py-2 text-gray-400">
                        沒有符合資料
                      </div>
                    ) : (
                      locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id.toString()}>
                          {loc.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>中心</Label>
                <Select value={centerId} onValueChange={setCenterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部中心" />
                  </SelectTrigger>
                  <SelectContent>
                    {centers.length === 0 ? (
                      <div className="px-3 py-2 text-gray-400">
                        沒有符合資料
                      </div>
                    ) : (
                      centers.map((center) => (
                        <SelectItem
                          key={center.id}
                          value={center.id.toString()}
                        >
                          {center.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>運動</Label>
                <Select value={sportId} onValueChange={setSportId}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部運動" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.filter(
                      (sport) =>
                        !centerId ||
                        // 運動項目已經由 API 根據 centerId 篩選過了
                        true
                    ).length === 0 ? (
                      <div className="px-3 py-2 text-gray-400">
                        {centerId ? '此場館沒有支援的運動項目' : '沒有符合資料'}
                      </div>
                    ) : (
                      sports
                        .filter(
                          (sport) =>
                            !centerId ||
                            // 運動項目已經由 API 根據 centerId 篩選過了
                            true
                        )
                        .map((sport) => (
                          <SelectItem
                            key={sport.id}
                            value={sport.id.toString()}
                          >
                            {sport.name}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>球場（可多選）</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {courtIds.length === 0
                        ? '全部球場'
                        : `已選 ${courtIds.length} 項`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {courts.length === 0 ? (
                      <div className="px-3 py-2 text-gray-400">
                        沒有符合資料
                      </div>
                    ) : (
                      courts.map((court) => (
                        <DropdownMenuCheckboxItem
                          key={court.id}
                          checked={courtIds.includes(court.id.toString())}
                          onCheckedChange={(checked) => {
                            setCourtIds((prev) =>
                              checked
                                ? [...prev, court.id.toString()]
                                : prev.filter(
                                    (id) => id !== court.id.toString()
                                  )
                            )
                          }}
                        >
                          {court.name}
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-2">
                <Label>時段區段</Label>
                <Select value={timePeriodId} onValueChange={setTimePeriodId}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部時段區段" />
                  </SelectTrigger>
                  <SelectContent>
                    {timePeriods.length === 0 ? (
                      <div className="px-3 py-2 text-gray-400">
                        沒有符合資料
                      </div>
                    ) : (
                      timePeriods.map((tp) => (
                        <SelectItem key={tp.id} value={tp.id.toString()}>
                          {tp.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>時段（可多選）</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {timeSlotIds.length === 0
                        ? '全部球場'
                        : `已選 ${timeSlotIds.length} 項`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {timeSlots.length === 0 ? (
                      <div className="px-3 py-2 text-gray-400">
                        沒有符合資料
                      </div>
                    ) : (
                      timeSlots.map((timeSlot) => (
                        <DropdownMenuCheckboxItem
                          key={timeSlot.id}
                          checked={timeSlotIds.includes(timeSlot.id.toString())}
                          onCheckedChange={(checked) => {
                            setTimeSlotIds((prev) =>
                              checked
                                ? [...prev, timeSlot.id.toString()]
                                : prev.filter(
                                    (id) => id !== timeSlot.id.toString()
                                  )
                            )
                          }}
                        >
                          {timeSlot.startTime}~{timeSlot.endTime}
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-2">
                <Label>
                  價格<span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="請輸入價格"
                  min="0"
                  step="1"
                  className={errors.price ? 'border-red-500' : ''}
                />
                {errors.price && (
                  <p className="text-sm text-red-500 mt-1">{errors.price}</p>
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
                    ? '編輯價格'
                    : '新增價格'}
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
                {itemToDelete?.id}. {itemToDelete?.name}
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
                {itemsToDelete.length} 項資料
              </strong>
              嗎？
            </AlertDialogDescription>
            <div className="mt-3 max-h-32 overflow-y-auto">
              {itemsToDelete.map((court, index) => (
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

export default function CourtTimeSlotPage() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <CourtTimeSlotContent />
    </Suspense>
  )
}
