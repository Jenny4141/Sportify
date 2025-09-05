import express from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'mySecret'

// *** zod 建立 Schema 驗證規則
const registerSchema = z
  .object({
    email: z
      .string()
      .nonempty({ message: '電郵為必填欄位' })
      .email({ message: '電郵格式錯誤' }),
    password: z
      .string()
      .nonempty({ message: '密碼為必填欄位' })
      .min(6, { message: '密碼至少 6 個字' }),
    confirmPassword: z.string().nonempty({ message: '確認密碼為必填欄位' }),
    name: z
      .string()
      .nonempty({ message: '姓名為必填欄位' })
      .min(2, { message: '姓名至少 2 個字' }),
    phone: z
      .string()
      .regex(/^09\d{8}$/, { message: '手機號碼格式錯誤' })
      .optional()
      .or(z.literal('')),
    gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
    birth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: '生日格式須為 YYYY-MM-DD' })
      .optional()
      .or(z.literal('')),
    address: z
      .string()
      .min(3, { message: '地址至少 3 個字' })
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '密碼與確認密碼不相符',
    path: ['confirmPassword'],
  })

// *** register API 路由
router.post('/', async (req, res) => {
  const output = {
    success: false,
    bodyData: req.body,
    insertId: 0,
    code: 0,
    issues: [],
  }

  let {
    email,
    password,
    confirmPassword,
    name,
    phone,
    gender,
    birth,
    address,
  } = req.body

  // Zod 驗證
  const zodResult = registerSchema.safeParse({
    email,
    password,
    confirmPassword,
    name,
    phone,
    gender,
    birth,
    address,
  })

  if (!zodResult.success) {
    if (zodResult.error?.issues?.length) {
      output.issues = zodResult.error.issues
    }
    return res.status(400).json(output)
  }

  try {
    // 檢查是否已存在
    const exists = await prisma.member.findUnique({ where: { email } })
    if (exists) {
      output.issues = [{ path: ['email'], message: '此 email 已註冊' }]
      return res.status(400).json(output)
    }

    // 密碼加密
    const hashedPassword = await bcrypt.hash(password, 10)

    // 建立用戶
    const user = await prisma.member.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        gender: gender || null,
        birth: birth ? new Date(birth) : null,
        address: address || null,
      },
    })

    // 生成 JWT token
    const token = jwt.sign(
      {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    output.success = true
    output.insertId = user.id
    output.token = token
    output.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }

    res.json(output)
  } catch (error) {
    console.error('註冊錯誤：', error)
    res.status(500).json({
      success: false,
      error: '伺服器發生錯誤，請稍後再試',
    })
  }
})

export default router
