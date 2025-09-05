/* 避免開發環境中產生多個 PrismaClient 實例
在開發模式下，若每次 import 都建立新實例，會導致過多連線（Prisma 官方稱之為 “too many clients” 問題）。
使用 global.prisma 做記憶緩存的技巧，可以確保整個專案只用到一個共用 PrismaClient 實例。 */

import { PrismaClient } from '@prisma/client'

const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV === 'development') global.prisma = prisma

export default prisma
