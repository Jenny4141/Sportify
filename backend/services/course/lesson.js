import prisma from '../../lib/prisma.js'
import { lessonSchema } from '../../utils/zod-schema.js'
import moment from 'moment-timezone'

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
  perPage = 6,
  sportId,
  coachId,
}) => {
  // 確保 perPage 在合理範圍內，避免惡意請求
  const validPerPage = Math.min(Math.max(parseInt(perPage) || 10, 1), 100)
  const where = {
    ...(keyword
      ? {
          OR: [
            { title: { contains: keyword } },
            { court: { name: { contains: keyword } } },
            { sport: { name: { contains: keyword } } },
            { coach: { member: { name: { contains: keyword } } } },
          ],
        }
      : {}),
    ...(sportId ? { sportId: Number(sportId) } : {}),
    ...(coachId ? { coachId: Number(coachId) } : {}),
  }

  const totalRows = await prisma.lesson.count({ where })
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

  const rows = await prisma.lesson.findMany({
    skip: (page - 1) * validPerPage,
    take: validPerPage,
    where,
    orderBy:
      orderby in orderByMapping ? orderByMapping[orderby] : { id: 'desc' },
    include: {
      court: true,
      sport: true,
      coach: { include: { member: true } },
      images: true,
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
      court_name: r.court?.name || '',
      sport_name: r.sport?.name || '',
      coach_name: r.coach?.member?.name || '',
      images: r.images.map((img) => img.url),
    })),
  }
}

// *** 取得單筆資料
export const getItemData = async (id) => {
  const record = await prisma.lesson.findUnique({
    where: { id: +id },
    include: {
      court: true,
      sport: true,
      coach: { include: { member: true } },
      images: true,
    },
  })
  return record
    ? {
        code: 200,
        success: true,
        record: {
          ...record,
          court_name: record.court?.name || '',
          sport_name: record.sport?.name || '',
          coach_name: record.coach?.member?.name || '',
          startDate: moment(record.startDate).format('YYYY-MM-DD'),
          endDate: moment(record.endDate).format('YYYY-MM-DD'),
          images: record.images.map((img) => img.url),
        },
      }
    : { code: 404, success: false, message: '沒有該筆資料', record: {} }
}

// *** 新增資料
export const createLesson = async (data) => {
  const output = { success: false, insertId: 0, issues: [] }
  // console.log('收到的 data:', data)
  // *** zod 使用 safeParse 驗證表單
  const result = lessonSchema.safeParse(data)
  if (!result.success) {
    output.issues = result.error.issues
    return { code: 400, ...output }
  }

  const record = await prisma.lesson.create({ data: result.data })
  return { code: 200, success: true, insertId: record.id }
}

// *** 編輯資料
export const updateLesson = async (id, data) => {
  const exists = await prisma.lesson.findUnique({ where: { id: +id } })
  if (!exists) return { code: 404, success: false, message: '找不到資料' }

  // *** 表單驗證
  const result = lessonSchema.safeParse(data)
  if (!result.success)
    return { code: 400, success: false, issues: result.error.issues }

  await prisma.lesson.update({ where: { id: +id }, data: result.data })
  return { code: 200, success: true }
}

// *** 多選刪除資料
export const deleteMultipleLessons = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { code: 400, success: false, message: '未提供要刪除的項目' }
  }

  // 先查要刪除的資料內容
  const toBeDeleted = await prisma.lesson.findMany({
    where: { id: { in: ids.map((id) => +id) } },
    select: { id: true, name: true },
  })

  // 執行刪除
  const result = await prisma.lesson.deleteMany({
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
export const deleteLesson = async (id) => {
  const exists = await prisma.lesson.findUnique({ where: { id: +id } })
  if (!exists) return { code: 404, success: false, message: '沒有該筆資料' }

  const deleted = await prisma.lesson.delete({ where: { id: +id } })

  return {
    code: 200,
    success: true,
    deletedId: deleted.id,
    deletedName: deleted.name, // 如果要給使用者看
  }
}
