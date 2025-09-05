import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const seedsPath = path.join(__dirname, '..', 'seeds')
const outputFile = path.join(seedsPath, 'centerSport.json')

try {
  const centers = await prisma.center.findMany()
  const sports = await prisma.sport.findMany()

  if (!centers.length || !sports.length) {
    throw new Error('請先確保有 center 與 sport 資料')
  }

  const records = []

  for (const center of centers) {
    // 隨機決定要分配的數量（3..6），但不超過總運動數
    const count = Math.min(
      Math.floor(Math.random() * 4) + 3, // 3..6
      sports.length
    )

    // 隨機選出不重複的 sport，並在寫入前以 sportId 升序排序
    const pool = [...sports]
    const chosenIds = []
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length)
      const sport = pool.splice(idx, 1)[0]
      chosenIds.push(sport.id)
    }

    chosenIds.sort((a, b) => a - b)
    for (const sid of chosenIds) {
      records.push({ centerId: center.id, sportId: sid })
    }
  }

  await fs.writeFile(outputFile, JSON.stringify(records, null, 2), 'utf-8')
  console.log(`✅ 已產生 center_sport seeds → 共 ${records.length} 筆`)
} catch (err) {
  console.error('❌ 發生錯誤：', err)
} finally {
  await prisma.$disconnect()
}
