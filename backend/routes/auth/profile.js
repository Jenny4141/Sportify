import express from 'express'
import { getItemData, updateProfile } from '../../services/member.js'
import { jwtMiddleware } from '../../utils/jwt-middleware.js'
import { profileUpdateSchema } from '../../utils/zod-schema.js'
import prisma from '../../lib/prisma.js'

const router = express.Router()

// 取得個人資料
router.get('/', jwtMiddleware, async (req, res) => {
  const output = {
    success: false,
    code: 0,
    issues: [],
  }

  try {
    const result = await getItemData(req.user.id)

    if (result.success) {
      output.success = true
      output.code = 200
      output.user = result.record
    } else {
      output.code = 404
      output.issues = [{ message: '找不到用戶資料' }]
    }
  } catch (error) {
    console.error('取得個人資料錯誤：', error)
    output.code = 500
    output.issues = [{ message: '伺服器發生錯誤' }]
  }

  res.status(output.code).json(output)
})

// 更新個人資料
router.put('/', jwtMiddleware, async (req, res) => {
  const output = {
    success: false,
    code: 0,
    issues: [],
  }

  try {
    // Zod 驗證
    const zodResult = profileUpdateSchema.safeParse(req.body)
    if (!zodResult.success) {
      output.code = 400
      output.issues = zodResult.error.issues
      return res.status(400).json(output)
    }

    const result = await updateProfile(req.user.id, zodResult.data)

    if (result.success) {
      // 使用 service 回傳的更新後資料
      const updatedUser = await prisma.member.findUnique({
        where: { id: BigInt(req.user.id) },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          phone: true,
          gender: true,
          birth: true,
          address: true,
        },
      })

      output.success = true
      output.code = 200
      output.message = '個人資料更新成功'
      output.user = {
        ...updatedUser,
        id: updatedUser.id.toString(),
      }
    } else {
      output.code = result.code || 400
      output.issues = result.issues || [{ message: '更新失敗' }]
    }
  } catch (error) {
    console.error('更新個人資料錯誤：', error)
    output.code = 500
    output.issues = [{ message: '伺服器發生錯誤' }]
  }

  res.status(output.code).json(output)
})

export default router
