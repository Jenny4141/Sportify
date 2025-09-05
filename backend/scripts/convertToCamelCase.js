import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

// 📌使用方式
// 產生 .camel.json 副本（安全模式）：node scripts/convertToCamelCase.js 你的檔案名.json
// 覆蓋原始檔案（加上 --in-place）：node scripts/convertToCamelCase.js 你的檔案名.json --in-place

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const inputFilename = process.argv[2] // 使用時從命令列帶入檔名

// 解析是否有傳入 --in-place
const inPlace = process.argv.includes('--in-place')

if (!inputFilename) {
  console.error('❌ 請輸入要轉換的 JSON 檔案名稱')
  // process.exit(1)
}

const toCamelCase = (str) =>
  str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())

const convertKeys = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(convertKeys)
  } else if (obj !== null && typeof obj === 'object') {
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
  const inputPath = path.join(__dirname, '..', 'seeds', inputFilename)
  const raw = await fs.readFile(inputPath, 'utf-8')
  const data = JSON.parse(raw)
  const converted = convertKeys(data)

  const outputPath = inPlace
    ? inputPath
    : inputPath.replace(/\.json$/, '.camel.json')
  await fs.writeFile(outputPath, JSON.stringify(converted, null, 2), 'utf-8')

  console.log(`✅ 轉換 ${inputFilename} → ${path.basename(outputPath)}${inPlace ? ' (覆蓋原始檔)' : ''}`)
}

run()
