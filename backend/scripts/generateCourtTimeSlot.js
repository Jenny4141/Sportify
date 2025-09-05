// ...existing code...
import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const seedsPath = path.join(__dirname, '..', 'seeds')
const outputFile = path.join(seedsPath, 'courtTimeSlot.json')

try {
  // 取得所有 court 與 timeSlot
  const courts = await prisma.court.findMany()
  const courtCount = await prisma.court.count()
  // const timeSlots = await prisma.timeSlot.findMany({ skip: 2, take: 12 })
  const timeSlots = await prisma.timeSlot.findMany()

  // debug log：印出抓到的數量
  console.log(
    `Found courts array length: ${courts.length}, prisma.court.count(): ${courtCount}`
  )
  console.log(`Found timeSlots length: ${timeSlots.length}`)

  const expectedTotal = courts.length * timeSlots.length
  console.log(
    `Expected total courtTimeSlots = ${courts.length} * ${timeSlots.length} = ${expectedTotal}`
  )

  const courtTimeSlots = []

  for (const court of courts) {
    for (const timeSlot of timeSlots) {
      courtTimeSlots.push({
        courtId: court.id,
        timeSlotId: timeSlot.id,
        // price: (Math.floor(Math.random() * 6) + 5) * 10 // 隨機價格：$50 ~ $100
        price: 100, // 固定價格：$100
      })
    }
  }

  await fs.writeFile(
    outputFile,
    JSON.stringify(courtTimeSlots, null, 2),
    'utf-8'
  )

  console.log(`✅ 產出 courtTimeSlot.json → 共 ${courtTimeSlots.length} 筆資料`)
  if (courtTimeSlots.length !== expectedTotal) {
    console.warn(
      `⚠️ 實際產生數量 (${courtTimeSlots.length}) 與預期數量 (${expectedTotal}) 不符。請檢查 prisma.court.findMany() 是否回傳完整資料。可執行 "npx prisma studio" 或在程式內使用 prisma.court.findMany({ take: 1000 }) / prisma.court.count() 做進一步確認。`
    )
  }
} catch (err) {
  console.error('❌ 發生錯誤：', err)
} finally {
  await prisma.$disconnect()
}
// ...existing code...
