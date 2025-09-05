// 生成 center 評分假資料的腳本
import fs from 'fs'
import path from 'path'

// 評論內容池
const comments = [
  '設施很完善，環境乾淨整潔！',
  '教練很專業，服務態度很好',
  '場地寬敞，器材維護得很好',
  '交通方便，停車位充足',
  '價格合理，性價比很高',
  '空調舒適，運動起來很舒服',
  '更衣室很乾淨，淋浴設備也不錯',
  '課程安排豐富，適合不同程度的人',
  '工作人員很親切，服務很周到',
  '場館新穎，設備都很先進',
  '時段安排靈活，很容易預約',
  '整體體驗很棒，會推薦給朋友',
  '運動氛圍很好，大家都很友善',
  '場地維護得很好，很安全',
  '音響效果不錯，運動時很有動力',
  '燈光明亮，視野很清楚',
  '有專業的體適能檢測，很貼心',
  '社區氛圍很好，常常遇到鄰居',
  '教練會耐心指導，很專業',
  '設施齊全，什麼運動都能做',
  null, // 有些評分沒有評論
]

// 生成隨機評分 (偏向較高分數)
function generateRating() {
  const weights = [
    { rating: 1, weight: 5 },
    { rating: 2, weight: 10 },
    { rating: 3, weight: 20 },
    { rating: 4, weight: 35 },
    { rating: 5, weight: 30 },
  ]

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0)
  const random = Math.random() * totalWeight

  let currentWeight = 0
  for (const { rating, weight } of weights) {
    currentWeight += weight
    if (random <= currentWeight) {
      return rating
    }
  }
  return 5 // 預設回傳 5
}

// 生成隨機評論
function generateComment(rating) {
  // 30% 機率沒有評論
  if (Math.random() < 0.3) {
    return null
  }

  // 根據評分決定評論內容
  const positiveComments = comments.slice(0, 15)
  const neutralComments = comments.slice(15, 18)
  const allComments = comments.slice(0, -1) // 排除 null

  if (rating >= 4) {
    return positiveComments[Math.floor(Math.random() * positiveComments.length)]
  } else if (rating === 3) {
    return neutralComments[Math.floor(Math.random() * neutralComments.length)]
  } else {
    return allComments[Math.floor(Math.random() * allComments.length)]
  }
}

// 隨機選擇不同的會員 ID (假設有 100 個會員)
function selectRandomMembers(count) {
  const members = new Set()
  while (members.size < count) {
    // 隨機選擇 1-100 的會員 ID
    members.add(Math.floor(Math.random() * 100) + 1)
  }
  return Array.from(members)
}

function generateCenterRatings() {
  const ratings = []

  // 28 個運動中心，每個都有 5-12 個評分
  for (let centerId = 1; centerId <= 28; centerId++) {
    const ratingCount = Math.floor(Math.random() * 8) + 5 // 5-12 個評分
    const memberIds = selectRandomMembers(ratingCount)

    memberIds.forEach((memberId) => {
      const rating = generateRating()
      const comment = generateComment(rating)

      // 生成隨機的創建時間 (過去 6 個月內)
      const now = new Date()
      const sixMonthsAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 6,
        now.getDate()
      )
      const randomTime = new Date(
        sixMonthsAgo.getTime() +
          Math.random() * (now.getTime() - sixMonthsAgo.getTime())
      )

      ratings.push({
        centerId,
        memberId,
        rating,
        comment,
        createdAt: randomTime.toISOString(),
        updatedAt: randomTime.toISOString(),
      })
    })
  }

  // 按創建時間排序
  ratings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  return ratings
}

// 生成並儲存假資料
const ratings = generateCenterRatings()
const filePath = path.join(process.cwd(), 'seeds', 'centerRating.json')

fs.writeFileSync(filePath, JSON.stringify(ratings, null, 2), 'utf8')

console.log(`✅ 成功生成 ${ratings.length} 筆評分資料！`)
console.log(`📊 平均每個運動中心有 ${(ratings.length / 28).toFixed(1)} 個評分`)
console.log(`📝 檔案儲存至: ${filePath}`)

// 顯示一些統計資訊
const ratingStats = ratings.reduce((stats, r) => {
  stats[r.rating] = (stats[r.rating] || 0) + 1
  return stats
}, {})

console.log('\n📈 評分分布：')
for (let i = 1; i <= 5; i++) {
  const count = ratingStats[i] || 0
  const percentage = ((count / ratings.length) * 100).toFixed(1)
  console.log(`${i}星: ${count} 筆 (${percentage}%)`)
}

const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
console.log(`\n⭐ 整體平均評分: ${avgRating.toFixed(2)}`)
