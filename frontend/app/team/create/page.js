'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import HeroBanner from '@/components/hero-banner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
// --- 修改開始 (1/5): 引入 Checkbox 和 Label ---
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
// --- 修改結束 (1/5) ---
import { ChevronLeftIcon, AlertCircle, PlusCircle, XCircle } from 'lucide-react'
import { teamService } from '@/api/team/team'
import {
  fetchTeamSportOptions,
  fetchTeamLevelOptions,
  fetchAllTeamCenterOptions,
} from '@/api/team/common'
import { toast } from 'sonner'

export default function CreateTeamPage() {
  const router = useRouter()

  const [teamName, setTeamName] = useState('')
  const [sportId, setSportId] = useState('')
  const [levelId, setLevelId] = useState('')
  const [centerId, setCenterId] = useState('')

  // --- 修改開始 (2/5): 更新 state 結構 ---
  // 將 dayOfWeek: '' 改為 selectedDays: []
  const [schedules, setSchedules] = useState([
    { selectedDays: [], startTime: '', endTime: '' },
  ])
  // --- 修改結束 (2/5) ---

  const [sports, setSports] = useState([])
  const [levels, setLevels] = useState([])
  const [centers, setCenters] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const loadInitialOptions = async () => {
      try {
        const [sportData, levelData, centerData] = await Promise.all([
          fetchTeamSportOptions(),
          fetchTeamLevelOptions(),
          fetchAllTeamCenterOptions(),
        ])

        setSports(sportData.rows || [])
        setLevels(levelData.rows || [])

        setCenters(centerData.rows.rows || [])
      } catch (err) {
        console.error('載入初始資料時發生錯誤:', err)
        setError(err.message || '載入選項失敗')
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialOptions()
  }, [])

  // --- 修改開始 (3/5): 更新時程管理函式 ---
  const handleScheduleChange = (index, field, value) => {
    const newSchedules = [...schedules]
    if (field === 'dayOfWeek') {
      const dayValue = value
      const currentDays = newSchedules[index].selectedDays
      if (currentDays.includes(dayValue)) {
        newSchedules[index].selectedDays = currentDays.filter(
          (d) => d !== dayValue
        )
      } else {
        newSchedules[index].selectedDays = [...currentDays, dayValue]
      }
    } else {
      newSchedules[index][field] = value
    }
    setSchedules(newSchedules)
  }

  const removeSchedule = (index) => {
    const newSchedules = schedules.filter((_, i) => i !== index)
    setSchedules(newSchedules)
  }
  // --- 修改結束 (3/5) ---

  // --- 修改開始 (4/5): 更新儲存邏輯 ---
  async function handleSave() {
    setFormError('')
    if (!teamName || !sportId || !levelId || !centerId) {
      setFormError('請完整填寫隊伍基本欄位')
      return
    }

    const finalSchedules = []
    for (const schedule of schedules) {
      if (
        schedule.selectedDays.length === 0 ||
        !schedule.startTime ||
        !schedule.endTime
      ) {
        setFormError('請完整填寫所有練習時段，並至少選擇一個星期')
        return
      }
      // 將使用者勾選的多個星期，拆分成多筆紀錄
      for (const day of schedule.selectedDays) {
        finalSchedules.push({
          dayOfWeek: Number(day),
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        })
      }
    }

    if (finalSchedules.length === 0) {
      setFormError('請至少設定一個完整的練習時段')
      return
    }

    const payload = {
      name: teamName,
      sportId: Number(sportId),
      levelId: Number(levelId),
      centerId: Number(centerId),
      schedules: finalSchedules,
    }

    setIsSubmitting(true)
    try {
      const response = await teamService.create(payload)
      if (response.success) {
        toast('您成功建立了您的隊伍!！', {
          style: {
            backgroundColor: '#ff671e', // 橘色背景
            color: '#fff', // 白色文字
            border: 'none',
            width: 'auto',
            minWidth: '250px',
          },
        })
        router.push(`/team`)
      } else {
        throw new Error(response.error || '建立隊伍失敗')
      }
    } catch (err) {
      setFormError(err.message || '發生未知錯誤，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }
  // --- 修改結束 (4/5) ---

  if (isLoading) return <p className="text-center p-8">{'載入中...'}</p>
  if (error)
    return (
      <p className="text-center p-8 text-red-600">{`載入錯誤：${error}`}</p>
    )

  const timeOptions = Array.from({ length: 18 }, (_, i) => {
    const hour = i + 7
    return `${String(hour).padStart(2, '0')}:00`
  })
  const endTimeOptions = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 8
    return `${String(hour).padStart(2, '0')}:00`
  })

  // --- 修改開始 (5/5): 建立星期選項 ---
  const dayOptions = [
    { value: '1', label: '一' },
    { value: '2', label: '二' },
    { value: '3', label: '三' },
    { value: '4', label: '四' },
    { value: '5', label: '五' },
    { value: '6', label: '六' },
    { value: '7', label: '日' },
  ]
  // --- 修改結束 (5/5) ---

  return (
    <>
      <Navbar />
      <BreadcrumbAuto />
      <HeroBanner
        backgroundImage="/banner/team-banner.jpg"
        title="  "
        overlayOpacity="bg-primary/10"
      />
      <section className="py-20">
        <div className="container mx-auto max-w-screen-xl">
          <div className="w-full max-w-3xl mx-auto p-8 bg-card rounded-lg shadow-lg">
            <h1 className=" text-2xl font-bold mb-8 text-center ">
              {'創立您的隊伍'}
            </h1>
            <div className="flex flex-col gap-6">
              {/* 基本資訊欄位... */}
              <div>
                <h2 className="text-sm font-semibold mb-2  ">{'隊伍名稱'}</h2>
                <Input
                  className="text-popover-foreground"
                  placeholder="請輸入隊伍名稱"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
              <div>
                <h2 className="text-sm font-semibold mb-2  ">{'運動類別'}</h2>
                <Select value={sportId} onValueChange={setSportId}>
                  <SelectTrigger className="text-popover-foreground">
                    <SelectValue placeholder="請選擇運動類別" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <h2 className="text-sm font-semibold mb-2  ">{'出沒場地'}</h2>
                <Select value={centerId} onValueChange={setCenterId}>
                  <SelectTrigger className="text-popover-foreground">
                    <SelectValue placeholder={'請選擇出沒場地'} />
                  </SelectTrigger>
                  <SelectContent>
                    {centers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <h2 className="text-sm font-semibold mb-2  ">{'階級程度'}</h2>
                <Select value={levelId} onValueChange={setLevelId}>
                  <SelectTrigger className="text-popover-foreground">
                    <SelectValue placeholder="請選擇階級程度" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((lv) => (
                      <SelectItem key={lv.id} value={String(lv.id)}>
                        {lv.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 團隊練習時段 */}
              <div>
                <h2 className="text-sm font-semibold mb-2">{'團隊練習時段'}</h2>
                <div className="space-y-4">
                  {schedules.map((schedule, index) => (
                    <div key={index} className="rounded-md space-y-3">
                      {/* 星期複選 */}
                      <div className="flex items-center gap-4 flex-wrap">
                        {dayOptions.map((day) => (
                          <div
                            key={day.value}
                            className="flex items-center space-x-2  "
                          >
                            <Checkbox
                              id={`day-${index}-${day.value}`}
                              checked={schedule.selectedDays.includes(
                                day.value
                              )}
                              onCheckedChange={() =>
                                handleScheduleChange(
                                  index,
                                  'dayOfWeek',
                                  day.value
                                )
                              }
                            />
                            <Label htmlFor={`day-${index}-${day.value}`}>
                              週{day.label}
                            </Label>
                          </div>
                        ))}
                      </div>

                      {/* 時間選擇 */}
                      <div className="flex items-center gap-2">
                        <Select
                          value={schedule.startTime}
                          onValueChange={(value) =>
                            handleScheduleChange(index, 'startTime', value)
                          }
                        >
                          <SelectTrigger className="text-card-foreground">
                            <SelectValue placeholder="開始時間" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-card-foreground">-</span>
                        <Select
                          value={schedule.endTime}
                          onValueChange={(value) =>
                            handleScheduleChange(index, 'endTime', value)
                          }
                        >
                          <SelectTrigger className="text-card-foreground">
                            <SelectValue placeholder="結束時間" />
                          </SelectTrigger>
                          <SelectContent>
                            {endTimeOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                            <SelectItem value="00:00">00:00</SelectItem>
                          </SelectContent>
                        </Select>
                        {schedules.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSchedule(index)}
                          >
                            <XCircle className="h-5 w-5 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {formError && (
              <div className="mt-6 p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>{formError}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-8">
              <Button variant="outline" asChild>
                <Link href="/team" aria-label="返回上一頁">
                  <ChevronLeftIcon className="h-4 w-4" />
                  <span>{'返回上一頁'}</span>
                </Link>
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting} size="lg">
                {isSubmitting ? '儲存中...' : '儲存'}
              </Button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
