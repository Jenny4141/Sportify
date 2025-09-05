import prisma from '../lib/prisma.js'
import moment from 'moment-timezone'
import { memberSchema } from '../utils/zod-schema.js'
import { z } from 'zod'

// *** 定義排序的類型 Order By
const orderByMapping = {
  id_asc: { id: 'asc' },
  id_desc: { id: 'desc' },
  birth_asc: { birth: 'asc' },
  birth_desc: { birth: 'desc' },
  phone_asc: { phone: 'asc' },
  phone_desc: { phone: 'desc' },
}

// 個人資料更新專用 schema（不包含 account, email, password）
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .nonempty({ message: '姓名為必填欄位' })
    .min(2, { message: '姓名至少 2 個字' }),
  phone: z
    .string()
    .regex(/^09\d{8}$/, { message: '手機號碼格式錯誤' })
    .optional()
    .or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
  birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: '生日格式須為 YYYY-MM-DD' })
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .min(3, { message: '地址至少 3 個字' })
    .optional()
    .or(z.literal('')),
  avatar: z.string().optional(), // 新增 avatar 欄位
})

// *** 取得列表資料
export const getListData = async ({ page = 1, keyword = '', orderby = '' }) => {
  const perPage = 20 // 每頁最多有幾筆
  const where = keyword
    ? {
        OR: [
          { name: { contains: keyword } },
          { email: { contains: keyword } },
          { account: { contains: keyword } },
          { phone: { contains: keyword } },
          // { gender: { contains: keyword } },
          // { birth: { contains: keyword } },
          { address: { contains: keyword } },
        ],
      }
    : {}

  const totalRows = await prisma.member.count({ where })
  if (totalRows === 0) {
    return {
      code: 200,
      success: true,
      page,
      perPage,
      totalRows: 0,
      totalPages: 0,
      rows: [],
    }
  }
  const totalPages = Math.ceil(totalRows / perPage)
  if (page > totalPages && totalPages > 0)
    return { code: 400, success: false, redirect: `?page=${totalPages}` }

  const rows = await prisma.member.findMany({
    skip: (page - 1) * perPage,
    take: perPage,
    where,
    orderBy:
      orderby in orderByMapping ? orderByMapping[orderby] : { id: 'desc' },
  })

  return {
    code: 200,
    success: true,
    page,
    perPage,
    totalRows,
    totalPages,
    rows: rows.map((r) => ({
      ...r,
      birth: r.birth
        ? moment(r.birth).tz('Asia/Taipei').format('YYYY-MM-DD')
        : null,
    })),
  }
}

// *** 取得單筆資料
export const getItemData = async (id) => {
  const record = await prisma.member.findUnique({
    where: { id: +id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      phone: true,
      gender: true,
      birth: true,
      address: true,
    },
  })

  const result = record
    ? {
        code: 200,
        success: true,
        record: {
          ...record,
          id: record.id.toString(), // 轉換 BigInt 為字串
          birth: record.birth
            ? moment(record.birth).tz('Asia/Taipei').format('YYYY-MM-DD')
            : null,
        },
      }
    : { code: 404, success: false, message: '沒有該筆資料', record: {} }

  // console.log('getItemData 回傳結果:', result)
  // console.log('=== getItemData 完成 ===')

  return result
}

// *** 新增資料
export const createMember = async (data) => {
  const output = { success: false, insertId: 0, issues: [] }

  // *** zod 使用 safeParse 驗證表單
  const result = memberSchema.safeParse(data)
  if (!result.success) {
    output.issues = result.error.issues
    return { code: 400, ...output }
  }

  const record = await prisma.member.create({ data: result.data })
  return { code: 200, success: true, insertId: record.id }
}

// *** 編輯資料
export const updateMember = async (id, data) => {
  const exists = await prisma.member.findUnique({ where: { id: +id } })
  if (!exists) return { code: 404, success: false, message: '找不到資料' }

  // 處理日期格式
  const updateData = { ...data }
  if (data.birth) {
    updateData.birth = new Date(data.birth)
  }

  // *** 表單驗證 - 使用個人資料更新 Schema
  const result = profileUpdateSchema.safeParse(updateData)
  if (!result.success)
    return { code: 400, success: false, issues: result.error.issues }

  await prisma.member.update({ where: { id: +id }, data: result.data })
  return { code: 200, success: true }
}

// *** 新增：個人資料更新專用函數
export const updateProfile = async (id, data) => {
  const exists = await prisma.member.findUnique({ where: { id: +id } })
  if (!exists) return { code: 404, success: false, message: '找不到資料' }

  // 處理日期格式
  const updateData = { ...data }
  if (data.birth) {
    updateData.birth = new Date(data.birth)
  }

  const updatedMember = await prisma.member.update({
    where: { id: +id },
    data: updateData,
  })

  return {
    code: 200,
    success: true,
    user: updatedMember,
  }
}

// *** 多選刪除資料
export const deleteMultipleMembers = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { code: 400, success: false, message: '未提供要刪除的項目' }
  }

  // 先查要刪除的資料內容
  const toBeDeleted = await prisma.member.findMany({
    where: { id: { in: ids.map((id) => +id) } },
    select: { id: true, name: true },
  })

  // 執行刪除
  const result = await prisma.member.deleteMany({
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
export const deleteMember = async (id) => {
  const exists = await prisma.member.findUnique({ where: { id: +id } })
  if (!exists) return { code: 404, success: false, message: '沒有該筆資料' }

  const deleted = await prisma.member.delete({ where: { id: +id } })

  return {
    code: 200,
    success: true,
    deletedId: deleted.id,
    deletedName: deleted.name, // 如果要給使用者看
  }
}
