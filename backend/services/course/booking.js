import prisma from '../../lib/prisma.js'
import { bookingSchema } from '../../utils/zod-schema.js'
import moment from 'moment-timezone'
import { createInvoiceNumber } from '../../utils/createInvoiceNumber.js'

// *** 定義排序的類型 Order By
const orderByMapping = {
  id_asc: { id: 'asc' },
  id_desc: { id: 'desc' },
  created_asc: { createdAt: 'asc' },
  created_desc: { createdAt: 'desc' },
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
}

// *** 取得列表資料
export const getListData = async ({
  page = 1,
  keyword = '',
  orderby = '',
  perPage = 6,
}) => {
  // 確保 perPage 在合理範圍內，避免惡意請求
  const validPerPage = Math.min(Math.max(parseInt(perPage) || 10, 1), 100)
  const where = keyword
    ? {
        OR: [
          { member: { name: { contains: keyword } } },
          { lesson: { title: { contains: keyword } } },
          { invoiceNumber: { contains: keyword } },
          { status: { name: { contains: keyword } } },
        ],
      }
    : {}

  const totalRows = await prisma.booking.count({ where })
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

  const rows = await prisma.booking.findMany({
    skip: (page - 1) * validPerPage,
    take: validPerPage,
    where,
    orderBy:
      orderby in orderByMapping ? orderByMapping[orderby] : { id: 'desc' },
    include: {
      member: { select: { id: true, name: true, email: true } },
      lesson: {
        select: {
          id: true,
          title: true,
          price: true,
          sport: { select: { name: true } },
          coach: {
            select: {
              member: { select: { name: true } },
            },
          },
        },
      },
      payment: { select: { id: true, name: true } },
      invoice: { select: { id: true, name: true } },
      status: { select: { id: true, name: true } },
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
      memberName: r.member?.name || '',
      lessonTitle: r.lesson?.title || '',
      sportName: r.lesson?.sport?.name || '',
      coachName: r.lesson?.coach?.member?.name || '',
      paymentName: r.payment?.name || '',
      invoiceName: r.invoice?.name || '',
      statusName: r.status?.name || '',
      createdAt: moment(r.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: moment(r.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
    })),
  }
}

// *** 取得單筆資料
export const getItemData = async (id) => {
  const record = await prisma.booking.findUnique({
    where: { id: +id },
    include: {
      member: { select: { id: true, name: true, email: true, phone: true } },
      lesson: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          startDate: true,
          endDate: true,
          sport: { select: { id: true, name: true } },
          coach: {
            select: {
              id: true,
              member: { select: { name: true, email: true } },
            },
          },
          court: { select: { id: true, name: true } },
        },
      },
      payment: { select: { id: true, name: true } },
      invoice: { select: { id: true, name: true } },
      status: { select: { id: true, name: true } },
    },
  })
  return record
    ? {
        code: 200,
        success: true,
        record: {
          ...record,
          memberName: record.member?.name || '',
          lessonTitle: record.lesson?.title || '',
          sportName: record.lesson?.sport?.name || '',
          coachName: record.lesson?.coach?.member?.name || '',
          paymentName: record.payment?.name || '',
          invoiceName: record.invoice?.name || '',
          statusName: record.status?.name || '',
          createdAt: moment(record.createdAt).format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: moment(record.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
        },
      }
    : { code: 404, success: false, message: '沒有該筆資料', record: {} }
}

// *** 新增資料
export const createBooking = async (data) => {
  const output = { success: false, insertId: 0, issues: [] }
  // console.log('收到的 data:', data)

  // *** zod 使用 safeParse 驗證表單
  const result = bookingSchema.safeParse(data)
  if (!result.success) {
    output.issues = result.error.issues
    return { code: 400, ...output }
  }

  // 生成發票號碼
  const invoiceNumber = await createInvoiceNumber()

  // 檢查課程是否存在且尚有名額
  const lesson = await prisma.lesson.findUnique({
    where: { id: result.data.lessonId },
  })

  if (!lesson) {
    return { code: 404, success: false, message: '找不到該課程' }
  }

  if (lesson.currentCount >= lesson.maxCapacity) {
    return { code: 400, success: false, message: '課程已額滿' }
  }

  // 檢查會員是否已報名此課程
  const existingBooking = await prisma.booking.findFirst({
    where: {
      memberId: result.data.memberId,
      lessonId: result.data.lessonId,
    },
  })

  if (existingBooking) {
    return { code: 400, success: false, message: '您已報名此課程' }
  }

  // 建立報名記錄並更新課程人數
  const record = await prisma.$transaction(async (tx) => {
    // 建立報名記錄，使用自動生成的發票號碼
    const booking = await tx.booking.create({
      data: {
        ...result.data,
        invoiceNumber: invoiceNumber, // 使用自動生成的發票號碼
      },
    })

    // 更新課程報名人數
    await tx.lesson.update({
      where: { id: result.data.lessonId },
      data: { currentCount: { increment: 1 } },
    })

    return booking
  })

  return { code: 200, success: true, insertId: record.id }
}

