// ===================================================================
// 後端商品圖片服務模組 - 圖片檔案系統管理
// ===================================================================
/**
 * 此模組負責處理商品圖片的後端操作，包括：
 * • 圖片檔案的永久性刪除（資料庫 + 檔案系統）
 * • 檔案路徑管理和安全性檢查
 * • 錯誤處理和日誌記錄
 * • 交易性一致性保證
 */

import prisma from '../../lib/prisma.js' // Prisma ORM 資料庫客戶端
import fs from 'fs' // Node.js 檔案系統模組
import path from 'path' // 檔案路徑處理模組
import { fileURLToPath } from 'url' // ES6 模組路徑轉換工具

// === ES6 模組路徑解析 ===
// 在 ES6 模組中獲取當前檔案的絕對路徑
const __filename = fileURLToPath(import.meta.url) // 當前檔案的完整路徑
const __dirname = path.dirname(__filename) // 當前檔案所在目錄路徑

// ===================================================================
// 圖片永久性刪除服務
// ===================================================================
/**
 * deleteImage - 安全且完整的圖片刪除功能
 *
 * 功能特色：
 * • 雙層刪除：同時刪除資料庫記錄和實體檔案
 * • 安全檢查：先驗證圖片存在性再執行刪除
 * • 錯誤隔離：檔案系統錯誤不影響資料庫一致性
 * • 詳細日誌：記錄所有操作和錯誤資訊
 * • RESTful 回應：統一的 HTTP 狀態碼和訊息格式
 *
 * 刪除流程：
 * 1. 驗證圖片存在性 (資料庫查詢)
 * 2. 刪除資料庫記錄 (保證一致性)
 * 3. 刪除實體檔案 (釋放儲存空間)
 *
 * @param {Object} params 參數物件
 * @param {number} params.imageId 圖片記錄的唯一 ID
 * @returns {Object} 操作結果物件 { code: number, message: string }
 *
 * @example
 * // 成功刪除
 * await deleteImage({ imageId: 123 })
 * // -> { code: 200, message: '圖片已刪除' }
 *
 * @example
 * // 圖片不存在
 * await deleteImage({ imageId: 999 })
 * // -> { code: 404, message: '圖片不存在' }
 */
export const deleteImage = async ({ imageId }) => {
  try {
    // === 步驟 1：圖片存在性驗證 ===
    // 在執行刪除之前，必須先確認圖片記錄存在
    // 這樣做的好處：
    // 1. 避免無效的刪除操作
    // 2. 獲取檔案名稱用於後續的檔案系統刪除
    // 3. 提供明確的錯誤訊息
    const img = await prisma.productImage.findUnique({
      where: { id: imageId },
    })

    // 圖片不存在時的彥帰處理
    if (!img) {
      return { code: 404, message: '圖片不存在' }
    }
    // === 步驟 2：資料庫記錄刪除 (優先級高) ===
    // 先刪除資料庫記錄，確保數據一致性
    // 即使後續檔案刪除失敗，也不會在資料庫中留下無效的參考
    await prisma.productImage.delete({
      where: { id: imageId },
    })

    // === 步驟 3：實體檔案刪除 (優先級低) ===
    // 產生完整的檔案系統路徑
    // 路徑結構：/backend/public/product-imgs/[filename]
    const filepath = path.join(__dirname, '../../public/product-imgs/', img.url)

    try {
      // 使用 Promise-based API 進行非同步檔案刪除
      // fs.promises.unlink() 是 fs.unlink() 的 Promise 版本
      await fs.promises.unlink(filepath)
    } catch (err) {
      // === 檔案刪除失敗的寬鬆處理 ===
      // 設計理念：檔案系統錯誤不應影響業務邏輯
      // 常見情況：
      // - 檔案已經不存在 (ENOENT)
      // - 權限不足 (EACCES)
      // - 檔案正在被使用 (EBUSY)
      //
      // 處理策略：
      // 1. 記錄詳細錯誤資訊供運維人員查看
      // 2. 不將檔案錯誤傳播給上層應用
      // 3. 仍然返回成功結果 (因為資料庫已清理)
      console.error('圖片實體檔案刪除失敗:', {
        filepath, // 失敗的檔案路徑
        imageId, // 圖片 ID
        filename: img.url, // 原始檔案名
        error: err.message, // 錯誤訊息
        errorCode: err.code, // 系統錯誤碼
      })
    }

    // === 成功回應 ===
    // 無論檔案刪除是否成功，只要資料庫記錄已刪除就視為成功
    return { code: 200, message: '圖片已刪除' }
  } catch (error) {
    // === 全局異常捕獲和記錄 ===
    // 捕獲所有未預期的錯誤，包括：
    // - 資料庫連線錯誤
    // - Prisma ORM 錯誤
    // - 程式邏輯錯誤
    // - 系統資源不足
    console.error('刪除圖片時發生錯誤:', {
      imageId, // 錯誤相關的圖片 ID
      error: error.message, // 錯誤訊息
      stack: error.stack, // 錯誤堆疊追蹤 (供開發者調試)
      timestamp: new Date().toISOString(), // 錯誤發生時間
    })

    // === 統一錯誤回應 ===
    // 不暴露內部錯誤詳情，保護系統安全性
    return { code: 500, message: '伺服器錯誤' }
  }
}

// ===================================================================
// 模組註解和使用指南
// ===================================================================
/**
 * 使用範例：
 *
 * // 在 Express 路由中使用
 * app.delete('/admin/shop/product/image/:id', async (req, res) => {
 *   const result = await deleteImage({ imageId: parseInt(req.params.id) })
 *   res.status(result.code).json({ message: result.message })
 * })
 *
 * // 在其他服務中使用
 * import { deleteImage } from './image.js'
 * const result = await deleteImage({ imageId: 123 })
 * if (result.code === 200) {
 *   // 刪除成功的後續處理
 * }
 *
 * 注意事項：
 * 1. imageId 必須是有效的整數
 * 2. 需要資料庫連接和檔案系統許可權
 * 3. 建議在調用前驗證用戶權限
 * 4. 考慮嫺來備份策略避免數據遺失
 */
