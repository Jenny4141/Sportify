// app/admin/venue/reservation/page.js
'use client'

// hooks
import { useState, useEffect, useMemo, Suspense } from 'react'

// utils
import { cn } from '@/lib/utils'
import { format as formatDate } from 'date-fns'

// 資料請求函式庫
import useSWR from 'swr'

// Icon
import { ChevronDownIcon } from 'lucide-react'
import { IconTrash, IconSearch, IconX } from '@tabler/icons-react'

// API 請求
import {
  fetchReservations,
  deleteReservation,
  deleteMultipleReservations,
  fetchMemberOptions,
  fetchLocationOptions,
  fetchCenterOptions,
  fetchSportOptions,
} from '@/api'

// next 元件
import { useSearchParams, useRouter } from 'next/navigation'

// UI 元件
import { Label } from '@/components/ui/label'
import { AppSidebar } from '@/components/admin/app-sidebar'
import { SiteHeader } from '@/components/admin/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { DataTable } from '@/components/admin/data-table'
import { reservationColumns } from './columns'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/combobox'
import { toast } from 'sonner'

// 將使用 useSearchParams 的邏輯抽取到單獨的組件
function ReservationContent() {
  // #region 路由和URL參數
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryParams = useMemo(() => {
    const entries = Object.fromEntries(searchParams.entries())
    return entries
  }, [searchParams])

  // #region 狀態管理
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [reservationToDelete, setReservationToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [reservationsToDelete, setReservationsToDelete] = useState([])

  const [memberId, setMemberId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [centerId, setCenterId] = useState('')
  const [sportId, setSportId] = useState('')
  const [date, setDate] = useState(null)

  const [members, setMembers] = useState([])
  const [locations, setLocations] = useState([])
  const [centers, setCenters] = useState([])
  const [sports, setSports] = useState([])

  const [errors, setErrors] = useState({})
  const [open, setOpen] = useState(false)

  const [filters, setFilters] = useState({
    memberId: queryParams.memberId || '',
    date: queryParams.date || '',
    locationId: queryParams.locationId || '',
    centerId: queryParams.centerId || '',
    sportId: queryParams.sportId || '',
  })

  // #region 數據獲取
  const {
    data,
    isLoading: isDataLoading,
    error,
    mutate,
  } = useSWR(['reservations', queryParams], async ([, params]) =>
    fetchReservations(params)
  )

  // #region 副作用處理
  useEffect(() => {
    const loadData = async () => {
      try {
        const memberData = await fetchMemberOptions()
        setMembers(memberData.rows || [])

        const locationData = await fetchLocationOptions()
        setLocations(locationData.rows || [])

        const centerData = await fetchCenterOptions()
        setCenters(centerData.rows || [])
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
      memberId: queryParams.memberId || '',
      date: queryParams.date || '',
      locationId: queryParams.locationId || '',
      centerId: queryParams.centerId || '',
      sportId: queryParams.sportId || '',
    })

    // 同步日期選擇器狀態
    if (queryParams.date) {
      try {
        const parsedDate = new Date(queryParams.date)
        if (!isNaN(parsedDate.getTime())) {
          setDate(parsedDate)
        }
      } catch (error) {
        console.error('日期解析錯誤:', error)
      }
    } else {
      setDate(null)
    }
  }, [
    queryParams.memberId,
    queryParams.date,
    queryParams.locationId,
    queryParams.centerId,
    queryParams.sportId,
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

  // 處理日期變更
  const handleDateChange = (selectedDate) => {
    setDate(selectedDate)
    setOpen(false)

    // 格式化日期為 YYYY-MM-DD 格式
    const formattedDate = selectedDate
      ? formatDate(selectedDate, 'yyyy-MM-dd')
      : ''
    handleFilterChange('date', formattedDate)
  }

  // 清除所有篩選
  const handleClearFilters = () => {
    setFilters({
      memberId: '',
      date: '',
      locationId: '',
      centerId: '',
      sportId: '',
    })

    // 清除日期選擇器狀態
    setDate(null)

    // 清除 URL 中的篩選參數
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.delete('memberId')
    newParams.delete('date')
    newParams.delete('locationId')
    newParams.delete('centerId')
    newParams.delete('sportId')
    newParams.set('page', '1')

    router.push(`?${newParams.toString()}`)
  }

  // 套用篩選
  const handleApplyFilters = () => {
    const newParams = new URLSearchParams(searchParams.toString())

    // 設置篩選參數
    if (filters.memberId) {
      newParams.set('memberId', filters.memberId)
    } else {
      newParams.delete('memberId')
    }

    if (filters.date) {
      newParams.set('date', filters.date)
    } else {
      newParams.delete('date')
    }

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
    router.push('/admin/venue/reservation/add')
  }

  const handleEdit = (reservation) => {
    router.push(`/admin/venue/reservation/edit/${reservation.id}`)
  }

  const handleDelete = (reservation) => {
    setReservationToDelete(reservation)
    setIsDeleteDialogOpen(true)
  }

  const handleBulkDelete = async (selectedData) => {
    setReservationsToDelete(selectedData)
    setIsBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    setIsDeleting(true)
    try {
      const checkedItems = reservationsToDelete.map((item) => item.id)
      const result = await deleteMultipleReservations(checkedItems)
      if (result.success) {
        toast.success(`成功刪除 ${reservationsToDelete.length} 筆預約！`)
        mutate()
        setIsBulkDeleteDialogOpen(false)
        setReservationsToDelete([])
      } else {
        toast.error(result.message || '批量刪除失敗')
      }
    } catch (error) {
      toast.error('批量刪除失敗：' + (error.message || '未知錯誤'))
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelBulkDelete = () => {
    setIsBulkDeleteDialogOpen(false)
    setReservationsToDelete([])
  }

  const confirmDelete = async () => {
    if (!reservationToDelete) return
    setIsDeleting(true)
    try {
      const result = await deleteReservation(reservationToDelete.id)
      if (result.success) {
        toast.success('刪除成功！')
        mutate()
        setIsDeleteDialogOpen(false)
        setReservationToDelete(null)
      } else {
        toast.error(result.message || '刪除失敗')
      }
    } catch (error) {
      toast.error('刪除失敗：' + (error.message || '未知錯誤'))
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setReservationToDelete(null)
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

  // #region資料選項
  const comboboxData = [
    { value: 'all', label: '全部會員' },
    ...members.map((m) => ({
      value: m.id?.toString?.() ?? String(m.id),
      label: `${m.id}.${m.name}` ?? `${m.id}`,
    })),
  ]

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
        <SiteHeader title="訂單管理" />
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
                    {/* 會員 */}
                    <div className="space-y-2">
                      <Label htmlFor="memberId">會員</Label>
                      <Combobox
                        data={comboboxData}
                        value={filters.memberId || ''}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'memberId',
                            value === 'all' ? '' : value
                          )
                        }
                        onOpenChange={() => {}}
                        type="會員"
                      >
                        <ComboboxTrigger className="w-full" />
                        <ComboboxContent>
                          <ComboboxInput />
                          <ComboboxEmpty />
                          <ComboboxList>
                            <ComboboxGroup>
                              {comboboxData.map((cbd) => (
                                <ComboboxItem key={cbd.value} value={cbd.value}>
                                  {cbd.label}
                                </ComboboxItem>
                              ))}
                            </ComboboxGroup>
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                      {errors.memberId && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.memberId}
                        </p>
                      )}
                    </div>

                    {/* 日期 */}
                    <div className="space-y-2">
                      <Label htmlFor="date">日期</Label>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="date"
                            className={`w-full justify-between font-normal
                            }`}
                          >
                            {date
                              ? date.toLocaleDateString()
                              : '請選擇預訂日期'}
                            <ChevronDownIcon />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto overflow-hidden p-0"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={date}
                            captionLayout="dropdown"
                            onSelect={handleDateChange}
                            disabled={(date) => {
                              // 禁用今天之前的日期
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              return date < today
                            }}
                            className={
                              errors.date
                                ? 'border border-red-500 rounded-md'
                                : ''
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.date && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.date}
                        </p>
                      )}
                    </div>

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
                          {sports.length === 0 ? (
                            <div className="px-3 py-2 text-gray-400 text-center">
                              {filters.centerId
                                ? '此場館沒有支援的運動項目'
                                : '載入中...'}
                            </div>
                          ) : (
                            sports.map((sport) => (
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
                columns={reservationColumns}
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
                {reservationToDelete?.id}
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
                {reservationsToDelete.length} 筆預約
              </strong>
              嗎？
            </AlertDialogDescription>
            <div className="mt-3 max-h-32 overflow-y-auto">
              {reservationsToDelete.map((reservation, index) => (
                <div
                  key={reservation.id}
                  className="text-sm text-gray-700 py-1"
                >
                  {reservation.id}
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

export default function ReservationPage() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <ReservationContent />
    </Suspense>
  )
}
