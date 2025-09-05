import express from 'express'
import admin from '../../config/firebase-admin.js'
import prisma from '../../lib/prisma.js'
import { z } from 'zod'
import jwt from 'jsonwebtoken'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'mySecret'

// *** zod 建立 Schema 驗證規則
const firebaseLoginSchema = z.object({
  idToken: z.string().nonempty({ message: 'Firebase ID Token 為必填欄位' }),
})

// *** 渲染 firebase login 頁面
router.get('/', (req, res) => res.send('Firebase Login is running.'))

// *** Firebase 登入 API 路由
router.post('/', async (req, res) => {
  const output = {
    success: false,
    bodyData: req.body,
    code: 0,
    issues: [],
  }

  const { idToken } = req.body

  // Zod 驗證
  const zodResult = firebaseLoginSchema.safeParse({ idToken })

  if (!zodResult.success) {
    if (zodResult.error?.issues?.length) {
      output.issues = zodResult.error.issues
    }
    return res.status(400).json(output)
  }

  try {
    // 驗證 Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken)

    if (!decodedToken) {
      output.issues = [{ path: ['idToken'], message: '無效的 Firebase Token' }]
      return res.status(401).json(output)
    }

    const { uid, email, name, picture } = decodedToken

    // 檢查用戶是否已存在於資料庫
    let user = await prisma.member.findUnique({
      where: { email },
    })

    if (!user) {
      // 如果用戶不存在，創建新用戶
      user = await prisma.member.create({
        data: {
          email,
          name: name || email.split('@')[0], // 如果沒有名字，使用 email 前綴
          password: '', // Firebase 用戶不需要密碼
          role: 'user', // 預設角色
          avatar: picture || null, // Firebase 提供的頭像
          firebaseUid: uid, // 儲存 Firebase UID
          emailVerified: decodedToken.email_verified || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
    } else {
      // 如果用戶存在，更新 Firebase UID 和頭像
      user = await prisma.member.update({
        where: { id: user.id },
        data: {
          firebaseUid: uid,
          avatar: picture || user.avatar,
          emailVerified: decodedToken.email_verified || user.emailVerified,
          updatedAt: new Date(),
        },
      })
    }

    // 設定 JWT token
    const payload = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      firebaseUid: uid,
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        firebaseUid: uid,
        emailVerified: user.emailVerified,
      },
      firebase_user: {
        uid,
        email,
        name,
        picture,
        email_verified: decodedToken.email_verified,
      },
    })
  } catch (err) {
    console.error('Firebase 登入錯誤：', err)
    console.error('錯誤詳情：', {
      message: err.message,
      code: err.code,
      stack: err.stack,
    })

    // 處理 Firebase 驗證錯誤
    if (err.code === 'auth/id-token-expired') {
      output.issues = [{ path: ['idToken'], message: 'Firebase Token 已過期' }]
      return res.status(401).json(output)
    }

    if (err.code === 'auth/id-token-revoked') {
      output.issues = [
        { path: ['idToken'], message: 'Firebase Token 已被撤銷' },
      ]
      return res.status(401).json(output)
    }

    // 處理 Firebase 初始化錯誤
    if (err.code === 'app/no-app') {
      console.error('Firebase 應用程式未初始化')
      return res.status(500).json({
        success: false,
        error: 'Firebase 設定錯誤，請檢查環境變數',
      })
    }

    // 處理其他 Firebase 錯誤
    if (err.code && err.code.startsWith('auth/')) {
      return res.status(401).json({
        success: false,
        error: `Firebase 驗證錯誤: ${err.message}`,
      })
    }

    res.status(500).json({
      success: false,
      error: '伺服器發生錯誤，請稍後再試',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    })
  }
})

// *** 驗證 Firebase Token 的中間件
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '缺少 Firebase Token',
      })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await admin.auth().verifyIdToken(idToken)

    req.firebaseUser = decodedToken
    next()
  } catch (err) {
    console.error('Firebase Token 驗證錯誤：', err)
    res.status(401).json({
      success: false,
      error: '無效的 Firebase Token',
    })
  }
}

export default router
