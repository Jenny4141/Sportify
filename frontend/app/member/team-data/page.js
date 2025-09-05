'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import HeroBannerMember from '@/components/hero-banner-member'
import ScrollAreaMember from '@/components/scroll-area-member'
import { useAuth } from '@/contexts/auth-context'
import { PaginationBar } from '@/components/pagination-bar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { teamService } from '@/api/team/team'

// 將使用 useSearchParams 的邏輯抽取到單獨的組件
function TeamDataContent() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [allTeams, setAllTeams] = useState([])
  const [teamDetails, setTeamDetails] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  // 分頁相關狀態
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage, setPerPage] = useState(10) // 預設桌面版 10 筆

  // 路由和URL參數
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryParams = useMemo(() => {
    const entries = Object.fromEntries(searchParams.entries())
    return entries
  }, [searchParams])

  // 根據螢幕寬度設定每頁資料筆數
  useEffect(() => {
    const updatePerPage = () => {
      if (window.innerWidth < 768) {
        setPerPage(6) // 手機版 6 筆
      } else {
        setPerPage(10) // 桌面版 10 筆
      }
    }

    // 初始化設定
    updatePerPage()

    // 監聽視窗大小變化
    window.addEventListener('resize', updatePerPage)

    // 清理事件監聽器
    return () => {
      window.removeEventListener('resize', updatePerPage)
    }
  }, [])

  // 處理分頁
  const handlePagination = (targetPage) => {
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('page', String(targetPage))
    newParams.set('perPage', String(perPage))
    router.push(`?${newParams.toString()}`)
  }

  const loadMyTeams = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await teamService.fetchMyTeams({
        page: currentPage,
        limit: perPage,
      })

      // 後端回傳的資料結構是 { teams: [...], totalPages: number }
      const currentPageTeams = Array.isArray(data?.teams) ? data.teams : []

      // 保存當前頁的隊伍資料
      setTeams(currentPageTeams)

      // 使用後端回傳的分頁資訊
      const totalPagesCount = data?.totalPages || 1
      setTotalPages(totalPagesCount)

      // 如果後端有回傳總數，使用它；否則使用當前頁資料的長度
      const totalCount = data?.totalCount || currentPageTeams.length
      setAllTeams(currentPageTeams) // 簡化處理，只顯示當前頁資料
    } catch (err) {
      console.error('獲取隊伍列表錯誤:', err)
      if (err.response?.status === 401) {
        setError('請先登入')
      } else if (err.response?.status === 404) {
        setError('找不到隊伍列表')
      } else if (err.code === 'NETWORK_ERROR') {
        setError('網路連線錯誤，請檢查網路連線')
      } else {
        setError('獲取隊伍列表時發生錯誤')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 當 user 改變時重新獲取隊伍資料
  useEffect(() => {
    if (user) {
      loadMyTeams()
    }
  }, [user])

  // 當 URL 參數改變時更新當前頁面
  useEffect(() => {
    const page = parseInt(queryParams.page) || 1
    setCurrentPage(page)
  }, [queryParams.page])

  // 當分頁參數改變時重新載入資料
  useEffect(() => {
    if (user && currentPage > 0) {
      loadMyTeams()
    }
  }, [currentPage, perPage])

  return (
    <>
      <Navbar />
      <BreadcrumbAuto />
      <HeroBannerMember
        backgroundImage="/banner/member-banner.jpg"
        title="會員中心"
      ></HeroBannerMember>
      <ScrollAreaMember />
      <section className="py-10">
        <div className="container flex justify-center mx-auto max-w-screen-xl px-4">
          <div
            className="bg-card rounded-xl border bg-card py-6
          text-card-foreground shadow-sm rounded-lg p-6 w-full"
          >
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-accent-foreground">
                    揪團紀錄
                  </h2>
                  <p className="text-muted-foreground mt-2">管理您加入的隊伍</p>
                  {!isLoading && !error && (
                    <p className="text-sm text-muted-foreground mt-1">
                      第 {currentPage} 頁，共 {totalPages} 頁
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={loadMyTeams}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  )}
                  重新整理
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-lg text-muted-foreground">
                  載入隊伍列表中...
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center py-12">
                <div className="text-red-500 text-lg mb-4">{error}</div>
                <Button
                  variant="outline"
                  onClick={loadMyTeams}
                  className="flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  重試
                </Button>
              </div>
            ) : teams.length === 0 && currentPage === 1 ? (
              <div className="flex flex-col justify-center items-center py-12">
                <div className="text-muted-foreground text-lg mb-4">
                  您還沒有加入任何隊伍
                </div>
                <div className="text-muted-foreground text-sm mb-6">
                  去發現更多精彩隊伍吧！
                </div>
                <Button
                  variant="default"
                  onClick={() => window.open('/team', '_blank')}
                  className="flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  找隊伍
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader className="border-b-2 border-card-foreground">
                      <TableRow className="text-lg">
                        <TableHead className="font-bold w-1/5 text-accent-foreground">
                          隊伍名稱
                        </TableHead>
                        <TableHead className="font-bold w-1/5 text-accent-foreground text-center">
                          隊伍人數
                        </TableHead>
                        <TableHead className="font-bold w-1/5 text-accent-foreground text-center">
                          運動種類
                        </TableHead>
                        <TableHead className="font-bold w-1/5 text-accent-foreground text-center">
                          練習場館
                        </TableHead>
                        <TableHead className="font-bold w-1/5 text-accent-foreground text-center">
                          隊伍專頁
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-foreground">
                      {teams.map((team, index) => {
                        return (
                          <TableRow
                            key={team.id || index}
                            className="border-b border-card-foreground hover:bg-muted/50"
                          >
                            <TableCell className="font-medium text-base py-4 text-accent-foreground">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="font-base line-clamp-2 leading-tight">
                                    {team?.name || '隊伍名稱'}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-mono">
                              {team.memberCount || 0}
                            </TableCell>
                            <TableCell className="text-center text-card-foreground">
                              {team.court?.sport?.name || '未知'}
                            </TableCell>
                            <TableCell className="text-center text-card-foreground">
                              {team.court?.center?.name || '未知'}
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              <div className="flex flex-col md:flex-row justify-center gap-2">
                                <Link
                                  href={`/team/ourteam/${team.id}`}
                                  passHref
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full md:w-[80px] hover:bg-primary/90 hover:text-white"
                                  >
                                    查看
                                  </Button>
                                </Link>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 分頁組件 - 移到卡片外面 */}
        {!isLoading && !error && teams.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <PaginationBar
              page={currentPage}
              totalPages={totalPages}
              perPage={perPage}
              onPageChange={(targetPage) => {
                handlePagination(targetPage)
              }}
            />
          </div>
        )}
      </section>
      <Footer />
    </>
  )
}

// 主要導出組件，包含 Suspense 邊界
export default function TeamDataPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">載入隊伍資料中...</p>
          </div>
        </div>
      }
    >
      <TeamDataContent />
    </Suspense>
  )
}
