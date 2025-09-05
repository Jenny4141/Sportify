import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { createInvoiceNumber } from '../utils/createInvoiceNumber.js'

const prisma = new PrismaClient()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const seedsPath = path.join(__dirname, '..', 'seeds')
const reservationFile = path.join(seedsPath, 'reservation.json')
const reservationCourtTimeSlotFile = path.join(
  seedsPath,
  'reservationCourtTimeSlot.json'
)

// 產生隨機日期（今天 ± 15 天）
/* const randomDate = () => {
  const today = new Date()
  const offset = Math.floor(Math.random() * 31) - 15
  const date = new Date(today)
  date.setDate(today.getDate() + offset)
  return date.toISOString().split('T')[0] // YYYY-MM-DD
} */

// 產生隨機日期（今天起往後 15 天）
const randomDate = () => {
  const today = new Date()
  const end = new Date(today)
  end.setDate(today.getDate() + 5)

  // 產生從 0 到 15 的隨機偏移（包含兩端）
  const offset = Math.floor(
    Math.random() * (Math.floor((end - today) / 86400000) + 1)
  )
  const date = new Date(today)
  date.setDate(today.getDate() + offset)
  return date.toISOString().split('T')[0] // YYYY-MM-DD
}

// 產生隨機統一編號 (8位數字)
const randomTax = () => {
  return Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, '0')
}

// 產生隨機載具號碼
const randomCarrier = () => {
  const carriers = [
    `/${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    `${Math.random().toString(36).substring(2, 18).toUpperCase()}`,
    null,
  ]
  return carriers[Math.floor(Math.random() * carriers.length)]
}

try {
  const members = await prisma.member.findMany()
  const courtTimeSlots = await prisma.courtTimeSlot.findMany({
    include: {
      court: true,
      timeSlot: true,
    },
  })
  const statuses = await prisma.status.findMany({
    where: {
      id: { in: [1] },
    },
  })
  const payments = await prisma.payment.findMany({
    where: {
      id: { in: [1, 2] },
    },
  })
  const invoices = await prisma.invoice.findMany()

  if (
    !members.length ||
    !courtTimeSlots.length ||
    !statuses.length ||
    !payments.length ||
    !invoices.length
  ) {
    throw new Error(
      '資料不完整：請先匯入 member、courtTimeSlot、status、payment 與 invoice 種子資料'
    )
  }

  const reservations = []
  const reservationCourtTimeSlots = []

  // 追蹤已使用的 courtTimeSlotId + date 組合，避免重複
  const usedSlotDates = new Set()

  for (let i = 0; i < 5000; i++) {
    const member = members[Math.floor(Math.random() * members.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const payment = payments[Math.floor(Math.random() * payments.length)]
    const invoice = invoices[Math.floor(Math.random() * invoices.length)]

    // 先隨機選一個 courtTimeSlot 作為基準
    const baseSlot =
      courtTimeSlots[Math.floor(Math.random() * courtTimeSlots.length)]
    const centerId = baseSlot.court.centerId
    const sportId = baseSlot.court.sportId

    // 篩出同場館同運動的所有 slot
    const availableSlots = courtTimeSlots.filter(
      (slot) =>
        slot.court.centerId === centerId && slot.court.sportId === sportId
    )

    // 隨機選 1~4 個 slot，但時間需為同一場地上的連續時段
    let numSlots = Math.floor(Math.random() * 4) + 1 // 1..4
    const date = randomDate()

    // 過濾掉已被使用的 slot（同一天）
    const availableSlotsFiltered = availableSlots.filter(
      (slot) => !usedSlotDates.has(`${slot.id}_${date}`)
    )

    // 以場地分組，並依 timeSlot.id 排序，從同一場地中取出連續的時段
    const byCourt = {}
    for (const s of availableSlotsFiltered) {
      const cid = s.court?.id ?? s.courtId
      if (!byCourt[cid]) byCourt[cid] = []
      byCourt[cid].push(s)
    }

    const courtGroups = Object.values(byCourt).map((arr) =>
      arr.sort((a, b) => (a.timeSlot?.id ?? 0) - (b.timeSlot?.id ?? 0))
    )

    let selectedSlots = []

    if (courtGroups.length > 0) {
      // 隨機選一個場地作為候選，如果該場地時段不足，會降級 numSlots
      const group = courtGroups[Math.floor(Math.random() * courtGroups.length)]
      if (group.length > 0) {
        const maxLen = Math.min(numSlots, group.length)
        // 可選的起始 index 範圍
        const startMax = group.length - maxLen
        const start = Math.floor(Math.random() * (startMax + 1))
        selectedSlots = group.slice(start, start + maxLen)
        // 若實際取得數量少於預期，接受較少數量
        numSlots = selectedSlots.length
      }
    }

    // 若仍沒選到（非常罕見），退回選隨機單一時段
    if (selectedSlots.length === 0 && availableSlotsFiltered.length > 0) {
      const slot =
        availableSlotsFiltered[
          Math.floor(Math.random() * availableSlotsFiltered.length)
        ]
      selectedSlots = [slot]
      numSlots = 1
    }

    // 如果沒有可用的時段，跳過這次迭代
    if (selectedSlots.length === 0) {
      continue
    }

    // 計算總價格
    const totalPrice = selectedSlots.reduce(
      (sum, slot) => sum + Number(slot.price),
      0
    )

    // 產生發票號碼
    const invoiceNumber = await createInvoiceNumber()

    // 建立 reservation
    const reservation = {
      id: (i + 1).toString(),
      memberId: member.id.toString(),
      date,
      price: totalPrice.toFixed(2),
      paymentId: payment.id,
      invoiceId: invoice.id,
      invoiceNumber,
      tax: Math.random() > 0.7 ? randomTax() : null, // 30% 機率有統一編號
      carrier: Math.random() > 0.5 ? randomCarrier() : null, // 50% 機率有載具
      // statusId: status.id,
      statusId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    reservations.push(reservation)

    // 建立對應的 reservationCourtTimeSlot
    selectedSlots.forEach((slot) => {
      const slotDateKey = `${slot.id}_${date}`
      usedSlotDates.add(slotDateKey) // 標記為已使用

      reservationCourtTimeSlots.push({
        reservationId: reservation.id,
        courtTimeSlotId: slot.id.toString(),
        date,
      })
    })
  }

  const safeStringify = (obj) =>
    JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2)

  await fs.writeFile(reservationFile, safeStringify(reservations), 'utf-8')
  await fs.writeFile(
    reservationCourtTimeSlotFile,
    safeStringify(reservationCourtTimeSlots),
    'utf-8'
  )

  console.log(`✅ 產出 reservation.json → 共 ${reservations.length} 筆`)
  console.log(
    `✅ 產出 reservationCourtTimeSlot.json → 共 ${reservationCourtTimeSlots.length} 筆`
  )
} catch (err) {
  console.error('❌ 發生錯誤：', err)
} finally {
  await prisma.$disconnect()
}
