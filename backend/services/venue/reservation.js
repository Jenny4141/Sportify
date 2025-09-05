import prisma from '../../lib/prisma.js'
import moment from 'moment-timezone'
import { reservationSchema } from '../../utils/zod-schema.js'
import { createInvoiceNumber } from '../../utils/createInvoiceNumber.js'

// *** 定義排序的類型 Order By
const orderByMapping = {
  id_asc: { id: 'asc' },
  id_desc: { id: 'desc' },
}

// #region 取得 Reservation 列表資料
export const getListData = async ({
  page = 1,
  keyword = '',
  orderby = '',
  perPage = 10,
  memberId = null,
  date = null,
  locationId = null,
  centerId = null,
  sportId = null,
  timePeriodId = null,
}) => {
  const validPerPage = Math.min(Math.max(parseInt(perPage) || 10, 1), 100)

  const where = {}

  // 關鍵字搜尋
  if (keyword) {
    where.OR = [
      { member: { name: { contains: keyword } } },
      {
        courtTimeSlots: {
          some: {
            courtTimeSlot: {
              court: { name: { contains: keyword } },
            },
          },
        },
      },
      {
        courtTimeSlots: {
          some: {
            courtTimeSlot: {
              timeSlot: { label: { contains: keyword } },
            },
          },
        },
      },
      { status: { name: { contains: keyword } } },
    ]
  }

  // 會員篩選
  if (memberId) {
    where.memberId = BigInt(memberId)
  }

  // 日期篩選
  if (date) {
    where.date = new Date(date)
  }

  // 建立 courtTimeSlots 篩選條件
  const courtTimeSlotWhere = {}

  // 建立嵌套的 court 條件
  let courtWhere = {}

  // 地區篩選 (透過 courtTimeSlot -> court -> center -> location)
  if (locationId) {
    courtWhere.center = { locationId: +locationId }
  }

  // 場館篩選 (透過 courtTimeSlot -> court -> center)
  if (centerId) {
    courtWhere.centerId = +centerId
  }

  // 運動項目篩選 (透過 courtTimeSlot -> court -> sport)
  if (sportId) {
    courtWhere.sportId = +sportId
  }

  // 如果有 court 相關篩選條件，加入到 courtTimeSlotWhere
  if (Object.keys(courtWhere).length > 0) {
    courtTimeSlotWhere.courtTimeSlot = { court: courtWhere }
  }

  // 時段類型篩選 (透過 courtTimeSlot -> timeSlot -> timePeriod)
  if (timePeriodId) {
    if (courtTimeSlotWhere.courtTimeSlot) {
      courtTimeSlotWhere.courtTimeSlot.timeSlot = {
        timePeriodId: +timePeriodId,
      }
    } else {
      courtTimeSlotWhere.courtTimeSlot = {
        timeSlot: { timePeriodId: +timePeriodId },
      }
    }
  }

  // 如果有 courtTimeSlot 相關篩選條件，加入 where
  if (Object.keys(courtTimeSlotWhere).length > 0) {
    where.courtTimeSlots = { some: courtTimeSlotWhere }
  }

  const totalRows = await prisma.reservation.count({ where })
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

  const rows = await prisma.reservation.findMany({
    skip: (page - 1) * validPerPage,
    take: validPerPage,
    where,
    orderBy:
      orderby in orderByMapping ? orderByMapping[orderby] : { id: 'desc' },
    include: {
      member: true,
      status: true,
      payment: true,
      invoice: true,
      courtTimeSlots: {
        include: {
          courtTimeSlot: {
            include: {
              court: {
                include: {
                  center: {
                    include: {
                      location: true,
                    },
                  },
                  sport: true,
                },
              },
              timeSlot: {
                include: {
                  timePeriod: true,
                },
              },
            },
          },
        },
      },
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
      memberName: r.member.name || '',
      courtTimeSlots: r.courtTimeSlots.map((rcs) => ({
        courtName: rcs.courtTimeSlot?.court?.name || '',
        timeLabel: rcs.courtTimeSlot?.timeSlot?.label || '',
        date: moment(rcs.date).format('YYYY-MM-DD'),
        // 新增便於前端使用的資料
        centerName: rcs.courtTimeSlot?.court?.center?.name || '',
        locationName: rcs.courtTimeSlot?.court?.center?.location?.name || '',
        sportName: rcs.courtTimeSlot?.court?.sport?.name || '',
        timePeriodName: rcs.courtTimeSlot?.timeSlot?.timePeriod?.name || '',
        centerId: rcs.courtTimeSlot?.court?.centerId || null,
        sportId: rcs.courtTimeSlot?.court?.sportId || null,
        locationId: rcs.courtTimeSlot?.court?.center?.locationId || null,
        timePeriodId: rcs.courtTimeSlot?.timeSlot?.timePeriodId || null,
      })),
      date: moment(r.date).format('YYYY-MM-DD'),
      createdAt: moment(r.createdAt)
        .tz('Asia/Taipei')
        .format('YYYY-MM-DD HH:mm:ss'),
    })),
  }
}

