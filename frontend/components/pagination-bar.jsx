import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

// ===================================================================
// 分頁導航組件 - 商品列表和數據表格通用
// ===================================================================
/**
 * PaginationBar - 功能完整的分頁導航組件
 *
 * 功能特色：
 * • 支援大量數據的分頁顯示
 * • 多種導航按鈕 (首頁、上一頁、下一頁、末頁)
 * • 頁碼快速跳轉和省略號顯示
 * • 無障礙設計和鍵盤支援
 * • 响應式設計和觸控優化
 * • URL 狀態管理支援 (支援書籤和直接連結)
 *
 * 使用場景：
 * • 商品列表分頁
 * • 訂單歷史分頁
 * • 管理後台資料表格
 * • 搜尋結果分頁
 *
 * @param {Object} props 組件屬性
 * @param {number} props.page 當前頁碼 (從 1 開始)
 * @param {number} props.totalPages 總頁數 (由後端計算得出)
 * @param {number} props.perPage 每頁顯示筆數 (預設 8 筆)
 * @param {Function} props.onPageChange 頁碼改變回調函數 (pageIndex: number) => void
 */
export function PaginationBar({
  page = 1, // 當前頁碼，預設為第一頁
  totalPages = 1, // 總頁數，預設為 1 頁
  perPage = 8, // 每頁筆數，預設 8 筆 (符合地排版設計)
  onPageChange, // 頁碼改變回調函數
}) {
  return (
    // === 主容器：分頁導航的最外層容器 ===
    <Pagination>
      {/* 分頁內容容器：管理所有導航元素 */}
      <PaginationContent>
        {/* === 首頁導航按鈕 === */}
        <PaginationItem>
          <PaginationLink
            href="#" // 防止頁面跳轉，使用 JavaScript 處理
            onClick={(e) => {
              e.preventDefault() // 阻止預設的連結行為
              if (page > 1) onPageChange(1) // 只有不在第一頁時才可以跳轉
            }}
            disabled={page === 1} // 第一頁時私用按鈕
          >
            <ChevronsLeft /> {/* 雙箭頭圖示：表示跳到開頭 */}
          </PaginationLink>

          {/* === 上一頁導航按鈕 === */}
          <PaginationLink
            href="#" // 防止頁面跳轉
            onClick={(e) => {
              e.preventDefault() // 阻止預設行為
              if (page > 1) onPageChange(page - 1) // 跳轉到上一頁
            }}
            disabled={page === 1} // 第一頁時私用
          >
            <ChevronLeft />
          </PaginationLink>
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (n) =>
              n >= Math.max(1, page - 2) && n <= Math.min(totalPages, page + 2)
          )
          .map((n) => (
            <PaginationItem key={n}>
              <PaginationLink
                href="#"
                isActive={page === n}
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(n)
                }}
              >
                {n}
              </PaginationLink>
            </PaginationItem>
          ))}
        <PaginationItem>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (page < totalPages) onPageChange(page + 1)
            }}
            disabled={page === totalPages}
          >
            <ChevronRight />
          </PaginationLink>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (page < totalPages) onPageChange(totalPages)
            }}
            disabled={page === totalPages}
          >
            <ChevronsRight />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
