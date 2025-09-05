'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { Camera, Upload } from 'lucide-react'
import ImageCropDialog from '@/components/ui/image-crop-dialog'
import { getAvatarUrl } from '@/api/member/user'

export default function HeroBanner({
  backgroundImage = '/banner/member-banner.jpg',
  title = '會員中心',
  overlayOpacity = 'bg-black/50',
  children,
  onSearch,
  className = '',
  containerClassName = '',
  titleClassName = 'text-4xl text-white font-bold',
  ...props
}) {
  const { user, uploadAvatar } = useAuth()
  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [localAvatarUrl, setLocalAvatarUrl] = useState(null)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [selectedImageSrc, setSelectedImageSrc] = useState(null)

  // 當用戶資料載入時，同步更新本地頭像 URL
  useEffect(() => {
    console.log('HeroBannerMember - 用戶資料變化:', user)
    console.log('HeroBannerMember - 用戶資料類型:', typeof user)
    console.log('HeroBannerMember - 用戶資料是否為 null:', user === null)
    console.log('HeroBannerMember - 用戶頭像:', user?.avatar)
    console.log('HeroBannerMember - 用戶頭像類型:', typeof user?.avatar)
    console.log(
      'HeroBannerMember - 用戶頭像是否為 null:',
      user?.avatar === null
    )
    console.log(
      'HeroBannerMember - 用戶頭像是否為 undefined:',
      user?.avatar === undefined
    )
    console.log(
      'HeroBannerMember - 用戶資料的所有欄位:',
      Object.keys(user || {})
    )
    console.log('HeroBannerMember - 完整的用戶資料:', user)

    if (user?.avatar) {
      console.log('設置本地頭像 URL:', user.avatar)
      setLocalAvatarUrl(user.avatar)
    } else {
      console.log('用戶沒有頭像，清空本地頭像 URL')
      setLocalAvatarUrl(null)
    }
  }, [user])

  // 獲取用戶頭像 URL
  /* const getAvatarUrlForDisplay = () => {
    console.log('getAvatarUrlForDisplay 被調用')
    console.log('當前用戶資料:', user)
    console.log('用戶頭像:', user?.avatar)
    console.log('本地頭像 URL:', localAvatarUrl)

    // 優先使用本地頭像 URL（用於即時更新）
    if (localAvatarUrl) {
      console.log('使用本地頭像 URL:', localAvatarUrl)
      // 如果已經是完整 URL，直接使用
      if (localAvatarUrl.startsWith('http')) {
        return localAvatarUrl
      }
      // 如果是檔案名稱，使用 getAvatarUrl 函數
      return getAvatarUrl(localAvatarUrl)
    }

    // 其次使用用戶資料中的頭像
    if (user?.avatar) {
      console.log('使用用戶資料中的頭像:', user.avatar)
      // 如果已經是完整 URL，直接使用
      if (user.avatar.startsWith('http')) {
        return user.avatar
      }
      // 如果是檔案名稱，使用 getAvatarUrl 函數
      return getAvatarUrl(user.avatar)
    }

    console.log('使用預設頭像')
    return getAvatarUrl(null)
  } */

  // 獲取用戶名稱
  const getUserName = () => {
    if (user?.name) {
      return user.name
    }
    return 'GUEST'
  }

  // 讀取檔案為 base64
  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.addEventListener('load', () => resolve(reader.result), false)
      reader.readAsDataURL(file)
    })
  }

  // 處理檔案選擇
  const handleFileSelect = async (event) => {
    console.log('handleFileSelect 被觸發', event.target.files)
    const file = event.target.files[0]
    if (!file) {
      console.log('沒有選擇檔案')
      return
    }

    console.log('選擇的檔案:', file.name, file.type, file.size)

    // 驗證檔案類型
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案')
      // 清空 input 值以允許重新選擇相同檔案
      event.target.value = ''
      return
    }

    // 驗證檔案大小 (限制為 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不能超過 5MB')
      // 清空 input 值以允許重新選擇相同檔案
      event.target.value = ''
      return
    }

    try {
      // 讀取檔案為 base64
      const imageSrc = await readFile(file)
      setSelectedImageSrc(imageSrc)
      setShowCropDialog(true)
    } catch (error) {
      console.error('讀取檔案錯誤:', error)
      alert('讀取檔案失敗，請稍後再試')
      // 清空 input 值以允許重新選擇相同檔案
      event.target.value = ''
    }
  }

  // 處理裁切完成
  const handleCropComplete = async (croppedFile) => {
    setIsUploading(true)
    try {
      console.log('開始上傳裁切後的檔案...')
      console.log('檔案資訊:', {
        name: croppedFile.name,
        type: croppedFile.type,
        size: croppedFile.size,
      })

      const result = await uploadAvatar(croppedFile)
      console.log('上傳結果:', result)
      if (result.success) {
        console.log('更新後的用戶資料:', result.user)

        // 立即更新本地頭像 URL 以顯示新圖片
        if (result.user.avatar) {
          setLocalAvatarUrl(result.user.avatar)
        } else {
          // 如果後端沒有回傳 avatar 欄位，使用檔案名稱
          setLocalAvatarUrl(croppedFile.name)
        }

        alert('頭像更新成功！')
      } else {
        alert(result.message || '上傳失敗')
      }
    } catch (error) {
      console.error('上傳錯誤:', error)
      alert('上傳失敗，請稍後再試')
    } finally {
      setIsUploading(false)
    }
  }

  // 處理頭像上傳 (保留原有函數以向後兼容)
  const handleAvatarUpload = async (event) => {
    await handleFileSelect(event)
  }

  // 點擊頭像觸發檔案選擇
  const handleAvatarClick = () => {
    console.log('頭像被點擊')
    console.log('fileInputRef.current:', fileInputRef.current)
    if (fileInputRef.current) {
      fileInputRef.current.click()
    } else {
      console.error('fileInputRef.current 是 null')
    }
  }

  return (
    <>
      <div
        className={`relative w-full bg-cover bg-center px-4 md:px-6 mb-8 md:mb-5 ${className}`}
        style={{ backgroundImage: `url('${backgroundImage}')` }}
        {...props}
      >
        <div className={`absolute inset-0 ${overlayOpacity}`}></div>
        <div className="relative container mx-auto flex flex-col self-stretch h-70 max-w-screen-xl gap-8 justify-between items-center ">
          <div className="w-full h-32 max-w-[1140px] pb-2.5 flex flex-col justify-center items-center gap-4 mt-8">
            <div className="self-stretch inline-flex justify-center items-center gap-1">
              <div className="text-center justify-center">
                <h2 className={titleClassName}>{title}</h2>
              </div>
            </div>
          </div>
          <div className="w-full max-w-[1140px] flex flex-col justify-center items-center ">
            <div className="relative group">
              <img
                className="w-28 h-28 rounded-full cursor-pointer transition-opacity group-hover:opacity-80"
                src={getAvatarUrl(user?.avatar)}
                alt="用戶頭像"
                onClick={handleAvatarClick}
                style={{ pointerEvents: 'auto' }}
              />
              {/* 上傳圖示覆蓋層 */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-black/50 rounded-full p-2">
                  {isUploading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
            </div>

            {/* 隱藏的檔案輸入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              style={{ display: 'none' }}
            />

            {/* 裁切對話框 */}
            <ImageCropDialog
              isOpen={showCropDialog}
              onClose={() => {
                setShowCropDialog(false)
                setSelectedImageSrc(null)
              }}
              onDialogClose={() => {
                // 清空檔案輸入以允許重新選擇相同檔案
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
              imageSrc={selectedImageSrc}
              onCropComplete={handleCropComplete}
              aspect={1}
              cropShape="round"
            />

            <div className="inline-flex justify-center items-center gap-1">
              <div className="text-center justify-center text-white text-xl font-medium font-['Montserrat'] leading-[48px]">
                {getUserName()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// 搜尋表單子元件
// export function SearchField({
//   fields = [],
//   onSearch,
//   searchButtonText = '搜尋',
//   searchButtonProps = {},
// }) {
//   return (
//     <>
//       {fields.map((field, index) => (
//         <div key={index} className="w-full space-y-2 flex-1">
//           <Label className="text-white">{field.label}</Label>
//           {field.component}
//         </div>
//       ))}
//       <Button
//         variant="secondary"
//         className="w-full md:w-auto h-10"
//         onClick={onSearch}
//         {...searchButtonProps}
//       >
//         {searchButtonText}
//       </Button>
//     </>
//   )
// }
