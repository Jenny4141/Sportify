// icons
import { IconTrash, IconEdit } from '@tabler/icons-react'
import { Checkbox } from '@/components/ui/checkbox'
// ui components
import { Button } from '@/components/ui/button'

export const productColumns = [
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
    header: '商品名稱',
    cell: ({ row, table }) => {
      const value = row.original.name
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'sport',
    header: '運動種類',
    cell: ({ row, table }) => {
      const value = row.original.sport_name ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'brand',
    header: '品牌',
    cell: ({ row, table }) => {
      const value = row.original.brand_name ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'price',
    header: '單價',
    cell: ({ row, table }) => {
      const value = row.original.price ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'stock',
    header: '庫存',
    cell: ({ row, table }) => {
      const value = row.original.stock ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'createdAt',
    header: '創建時間',
    cell: ({ row, table }) => {
      const value = row.original.created_at ?? '—'
      const highlightKeyword = table.options.meta?.highlightKeyword
      return highlightKeyword ? highlightKeyword(value) : value
    },
  },
  {
    accessorKey: 'updatedAt',
    header: '更新時間',
    cell: ({ row, table }) => {
      const value = row.original.updated_at ?? '—'
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