// #region 取得單筆 Reservation 資料
export const getItemData = async (id) => {
  const record = await prisma.reservation.findUnique({
    where: { id: BigInt(id) },
    include: {
      member: true,
      status: true,
      payment: true,
      invoice: true,
      courtTimeSlots: {
        include: {
          courtTimeSlot: {
            include: {
              court: {
                include: {
                  sport: true,
                },
              },
              timeSlot: true,
            },
          },
        },
      },
    },
  })
  return record
    ? {
        code: 200,
        success: true,
        record: {
          ...record,
          memberName: record.member.name || '',
          courtTimeSlots: record.courtTimeSlots.map((rcs) => ({
            courtName: rcs.courtTimeSlot?.court?.name || '',
            sportName: rcs.courtTimeSlot?.court?.sport?.name || '',
            centerId: rcs.courtTimeSlot?.court?.centerId ?? null,
            sportId: rcs.courtTimeSlot?.court?.sportId ?? null,
            timeLabel: rcs.courtTimeSlot?.timeSlot?.label || '',
            courtId: rcs.courtTimeSlot?.court?.id || '',
            timeSlotId: rcs.courtTimeSlot?.timeSlot?.id || '',

            date: moment(rcs.date).format('YYYY-MM-DD'),
            price: rcs.courtTimeSlot?.price
              ? Number(rcs.courtTimeSlot.price)
              : null,
          })),
          date: moment(record.date).format('YYYY-MM-DD'),
          createdAt: moment(record.createdAt)
            .tz('Asia/Taipei')
            .format('YYYY-MM-DD HH:mm:ss'),
        },
      }
    : { code: 404, success: false, message: '沒有該筆資料', record: {} }
}
// #region 取得某會員 Reservation 資料
export const getDataOfMember = async (memberId) => {
  if (!memberId) {
    return { code: 400, error: '缺少會員編號' }
  }
  const totalRows = await prisma.reservation.count({
    where: { memberId: BigInt(memberId) },
  })
  const rows = await prisma.reservation.findMany({
    where: { memberId: BigInt(memberId) },
    include: {
      member: true,
      status: true,
      payment: true,
      invoice: true,
      courtTimeSlots: {
        include: {
          courtTimeSlot: {
            include: {
              court: {
                include: {
                  sport: true,
                },
              },
              timeSlot: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return {
    code: 200,
    success: true,
    totalRows,
    rows: rows.map((r) => ({
      ...r,
      memberName: r.member.name || '',
      courtTimeSlots: r.courtTimeSlots.map((rcs) => ({
        courtName: rcs.courtTimeSlot?.court?.name || '',
        courtId: rcs.courtTimeSlot?.court?.id || '',
        timeLabel: rcs.courtTimeSlot?.timeSlot?.label || '',
        timeSlotId: rcs.courtTimeSlot?.timeSlot?.id || '',
        date: moment(rcs.date).format('YYYY-MM-DD'),
        price: rcs.courtTimeSlot?.price
          ? Number(rcs.courtTimeSlot.price)
          : null,
      })),
      date: moment(r.date).format('YYYY-MM-DD'),
      createdAt: moment(r.createdAt)
        .tz('Asia/Taipei')
        .format('YYYY-MM-DD HH:mm:ss'),
    })),
  }
}

// #region 新增 Reservation 資料
export const createReservation = async (data) => {
  const output = { success: false, insertId: 0, issues: [] }
  // zod 驗證
  const result = reservationSchema.safeParse(data)
  if (!result.success) {
    output.issues = result.error.issues
    return { code: 400, ...output }
  }
  const {
    memberId,
    courtTimeSlotId,
    date,
    statusId,
    paymentId,
    invoiceId,
    tax,
    carrier,
  } = result.data

  // 去重並轉為數字
  const slotIds = Array.isArray(courtTimeSlotId)
    ? [...new Set(courtTimeSlotId.map((id) => Number(id)))]
    : []

  if (slotIds.length === 0) {
    return { code: 400, success: false, message: '請至少選擇一個時段' }
  }

  // 標準化日期（去除時分秒）
  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  try {
    // 1) 檢查是否有衝突（同一 courtTimeSlot + 同一天已被預約）
    const conflicts = await prisma.reservationCourtTimeSlot.findMany({
      where: {
        courtTimeSlotId: { in: slotIds },
        date: dateOnly,
      },
      select: { courtTimeSlotId: true },
    })

    if (conflicts.length > 0) {
      const conflictIds = [...new Set(conflicts.map((c) => c.courtTimeSlotId))]
      return {
        code: 409,
        success: false,
        message: '部分時段已被預約，請重新選擇時段',
        conflictIds,
      }
    }

    // 2) 查詢所有 courtTimeSlot 的 price
    const slots = await prisma.courtTimeSlot.findMany({
      where: { id: { in: slotIds } },
      select: { price: true, id: true },
    })
    const totalPrice = slots.reduce((sum, slot) => sum + Number(slot.price), 0)

    // 產生唯一發票號碼
    const invoiceNumber = await createInvoiceNumber()

    // 3) 使用 transaction 建立預約
    const reservation = await prisma.$transaction(async (tx) => {
      // 建立 Reservation 主資料
      const reservation = await tx.reservation.create({
        data: {
          member: { connect: { id: BigInt(memberId) } },
          payment: { connect: { id: paymentId } },
          invoice: { connect: { id: invoiceId } },
          status: { connect: { id: statusId } },
          date: dateOnly,
          price: totalPrice,
          invoiceNumber,
          tax: tax ?? null,
          carrier: carrier ?? null,
        },
      })

      // 建立多筆 ReservationCourtTimeSlot 關聯
      await tx.reservationCourtTimeSlot.createMany({
        data: slotIds.map((slotId) => ({
          reservationId: reservation.id,
          courtTimeSlotId: slotId,
          date: dateOnly,
        })),
      })

      return reservation
    })

    return { code: 200, success: true, insertId: reservation.id }
  } catch (err) {
    console.error('新增預約錯誤:', err)
    if (err.code === 'P2002') {
      return {
        code: 409,
        success: false,
        message: '部分時段已被其他使用者先預約，請重新選擇時段',
      }
    }
    return { code: 500, success: false, message: '伺服器發生錯誤，請稍後再試' }
  }
}

// #region 編輯 Reservation 資料
export const updateReservation = async (id, data) => {
  const output = { success: false, issues: [] }

  // 檢查資料是否存在
  const exists = await prisma.reservation.findUnique({
    where: { id: BigInt(id) },
  })
  if (!exists) return { code: 404, success: false, message: '找不到資料' }

  // zod 驗證
  const result = reservationSchema.safeParse(data)
  if (!result.success) {
    output.issues = result.error.issues
    return { code: 400, ...output }
  }

  const {
    memberId,
    courtTimeSlotId,
    date,
    statusId,
    paymentId,
    invoiceId,
    tax,
    carrier,
  } = result.data

  try {
    // 查詢所有 courtTimeSlot 的 price 重新計算總價
    const slots = await prisma.courtTimeSlot.findMany({
      where: { id: { in: courtTimeSlotId } },
      select: { price: true, id: true },
    })
    const totalPrice = slots.reduce((sum, slot) => sum + Number(slot.price), 0)

    // 使用 transaction 確保資料一致性
    await prisma.$transaction(async (tx) => {
      // 1. 先刪除原有的 ReservationCourtTimeSlot 關聯
      await tx.reservationCourtTimeSlot.deleteMany({
        where: { reservationId: BigInt(id) },
      })

      // 2. 更新 Reservation 主資料
      await tx.reservation.update({
        where: { id: BigInt(id) },
        data: {
          member: { connect: { id: BigInt(memberId) } },
          payment: { connect: { id: paymentId } },
          invoice: { connect: { id: invoiceId } },
          status: { connect: { id: statusId } },
          date: new Date(date),
          price: totalPrice,
          tax: tax ?? null,
          carrier: carrier ?? null,
        },
      })

      // 3. 建立新的 ReservationCourtTimeSlot 關聯
      await tx.reservationCourtTimeSlot.createMany({
        data: courtTimeSlotId.map((slotId) => ({
          reservationId: BigInt(id),
          courtTimeSlotId: slotId,
          date: new Date(date),
        })),
      })
    })

    return { code: 200, success: true }
  } catch (err) {
    console.error('編輯預約錯誤:', err)
    if (err.code === 'P2002') {
      return {
        code: 409,
        success: false,
        message: '該時段已被預約，請選擇其他時段',
      }
    }
    return { code: 500, success: false, message: '伺服器發生錯誤，請稍後再試' }
  }
}

// #region 多選刪除 Reservation 資料
export const deleteMultipleReservations = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { code: 400, success: false, message: '未提供要刪除的項目' }
  }

  try {
    // 先查要刪除的資料內容
    const toBeDeleted = await prisma.reservation.findMany({
      where: { id: { in: ids.map((id) => BigInt(id)) } },
      select: {
        id: true,
        date: true,
        courtTimeSlots: {
          select: {
            courtTimeSlot: {
              select: {
                court: { select: { name: true } },
                timeSlot: { select: { label: true } },
              },
            },
          },
        },
      },
    })

    // 使用 transaction 確保資料一致性
    const result = await prisma.$transaction(async (tx) => {
      // 1. 先刪除所有相關的 ReservationCourtTimeSlot 關聯
      await tx.reservationCourtTimeSlot.deleteMany({
        where: { reservationId: { in: ids.map((id) => BigInt(id)) } },
      })

      // 2. 刪除 Reservation 主資料
      const deleteResult = await tx.reservation.deleteMany({
        where: { id: { in: ids.map((id) => BigInt(id)) } },
      })

      return deleteResult
    })

    return {
      code: 200,
      success: !!result.count,
      affectedRows: result.count,
      deleted: toBeDeleted.map((r) => ({
        id: r.id,
        date: moment(r.date).format('YYYY-MM-DD'),
        courtTimeSlots: r.courtTimeSlots.map((rcs) => ({
          courtName: rcs.courtTimeSlot?.court?.name || '',
          timeLabel: rcs.courtTimeSlot?.timeSlot?.label || '',
        })),
      })),
    }
  } catch (err) {
    console.error('多選刪除預約錯誤:', err)
    return { code: 500, success: false, message: '伺服器發生錯誤，請稍後再試' }
  }
}

// #region 刪除 Reservation 資料
export const deleteReservation = async (id) => {
  try {
    // 先查詢要刪除的資料內容
    const exists = await prisma.reservation.findUnique({
      where: { id: BigInt(id) },
      include: {
        courtTimeSlots: {
          include: {
            courtTimeSlot: {
              include: {
                court: { select: { name: true } },
                timeSlot: { select: { label: true } },
              },
            },
          },
        },
      },
    })

    if (!exists) return { code: 404, success: false, message: '沒有該筆資料' }

    // 使用 transaction 確保資料一致性
    await prisma.$transaction(async (tx) => {
      // 1. 先刪除 ReservationCourtTimeSlot 關聯
      await tx.reservationCourtTimeSlot.deleteMany({
        where: { reservationId: BigInt(id) },
      })

      // 2. 刪除 Reservation 主資料
      await tx.reservation.delete({
        where: { id: BigInt(id) },
      })
    })

    return {
      code: 200,
      success: true,
      deletedId: exists.id,
      deletedDate: moment(exists.date).format('YYYY-MM-DD'),
      deletedCourtTimeSlots: exists.courtTimeSlots.map((rcs) => ({
        courtName: rcs.courtTimeSlot?.court?.name || '',
        timeLabel: rcs.courtTimeSlot?.timeSlot?.label || '',
      })),
    }
  } catch (err) {
    console.error('刪除預約錯誤:', err)
    return { code: 500, success: false, message: '伺服器發生錯誤，請稍後再試' }
  }
}

// *** 無批次設定價格功能，請依需求另行設計 Reservation 批次操作 ***
