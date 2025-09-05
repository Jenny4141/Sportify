import fs from 'fs'
import path from 'path'
import https from 'https'

// 使用 Nominatim API 將地址轉換為經緯度
async function getCoordinates(address) {
  return new Promise((resolve) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1`

      const options = {
        headers: {
          'User-Agent': 'Sportify-Center-Geocoder/1.0',
        },
      }

      https
        .get(url, options, (response) => {
          let data = ''

          response.on('data', (chunk) => {
            data += chunk
          })

          response.on('end', () => {
            try {
              const jsonData = JSON.parse(data)
              if (jsonData.length > 0) {
                resolve({
                  lat: parseFloat(jsonData[0].lat),
                  lng: parseFloat(jsonData[0].lon),
                })
              } else {
                resolve(null)
              }
            } catch (parseError) {
              console.error(`Parse error for address: ${address}`, parseError)
              resolve(null)
            }
          })
        })
        .on('error', (error) => {
          console.error(`Request error for address: ${address}`, error)
          resolve(null)
        })
    } catch (error) {
      console.error(`Error geocoding address: ${address}`, error)
      resolve(null)
    }
  })
}

// 延遲函數，避免 API 速率限制
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function addCoordinatesToCenters() {
  const filePath = path.join(process.cwd(), 'seeds', 'center.json')

  try {
    // 讀取現有的 JSON 檔案
    const data = fs.readFileSync(filePath, 'utf8')
    const centers = JSON.parse(data)

    console.log(`開始處理 ${centers.length} 個運動中心的地址...`)

    // 為每個運動中心添加經緯度
    for (let i = 0; i < centers.length; i++) {
      const center = centers[i]
      console.log(`處理第 ${i + 1}/${centers.length} 個: ${center.name}`)

      // 如果已經有經緯度就跳過
      if (center.lat && center.lng) {
        console.log(`  已有經緯度，跳過`)
        continue
      }

      const coordinates = await getCoordinates(center.address)

      if (coordinates) {
        center.lat = coordinates.lat
        center.lng = coordinates.lng
        console.log(`  成功: ${coordinates.lat}, ${coordinates.lng}`)
      } else {
        console.log(`  失敗: 無法取得經緯度`)
      }

      // 延遲 1 秒，避免 API 速率限制
      if (i < centers.length - 1) {
        await delay(1000)
      }
    }

    // 將更新後的資料寫回檔案
    fs.writeFileSync(filePath, JSON.stringify(centers, null, 2), 'utf8')
    console.log(`完成！更新的檔案已儲存至: ${filePath}`)
  } catch (error) {
    console.error('處理過程中發生錯誤:', error)
  }
}

// 執行腳本
addCoordinatesToCenters()
