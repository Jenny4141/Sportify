// court-time-slot/columns.js
import { Button } from '@/components/ui/button'
import { IconTrash, IconEdit } from '@tabler/icons-react'
import { Checkbox } from '@/components/ui/checkbox'

export const courtTimeSlotColumns = [
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
    accessorKey: 'court',
    header: '球場',
    cell: ({ row, table }) => {
      const value = row.original.court?.name ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'timeSlot',
    header: '時段',
    cell: ({ row, table }) => {
      const start = row.original.startTime
      const end = row.original.endTime
      let value = '—'
      value = `${start} ~ ${end}`
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'price',
    header: '價格',
    cell: ({ row }) => row.original.price ?? '—',
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
