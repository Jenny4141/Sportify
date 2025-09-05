'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import HeroBanner from '@/components/hero-banner'
import { Button } from '@/components/ui/button'
import { twMerge } from 'tailwind-merge'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ===== 【修改 1】引入我們建立的 teamService =====
import { teamService } from '@/api/team/team'

// --- 輔助元件 (維持不變) ---
const cn = (...inputs) => {
  return twMerge(clsx(inputs))
}
const Table = ({ className, ...props }) => (
  <div className="relative w-full overflow-x-auto rounded-lg shadow-lg border-1">
    <table
      className={cn(
        'w-full caption-bottom text-sm bg-card dark:bg-card-foreground',
        className
      )}
      {...props}
    />
  </div>
)
const TableHeader = ({ className, ...props }) => (
  <thead className={cn('[&_tr]:border-b', className)} {...props} />
)
const TableBody = ({ className, ...props }) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
)
const TableRow = ({ className, ...props }) => (
  <tr
    className={cn(
      'border-b border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700',
      className
    )}
    {...props}
  />
)
const TableHead = ({ className, ...props }) => (
  <th
    className={cn(
      'h-12 px-4 text-center align-middle text-lg text-gray-700 dark:text-ring bg-gray-50 dark:bg-gray-900 whitespace-nowrap',
      className
    )}
    {...props}
  />
)
const TableCell = ({ className, ...props }) => (
  <td
    className={cn(
      'p-4 align-middle text-gray-800 dark:text-gray-200 text-center',
      className
    )}
    {...props}
  />
)

// ===== 【修改 2】移除舊的 fetchAPI 和 API_BASE_URL =====
// const API_BASE_URL = ...
// async function fetchAPI(...) { ... }

// 分頁元件 (維持不變)
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null
  }
  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outline"
        size="icon"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-foreground font-semibold">
        第 {currentPage} 頁 / 共 {totalPages} 頁
      </span>
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="outline"
        size="icon"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function OurTeamPage() {
  const [teams, setTeams] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const loadMyTeams = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // ===== 【修改 3】使用 teamService.fetchMyTeams 來獲取「我的隊伍」列表 =====
        // 這會對應到後端的 /api/team/ourteam 路由
        const data = await teamService.fetchMyTeams({
          page: currentPage,
          limit: 12,
        })

        setTeams(data.teams || [])
        setTotalPages(data.totalPages || 1)
      } catch (err) {
        setError(err.message)
        console.error('載入我的隊伍列表失敗:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadMyTeams()
  }, [currentPage])

  return (
    <>
      <Navbar />
      <BreadcrumbAuto />
      <HeroBanner
        backgroundImage="/banner/team-banner.jpg"
        title=""
        overlayOpacity="bg-primary/10"
      ></HeroBanner>
      <div className="container mx-auto max-w-screen-xl px-4 gap-8">
        <div className="w-full min-h-[814px] max-w-[1140px] py-20 flex flex-col justify-start items-center gap-6">
          <h1 className="text-2xl font-bold text-center text-card-foreground">
            你隸屬的隊伍資訊
          </h1>
          <Table>
            <TableHeader className="bg-card">
              <TableRow>
                <TableHead className="w-[200px]">隊伍名稱</TableHead>
                <TableHead>隊伍成立時間</TableHead>
                <TableHead>隊伍人數</TableHead>
                <TableHead>運動種類</TableHead>
                <TableHead>練習場館</TableHead>
                <TableHead>隊伍專頁</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan="6"
                    className="h-24 text-center text-card-foreground"
                  >
                    資料載入中...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan="6"
                    className="h-24 text-center text-red-500"
                  >
                    載入失敗：{error}
                  </TableCell>
                </TableRow>
              ) : teams.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan="6"
                    className="h-24 text-center text-card-foreground"
                  >
                    您尚未加入任何隊伍。
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium text-card-foreground">
                      {team.name}
                    </TableCell>
                    <TableCell className="text-card-foreground">
                      {new Date(team.createdAt).toLocaleDateString('zh-TW')}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {team.memberCount}
                    </TableCell>
                    <TableCell className="text-card-foreground">
                      {team.court?.sport?.name || '未知'}
                    </TableCell>
                    <TableCell className="text-card-foreground">
                      {team.court?.center?.name || '未知'}
                    </TableCell>
                    <TableCell>
                      <Link href={`/team/ourteam/${team.id}`} passHref>
                        <Button variant="highlight">點擊</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />

          <div className="self-stretch inline-flex justify-between items-start">
            <Link href="/team" passHref>
              <Button variant="default" size="lg">
                返回上一頁
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
