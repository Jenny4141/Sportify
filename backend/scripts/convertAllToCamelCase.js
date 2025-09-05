import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

// 📌使用方式
// 產生 .camel.json 副本（安全模式）：node scripts/convertAllToCamelCase.js
// 覆蓋原始檔案（加上 --in-place）：node scripts/convertAllToCamelCase.js --in-place

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const seedsPath = path.join(__dirname, '..', 'seeds')

// 解析是否有傳入 --in-place
const inPlace = process.argv.includes('--in-place')

const toCamelCase = (str) =>
  str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())

const convertKeys = (obj) => {
  if (Array.isArray(obj)) return obj.map(convertKeys)
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        toCamelCase(key),
        convertKeys(value)
      ])
    )
  }
  return obj
}

const run = async () => {
  const files = await fs.readdir(seedsPath)
  const jsonFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('.camel.json'))

  for (const file of jsonFiles) {
    const inputPath = path.join(seedsPath, file)
    const outputPath = inPlace
      ? inputPath
      : inputPath.replace(/\.json$/, '.camel.json')

    try {
      const raw = await fs.readFile(inputPath, 'utf-8')
      const data = JSON.parse(raw)
      const converted = convertKeys(data)

      await fs.writeFile(outputPath, JSON.stringify(converted, null, 2), 'utf-8')

      console.log(`✅ 轉換 ${file} → ${path.basename(outputPath)} ${inPlace ? '(覆蓋原始檔)' : ''}`)
    } catch (err) {
      console.warn(`⚠️ 無法處理 ${file}：${err.message}`)
    }
  }
}

run()
