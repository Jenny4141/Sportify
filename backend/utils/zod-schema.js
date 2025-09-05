// schemas.js
import { z } from 'zod'

export const idField = z.coerce
  .number({
    invalid_type_error: '格式錯誤',
    required_error: '必填欄位',
  })
  .int()
  .positive({ message: '請選擇有效選項' })

export const priceField = z
  .preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    z.coerce
      .number({
        invalid_type_error: '價格為必填欄位',
        required_error: '價格為必填欄位',
      })
      .positive({ message: '請輸入有效價格' })
  )
  .refine((v) => v !== undefined, { message: '價格為必填欄位' })

export const nameField = z
  .string()
  .nonempty({ message: '名稱為必填欄位' })
  .min(1, { message: '帳號至少 1 個字' })

export const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式須為 YYYY-MM-DD' })

export const timeField = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: '時間格式錯誤，請輸入HH:mm' })

// member, register 專用欄位
export const accountField = z
  .string()
  .nonempty({ message: '帳號為必填欄位' })
  .min(4, { message: '帳號至少 4 個字' })
export const emailField = z
  .string()
  .nonempty({ message: '電郵為必填欄位' })
  .email({ message: '電郵格式錯誤' })
export const passwordField = z
  .string()
  .nonempty({ message: '密碼為必填欄位' })
  .min(6, { message: '密碼至少 6 個字' })
export const phoneField = z
  .string()
  .regex(/^09\d{8}$/, { message: '手機號碼格式錯誤' })
  .optional()
  .or(z.literal(''))
export const genderField = z
  .enum(['male', 'female', 'none'])
  .optional()
  .or(z.literal(''))
export const addressField = z
  .string()
  .min(3, { message: '地址至少 3 個字' })
  .optional()
  .or(z.literal(''))
export const birthField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: '生日格式須為 YYYY-MM-DD' })
  .optional()
  .or(z.literal(''))

// 發票相關欄位
export const taxField = z
  .string()
  .regex(/^\d{8}$/)
  .optional()
  .or(z.literal(''))
  .or(z.null())

export const carrierField = z
  .string()
  .regex(/^\/[A-Z0-9.+-]{7}$/)
  .optional()
  .or(z.literal(''))
  .or(z.null())

export const memberSchema = z.object({
  account: accountField,
  email: emailField,
  password: passwordField,
  name: z.string().optional().or(z.literal('')),
  phone: phoneField,
  gender: genderField,
  birth: birthField,
  address: addressField,
})

// 註冊專用 schema
export const registerSchema = z.object({
  account: accountField,
  email: emailField,
  password: passwordField,
  name: nameField,
  phone: phoneField,
  gender: genderField,
  birth: birthField,
  address: addressField,
})

// 各 schema
export const centerSchema = z.object({
  name: nameField,
  locationId: idField,
  address: z.string().optional().or(z.literal('')),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  sportIds: z.array(idField).min(1, '至少要選擇一種運動項目'),
  images: z.array(z.any()).optional(), // 編輯時可能不重新上傳圖片
})

// 場館編輯 schema (可選圖片)
export const updateCenterSchema = z.object({
  name: nameField,
  locationId: idField,
  address: z.string().optional().or(z.literal('')),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  sportIds: z.array(idField).min(1, '至少要選擇一種運動項目'),
  images: z.array(z.any()).optional(),
  keepExistingImages: z.boolean().optional(), // 是否保留現有圖片
})

export const courtSchema = z.object({
  name: nameField,
  centerId: idField,
  sportId: idField,
})

export const timeSlotSchema = z.object({
  startTime: timeField,
  endTime: timeField,
  timePeriodId: idField,
})

export const courtTimeSlotSchema = z.object({
  courtId: idField,
  timeSlotId: idField,
  price: priceField,
})

