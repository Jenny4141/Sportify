// 核心模組
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { readdir, stat } from 'fs/promises'
import dotenv from 'dotenv'
import session from 'express-session'

// 資料庫相關模組
import db from '../utils/connect-mysql.js'

// utlis
import { safeJsonMiddleware } from '../utils/safe-json-middleware.js'
import { jwtMiddleware } from '../utils/jwt-middleware.js'
import { adminOnlyMiddleware } from '../utils/admin-only-middleware.js'
import joinRequestsRouter from '../routes/team/joinRequests.js'
import membersRouter from '../routes/team/members.js'
import calendarMarksRouter from '../routes/team/calendarMarks.js'
import messagesRouter from '../routes/team/messages.js'

// #region 全域設定 ========================================================================

// 讀取 env 全域變數
dotenv.config()

// 初始化 Express 應用
const app = express()

// 設定 Session
app.use(
  session({
    // key: "session_cookie_name",
    secret: process.env.SESSION_SECRET,
    // store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // 本地開發時應該關閉 secure，否則 cookie 不會存下來
      sameSite: 'lax', // 預設即可，避免被拒收（你也可寫明）
      maxAge: 60 * 60 * 1000, // 建議加上有效期，例如 1 小時
    },
  })
)

// 設定白名單，只允許特定網址存取
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
const whiteList = frontendUrl.split(',')
// 設定 CORS
app.use(
  cors({
    origin: whiteList,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
)

// 設定全域中介軟體 middleware
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true })) // x-www-form-urlencoded 解析
app.use(express.json()) // JSON 解析
app.use(safeJsonMiddleware) // BigInt 解析

// 設定靜態檔案服務 - 商品圖片
// 不論用「後台 API 路徑」或「純靜態路徑」都能正常顯示圖片
app.use(
  '/api/admin/shop/product/image',
  express.static(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../public/product-imgs'
    )
  )
)
app.use(
  '/shop/product/image',
  express.static(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../public/product-imgs'
    )
  )
)

// 設定靜態檔案服務 - 頭像圖片
app.use(
  '/api/auth/avatar',
  express.static(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/avatars')
  )
)

// JWT 驗證中介軟體
app.use('/api/admin', jwtMiddleware, adminOnlyMiddleware)

// #endregion 全域設定

// #region 頂層 API  ==================================================================

// 根路由預設測試畫面
// app.get('/', (req, res) => res.send('Express server is running.'))

// #endregion 頂層 API

// #region 引入路由模組 ================================================================

/* 載入routes中的各路由檔案，並套用api路由
目前可以讀取routes資料夾中的所有檔案，可以無限深度支援，以下為範例:
  routes/index.js → /api/
  routes/admin/index.js → /api/admin
  routes/admin/members.js → /api/admin/members
  routes/admin/venue/center.js → /api/admin/venue/center */

// 取得目前檔案所在的絕對路徑
const __dirname = path.dirname(fileURLToPath(import.meta.url))
// 組出 routes/ 資料夾的實際絕對路徑
const routePath = path.join(__dirname, '..', 'routes')
// API 的統一 prefix。最終會讓路由掛載在 /api/xxxxx
const apiPath = '/api'

// 遞迴抓所有 js 檔路徑，並同時記錄路由階層
async function loadRoutes(dir, prefix = '') {
  // 抓出該層資料夾下所有檔案與資料夾的名稱（不會帶路徑）
  const entries = await readdir(dir)

  for (const entry of entries) {
    // 組出完整路徑，並用 stat() 來確認目前項目是「檔案」還是「資料夾」
    const fullPath = path.join(dir, entry)
    const stats = await stat(fullPath)

    // 動態建立出「路由路徑」並以 ES module 方式匯入檔案內容，最後用 app.use() 掛到對應 API path 上
    if (stats.isFile() && entry.endsWith('.js')) {
      const route = path
        .join(prefix, entry.replace('.js', '')) // 把檔名後綴 .js 拿掉
        .replace(/\\/g, '/') // 為了兼容 Windows 的路徑分隔符
        .replace(/\/index$/, '') // 特別處理 index.js → 根路由

      const module = await import(pathToFileURL(fullPath)) // 動態引入該路由模組
      app.use(`${apiPath}/${route}`, module.default) // 套用到 app 上
    }

    // 遞迴進子目錄，讓你支援無限巢狀層級的 routes/ 資料夾
    if (stats.isDirectory()) {
      await loadRoutes(fullPath, path.join(prefix, entry))
    }
  }
}
// 最後呼叫一次即可讀入全部路由
await loadRoutes(routePath)

// #endregion 引入路由模組

// #region 測試 API  =====================================================

// #region 偵聽伺服器 =====================================================

const port = process.env.WEB_PORT || 3002 // 使用環境變數
// 手動掛載 join-requests 路由
app.use('/api/team/join-requests', joinRequestsRouter)
app.use('/api/team/members', membersRouter)
app.use('/api/team/calendar-marks', calendarMarksRouter)
app.use('/api/team/messages', messagesRouter);

// Server 偵聽
app.listen(port, () => {
  console.log(`Express server 啟動 port: ${port}`)
})
