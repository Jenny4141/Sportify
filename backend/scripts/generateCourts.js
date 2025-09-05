import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const seedsPath = path.join(__dirname, '..', 'seeds')
const outputFile = path.join(seedsPath, 'court.json')

try {
  // 依照 center_sport 關聯表，取得每個場館所對應的運動
  const centers = await prisma.center.findMany({
    include: { centerSports: { include: { sport: true } } },
  })

  const courts = []

  for (const center of centers) {
    // 取得該場館的運動清單（透過關聯表）
    const sports = (center.centerSports || []).map((cs) => cs.sport)

    for (const sport of sports) {
      for (let i = 1; i <= 3; i++) {
        courts.push({
          name: `${center.name.slice(0, 2)} ${sport.name} ${i}`,
          centerId: center.id,
          sportId: sport.id,
        })
      }
    }
  }

  await fs.writeFile(outputFile, JSON.stringify(courts, null, 2), 'utf-8')
  console.log(`✅ 已從資料庫產出 court.json → 共 ${courts.length} 筆`)
} catch (err) {
  console.error('❌ 發生錯誤：', err)
} finally {
  await prisma.$disconnect()
}
