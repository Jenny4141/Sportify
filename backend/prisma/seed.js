import { PrismaClient } from '@prisma/client'
import { readFile, readdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt'
import fs from 'fs'

const prisma = new PrismaClient()
const verbose = process.argv.includes('--verbose')
// 取得當前檔案的資料夾路徑 C:\Users\...\prisma
const __dirname = path.dirname(fileURLToPath(import.meta.url))
// 組出 JSON 路徑 C:\Users\...\prisma\seeds
const seedsPath = path.join(__dirname, '..', 'seeds')

// #region 自動解析 Prisma Schema 的 model 依賴並排序

// 解析 Prisma schema 的 Model 關聯
const extractDependencies = (schemaContent) => {
  // 用正則表達式找出所有 model 名稱與其內容區塊（包含欄位與關聯）
  //  - (\w+) 是 model 名稱
  //  - ([\s\S]*?) 是 model 的內容（非貪婪模式）
  const modelRegex = /model (\w+) \{([\s\S]*?)\}/g

  // 用來儲存每個 model 對應的依賴 model 陣列 (key: modelName, value: [依賴的其他 model 名稱]）
  const models = {}
  let match

  // 使用迴圈，不斷從 schemaContent 中匹配 model 區塊
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    // 擷取出 model 名稱與其定義區塊文字
    const modelName = match[1] // 取得 model 名稱（如 Court）
    const body = match[2] // 取得 model 區塊內容

    // 使用 Set 儲存此 model 的依賴，避免重複
    const deps = new Set()

    // 逐行解析該 model 的欄位定義
    const lines = body.split('\n')
    for (const line of lines) {
      // 如果這行是關聯欄位，並且有 references（代表是 FK）
      if (line.includes('@relation') && line.includes('references:')) {
        // 把這行用空白切開，取得 model type（可能是關聯的目標 model 名稱）
        const parts = line.trim().split(/\s+/)

        // 確認切出來的 parts 至少有 3 個，而且第三個是 @relation
        if (parts.length >= 3 && parts[2].startsWith('@relation')) {
          const targetModel = parts[1] // 通常是該欄位的型別（可能為關聯 model）

          // 避免自己依賴自己（避免 circular error），如果有效就加入 Set
          if (targetModel && targetModel !== modelName) {
            deps.add(targetModel)
          }
        }
      }
    }
    // 把目前 model 的所有依賴結果存進 models 物件
    models[modelName] = Array.from(deps)
  }
  // 回傳所有解析完的 model 依賴對照表
  return models
}

// 根據依賴圖做拓撲排序
const topologicalSort = (graph) => {
  const visited = new Set()
  const result = []

  const visit = (node) => {
    if (visited.has(node)) return
    visited.add(node)
    for (const dep of graph[node] || []) {
      visit(dep)
    }
    result.push(node)
  }

  Object.keys(graph).forEach(visit)
  return result
}

// #endregion 自動解析 Prisma Schema 的 model 依賴並排序

const main = async () => {
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')
  const schema = fs.readFileSync(schemaPath, 'utf-8')
  const dependencyGraph = extractDependencies(schema)
  const sortedModels = topologicalSort(dependencyGraph)

  const files = await readdir(seedsPath)

  for (const model of sortedModels) {
    // 把模型名稱轉為小駝峰格式（Sport → sport.json）
    const jsonName = `${model.charAt(0).toLowerCase()}${model.slice(1)}.json`
    // 回傳在提供的陣列中第一個通過所提供測試函式的元素(會照順序)
    const file = files.find((f) => f === jsonName)
    if (!file) continue

    // 把 JSON 檔名 file 加在 seedsPath 後面，得到完整檔案路徑 C:\Users\...\prisma\seeds\(file)
    const fullPath = path.join(seedsPath, file)
    // 用 fs/promises 的 readFile 讀取檔案內容（純文字）
    const json = await readFile(fullPath, 'utf-8')
    // 使用 JSON.parse 把字串轉成 JS 陣列物件
    let data = JSON.parse(json)

    // #region 轉換資料格式
    const dateFields = [
      'createdAt',
      'updatedAt',
      'birth',
      'date',
      'startDate',
      'endDate',
    ]
    const timeFields = ['startTime', 'endTime', 'time']

    data = await Promise.all(
      data.map(async (entry) => {
        const transformed = { ...entry }

        // 密碼欄位加密
        if (
          'password' in transformed &&
          typeof transformed.password === 'string'
        ) {
          transformed.password = await bcrypt.hash(transformed.password, 10)
        }

        // 日期欄位轉換
        for (const field of dateFields) {
          if (field in transformed && typeof transformed[field] === 'string') {
            transformed[field] = new Date(transformed[field])
          }
        }

        // 時間欄位轉換（格式 "HH:mm"）
        for (const field of timeFields) {
          if (field in transformed && typeof transformed[field] === 'string') {
            const [hour, minute] = transformed[field].split(':').map(Number)
            const date = new Date('2000-01-01') // 固定日期不重要，重點是時間部分
            date.setHours(hour, minute, 0, 0)
            transformed[field] = date
          }
        }

        return transformed
      })
    )
    // #endregion 轉換資料格式

    const modelName = model.charAt(0).toLowerCase() + model.slice(1)
    if (!prisma[modelName]) {
      console.warn(`⚠️ 跳過 ${file}，找不到 Prisma model: ${modelName}`)
      continue
    }

    // 計算匯入前筆數
    let beforeCount = 0
    if (verbose) {
      beforeCount = await prisma[modelName].count()
    }

    await prisma[modelName].createMany({
      data,
      skipDuplicates: true,
    })

    if (verbose) {
      const afterCount = await prisma[modelName].count()
      const inserted = afterCount - beforeCount
      console.log(
        `📊 匯入 ${modelName}：新增 ${inserted} 筆，資料庫共 ${afterCount} 筆`
      )
    } else {
      console.log(
        `✅ 匯入 ${data.length} 筆資料 → ${modelName}（來源：${file}）`
      )
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ 匯入失敗：', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
