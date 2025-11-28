// ===================================================================
// 商品圖片上傳工具模組 - Multer 配置和檔案處理
// ===================================================================
/**
 * 此模組提供完整的商品圖片上傳功能，包括：
 * • 檔案類型驗證和安全性檢查
 * • 自動檔名產生和衝突避免
 * • 結構化檔案儲存管理
 * • UUID 唯一性保證
 * • 時間戳追蹤和版本控制
 */

import multer from 'multer' // Node.js 檔案上傳中間件
import { v4 as uuidv4 } from 'uuid' // UUID 產生工具，確保檔名唯一性

// ===================================================================
// 支援的圖片格式定義
// ===================================================================
/**
 * extMap - 允許的圖片 MIME 類型和對應副檔名映射
 *
 * 選擇理由：
 * • PNG: 適合透明背景和高品質圖片
 * • JPEG: 最常用的圖片格式，適合照片和複雜圖像
 * • WebP: 現代瀏覽器支援，更好的壓縮效果
 *
 * 安全性考量：
 * • 只允許圖片類型，避免惡意檔案上傳
 * • 不支援 SVG 等可執行格式，避免 XSS 攻擊
 */
const extMap = {
  'image/png': '.png', // PNG 格式：無損壓縮，支援透明
  'image/jpeg': '.jpg', // JPEG 格式：有損壓縮，適合照片
  'image/webp': '.webp', // WebP 格式：現代格式，優秀壓縮效果
}

// ===================================================================
// 檔案上傳安全性篩選器
// ===================================================================
/**
 * fileFilter - 上傳檔案的安全性檢查函數
 *
 * 功能特色：
 * • MIME 類型驗證：只允許預先定義的圖片類型
 * • 快速拒絕：在檔案上傳前即驗證，節省資源
 * • 安全防護：防止惡意檔案上傳到伺服器
 *
 * @param {Object} req Express 請求物件
 * @param {Object} file Multer 檔案物件，包含 mimetype 等資訊
 * @param {Function} callback 回調函數 (error, accepted)
 */
const fileFilter = (req, file, callback) => {
  // 使用 !!extMap[file.mimetype] 將結果轉換為布林值
  // - 如果 MIME 類型在 extMap 中存在，返回 true (接受)
  // - 如果 MIME 類型不在 extMap 中，返回 false (拒絕)
  callback(null, !!extMap[file.mimetype])
}

// ===================================================================
// 檔案儲存配置
// ===================================================================
/**
 * storage - Multer 磁碟儲存配置
 *
 * 設計理念：
 * • 結構化儲存：統一放置在 public/product-imgs 目錄
 * • 唯一性保證：使用時間戳 + UUID 避免檔名衝突
 * • 可識別性：檔名包含 product 字首，方便管理
 * • 時間追蹤：檔名包含上傳時間戳，方便排序和追蹤
 */
const storage = multer.diskStorage({
  // === 儲存目錄配置 ===
  destination: (req, file, callback) => {
    // 檔案儲存路徑：相對於專案根目錄
    // 這個路徑必須存在，否則 Multer 會拋出錯誤
    callback(null, 'public/product-imgs')
  },

  // === 檔案命名策略 ===
  filename: (req, file, callback) => {
    // === 檔名組成元素 ===
    const timestamp = Date.now() // Unix 時間戳（毫秒）
    const uuid = uuidv4() // UUID v4 唯一識別碼
    const ext = extMap[file.mimetype] // 根據 MIME 類型獲取正確副檔名

    // === 檔名格式：product-<timestamp>-<uuid>.<ext> ===
    // 範例：product-1703123456789-f47ac10b-58cc-4372-a567-0e02b2c3d479.jpg
    const name = `product-${timestamp}-${uuid}${ext}`

    callback(null, name)
  },
})

// ===================================================================
// Multer 中間件配置導出
// ===================================================================
/**
 * 組合完整的 Multer 配置並導出
 *
 * 配置項目：
 * • fileFilter: 檔案類型篩選器
 * • storage: 磁碟儲存配置
 *
 * 使用方式：
 * 1. 單檔上傳：upload.single('image')
 * 2. 多檔上傳：upload.array('images', 5)
 * 3. 欄位組合：upload.fields([{ name: 'images', maxCount: 5 }])
 *
 * 限制設定：
 * - 檔案大小：由 Express 或程序其他部分控制
 * - 檔案數量：由調用方指定 (single/array/fields)
 * - 檔案類型：由 fileFilter 控制
 *
 * @example
 * // 在 Express 路由中使用
 * import upload from './upload-imgs.js'
 *
 * app.post('/admin/shop/product/image',
 *   upload.single('image'),
 *   (req, res) => {
 *     console.log('上傳檔案:', req.file)
 *     res.json({ filename: req.file.filename })
 *   }
 * )
 *
 * @example
 * // 多檔上傳
 * app.post('/admin/shop/product/images',
 *   upload.array('images', 5),
 *   (req, res) => {
 *     console.log('上傳檔案:', req.files)
 *     const filenames = req.files.map(f => f.filename)
 *     res.json({ filenames })
 *   }
 * )
 */
export default multer({
  fileFilter, // 檔案篩選器：控制允許的檔案類型
  storage, // 儲存配置：控制檔案儲存位置和命名
})
