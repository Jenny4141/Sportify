import prisma from '../../lib/prisma.js'
import moment from 'moment-timezone'
import { courtTimeSlotSchema } from '../../utils/zod-schema.js'

const priceSchema = courtTimeSlotSchema.pick({ price: true })

// *** 定義排序的類型 Order By
const orderByMapping = {
  id_asc: { id: 'asc' },
  id_desc: { id: 'desc' },
}

// *** 取得 CourtTimeSlot 列表資料
export const getListData = async ({
  page = 1,
  keyword = '',
  orderby = '',
  perPage = 10,
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
      { court: { name: { contains: keyword } } },
      { timeSlot: { label: { contains: keyword } } },
    ]
  }

  // 建立 court 篩選條件
  const courtWhere = {}

  // 地區篩選 (透過 court -> center -> location)
  if (locationId) {
    courtWhere.center = { locationId: +locationId }
  }

  // 場館篩選 (透過 court -> center)
  if (centerId) {
    courtWhere.centerId = +centerId
  }

  // 運動項目篩選 (透過 court -> sport)
  if (sportId) {
    courtWhere.sportId = +sportId
  }

  // 如果有 court 相關篩選條件，加入 where
  if (Object.keys(courtWhere).length > 0) {
    where.court = courtWhere
  }

  // 時段類型篩選 (透過 timeSlot -> timePeriod)
  if (timePeriodId) {
    where.timeSlot = { timePeriodId: +timePeriodId }
  }

  const totalRows = await prisma.courtTimeSlot.count({ where })
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

  const rows = await prisma.courtTimeSlot.findMany({
    skip: (page - 1) * validPerPage,
    take: validPerPage,
    where,
    orderBy:
      orderby in orderByMapping ? orderByMapping[orderby] : { id: 'desc' },
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
      startTime: moment(r.timeSlot.startTime).format('HH:mm'),
      endTime: moment(r.timeSlot.endTime).format('HH:mm'),
      // 新增便於前端使用的資料
      centerName: r.court.center.name,
      locationName: r.court.center.location.name,
      sportName: r.court.sport.name,
      timePeriodName: r.timeSlot.timePeriod.name,
    })),
  }
}

// #region 透過場館與運動篩選，取得列表資料
export const getAvailableTimeSlotsDate = async (
  centerId,
  sportId,
  date = null,
  excludeReservationId = null
) => {
  const rows = await prisma.courtTimeSlot.findMany({
    where: {
      court: {
        centerId: Number(centerId),
        sportId: Number(sportId),
      },
    },
    include: {
      court: true,
      timeSlot: true,
    },
  })

  // 如果有傳入日期，查詢該日期的預約狀態
  if (date) {
    // 構建查詢條件
    const whereCondition = {
      date: new Date(date),
    }

    // 如果有 excludeReservationId，排除該預約
    if (excludeReservationId) {
      whereCondition.reservationId = {
        not: BigInt(excludeReservationId),
      }
    }

    // 查詢該日期已被預約的 courtTimeSlot（排除指定的預約）
    const reserved = await prisma.reservationCourtTimeSlot.findMany({
      where: whereCondition,
      select: { courtTimeSlotId: true },
    })

    // 建立已預約的 courtTimeSlotId Set
    const reservedSet = new Set(
      reserved.map((r) => r.courtTimeSlotId.toString())
    )

    // 為每個 courtTimeSlot 添加預約狀態
    const rowsWithStatus = rows.map((row) => ({
      ...row,
      date: date,
      isAvailable: !reservedSet.has(row.id.toString()),
      status: reservedSet.has(row.id.toString()) ? '已預約' : '可預約',
      startTime: moment(row.timeSlot.startTime).format('HH:mm'),
      endTime: moment(row.timeSlot.endTime).format('HH:mm'),
    }))

    return {
      code: 200,
      success: true,
      date: date,
      excludeReservationId: excludeReservationId,
      totalSlots: rows.length,
      availableSlots: rowsWithStatus.filter((r) => r.isAvailable).length,
      reservedSlots: rowsWithStatus.filter((r) => !r.isAvailable).length,
      rows: rowsWithStatus,
    }
  }

  // 如果沒有傳入日期，回傳原本的資料
  return {
    code: 200,
    success: true,
    rows: rows.map((row) => ({
      ...row,
      startTime: moment(row.timeSlot.startTime).format('HH:mm'),
      endTime: moment(row.timeSlot.endTime).format('HH:mm'),
    })),
  }
}

// #region 查詢從 today 起算 N 天的可預約 CourtTimeSlots
export const getAvailableTimeSlotsRange = async ({
  centerId,
  sportId,
  today,
  days = 30,
}) => {
  // 取得該 centerId, sportId 的所有 courtTimeSlot
  const courtTimeSlots = await prisma.courtTimeSlot.findMany({
    where: {
      court: {
        centerId: Number(centerId),
        sportId: Number(sportId),
      },
    },
    select: { id: true, courtId: true, timeSlotId: true, price: true },
  })

  // 取得 today 起算的連續 days 天日期
  const start = moment(today, 'YYYY-MM-DD')
  const dates = Array.from({ length: days }, (_, i) =>
    start.clone().add(i, 'days').format('YYYY-MM-DD')
  )

  // 查詢該月所有已預約的 courtTimeSlot
  const reserved = await prisma.reservationCourtTimeSlot.findMany({
    where: {
      date: {
        gte: new Date(dates[0]),
        lte: new Date(dates[days - 1]),
      },
    },
    select: { courtTimeSlotId: true, date: true },
  })

  // 建立已預約 map（確保日期格式一致）
  const reservedMap = new Map()
  reserved.forEach((r) => {
    const dateStr = moment(r.date).format('YYYY-MM-DD')
    const key = `${r.courtTimeSlotId}_${dateStr}`
    reservedMap.set(key, true)
  })

  // 回傳每天可預約的 courtTimeSlot
  const rows = dates.map((date) => {
    const availableCourtTimeSlots = courtTimeSlots.filter(
      (cts) => !reservedMap.has(`${cts.id}_${date}`)
    )

    return {
      date,
      availableCount: availableCourtTimeSlots.length,
      // availableCourtTimeSlots, // 若要回傳詳細時段
    }
  })

  return {
    code: 200,
    success: true,
    rows,
  }
}

