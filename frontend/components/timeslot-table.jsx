// hooks
import { useState, useEffect, useMemo } from 'react'

// utils
import { cn } from '@/lib/utils'

// Icon
import {
  FaRegCircleCheck,
  FaCircleCheck,
  FaCircleXmark,
  FaCircleMinus,
} from 'react-icons/fa6'

// UI 元件
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

export function TimeSlotTable({ courtTimeSlots = [], onSelectionChange }) {
  // #region 組件狀態管理
  // 儲存選中的時間段 {courtId: number, timeSlotId: number}[]
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([])
  // 控制超過限制警告對話框
  const [showLimitDialog, setShowLimitDialog] = useState(false)

  // 從真實資料中提取唯一的場地和時間段
  const { courts, timeSlots } = useMemo(() => {
    if (!courtTimeSlots.length) {
      return { courts: [], timeSlots: [] }
    }

    // 提取唯一的場地
    const courtsMap = new Map()
    const timeSlotsMap = new Map()

    courtTimeSlots.forEach((item) => {
      // 提取場地資訊
      if (item.court && !courtsMap.has(item.court.id)) {
        courtsMap.set(item.court.id, {
          id: item.court.id,
          name: item.court.name,
        })
      }

      if (item.timeSlot && !timeSlotsMap.has(item.timeSlot.id)) {
        timeSlotsMap.set(item.timeSlot.id, {
          id: item.timeSlot.id,
          label: item.timeSlot.label,
        })
      }
    })

    const courtsArray = Array.from(courtsMap.values()).sort(
      (a, b) => a.id - b.id
    )
    const timeSlotsArray = Array.from(timeSlotsMap.values()).sort(
      (a, b) => a.id - b.id
    )

    return {
      courts: courtsArray,
      timeSlots: timeSlotsArray,
    }
  }, [courtTimeSlots])

  // #region 副作用處理
  // 當 courtTimeSlots 改變時清除之前的選擇
  useEffect(() => {
    setSelectedTimeSlots([])
  }, [courtTimeSlots])

  // 當選擇變更時通知父組件
  useEffect(() => {
    if (onSelectionChange) {
      const selectionData = {
        selectedTimeSlots,
        totalPrice: getTotalPrice(),
        details: selectedTimeSlots.map(({ courtId, timeSlotId }) => {
          const court = courts.find((c) => c.id === courtId)
          const timeSlot = timeSlots.find((t) => t.id === timeSlotId)
          const price = getPrice(courtId, timeSlotId)

          // 找到對應的 courtTimeSlot 來獲取 ID
          const courtTimeSlot = courtTimeSlots.find(
            (item) =>
              item.court?.id === courtId && item.timeSlot?.id === timeSlotId
          )

          return {
            courtId,
            timeSlotId,
            courtTimeSlotId: courtTimeSlot?.id, // 添加 courtTimeSlotId
            courtName: court?.name,
            timeRange: timeSlot?.label,
            price,
          }
        }),
      }
      onSelectionChange(selectionData)
    }
  }, [selectedTimeSlots, onSelectionChange, courtTimeSlots])

  // #region 事件處理函數
  // 切換選擇狀態（只允許選擇可預約的時段）
  const toggleTimeSlot = (courtId, timeSlotId) => {
    const slotInfo = getSlotInfo(courtId, timeSlotId)

    // 只有可預約的時段才能被選擇
    if (!slotInfo || !slotInfo.isAvailable) {
      return
    }

    setSelectedTimeSlots((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.courtId === courtId && item.timeSlotId === timeSlotId
      )

      if (existingIndex >= 0) {
        // 如果已選中，則移除
        return prev.filter((_, index) => index !== existingIndex)
      } else {
        // 檢查是否已達到最大選擇數量（4個時段）
        if (prev.length >= 4) {
          setShowLimitDialog(true)
          return prev
        }
        // 如果未選中，則添加
        return [...prev, { courtId, timeSlotId }]
      }
    })
  }

  // 檢查是否已選中
  const isSelected = (courtId, timeSlotId) => {
    return selectedTimeSlots.some(
      (item) => item.courtId === courtId && item.timeSlotId === timeSlotId
    )
  }

  // 獲取場地時間段的價格和預約狀態
  const getSlotInfo = (courtId, timeSlotId) => {
    const courtTimeSlot = courtTimeSlots.find(
      (item) => item.court?.id === courtId && item.timeSlot?.id === timeSlotId
    )
    return courtTimeSlot
      ? {
          price: courtTimeSlot.price,
          isAvailable: courtTimeSlot.isAvailable !== false, // 預設為可用，除非明確標示不可用
          status: courtTimeSlot.status || '可預約',
        }
      : null
  }

  // 獲取場地時間段的價格（保持向後兼容）
  const getPrice = (courtId, timeSlotId) => {
    const slotInfo = getSlotInfo(courtId, timeSlotId)
    return slotInfo ? slotInfo.price : null
  }

  // 計算總價格
  const getTotalPrice = () => {
    return selectedTimeSlots.reduce((total, { courtId, timeSlotId }) => {
      const price = Number(getPrice(courtId, timeSlotId))
      return total + (price || 0)
    }, 0)
  }

  // #region 頁面渲染
  return (
    <div className="relative flex flex-col bg-card border rounded-lg p-6 gap-4">
      {courts.length === 0 || timeSlots.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>請先選擇場館和運動項目</p>
        </div>
      ) : (
        <>
          {/* 選擇提示 */}
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>選擇您要預約的場地時間段</span>
            <span>已選擇: {selectedTimeSlots.length}/4 個時段</span>
          </div>

          <Table className="text-muted-foreground">
            {/* <TableCaption>選擇您要預約的場地時間段</TableCaption> */}

            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground w-[100px]">
                  時間
                </TableHead>
                {courts.map((court) => (
                  <TableHead
                    key={court.id}
                    className="text-muted-foreground text-center"
                  >
                    {court.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeSlots.map((timeSlot) => (
                <TableRow key={timeSlot.id}>
                  <TableCell className="font-medium w-[100px]">
                    {timeSlot.label}
                  </TableCell>
                  {courts.map((court) => {
                    const slotInfo = getSlotInfo(court.id, timeSlot.id)
                    const selected = isSelected(court.id, timeSlot.id)

                    return (
                      <TableCell key={court.id} className="text-center">
                        {slotInfo ? (
                          slotInfo.isAvailable ? (
                            // 可預約的時段
                            <Button
                              variant={selected ? 'default' : 'secondary'}
                              size="sm"
                              onClick={() =>
                                toggleTimeSlot(court.id, timeSlot.id)
                              }
                              className={cn(
                                'w-full',
                                'hover:bg-primary/20',
                                'dark:hover:bg-primary/50',
                                selected &&
                                  'bg-primary text-primary-foreground hover:bg-primary/90'
                              )}
                            >
                              <div className="flex gap-2">
                                <span className="text-xs">
                                  NT$ {slotInfo.price}
                                </span>
                                <span
                                  style={{ width: 20, display: 'inline-block' }}
                                >
                                  {selected ? (
                                    <FaCircleCheck className="text-chart-2" />
                                  ) : (
                                    <span className="text-chart-2">
                                      <FaRegCircleCheck />
                                    </span>
                                  )}
                                </span>
                              </div>
                            </Button>
                          ) : (
                            // 已被預約的時段
                            <div className="flex justify-center items-center gap-2 cursor-not-allowed w-full py-2 px-3 text-xs text-muted-foreground bg-muted rounded-md">
                              {/* <span>NT$ {slotInfo.price}</span> */}
                              <span className="text-destructive">
                                {slotInfo.status}
                              </span>
                              <span className="text-destructive text-base">
                                <FaCircleXmark />
                              </span>
                            </div>
                          )
                        ) : (
                          // 沒有資料的時段
                          <div className="flex justify-center items-center gap-2 cursor-not-allowed w-full py-2 px-3 text-xs bg-red-100 text-muted-foreground bg-muted rounded-md">
                            <span className="text-muted-foreground text-sm">
                              不可預約
                            </span>
                            <span className="text-muted-foreground text-sm">
                              <FaCircleMinus />
                            </span>
                          </div>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 狀態說明 */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground border-t pt-4">
            <div className="flex items-center gap-2">
              <FaRegCircleCheck className="text-green-700" />
              <span>可預約</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCircleCheck className="text-blue-500" />
              <span>已選擇</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCircleXmark className="text-red-500" />
              <span>已被預約</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCircleMinus className="text-muted-foreground" />
              <span>不可預約</span>
            </div>
          </div>
        </>
      )}

      {/* 超過限制警告對話框 */}
      <AlertDialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>選擇數量已達上限</AlertDialogTitle>
            <AlertDialogDescription>
              您最多只能選擇 4 個時段進行預約。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowLimitDialog(false)}>
              確認
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
