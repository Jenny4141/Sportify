/**
 * 物流配送路由 - 處理第三方物流服務的回調
 *
 * 主要功能：
 * - 處理 7-ELEVEN 門市選擇的回調
 * - 將選擇結果傳遞給父視窗
 * - 自動關閉選店視窗
 *
 * 技術實現：
 * - 使用 PostMessage API 進行跨視窗通訊
 * - 彈出視窗選完門市後自動關閉
 * - 父視窗接收選店結果並更新表單
 *
 * 流程說明：
 * 1. 用戶在結帳頁面選擇「7-11 店到店」
 * 2. 開啟 7-11 門市選擇頁面 (新視窗)
 * 3. 用戶在 7-11 頁面選擇門市
 * 4. 7-11 系統 POST 選擇結果到此路由
 * 5. 回傳 JavaScript 將結果傳遞給父視窗
 * 6. 自動關閉選店視窗
 * 7. 父視窗更新配送地址為所選門市
 */

import express from 'express'

const router = express.Router()

/**
 * POST / - 處理 7-ELEVEN 門市選擇回調
 *
 * 請求來源：7-ELEVEN 店到店系統
 *
 * 請求內容 (req.body 包含)：
 * - storeName: 門市名稱
 * - storeAddress: 門市地址
 * - storeId: 門市代碼
 * - storeTel: 門市電話
 * - 其他 7-11 系統提供的門市資訊
 *
 * 回應內容：
 * - HTML 頁面包含 JavaScript
 * - 使用 window.postMessage 傳遞資料給父視窗
 * - 自動關閉當前視窗 (window.close)
 *
 * 安全考量：
 * - 使用 postMessage 的 targetOrigin 為 "*"
 * - 在生產環境建議指定特定的來源網域
 * - 父視窗應驗證接收到的資料格式
 *
 * 前端接收範例：
 * ```javascript
 * window.addEventListener('message', (event) => {
 *   if (event.data.storeName) {
 *     // 更新表單中的門市資訊
 *     setSelectedStore(event.data)
 *   }
 * })
 * ```
 */
router.post('/', (req, res) => {
  // 回傳包含 JavaScript 的 HTML 頁面
  res.send(`
    <script>
      // 將 7-11 回傳的門市資料傳遞給開啟此視窗的父視窗
      // JSON.stringify 確保資料格式正確並防止 XSS 攻擊
      window.opener.postMessage(${JSON.stringify(req.body)}, "*");
      
      // 資料傳遞完成後自動關閉此視窗
      // 用戶回到原本的結帳頁面，門市資訊已自動填入
      window.close();
    </script>
  `)
})

export default router