export const reservationSchema = z.object({
  memberId: idField,
  courtTimeSlotId: z.array(idField).min(1, '至少要選擇一個時段'),
  date: dateField,
  statusId: idField,
  paymentId: idField,
  invoiceId: idField,
  tax: taxField,
  carrier: carrierField,
})

// 商城schema
export const productSchema = z.object({
  name: z.string().trim().min(1, '商品名稱為必填'),
  sport_id: z.string().nonempty('運動類型為必填'),
  brand_id: z.string().nonempty('品牌為必填'),
  price: z
    .string()
    .nonempty('價格為必填')
    .refine(
      (val) => !val || (/^\d+$/.test(val) && parseInt(val) > 0),
      '價格必須為正整數'
    ),
  stock: z
    .string()
    .nonempty('庫存為必填')
    .refine(
      (val) => !val || (/^\d+$/.test(val) && parseInt(val) >= 0),
      '庫存必須大於0'
    ),
  material: z.string().trim().min(1, '材質為必填'),
  size: z
    .string()
    .nonempty('尺寸為必填')
    .refine((val) => !val || (!isNaN(val) && Number(val) > 0), '尺寸必須大於0'),
  weight: z
    .string()
    .nonempty('重量為必填')
    .refine((val) => !val || (!isNaN(val) && Number(val) > 0), '重量必須大於0'),
  origin: z.string().trim().min(1, '產地為必填'),
  images: z.array(z.any()).min(1, '至少要有一張圖片'),
})

export const editProductSchema = z
  .object({
    name: z.string().trim().min(1, '商品名稱為必填'),
    sport_id: z.string().nonempty('運動類型為必填'),
    brand_id: z.string().nonempty('品牌為必填'),
    price: z
      .string()
      .nonempty('價格為必填')
      .refine(
        (val) => !val || (/^\d+$/.test(val) && parseInt(val) > 0),
        '價格必須為正整數'
      ),
    stock: z
      .string()
      .nonempty('庫存為必填')
      .refine(
        (val) => !val || (/^\d+$/.test(val) && parseInt(val) >= 0),
        '庫存必須大於0'
      ),
    material: z.string().trim().min(1, '材質為必填'),
    size: z
      .string()
      .nonempty('尺寸為必填')
      .refine(
        (val) => !val || (!isNaN(val) && Number(val) > 0),
        '尺寸必須大於0'
      ),
    weight: z
      .string()
      .nonempty('重量為必填')
      .refine(
        (val) => !val || (!isNaN(val) && Number(val) > 0),
        '重量必須大於0'
      ),
    origin: z.string().trim().min(1, '產地為必填'),
    existingImageCount: z.string().transform(Number),
    images: z.array(z.any()),
  })
  .refine((data) => data.existingImageCount + data.images.length > 0, {
    message: '至少要有一張圖片',
    path: ['images'],
  })

// #region === 訂單相關 Schema ===

// 購物車項目 schema
export const cartItemSchema = z.object({
  productId: z.coerce.number().int().positive('商品ID無效'),
  quantity: z.coerce
    .number()
    .int()
    .min(1, '數量至少為1')
    .max(99, '數量不能超過99'),
})

// 更新購物車項目 schema
export const updateCartItemSchema = z.object({
  quantity: z.coerce
    .number()
    .int()
    .min(0, '數量不能為負數')
    .max(99, '數量不能超過99'),
})

