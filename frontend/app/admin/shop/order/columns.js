// react
import React from 'react'
// icons
import { IconTrash, IconEdit } from '@tabler/icons-react'
// ui components
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

export const orderColumns = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className="pl-2">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="pl-2">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  { accessorKey: 'id', header: '編號', sortable: true },
  {
    accessorKey: 'member_id',
    header: '會員ID',
    cell: ({ row, table }) => {
      const value = row.original.memberId ?? row.original.member_id ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'total',
    header: '訂單金額',
    cell: ({ row, table }) => {
      const value = row.original.total ? `${row.original.total}` : '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'recipient',
    header: '收件人',
    cell: ({ row, table }) => {
      const value = row.original.recipient ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'delivery_name',
    header: '物流方式',
    cell: ({ row, table }) => {
      const value = row.original.delivery_name || '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'payment_name',
    header: '付款方式',
    cell: ({ row, table }) => {
      const value = row.original.payment_name || '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'invoice_name',
    header: '發票類型',
    cell: ({ row, table }) => {
      const value = row.original.invoice_name || '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'invoice_number',
    header: '發票號碼',
    cell: ({ row, table }) => {
      const value =
        row.original.invoice_number ?? row.original.invoiceNumber ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'status_name',
    header: '訂單狀態',
    cell: ({ row, table }) => {
      const value = row.original.status_name || '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'created_at',
    header: '創建時間',
    cell: ({ row, table }) => {
      const value = row.original.createdAt ?? row.original.created_at ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'updated_at',
    header: '更新時間',
    cell: ({ row, table }) => {
      const value = row.original.updatedAt ?? row.original.updated_at ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row, table }) => (
      <div className="flex items-center gap-2">
        <Button
          variant="outlineBlue"
          size="sm"
          onClick={() => table.options.meta?.onEdit?.(row.original)}
        >
          <IconEdit />
        </Button>
        <Button
          variant="outlineRed"
          size="sm"
          onClick={() => table.options.meta?.onDelete?.(row.original)}
        >
          <IconTrash />
        </Button>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
]