// *** 編輯資料
export const updateBooking = async (id, data) => {
  const exists = await prisma.booking.findUnique({ where: { id: +id } })
  if (!exists) return { code: 404, success: false, message: '找不到資料' }

  // *** 表單驗證
  const result = bookingSchema.safeParse(data)
  if (!result.success)
    return { code: 400, success: false, issues: result.error.issues }

  await prisma.booking.update({ where: { id: +id }, data: result.data })
  return { code: 200, success: true }
}

// *** 多選刪除資料
export const deleteMultipleBookings = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { code: 400, success: false, message: '未提供要刪除的項目' }
  }

  // 先查要刪除的資料內容，並取得相關課程ID用於更新人數
  const toBeDeleted = await prisma.booking.findMany({
    where: { id: { in: ids.map((id) => +id) } },
    select: {
      id: true,
      lessonId: true,
      member: { select: { name: true } },
      lesson: { select: { title: true } },
    },
  })

  if (toBeDeleted.length === 0) {
    return { code: 404, success: false, message: '找不到要刪除的資料' }
  }

  // 執行刪除並更新課程人數
  const result = await prisma.$transaction(async (tx) => {
    // 刪除報名記錄
    const deleteResult = await tx.booking.deleteMany({
      where: { id: { in: ids.map((id) => +id) } },
    })

    // 更新每個相關課程的報名人數
    const lessonUpdates = {}
    toBeDeleted.forEach((booking) => {
      lessonUpdates[booking.lessonId] =
        (lessonUpdates[booking.lessonId] || 0) + 1
    })

    for (const [lessonId, count] of Object.entries(lessonUpdates)) {
      await tx.lesson.update({
        where: { id: +lessonId },
        data: { currentCount: { decrement: count } },
      })
    }

    return deleteResult
  })

  return {
    code: 200,
    success: !!result.count,
    affectedRows: result.count,
    deleted: toBeDeleted,
  }
}

// *** 刪除資料
export const deleteBooking = async (id) => {
  const exists = await prisma.booking.findUnique({
    where: { id: +id },
    include: {
      member: { select: { name: true } },
      lesson: { select: { title: true } },
    },
  })
  if (!exists) return { code: 404, success: false, message: '沒有該筆資料' }

  // 刪除報名記錄並更新課程人數
  const deleted = await prisma.$transaction(async (tx) => {
    // 刪除報名記錄
    const booking = await tx.booking.delete({ where: { id: +id } })

    // 更新課程報名人數
    await tx.lesson.update({
      where: { id: exists.lessonId },
      data: { currentCount: { decrement: 1 } },
    })

    return booking
  })

  return {
    code: 200,
    success: true,
    deletedId: deleted.id,
    deletedInfo: `${exists.member?.name} 的 ${exists.lesson?.title} 課程報名`,
  }
}

// #region 取得某會員 Booking 資料
export const getDataOfMember = async (memberId) => {
  if (!memberId) {
    return { code: 400, success: false, message: '缺少會員編號' }
  }

  // 驗證 memberId 是否為有效數字
  try {
    BigInt(memberId)
  } catch (error) {
    return { code: 400, success: false, message: '無效的會員編號格式' }
  }
  const totalRows = await prisma.booking.count({
    where: { memberId: BigInt(memberId) },
  })
  const rows = await prisma.booking.findMany({
    where: { memberId: BigInt(memberId) },
    include: {
      member: { select: { id: true, name: true, email: true } },
      lesson: {
        select: {
          id: true,
          title: true,
          price: true,
          sport: { select: { name: true } },
          coach: {
            select: {
              member: { select: { name: true } },
            },
          },
        },
      },
      payment: { select: { id: true, name: true } },
      invoice: { select: { id: true, name: true } },
      status: { select: { id: true, name: true } },
    },
  })
  return {
    code: 200,
    success: true,
    totalRows,
    rows: rows.map((r) => ({
      ...r,
      memberName: r.member?.name || '',
      lessonTitle: r.lesson?.title || '',
      sportName: r.lesson?.sport?.name || '',
      coachName: r.lesson?.coach?.member?.name || '',
      paymentName: r.payment?.name || '',
      invoiceName: r.invoice?.name || '',
      statusName: r.status?.name || '',
      createdAt: moment(r.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: moment(r.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
    })),
  }
}
