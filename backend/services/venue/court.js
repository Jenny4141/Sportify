import prisma from '../../lib/prisma.js'
import { courtSchema } from '../../utils/zod-schema.js'

// *** 定義排序的類型 Order By
const orderByMapping = {
  id_asc: { id: 'asc' },
  id_desc: { id: 'desc' },
}

// *** 取得列表資料
export const getListData = async ({
  page = 1,
  keyword = '',
  orderby = '',
  perPage = 10,
}) => {
  // 確保 perPage 在合理範圍內，避免惡意請求
  const validPerPage = Math.min(Math.max(parseInt(perPage) || 10, 1), 100)
  const where = keyword
    ? {
        OR: [
          { name: { contains: keyword } },
          { center: { name: { contains: keyword } } },
          { sport: { name: { contains: keyword } } },
        ],
      }
    : {}

  const totalRows = await prisma.court.count({ where })
  if (totalRows === 0) {
    return {
      code: 200,
      success: true,
      page,
      perPage: validPerPage,
      totalRows: 0,
      totalPages: 0,
      rows: [],
    }
  }
  const totalPages = Math.ceil(totalRows / validPerPage)
  if (page > totalPages && totalPages > 0)
    return { code: 400, success: false, redirect: `?page=${totalPages}` }

  const rows = await prisma.court.findMany({
    skip: (page - 1) * validPerPage,
    take: validPerPage,
    where,
    orderBy:
      orderby in orderByMapping ? orderByMapping[orderby] : { id: 'desc' },
    include: {
      center: true,
      sport: true,
    },
  })

  return {
    code: 200,
    success: true,
    page,
    perPage: validPerPage,
    totalRows,
    totalPages,
    rows: rows.map((r) => ({
      ...r,
      center_name: r.center?.name || '',
      sport_name: r.sport?.name || '',
    })),
  }
}

// *** 取得單筆資料
export const getItemData = async (id) => {
  const record = await prisma.court.findUnique({ where: { id: +id } })
  return record
    ? { code: 200, success: true, record }
    : { code: 404, success: false, message: '沒有該筆資料', record: {} }
}

// *** 新增資料
export const createCourt = async (data) => {
  const output = { success: false, insertId: 0, issues: [] }
  // *** zod 使用 safeParse 驗證表單
  const result = courtSchema.safeParse(data)
  if (!result.success) {
    output.issues = result.error.issues
    return { code: 400, ...output }
  }

  const record = await prisma.court.create({ data: result.data })
  return { code: 200, success: true, insertId: record.id }
}

// *** 編輯資料
export const updateCourt = async (id, data) => {
  const exists = await prisma.court.findUnique({ where: { id: +id } })
  if (!exists) return { code: 404, success: false, message: '找不到資料' }

  // *** 表單驗證
  const result = courtSchema.safeParse(data)
  if (!result.success)
    return { code: 400, success: false, issues: result.error.issues }

  await prisma.court.update({ where: { id: +id }, data: result.data })
  return { code: 200, success: true }
}

// *** 多選刪除資料
export const deleteMultipleCourts = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { code: 400, success: false, message: '未提供要刪除的項目' }
  }

  // 先查要刪除的資料內容
  const toBeDeleted = await prisma.court.findMany({
    where: { id: { in: ids.map((id) => +id) } },
    select: { id: true, name: true },
  })

  // 執行刪除
  const result = await prisma.court.deleteMany({
    where: { id: { in: ids.map((id) => +id) } },
  })

  return {
    code: 200,
    success: !!result.count,
    affectedRows: result.count,
    deleted: toBeDeleted,
  }
}

// *** 刪除資料
export const deleteCourt = async (id) => {
  const exists = await prisma.court.findUnique({ where: { id: +id } })
  if (!exists) return { code: 404, success: false, message: '沒有該筆資料' }

  const deleted = await prisma.court.delete({ where: { id: +id } })

  return {
    code: 200,
    success: true,
    deletedId: deleted.id,
    deletedName: deleted.name, // 如果要給使用者看
  }
}
