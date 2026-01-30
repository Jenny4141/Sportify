import express from 'express'

const router = express.Router()

router.post('/', (req, res) => {
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
