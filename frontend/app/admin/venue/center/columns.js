// center/columns.js
import { Button } from '@/components/ui/button'
import { IconTrash, IconEdit } from '@tabler/icons-react'
import { Checkbox } from '@/components/ui/checkbox'

export const centerColumns = [
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
    accessorKey: 'name',
    header: '場館名稱',
    cell: ({ row, table }) => {
      const value = row.original.name
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'location',
    header: '地區',
    cell: ({ row, table }) => {
      const value = row.original.location?.name ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'sports',
    header: '運動項目',
    cell: ({ row, table }) => {
      const slots = row.original.sports ?? []
      if (!slots.length) return '—'
      const value = slots.map((slot) => slot.name).join('、')
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'averageRating',
    header: '評分',
    cell: ({ row, table }) => {
      const value =
        row.original.averageRating != null
          ? `${row.original.averageRating} 星`
          : '—'
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
