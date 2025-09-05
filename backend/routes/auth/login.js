import express from 'express'
import prisma from '../../lib/prisma.js'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'mySecret'

// *** zod 建立 Schema 驗證規則
const loginSchema = z.object({
  email: z
    .string()
    .nonempty({ message: '電郵為必填欄位' })
    .email({ message: '電郵格式錯誤' }),
  password: z
    .string()
    .nonempty({ message: '密碼為必填欄位' })
    .min(6, { message: '密碼至少 6 個字' }), // 改為與註冊一致
})

// *** 渲染 login 頁面
router.get('/', (req, res) => res.send('Login is running.'))

// *** login API 路由
router.post('/', async (req, res) => {
  const output = {
    success: false,
    bodyData: req.body,
    code: 0,
    issues: [],
  }

  const { email, password } = req.body

  // Zod 驗證
  const zodResult = loginSchema.safeParse({
    email,
    password,
  })

  if (!zodResult.success) {
    if (zodResult.error?.issues?.length) {
      output.issues = zodResult.error.issues
    }
    return res.status(400).json(output)
  }

  try {
    // 使用 Prisma 查詢會員資料
    const user = await prisma.member.findUnique({
      where: { email },
    })

    // 查無帳號
    if (!user) {
      output.issues = [{ path: ['email'], message: '查無此帳號' }]
      return res.status(400).json(output)
    }

    // 密碼錯誤
    if (!(await bcrypt.compare(password, user.password))) {
      output.issues = [{ path: ['password'], message: '密碼錯誤' }]
      return res.status(400).json(output)
    }

    // 設定 token
    const payload = {
      id: user.id.toString(), // BigInt 轉字串
      email: user.email,
      name: user.name,
      role: user.role,
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      success: true,
      token, // 回傳 token 給前端
      user: payload,
    })
  } catch (err) {
    console.error('登入錯誤：', err)
    res.status(500).json({
      success: false,
      error: '伺服器發生錯誤，請稍後再試',
    })
  }
})

export default router
