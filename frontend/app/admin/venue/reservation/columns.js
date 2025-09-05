// reservation/columns.js
import { Button } from '@/components/ui/button'
import { IconTrash, IconEdit } from '@tabler/icons-react'
import { Checkbox } from '@/components/ui/checkbox'

export const reservationColumns = [
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
    accessorKey: 'member',
    header: '會員',
    cell: ({ row, table }) => {
      const value =
        `${row.original.member.id}.${row.original.member.name}` ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'date',
    header: '日期',
    cell: ({ row, table }) => {
      const value = row.original.date
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'courtTimeSlots',
    header: '場地時段',
    cell: ({ row, table }) => {
      const slots = row.original.courtTimeSlots ?? []
      if (!slots.length) return '—'
      // 例如：中和 羽球 3 (07:00-08:00)、中和 羽球 3 (14:00-15:00)
      const value = slots
        .map((slot) => `${slot.courtName} (${slot.timeLabel})`)
        .join('、')
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'price',
    header: '價格',
    cell: ({ row, table }) => {
      const value = row.original.price ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'createdAt',
    header: '創建時間',
    cell: ({ row, table }) => {
      const value = row.original.createdAt ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'status',
    header: '狀態',
    cell: ({ row, table }) => {
      const value = row.original.status?.name ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'payment',
    header: '付款方式',
    cell: ({ row, table }) => {
      const value = row.original.payment?.name ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'invoice',
    header: '發票種類',
    cell: ({ row, table }) => {
      const value = row.original.invoice?.name ?? '—'
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
