'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  UserIcon,
  ChevronLeft,
  ChevronRight,
  XCircle,
  CheckCircle,
  Crown,
  Trash2,
  InfoIcon,
  Link,
  ChevronLeftIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import { teamService } from '@/api/team/team'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { jwtDecode } from 'jwt-decode'
import TeamLink from '@/components/card/team-link'
import { getAvatarUrl, getUserProfile } from '@/api/member/user'
import { toast } from 'sonner'
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

// 保持這個不受時區影響的日期格式化函式
const toYYYYMMDD = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const generateCalendarDays = (year, month) => {
  const days = []
  const date = new Date(year, month, 1)
  let startDay = new Date(date)
  startDay.setDate(
    startDay.getDate() - (startDay.getDay() === 0 ? 6 : startDay.getDay() - 1)
  )
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDay)
    currentDate.setDate(startDay.getDate() + i)
    days.push({
      date: currentDate,
      isCurrentMonth: currentDate.getMonth() === month,
    })
  }
  return days
}

const TeamDetailPage = () => {
  const params = useParams()
  const teamId = params.id

  // 1. 所有 State 宣告
  const [teamData, setTeamData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [joinRequests, setJoinRequests] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [displayDate, setDisplayDate] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState(new Set())
  const [currentMode, setCurrentMode] = useState('select')
  const [editingDate, setEditingDate] = useState(null)
  const [noteInput, setNoteInput] = useState('')
  const memberRefs = useRef(new Map())

  const [showDialog, setShowDialog] = useState(false)
  const [selectedTeamMember, setSelectedTeamMember] = useState(null)

  // 2. 統一定義的資料獲取函式
  const fetchTeamData = useCallback(
    async (isInitialLoad = false) => {
      if (!teamId) return

      if (isInitialLoad) setIsLoading(true)
      setError(null)
      try {
        const result = await teamService.fetchById(teamId)
        if (result.success && result.team) {
          setTeamData(result.team)
          setJoinRequests(result.team.joinRequests || [])
          const calendarMarks = new Set(
            result.team.calendarMarks.map((mark) => mark.date.split('T')[0])
          )
          setSelectedDates(calendarMarks)
        } else {
          setError(result.error || '無法載入隊伍資料')
        }
      } catch (err) {
        setError(err.message)
        console.error('載入隊伍詳細資料失敗:', err)
      } finally {
        if (isInitialLoad) setIsLoading(false)
      }
    },
    [teamId]
  )

  // 3. 簡潔的 useEffect，只負責初次載入
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('sportify-auth')
        if (token) {
          // 先從 JWT 獲取基本資訊
          const userData = jwtDecode(token)
          setCurrentUser(userData)

          // 再從後端獲取完整的用戶資訊（包括頭像）
          try {
            const profileData = await getUserProfile()
            if (profileData.success && profileData.user) {
              setCurrentUser(profileData.user)
            }
          } catch (profileError) {
            console.error('獲取用戶資料失敗:', profileError)
            // 如果獲取完整資料失敗，至少保留 JWT 中的基本資訊
          }
        }
      } catch (error) {
        console.error('從 localStorage 解碼 JWT 失敗:', error)
      }
    }

    loadUserData()
    fetchTeamData(true) // 呼叫獲取函式，並告知是「初次載入」
  }, [teamId, fetchTeamData])

  // 4. isCaptain 的判斷邏輯
  const captain = teamData?.TeamMember?.[0]?.member
  const isCaptain = currentUser?.id === captain?.id

  // 5. 所有 handle... 事件處理函式
  const handleKickMember = async (memberIdToKick) => {
    console.log('handleKickMember called with:', memberIdToKick)
    console.log('selectedTeamMember:', selectedTeamMember)

    if (!memberIdToKick) {
      toast.error('無法獲取成員 ID')
      return
    }

    try {
      await teamService.kickMember(teamId, memberIdToKick)
      toast.success('成員已成功踢除')
      await fetchTeamData() // 無刷新更新
    } catch (error) {
      console.error('踢除成員時發生錯誤:', error)
      toast.error(`踢除失敗：${error.response?.data?.error || error.message}`)
    }
  }

  const handleReviewRequest = async (requestId, status) => {
    try {
      await teamService.reviewRequest(requestId, { status })
      toast.success(`申請已成功 ${status === 'APPROVED' ? '批准' : '拒絕'}`)
      await fetchTeamData() // 無刷新更新
    } catch (error) {
      console.error('審核申請時發生錯誤:', error)
      toast.error(`審核失敗：${error.response?.data?.error || error.message}`)
    }
  }

  const handleSaveNote = async () => {
    if (!editingDate) return
    try {
      await teamService.saveCalendarMark({
        teamId,
        date: editingDate,
        note: noteInput,
      })
      toast.success(`已成功為 ${editingDate} 新增/更新記事！`)
      setEditingDate(null)
      setNoteInput('')
      await fetchTeamData() // 無刷新更新
    } catch (error) {
      console.error('儲存記事失敗:', error)
      toast.error(`儲存失敗：${error.response?.data?.error || error.message}`)
    }
  }

  const handleDeleteNote = async (markId) => {
    if (!window.confirm('您確定要刪除這則記事嗎？')) return
    try {
      await teamService.deleteCalendarMark(markId)
      toast.success('記事已成功刪除！')
      await fetchTeamData() // 無刷新更新
    } catch (error) {
      console.error('刪除記事失敗:', error)
      toast.error(`刪除失敗：${error.response?.data?.error || error.message}`)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    try {
      await teamService.addMessage({
        teamId: teamId,
        content: newMessage,
      })
      setNewMessage('')
      await fetchTeamData() // 無刷新更新
    } catch (error) {
      console.error('發送訊息失敗:', error)
      toast.error(`發送失敗：${error.response?.data?.error || error.message}`)
    }
  }

  const handleMonthChange = (offset) => {
    setDisplayDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + offset)
      return newDate
    })
    setEditingDate(null)
    setNoteInput('')
  }

  const handleDayClick = (day) => {
    if (!isCaptain || !day.isCurrentMonth) return
    const dateString = toYYYYMMDD(day.date)
    setEditingDate(dateString)
    const existingNote = eventsForCurrentMonth.find(
      (e) => toYYYYMMDD(e.dateObj) === dateString
    )
    setNoteInput(existingNote?.note || '')
  }

  const handleEditNote = (event) => {
    const dateString = toYYYYMMDD(new Date(event.date))
    setEditingDate(dateString)
    setNoteInput(event.note || '')
    document
      .getElementById('note-editor')
      ?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSelectMode = () => setCurrentMode('select')
  const handleClearMode = () => setCurrentMode('clear')
  const scrollToMember = (id) => {
    /* ... */
  }

  // 6. 輔助變數
  const currentYear = displayDate.getFullYear()
  const currentMonth = displayDate.getMonth()
  const calendarDays = generateCalendarDays(currentYear, currentMonth)

  const eventsForCurrentMonth =
    teamData?.calendarMarks
      ?.map((mark) => ({
        ...mark,
        dateObj: new Date(mark.date),
      }))
      .filter(
        (mark) =>
          mark.dateObj.getFullYear() === displayDate.getFullYear() &&
          mark.dateObj.getMonth() === displayDate.getMonth()
      )
      .sort((a, b) => a.dateObj - b.dateObj) || []

  // 7. 處理載入與錯誤的 Render 判斷
  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="text-center py-20 text-white">載入隊伍資料中...</div>
        <Footer />
      </>
    )
  }
  if (error) {
    return (
      <>
        <Navbar />
        <div className="text-center py-20 text-red-400">載入失敗：{error}</div>
        <Footer />
      </>
    )
  }

  // 這個判斷式是解決您目前問題的關鍵！
  // 它確保在 teamData 確定有值之後，才會執行下面的主要渲染邏輯
  if (!teamData) {
    return (
      <>
        <Navbar />
        <div className="text-center py-20 text-gray-400">找不到隊伍資料。</div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <BreadcrumbAuto teamName={teamData?.name} />
      <main className="px-4 md:px-6 py-10">
        <div className="flex flex-col container mx-auto max-w-screen-xl min-h-screen gap-6">
          <header className="py-8 text-center border-b border-gray-700">
            <h2 className="text-2xl sm:text-2xl font-bold text-foreground">
              {teamData.name}
            </h2>
          </header>

          <section className="bg-card border border-ring rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-center border-b pb-4 border-ring text-foreground">
              隊伍成員資訊
            </h2>
            <div className="flex flex-col gap-4 p-4 overflow-y-auto h-[300px]">
              {teamData.TeamMember?.map((teamMember, index) => (
                <div
                  key={teamMember.member.id} // 改用 teamMember.member.id
                  ref={(el) => memberRefs.current.set(teamMember.member.id, el)}
                  className="flex items-center gap-4 p-4 rounded-lg border border-ring bg-background"
                >
                  <img
                    src={
                      getAvatarUrl(teamMember.member.avatar) ||
                      'https://placehold.co/48x48/E0E0E0/333333?text=user'
                    }
                    alt={teamMember.member.name} // 改用 teamMember.member.name
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">
                        {teamMember.member.name}{' '}
                        {/* 改用 teamMember.member.name */}
                      </span>
                      {/* 隊長判斷邏輯也需要修正，直接使用 isCaptain 欄位 */}
                      {teamMember.isCaptain && (
                        <Badge className="bg-highlight text-highlight-foreground">
                          <Crown className="w-3 h-3" /> 隊長
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{teamMember.member.email}</p>{' '}
                    {/* 改用 teamMember.member.email */}
                    <p className="text-sm">{teamMember.member.phone}</p>{' '}
                    {/* 改用 teamMember.member.phone */}
                  </div>
                  {/* 踢除按鈕邏輯 */}
                  {isCaptain && currentUser?.id !== teamMember.member.id && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedTeamMember(teamMember.member) // 傳整個 member 物件而不是 id
                        setShowDialog(true)
                      }}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="w-5 h-5" />
                      踢除隊員
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* --- 【新增】整個申請審核區塊，只有隊長看得到 --- */}
          {isCaptain && ( // 只有隊長看得到這個區塊
            <section className="bg-card border border-ring rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-center border-b pb-4 border-ring text-foreground">
                待審核的加入申請
              </h2>
              {/* 判斷 joinRequests 是否為空 */}
              {joinRequests.length > 0 ? (
                <div className="overflow-y-auto h-[300px] border border-ring rounded-lg p-2">
                  <div className="flex flex-col gap-4">
                    {joinRequests.map(({ member, id: requestId }) => (
                      <div
                        key={requestId}
                        className="flex items-center gap-4 p-4 rounded-lg border border-ring bg-background"
                      >
                        <img
                          src={
                            member.avatar ||
                            'https://placehold.co/48x48/E0E0E0/333333?text=user'
                          }
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <span className="font-bold text-lg text-card-foreground">
                            {member.name}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-500 hover:bg-green-100"
                            onClick={() =>
                              handleReviewRequest(requestId, 'APPROVED')
                            }
                          >
                            <CheckCircle className="w-6 h-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-100"
                            onClick={() =>
                              handleReviewRequest(requestId, 'REJECTED')
                            }
                          >
                            <XCircle className="w-6 h-6" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // 如果 joinRequests 是空的，顯示提示訊息
                <div className="text-center text-gray-500 py-10">
                  目前沒有人申請加入隊伍
                </div>
              )}
            </section>
          )}

          <section className="bg-card border border-ring rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-center border-b pb-4 border-ring text-foreground">
              團 · 練 · 時 · 間
            </h2>
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => handleMonthChange(-1)}
                className="p-2 rounded-full hover:bg-gray-200"
                aria-label="上一個月"
              >
                <ChevronLeft className="w-6 h-6 text-foreground" />
              </button>
              <div className="text-2xl font-bold text-gray-900">
                {displayDate.toLocaleDateString('zh-TW', {
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <button
                onClick={() => handleMonthChange(1)}
                className="p-2 rounded-full hover:bg-gray-200"
                aria-label="下一個月"
              >
                <ChevronRight className="w-6 h-6 text-foreground" />
              </button>
            </div>
            {isCaptain && (
              <div className="flex justify-end gap-2 mb-4">
                <button
                  onClick={handleSelectMode}
                  className={`flex items-center gap-1 text-sm rounded-lg px-2 py-1 ${currentMode === 'select' ? 'bg-green-100 text-green-600' : 'text-foreground hover:bg-gray-200'}`}
                >
                  <CheckCircle className="w-4 h-4" /> 圈選
                </button>
                <button
                  onClick={handleClearMode}
                  className={`flex items-center gap-1 text-sm rounded-lg px-2 py-1 ${currentMode === 'clear' ? 'bg-red-100 text-red-500' : 'text-foreground hover:bg-gray-200'}`}
                >
                  <XCircle className="w-4 h-4" /> 清除
                </button>
              </div>
            )}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-foreground mb-2">
              <div>一</div>
              <div>二</div>
              <div>三</div>
              <div>四</div>
              <div>五</div>
              <div>六</div>
              <div>日</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dateString = toYYYYMMDD(day.date)
                const isSelected = selectedDates.has(dateString)
                const isToday = toYYYYMMDD(day.date) === toYYYYMMDD(new Date())
                const isEditing = dateString === editingDate
                return (
                  <div
                    key={index}
                    onClick={() => handleDayClick(day)}
                    className={`p-2 rounded-full transition-colors duration-200 text-center relative 
          ${day.isCurrentMonth ? 'text-foreground' : 'text-foreground/30'} 
          ${isSelected ? 'bg-red-500 text-white' : ''} 
          ${isEditing ? 'ring-2 ring-blue-500' : ''} 
          ${isToday && !isSelected ? 'border-2 border-blue-500' : ''}
          ${isCaptain && day.isCurrentMonth ? 'cursor-pointer hover:bg-blue-200' : ''}
        `}
                  >
                    {day.date.getDate()}
                  </div>
                )
              })}
            </div>
            {isCaptain && editingDate && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-muted-foreground mb-2">
                  為 {editingDate} 新增/編輯記事
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="輸入事件內容..."
                    className="flex-1 p-2 bg-input text-foreground border border-ring rounded-lg"
                  />
                  <Button onClick={handleSaveNote}>儲存記事</Button>
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-bold text-foreground mb-2">本月記事</h3>
              {eventsForCurrentMonth.length > 0 ? (
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {eventsForCurrentMonth.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-start gap-3 text-sm p-2 rounded-md hover:bg-muted/50"
                    >
                      <span className="font-semibold text-gray-800 bg-gray-200 px-2 py-1 rounded">
                        {event.dateObj.getDate()}日
                      </span>
                      <p className="flex-1 text-foreground pt-1">
                        {event.note}
                      </p>

                      {/* --- 【新增】只有隊長能看到的修改和刪除按鈕 --- */}
                      {isCaptain && (
                        <div className="flex gap-2 ml-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-ring hover:bg-chart-2 dark:hover:bg-chart-2"
                            onClick={() => handleEditNote(event)}
                          >
                            修改
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-ring hover:bg-destructive dark:hover:bg-destructive"
                            onClick={() => handleDeleteNote(event.id)}
                          >
                            刪除
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">本月尚無特殊記事。</p>
              )}
            </div>
          </section>

          <section className="bg-card border border-ring rounded-lg p-6 flex flex-col h-[450px]">
            <h2 className="text-xl font-bold mb-4 text-center border-b pb-4 border-ring  text-foreground">
              {teamData.name} 留言板
            </h2>
            <div className="flex justify-center -space-x-2 mb-4">
              {teamData.TeamMember?.map(({ member }) => (
                <img
                  key={member.id}
                  className="w-10 h-10 rounded-full border-2 border-white object-cover cursor-pointer hover:scale-110 transition-transform"
                  src={
                    getAvatarUrl(member.avatar) ||
                    'https://placehold.co/48x48/E0E0E0/333333?text=user'
                  }
                  alt={member.name}
                  onClick={() => scrollToMember(member.id)}
                />
              ))}
            </div>
            <div className="flex-1 overflow-y-auto h-[200px] border border-ring rounded-lg p-4 mb-4">
              <div className="flex flex-col gap-4">
                {teamData.messages?.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-4 ">
                    <img
                      src={
                        getAvatarUrl(msg.member.avatar) ||
                        'https://placehold.co/48x48/E0E0E0/333333?text=user'
                      }
                      alt={msg.member?.name} // <--- 使用 msg.member.name
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold text-card-foreground-50">
                        {msg.member?.name || '未知使用者'}
                      </p>
                      <p className="text-sm text-foreground">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto flex items-center gap-2">
              {currentUser && (
                <>
                  <img
                    src={
                      getAvatarUrl(currentUser.avatar) ||
                      'https://placehold.co/48x48/E0E0E0/333333?text=user'
                    }
                    className="w-10 h-10 rounded-full object-cover"
                    alt={currentUser.name || '目前用戶'}
                  />
                </>
              )}

              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="請輸入訊息內容"
                  className="flex-1 p-2 bg-input text-card-foreground rounded-lg"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage()
                  }}
                />
                <Button onClick={handleSendMessage}>發送</Button>
              </div>
            </div>
          </section>
        </div>
      </main>
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認踢除</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要將此成員踢出隊伍嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDialog(false)
                setSelectedTeamMember(null)
              }}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleKickMember(selectedTeamMember?.id)
                setShowDialog(false)
                setSelectedTeamMember(null)
              }}
            >
              確認
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Footer />
    </>
  )
}

export default TeamDetailPage