// *** 取得單筆 CourtTimeSlot 資料
export const getItemData = async (id) => {
  const record = await prisma.courtTimeSlot.findUnique({
    where: { id: BigInt(id) },
    include: { court: true, timeSlot: true },
  })
  return record
    ? { code: 200, success: true, record }
    : { code: 404, success: false, message: '沒有該筆資料', record: {} }
}

// *** 新增 CourtTimeSlot 資料
export const createCourtTimeSlot = async (data) => {
  const output = { success: false, insertId: 0, issues: [] }
  // zod 驗證
  const result = courtTimeSlotSchema.safeParse(data)
  if (!result.success) {
    output.issues = result.error.issues
    return { code: 400, ...output }
  }
  const record = await prisma.courtTimeSlot.create({ data: result.data })
  return { code: 200, success: true, insertId: record.id }
}

// *** 編輯 CourtTimeSlot 資料
export const updateCourtTimeSlot = async (id, data) => {
  const exists = await prisma.courtTimeSlot.findUnique({
    where: { id: BigInt(id) },
  })
  if (!exists) return { code: 404, success: false, message: '找不到資料' }

  // 表單驗證
  const result = courtTimeSlotSchema.safeParse(data)
  if (!result.success)
    return { code: 400, success: false, issues: result.error.issues }

  await prisma.courtTimeSlot.update({
    where: { id: BigInt(id) },
    data: result.data,
  })
  return { code: 200, success: true }
}

// *** 多選刪除 CourtTimeSlot 資料
export const deleteMultipleCourtTimeSlots = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { code: 400, success: false, message: '未提供要刪除的項目' }
  }

  // 先查要刪除的資料內容
  const toBeDeleted = await prisma.courtTimeSlot.findMany({
    where: { id: { in: ids.map((id) => BigInt(id)) } },
    select: { id: true, price: true },
  })

  // 執行刪除
  const result = await prisma.courtTimeSlot.deleteMany({
    where: { id: { in: ids.map((id) => BigInt(id)) } },
  })

  return {
    code: 200,
    success: !!result.count,
    affectedRows: result.count,
    deleted: toBeDeleted,
  }
}

// *** 刪除 CourtTimeSlot 資料
export const deleteCourtTimeSlot = async (id) => {
  const exists = await prisma.courtTimeSlot.findUnique({
    where: { id: BigInt(id) },
  })
  if (!exists) return { code: 404, success: false, message: '沒有該筆資料' }

  const deleted = await prisma.courtTimeSlot.delete({
    where: { id: BigInt(id) },
  })

  return {
    code: 200,
    success: true,
    deletedId: deleted.id,
    deletedPrice: deleted.price, // 如果要給使用者看
  }
}

// *** 批次設定價格（依條件）
export const batchSetCourtTimeSlotPrice = async ({
  locationId,
  centerId,
  sportId,
  courtIds,
  timePeriodId,
  timeSlotIds,
  price,
}) => {
  // zod 驗證 price 欄位
  const result = priceSchema.safeParse({ price })
  if (!result.success) {
    return { code: 400, success: false, issues: result.error.issues }
  }
  // 取出轉型後的 price
  const priceNum = result.data.price

  // 1. 組合 court 查詢條件
  let courtWhere = {}
  if (courtIds && courtIds.length > 0)
    courtWhere.id = { in: courtIds.map(Number) }
  if (centerId) courtWhere.centerId = Number(centerId)
  if (sportId) courtWhere.sportId = Number(sportId)
  if (locationId) courtWhere.center = { locationId: Number(locationId) }

  // 2. 查詢所有符合條件的 courtId
  const courts = await prisma.court.findMany({
    where: courtWhere,
    select: { id: true },
  })
  const courtIdList = courts.map((c) => c.id)
  if (courtIdList.length === 0) {
    return { code: 404, success: false, message: '找不到符合條件的場地' }
  }

  // 3. 查詢所有符合條件的 timeSlotId
  let timeSlotWhere = {}
  if (timeSlotIds && timeSlotIds.length > 0)
    timeSlotWhere.id = { in: timeSlotIds.map(Number) }
  if (timePeriodId) timeSlotWhere.timePeriodId = Number(timePeriodId)
  const timeSlots = await prisma.timeSlot.findMany({
    where: timeSlotWhere,
    select: { id: true },
  })
  const timeSlotIdList = timeSlots.map((t) => t.id)
  if (timeSlotIdList.length === 0) {
    return { code: 404, success: false, message: '找不到符合條件的時段' }
  }

  // 4. 逐一 upsert courtTimeSlot
  let count = 0
  for (const courtId of courtIdList) {
    for (const timeSlotId of timeSlotIdList) {
      await prisma.courtTimeSlot.upsert({
        where: { courtId_timeSlotId: { courtId, timeSlotId } },
        update: { price: priceNum },
        create: { courtId, timeSlotId, price: priceNum },
      })
      count++
    }
  }
  return { code: 200, success: true, affectedRows: count }
}
