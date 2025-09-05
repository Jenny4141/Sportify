'use client'

// react
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
// ui components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
// api
import { getProductImageUrl } from '@/api/admin/shop/image'
import {
  createProduct,
  fetchProduct,
  updateProduct,
  fetchBrandOptions,
  fetchSportOptions,
} from '@/api'
// others
import { toast } from 'sonner'

export default function ProductForm({
  mode = 'add', // 'add' 或 'edit'
  productId = null,
  title,
  description,
  submitButtonText,
  loadingButtonText,
}) {
  // ===== 路由和搜尋參數處理 =====
  const router = useRouter()

  // ===== 組件狀態管理 =====
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(mode === 'edit')
  const [brands, setBrands] = useState([])
  const [sports, setSports] = useState([])
  const [errors, setErrors] = useState({})
  const [deletedImageIds, setDeletedImageIds] = useState([]) // 追蹤要刪除的圖片 ID
  const [formData, setFormData] = useState({
    name: '',
    sport_id: '',
    brand_id: '',
    price: '',
    stock: '',
    material: '',
    size: '',
    weight: '',
    origin: '',
    images: [],
    existingImages: [],
  })

  // ===== 副作用處理 =====
  useEffect(() => {
    if (mode !== 'edit' || !productId) {
      setIsDataLoading(false)
      return
    }

    const loadProductData = async () => {
      try {
        setIsDataLoading(true)
        const productData = await fetchProduct(productId)

        if (productData.code === 200) {
          const data = productData.data

          // 設定表單資料
          setFormData({
            name: data.name || '',
            sport_id:
              data.sportId?.toString() || data.sport_id?.toString() || '',
            brand_id:
              data.brandId?.toString() || data.brand_id?.toString() || '',
            price: data.price?.toString() || '',
            stock: data.stock?.toString() || '',
            material: data.material || '',
            size: data.size || '',
            weight: data.weight?.toString() || '',
            origin: data.origin || '',
            images: [],
            existingImages: data.images || [],
          })

          // 重置刪除列表
          setDeletedImageIds([])
        } else {
          console.log('API 回應格式不正確或沒有資料:', productData)
        }
      } catch (error) {
        console.error('載入商品資料失敗:', error)
        toast.error('載入商品資料失敗')
        router.push('/admin/shop/product')
      } finally {
        setIsDataLoading(false)
      }
    }

    loadProductData()
  }, [mode, productId, router])

  useEffect(() => {
    const loadData = async () => {
      try {
        const brandData = await fetchBrandOptions()
        setBrands(brandData.rows || [])

        const sportData = await fetchSportOptions()
        setSports(sportData.rows || [])
      } catch (error) {
        console.error('載入選項失敗:', error)
        toast.error('載入選項失敗')
      }
    }
    loadData()
  }, [])

  // ===== 事件處理函數 =====
  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    setFormData((prev) => ({
      ...prev,
      images: files,
    }))
  }

  const handleRemoveImage = (index, isExisting = false) => {
    if (isExisting) {
      // 取得要刪除的圖片資訊
      const imageToDelete = formData.existingImages[index]
      const imageId =
        typeof imageToDelete === 'object' ? imageToDelete.id : null

      // 如果有圖片 ID，添加到刪除列表
      if (imageId) {
        setDeletedImageIds((prev) => [...prev, imageId])
        console.log('添加到刪除列表的圖片 ID:', imageId) // Debug 用
      }

      // 從 UI 中移除
      setFormData((prev) => ({
        ...prev,
        existingImages: prev.existingImages.filter((_, i) => i !== index),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Debug: 送出前 log formData 和要刪除的圖片 ID
    console.log('送出前 formData:', formData)
    console.log('要刪除的圖片 IDs:', deletedImageIds) // Debug 用

    // 清除之前的錯誤訊息
    setErrors({})

    setIsLoading(true)

    try {
      // 準備提交的表單數據
      const submitData = new FormData()

      // 添加表單欄位
      Object.keys(formData).forEach((key) => {
        if (
          key !== 'images' &&
          key !== 'existingImages' &&
          formData[key] !== ''
        ) {
          submitData.append(key, formData[key])
        }
      })

      // 添加圖片檔案
      formData.images.forEach((image) => {
        submitData.append('images', image)
      })

      // 編輯模式時添加現有圖片數量和要刪除的圖片 ID
      if (mode === 'edit') {
        submitData.append(
          'existingImageCount',
          formData.existingImages.length.toString()
        )

        // 如果有要刪除的圖片，加入 deleteImageIds
        if (deletedImageIds.length > 0) {
          submitData.append('deleteImageIds', deletedImageIds.join(','))
          console.log('傳送要刪除的圖片 IDs:', deletedImageIds.join(',')) // Debug 用
        }
      }

      let result

      if (mode === 'edit' && productId) {
        // 編輯模式
        result = await updateProduct(productId, submitData)
      } else {
        // 新增模式
        result = await createProduct(submitData)
      }

      console.log('API 回應:', result) // Debug 用

      if (result.success || result.code === 200) {
        toast.success(mode === 'edit' ? '編輯商品成功！' : '新增商品成功！')
        router.push('/admin/shop/product')
      } else {
        toast.error(result.message || '操作失敗')
      }
    } catch (error) {
      // axios 400 驗證錯誤處理
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data
      ) {
        const result = error.response.data
        const errs = {}
        const shown = {}
        result.issues?.forEach((issue) => {
          const field = issue.path[0]
          if (shown[field]) return
          errs[field] = issue.message
          shown[field] = true
        })
        setErrors(errs)
        if (Object.keys(errs).length === 0) {
          toast.error(result.message || '輸入資料有誤')
        }
        return
      }
      console.error(mode === 'edit' ? '編輯商品失敗:' : '新增商品失敗:', error)
      // 根據不同的錯誤類型顯示不同的訊息
      if (
        error.message.includes('network') ||
        error.message.includes('fetch')
      ) {
        toast.error('網路連線錯誤，請檢查網路狀態')
      } else if (error.message.includes('400')) {
        toast.error('輸入資料有誤，請檢查後重試')
      } else if (error.message.includes('500')) {
        toast.error('伺服器錯誤，請稍後再試')
      } else {
        toast.error(
          (mode === 'edit' ? '編輯商品失敗：' : '新增商品失敗：') +
            (error.message || '未知錯誤')
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/shop/product')
  }

  // ===== 載入和錯誤狀態處理 =====
  if (isDataLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>載入中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                商品名稱
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="請輸入商品名稱"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sport_id">
                運動種類
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.sport_id}
                onValueChange={(value) => handleInputChange('sport_id', value)}
              >
                <SelectTrigger
                  className={errors.sport_id ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="請選擇運動種類" />
                </SelectTrigger>
                <SelectContent>
                  {sports.length === 0 ? (
                    <div className="px-3 py-2 text-gray-400">沒有符合資料</div>
                  ) : (
                    sports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id.toString()}>
                        {sport.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.sport_id && (
                <p className="text-sm text-red-500 mt-1">{errors.sport_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand_id">
                品牌
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.brand_id}
                onValueChange={(value) => handleInputChange('brand_id', value)}
              >
                <SelectTrigger
                  className={errors.brand_id ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="請選擇品牌" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.brand_id && (
                <p className="text-sm text-red-500 mt-1">{errors.brand_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">
                單價
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="請輸入單價"
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && (
                <p className="text-sm text-red-500 mt-1">{errors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">
                庫存
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                placeholder="請輸入庫存"
                className={errors.stock ? 'border-red-500' : ''}
              />
              {errors.stock && (
                <p className="text-sm text-red-500 mt-1">{errors.stock}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="material">材質</Label>
              <Input
                id="material"
                type="text"
                value={formData.material}
                onChange={(e) => handleInputChange('material', e.target.value)}
                placeholder="請輸入材質"
                className={errors.material ? 'border-red-500' : ''}
              />
              {errors.material && (
                <p className="text-sm text-red-500 mt-1">{errors.material}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">尺寸</Label>
              <Input
                id="size"
                type="text"
                value={formData.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
                placeholder="請輸入尺寸"
                className={errors.size ? 'border-red-500' : ''}
              />
              {errors.size && (
                <p className="text-sm text-red-500 mt-1">{errors.size}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">重量</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                placeholder="請輸入重量"
                className={errors.weight ? 'border-red-500' : ''}
              />
              {errors.weight && (
                <p className="text-sm text-red-500 mt-1">{errors.weight}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="origin">產地</Label>
              <Input
                id="origin"
                type="text"
                value={formData.origin}
                onChange={(e) => handleInputChange('origin', e.target.value)}
                placeholder="請輸入產地"
                className={errors.origin ? 'border-red-500' : ''}
              />
              {errors.origin && (
                <p className="text-sm text-red-500 mt-1">{errors.origin}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">商品圖片</Label>
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className={errors.images ? 'border-red-500' : ''}
              />
              {errors.images && (
                <p className="text-sm text-red-500 mt-1">{errors.images}</p>
              )}

              {/* 已選擇圖片預覽 */}
              {formData.images.length > 0 && (
                <div className="mt-2">
                  <Label>已選擇圖片:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={URL.createObjectURL(image)}
                          alt={`預覽 ${index + 1}`}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 現有圖片預覽（編輯模式） */}
              {mode === 'edit' && formData.existingImages.length > 0 && (
                <div className="mt-2">
                  <Label>現有圖片:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.existingImages.map((image, index) => {
                      // 處理圖片路徑：如果 image 是物件，取出 url 屬性；如果是字串，直接使用
                      const imageFileName =
                        typeof image === 'object' ? image.url : image
                      return (
                        <div key={index} className="relative">
                          <Image
                            src={getProductImageUrl(imageFileName)}
                            alt={`現有圖片 ${index + 1}`}
                            width={80}
                            height={80}
                            className="w-20 h-20 object-cover rounded border"
                            onError={(e) => {
                              e.target.style.border = '2px solid red'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index, true)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" variant="default" disabled={isLoading}>
              {isLoading ? loadingButtonText : submitButtonText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
