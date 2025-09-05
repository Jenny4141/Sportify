'use client'

// hooks
import { useState, useEffect } from 'react'

// utils
import { cn } from '@/lib/utils'
// icons

import { IconUpload, IconX } from '@tabler/icons-react'

// next 元件
import { useRouter } from 'next/navigation'

// API 請求
import { createCenter, fetchCenter, updateCenter } from '@/api'
import { fetchLocationOptions, fetchSportOptions } from '@/api/common'

// UI 元件
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'

export default function CenterForm({
  mode = 'add', // 'add' 或 'edit'
  centerId = null,
  title,
  description,
  submitButtonText,
  loadingButtonText,
}) {
  const router = useRouter()

  // #region 狀態管理
  const [isLoading, setIsLoading] = useState(false)
  const [locations, setLocations] = useState([])
  const [sports, setSports] = useState([])
  const [selectedImages, setSelectedImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [keepExistingImages, setKeepExistingImages] = useState(true)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    locationId: '',
    address: '',
    latitude: '',
    longitude: '',
    sportIds: [],
  })

  // #region 副作用處理
  // ===== 載入選項資料 =====
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // 載入地點選項
        const locationData = await fetchLocationOptions()
        setLocations(locationData.rows || [])

        // 載入運動項目選項
        const sportData = await fetchSportOptions()
        setSports(sportData.rows || [])
      } catch (error) {
        console.error('載入選項失敗:', error)
        toast.error('載入選項失敗')
      }
    }
    loadOptions()
  }, [])

  // ===== 編輯模式載入資料 =====
  useEffect(() => {
    if (mode === 'edit' && centerId) {
      const loadCenterData = async () => {
        try {
          const data = await fetchCenter(centerId)
          const center = data.record

          setFormData({
            name: center.name || '',
            locationId:
              center.location?.id?.toString() ||
              center.locationId?.toString() ||
              '',
            address: center.address || '',
            latitude: center.latitude?.toString() || '',
            longitude: center.longitude?.toString() || '',
            sportIds: center.centerSports?.map((cs) => cs.sportId) || [],
          })
          setExistingImages(center.images || [])
          setKeepExistingImages(true)
        } catch (error) {
          console.error('載入中心資料失敗:', error)
          toast.error('載入中心資料失敗')
        }
      }
      loadCenterData()
    }
  }, [mode, centerId])

  // #region 事件處理函數
  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSportChange = (sportId, checked) => {
    setFormData((prev) => ({
      ...prev,
      sportIds: checked
        ? [...prev.sportIds, sportId]
        : prev.sportIds.filter((id) => id !== sportId),
    }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    setSelectedImages((prev) => [...prev, ...files])
  }

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 準備提交資料
    const submitData = {
      ...formData,
      images: selectedImages,
      keepExistingImages: mode === 'edit' ? keepExistingImages : false,
    }

    // Debug: 送出前 log formData
    console.log('送出前 formData:', submitData)

    // 清除之前的錯誤訊息
    setErrors({})
    setIsLoading(true)

    try {
      let result

      if (mode === 'edit' && centerId) {
        // 編輯模式
        result = await updateCenter(centerId, submitData)
      } else {
        // 新增模式
        result = await createCenter(submitData)
      }

      console.log('API 回應:', result) // Debug 用

      if (result.success) {
        toast.success(mode === 'edit' ? '編輯中心成功！' : '新增中心成功！')
        router.push('/admin/venue/center')
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
      console.error(mode === 'edit' ? '編輯中心失敗:' : '新增中心失敗:', error)
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
          (mode === 'edit' ? '編輯中心失敗：' : '新增中心失敗：') +
            (error.message || '未知錯誤')
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/venue/center')
  }

  // #region 頁面渲染
  return (
    <Card className="max-w-2xl mx-auto w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-6">
            {/* 中心名稱 */}
            <div className="space-y-2">
              <Label htmlFor="name">
                中心名稱
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="請輸入中心名稱"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* 地區 */}
            <div className="space-y-2">
              <Label htmlFor="locationId">
                地區
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.locationId}
                onValueChange={(value) =>
                  handleInputChange('locationId', value)
                }
              >
                <SelectTrigger
                  className={cn(
                    'w-full',
                    errors.locationId && 'border-red-500'
                  )}
                >
                  <SelectValue placeholder="請選擇地點" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem
                      key={location.id}
                      value={location.id.toString()}
                    >
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.locationId && (
                <p className="text-sm text-red-500 mt-1">{errors.locationId}</p>
              )}
            </div>

            {/* 地址 */}
            <div className="space-y-2">
              <Label htmlFor="address">地址</Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="請輸入詳細地址"
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <p className="text-sm text-red-500 mt-1">{errors.address}</p>
              )}
            </div>

            {/* 經緯度 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">緯度</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) =>
                    handleInputChange('latitude', e.target.value)
                  }
                  placeholder="例：25.0330"
                  className={errors.latitude ? 'border-red-500' : ''}
                />
                {errors.latitude && (
                  <p className="text-sm text-red-500 mt-1">{errors.latitude}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">經度</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) =>
                    handleInputChange('longitude', e.target.value)
                  }
                  placeholder="例：121.5654"
                  className={errors.longitude ? 'border-red-500' : ''}
                />
                {errors.longitude && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.longitude}
                  </p>
                )}
              </div>
            </div>

            {/* 運動項目選擇 */}
            <div className="space-y-2">
              <Label>運動項目</Label>
              <div
                className={cn(
                  'grid grid-cols-2 gap-2 border rounded-md p-3',
                  errors.sportIds && 'border-red-500'
                )}
              >
                {sports.map((sport) => (
                  <div key={sport.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sport-${sport.id}`}
                      checked={formData.sportIds.includes(sport.id)}
                      onCheckedChange={(checked) =>
                        handleSportChange(sport.id, checked)
                      }
                    />
                    <Label
                      htmlFor={`sport-${sport.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {sport.name}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.sportIds && (
                <p className="text-sm text-red-500 mt-1">{errors.sportIds}</p>
              )}
            </div>

            {/* 圖片上傳 */}
            <div className="space-y-2">
              <Label htmlFor="images">場館圖片</Label>

              {/* 編輯模式顯示現有圖片 */}
              {mode === 'edit' && existingImages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="keepExistingImages"
                      checked={keepExistingImages}
                      onCheckedChange={setKeepExistingImages}
                    />
                    <Label
                      htmlFor="keepExistingImages"
                      className="text-sm font-normal"
                    >
                      保留現有圖片
                    </Label>
                  </div>
                  {keepExistingImages && (
                    <div className="grid grid-cols-3 gap-2">
                      {existingImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image.url}
                            alt={`現有圖片 ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 圖片上傳輸入 */}
              <div className="space-y-2">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="images"
                    className="flex flex-col items-center justify-center w-full h-30 border-2 border-muted rounded-lg cursor-pointer bg-card hover:bg-muted"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <IconUpload className="w-5 h-5 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        點擊選擇圖片或拖拽到此處
                      </p>
                      <p className="text-xs text-muted-foreground">
                        支援 PNG, JPG (最多10張)
                      </p>
                    </div>
                    <input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 已選擇的圖片預覽 */}
                {selectedImages.length > 0 && (
                  <div className="mt-4">
                    <Label>已選擇圖片:</Label>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`預覽 ${index + 1}`}
                            className="w-20 h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            <IconX className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {errors.images && (
                <p className="text-sm text-red-500 mt-1">{errors.images}</p>
              )}
            </div>
          </div>

          {/* 按鈕區域 */}
          <div className="flex justify-end space-x-4">
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
