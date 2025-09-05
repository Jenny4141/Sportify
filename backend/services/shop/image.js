import prisma from '../../lib/prisma.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 刪除圖片
export const deleteImage = async ({ imageId }) => {
  try {
    // 1. 先找到圖片紀錄，才能取得檔案路徑
    const img = await prisma.productImage.findUnique({
      where: { id: imageId },
    })
    if (!img) {
      return { code: 404, message: '圖片不存在' }
    }
    // 2. 刪除資料庫紀錄
    await prisma.productImage.delete({
      where: { id: imageId },
    })
    // 3. 從檔案系統刪除實體檔案
    const filepath = path.join(__dirname, '../../public/product-imgs/', img.url)
    try {
      await fs.promises.unlink(filepath)
    } catch (err) {
      // 即使檔案刪除失敗，資料庫紀錄也已經刪了，所以通常只在後台記錄錯誤
      console.error('圖片實體檔案刪除失敗:', filepath, err)
    }
    return { code: 200, message: '圖片已刪除' }
  } catch (error) {
    console.error('刪除圖片時發生錯誤:', error)
    return { code: 500, message: '伺服器錯誤' }
  }
}
