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

/**
 * PaginationBar 元件
 * @param {number} page 當前頁碼
 * @param {number} totalPages 總頁數
 * @param {number} perPage 每頁筆數
 * @param {function} onPageChange 切換頁碼時觸發 (pageIndex: number)
 */
export function PaginationBar({
  page = 1,
  totalPages = 1,
  perPage = 8,
  onPageChange,
}) {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (page > 1) onPageChange(1)
            }}
            disabled={page === 1}
          >
            <ChevronsLeft />
          </PaginationLink>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (page > 1) onPageChange(page - 1)
            }}
            disabled={page === 1}
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