export const orderSchema = z
  .object({
    recipient: z.string().trim().min(1, '收件人姓名為必填'),
    phone: z.string().regex(/^09\d{8}$/, '手機號碼格式錯誤'),
    address: z.string().trim().optional(),
    storeName: z.string().trim().optional(),
    deliveryId: z.coerce.number().int().positive('請選擇配送方式'),
    paymentId: z.coerce.number().int().positive('請選擇付款方式'),
    invoiceData: z
      .object({
        invoiceId: z.coerce.number().int().positive('請選擇發票類型'),
        carrier: z.string().nullable().optional(),
        tax: z.string().nullable().optional(),
      })
      .optional(),
    memberId: z.coerce.number().int().positive('會員ID無效').optional(),
    statusId: z.coerce.number().int().positive('訂單狀態無效').optional(),
    items: z.array(z.any()).min(1, '訂單必須至少包含一項商品').optional(),
  })
  .refine(
    (data) => {
      // 宅配時必填地址
      if (data.deliveryId === 3) {
        return data.address && data.address.trim().length >= 5
      }
      return true
    },
    {
      message: '宅配訂單收件地址為必填，至少5個字',
      path: ['address'],
    }
  )
  .refine(
    (data) => {
      // 7-11 取貨必填門市名稱（去掉至少2字限制）
      if (data.deliveryId === 1) {
        return !!data.storeName?.trim()
      }
      return true
    },
    {
      message: '7-11 取貨門市名稱為必填',
      path: ['storeName'],
    }
  )
  .refine(
    (data) => {
      // 驗證發票載具與統編格式
      if (data.invoiceData?.carrier && data.invoiceData.carrier.trim() !== '') {
        return /^\/[A-Z0-9+-]{7}$/.test(data.invoiceData.carrier)
      }
      if (data.invoiceData?.tax && data.invoiceData.tax.trim() !== '') {
        return /^\d{8}$/.test(data.invoiceData.tax)
      }
      return true
    },
    {
      message:
        '載具號碼格式錯誤（需以/開頭且為8碼）或統一編號格式錯誤（需為8位數字）',
      path: ['invoiceData'],
    }
  )
// 個人資料更新專用 schema（不包含 account, email, password）
export const profileUpdateSchema = z.object({
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
  avatar: z.string().optional(), // 新增 avatar 欄位
})

// #endregion

// #region === 課程相關 Schema ===

// 星期幾的驗證（1-7，1=星期一，7=星期日）
export const dayOfWeekField = z.coerce
  .number()
  .int()
  .min(1, '星期必須在1-7之間')
  .max(7, '星期必須在1-7之間')

// 容量相關欄位
export const capacityField = z.coerce
  .number()
  .int()
  .min(1, '容量至少為1人')
  .max(100, '容量不能超過100人')

// 課程標題欄位
export const titleField = z
  .string()
  .trim()
  .min(1, '課程標題為必填欄位')
  .max(100, '課程標題不能超過100字')

// 課程描述欄位
export const descriptionField = z.string().trim().optional().or(z.literal(''))

// 課程 Schema
export const lessonSchema = z
  .object({
    title: titleField,
    description: descriptionField,
    sportId: idField,
    courtId: idField,
    coachId: idField,
    timeSlotId: idField,
    dayOfWeek: dayOfWeekField,
    startDate: dateField,
    endDate: dateField,
    price: priceField,
    maxCapacity: capacityField,
    currentCount: z.coerce.number().int().min(0).default(0).optional(),
  })
  .refine(
    (data) => {
      // 檢查結束日期必須在開始日期之後
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      return end > start
    },
    {
      message: '結束日期必須在開始日期之後',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      // 檢查目前報名人數不能超過最大容量
      if (data.currentCount !== undefined) {
        return data.currentCount <= data.maxCapacity
      }
      return true
    },
    {
      message: '目前報名人數不能超過最大容量',
      path: ['currentCount'],
    }
  )

// 課程報名 Schema
export const bookingSchema = z.object({
  memberId: z.coerce.bigint().positive('會員ID無效'),
  lessonId: idField,
  price: priceField,
  paymentId: idField,
  invoiceId: idField,
  tax: taxField.optional(),
  carrier: carrierField.optional(),
  statusId: idField.optional(),
})

// 更新課程報名 Schema（用於編輯時，某些欄位可能不需要）
export const updateBookingSchema = z.object({
  price: priceField.optional(),
  paymentId: idField.optional(),
  invoiceId: idField.optional(),
  tax: taxField.optional(),
  carrier: carrierField.optional(),
  statusId: idField.optional(),
})

// #endregion
