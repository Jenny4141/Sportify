// components/data-table.jsx
'use client'

import React from 'react'

// ===== 依賴項匯入 =====
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import SearchForm from '@/components/search-form'

import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconPlus,
  IconLayoutColumns,
  IconTrash,
  IconArrowsSort,
  IconArrowBarUp,
  IconArrowBarDown,
} from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ===== 組件參數定義 =====
export function DataTable({
  data,
  columns,
  totalRows,
  totalPages,
  onPaginationChange,
  currentPage = 1,
  pageSize = 10,
  onAddNew,
  onBatch,
  onEdit,
  onDelete,
  onBulkDelete,
  onSearch,
  initialKeyword = '',
  onOrderBy,
  initialOrderBy = '',
}) {
  // ===== 狀態管理 =====
  const [pagination, setPagination] = React.useState({
    pageIndex: currentPage - 1, // 轉換為 0-based index
    pageSize: pageSize,
  })

  const [rowSelection, setRowSelection] = React.useState({})
  const [keyword, setKeyword] = React.useState(initialKeyword)
  const [orderBy, setOrderBy] = React.useState(initialOrderBy)
  const [columnVisibility, setColumnVisibility] = React.useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('columnVisibility')
        return stored ? JSON.parse(stored) : {}
      } catch {
        return {}
      }
    }
    return {}
  })

  // ===== 同步外部狀態變更 =====
  React.useEffect(() => {
    setPagination({
      pageIndex: currentPage - 1,
      pageSize: pageSize,
    })
  }, [currentPage, pageSize])

  React.useEffect(() => {
    try {
      localStorage.setItem('columnVisibility', JSON.stringify(columnVisibility))
    } catch {}
  }, [columnVisibility])

  // ===== 事件處理函數 =====
  // 頁數改變事件
  const handlePaginationChange = (updater) => {
    const newPagination =
      typeof updater === 'function' ? updater(pagination) : updater
    setPagination(newPagination)

    if (onPaginationChange) {
      onPaginationChange(newPagination)
    }
  }

  // 新增搜尋提交事件
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(keyword)
    }
  }

  // ===== 排序處理函數 =====
  const handleSort = (columnId) => {
    let newOrderBy = ''
    if (orderBy === `${columnId}_asc`) {
      newOrderBy = `${columnId}_desc`
    } else {
      newOrderBy = `${columnId}_asc`
    }
    setOrderBy(newOrderBy)
    if (onOrderBy) {
      onOrderBy(newOrderBy)
    }
  }

  // ===== 高亮關鍵字函式 =====
  function highlightKeyword(text) {
    if (!keyword || typeof text !== 'string') return text
    const regex = new RegExp(
      `(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi'
    )
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="text-red-600 font-bold">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  // ===== TanStack Table 配置 =====
  const table = useReactTable({
    data, // 表格的資料來源（陣列）
    columns, // 欄位定義（每個欄位的設定）

    state: {
      pagination, // 分頁狀態（目前頁碼、每頁筆數）
      rowSelection, // 列選取狀態（哪些 row 被選取）
      columnVisibility, // 欄位選項篩選狀態
    },

    onPaginationChange: handlePaginationChange, // 當分頁狀態改變時呼叫的函式
    onRowSelectionChange: setRowSelection, // 當選取列改變時呼叫的函式
    onColumnVisibilityChange: setColumnVisibility, // 當欄位選項篩選改變時呼叫的函式

    getCoreRowModel: getCoreRowModel(), // 產生最基礎的 row model（必要）
    getPaginationRowModel: getPaginationRowModel(), // 產生分頁後的 row model

    enableRowSelection: true, // 啟用列選取功能（可多選 row）

    getRowId: (row, index) => row.id || index, // 指定每一列的唯一 key（優先用 row.id，否則用 index）

    meta: {
      onEdit, // 傳遞編輯事件處理函式到 table meta
      onDelete, // 傳遞刪除事件處理函式到 table meta
      highlightKeyword, // 傳遞高亮關鍵字函式到 table meta
    },

    // 如果有 totalRows，啟用手動分頁，並指定總頁數
    ...(totalRows !== undefined && {
      pageCount: totalPages || Math.ceil(totalRows / pagination.pageSize), // 總頁數
      manualPagination: true, // 啟用手動分頁（由外部控制資料分頁）
    }),
  })

  return (
    <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
      {/* ===== 按鈕區域 ===== */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onAddNew}>
            <IconPlus />
            <span className="hidden lg:inline">新增</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const selectedRows = table.getSelectedRowModel().rows
              const selectedData = selectedRows.map((row) => row.original)
              onBulkDelete?.(selectedData)
              setRowSelection({})
            }}
            disabled={Object.keys(rowSelection).length === 0}
            className="h-8 text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
          >
            <IconTrash />
            <span className="hidden lg:inline">
              刪除 {Object.keys(rowSelection).length}
            </span>
          </Button>
        </div>

        <div className="flex items-center justify-end gap-2">
          {/* ===== 選項篩選框區域 ===== */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">顯示欄位</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    column.id !== 'select' &&
                    column.id !== 'actions' &&
                    column.columnDef.accessorKey // 只顯示有 accessorKey 的資料欄位
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* ===== 搜尋框區域 ===== */}
          <SearchForm
            className="self-center"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSubmit={handleSearchSubmit}
          />
        </div>
      </div>

      {/* ===== 表格主體區域 ===== */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="w-full">
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => {
                  const canSort = header.column.columnDef.sortable === true
                  const isSortedAsc = orderBy === `${header.id}_asc`
                  const isSortedDesc = orderBy === `${header.id}_desc`
                  return (
                    <TableHead
                      key={header.id}
                      onClick={
                        canSort ? () => handleSort(header.id) : undefined
                      }
                      className={canSort ? 'cursor-pointer select-none' : ''}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {canSort &&
                          (isSortedAsc ? (
                            <IconArrowBarUp size={16} />
                          ) : isSortedDesc ? (
                            <IconArrowBarDown size={16} />
                          ) : (
                            <IconArrowsSort size={16} />
                          ))}
                      </span>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {typeof cell.getValue() === 'string'
                        ? highlightKeyword(cell.getValue())
                        : flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ===== 分頁控制區域 ===== */}
      <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          此頁總共 {table.getFilteredRowModel().rows.length} 資料
        </div>

        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              一頁筆數
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-fit items-center justify-center text-sm font-medium">
            第 {table.getState().pagination.pageIndex + 1} 頁，共{' '}
            {table.getPageCount()} 頁
          </div>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>

            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>

            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>

            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
