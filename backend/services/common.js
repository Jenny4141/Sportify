import prisma from '../lib/prisma.js'
import moment from 'moment-timezone'

// *** 取得運動類型 sport 資料的函式
export const getSportData = async (filter = {}) => {
  const { centerId } = filter
  const where = {}

  // 若傳入 centerId，篩選該中心支援的運動
  if (centerId) {
    where.centersSports = { some: { centerId: Number(centerId) } }
  }

  const rows = await prisma.sport.findMany({
    where,
    select: { id: true, name: true, iconKey: true },
  })
  return rows.length
    ? { code: 200, success: true, rows }
    : { code: 404, success: false, message: '沒有資料', rows: [] }
}

// *** 取得會員 member 資料的函式
export const getMemberData = async () => {
  const rows = await prisma.member.findMany({
    select: { id: true, name: true },
  })
  return rows.length
    ? { code: 200, success: true, rows }
    : { code: 404, success: false, message: '沒有資料', rows: [] }
}

// *** 取得訂單狀態 status 資料的函式
export const getStatusData = async () => {
  const rows = await prisma.status.findMany({
    select: { id: true, name: true },
  })
  return rows.length
    ? { code: 200, success: true, rows }
    : { code: 404, success: false, message: '沒有資料', rows: [] }
}

// *** 取得物流方式 delivery 資料的函式
export const getDeliveryData = async () => {
  const rows = await prisma.delivery.findMany({
    select: { id: true, name: true },
  })
  return rows.length
    ? { code: 200, success: true, rows }
    : { code: 404, success: false, message: '沒有資料', rows: [] }
}

// *** 取得付款方式 payment 資料的函式
export const getPaymentData = async () => {
  const rows = await prisma.payment.findMany({
    select: { id: true, name: true },
  })
  return rows.length
    ? { code: 200, success: true, rows }
    : { code: 404, success: false, message: '沒有資料', rows: [] }
}

// *** 取得發票類型 invoice 資料的函式
export const getInvoiceData = async () => {
  const rows = await prisma.invoice.findMany({
    select: { id: true, name: true },
  })
  return rows.length
    ? { code: 200, success: true, rows }
    : { code: 404, success: false, message: '沒有資料', rows: [] }
}

// *** 取得 地區location 資料的函式
export const getLocationData = async () => {
  const rows = await prisma.location.findMany({
    select: { id: true, name: true },
  })
  return rows.length
    ? { code: 200, success: true, rows }
    : { code: 404, success: false, message: '沒有資料', rows: [] }
}

// *** 取得中心 center 資料的函式
export const getCenterData = async (filter = {}) => {
  const { locationId } = filter
  const where = {}

  if (locationId) where.locationId = Number(locationId)

  const rows = await prisma.center.findMany({
    where,
    select: {
      id: true,
      name: true,
      locationId: true,
      location: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
  return rows.length
    ? { code: 200, success: true, rows }
    : { code: 404, success: false, message: '沒有資料', rows: [] }
}

// *** 取得球場 court 資料的函式
export const getCourtData = async (filter = {}) => {
  const { centerId, sportId } = filter
  const where = {}

  if (centerId) where.centerId = Number(centerId)
  if (sportId) where.sportId = Number(sportId)

  const rows = await prisma.court.findMany({
    where,
    select: {
      id: true,
      name: true,
      centerId: true,
      sportId: true,
      center: {
        select: {
          id: true,
          name: true,
        },
      },
      sport: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return rows.length
    ? { code: 200, success: true, rows }
    : { code: 404, success: false, message: '沒有資料', rows: [] }
}

// *** 取得 地區timePeriod 資料的函式
export const getTimePeriodData = async () => {
  const rows = await prisma.timePeriod.findMany({
    select: { id: true, name: true },
  })
  return rows.length
    ? { code: 200, success: true, rows }
    : { code: 404, success: false, message: '沒有資料', rows: [] }
}

// *** 取得時段 timeSlot 資料的函式
export const getTimeSlotData = async (filter = {}) => {
  const { timePeriodId } = filter
  const where = {}

  if (timePeriodId) where.timePeriodId = Number(timePeriodId)

  const rows = await prisma.timeSlot.findMany({
    where,
    select: {
      id: true,
      startTime: true,
      endTime: true,
      timePeriodId: true,
      timePeriod: {
        select: {
          id: true,
          name: true,
        },
      },
      label: true,
    },
  })
  return rows.length
    ? {
        code: 200,
        success: true,
        rows: rows.map((r) => ({
          ...r,
          startTime: moment(r.startTime).format('HH:mm'),
          endTime: moment(r.endTime).format('HH:mm'),
        })),
      }
    : { code: 404, success: false, message: '沒有資料', rows: [] }
}

// *** 取得場地時段組合 court, timeSlot 資料
export const getCourtTimeSlotData = async (filter = {}) => {
  const { courtId, timeSlotId } = filter
  const where = {}

  if (courtId) where.courtId = Number(courtId)
  if (timeSlotId) where.timeSlotId = Number(timeSlotId)

  const rows = await prisma.courtTimeSlot.findMany({
    where,
    select: {
      id: true,
      courtId: true,
      timeSlotId: true,
      court: {
        select: {
          id: true,
          name: true,
        },
      },
      timeSlot: {
        select: {
          id: true,
          label: true,
        },
      },
      price: true,
    },
  })

  return rows.length
    ? { code: 200, success: true, rows }
    : { code: 404, success: false, message: '沒有資料', rows: [] }
}

// *** 取得品牌 brand 資料的函式
export const getBrandData = async () => {
  const rows = await prisma.brand.findMany({
    select: { id: true, name: true },
  })
  return rows.length
    ? { code: 200, success: true, rows }
    : { code: 404, success: false, message: '沒有資料', rows: [] }
}

// *** 取得教練 coach 資料的函式
export const getCoachData = async () => {
  const rows = await prisma.coach.findMany({
    select: {
      id: true,
      avatar: true,
      member: {
        select: {
          id: true,
          name: true,
        },
      },
      sport: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
  return rows.length
    ? { code: 200, success: true, rows }
    : { code: 404, success: false, message: '沒有資料', rows: [] }
}
