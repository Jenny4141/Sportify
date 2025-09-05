'use client'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserRound, UserRoundCog } from 'lucide-react'

export function RegisterForm({
  className,
  onSubmit,
  register,
  errors = {},
  isLoading = false,
  ...props
}) {
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  })

  useEffect(() => {
    const checkScreenSize = () => {
      // 當寬度 >= 976px 時使用大螢幕布局
      setIsLargeScreen(window.innerWidth >= 976)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(formData)
    }
  }

  return (
    <div className={cn('flex justify-center', className)} {...props}>
      <Card
        className={`overflow-hidden p-0 w-full ${isLargeScreen ? 'max-w-4xl' : 'max-w-sm'}`}
      >
        <div className="flex flex-row">
          {isLargeScreen && (
            <div
              className="relative w-1/2 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('/login/reg.jpg')`,
                backgroundPosition: 'left center',
                backgroundSize: 'cover',
              }}
            ></div>
          )}
          <div
            className={`p-6  ${isLargeScreen ? 'w-1/2' : 'w-full'}`}
          >
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">註冊帳號</h2>
              <Button
                  variant="outline"
                  className="text-center"
                  disabled={isLoading}
                  type="icon"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      email: '123455@gmail.com',
                      name: '宋夯塔',
                      phone: '0912345678',
                      password: '123456',
                      confirmPassword: '123456',

                    })
                  }}
                >
                  <UserRound />
                  {/* {isLoading ? 'Quick Logging in...' : 'Quick Login user'} */}
                </Button>
            </div>

            <div>
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  {/* 一般錯誤訊息 */}
                  {errors.general && (
                    <div className="text-destructive text-sm text-center bg-red-50 p-2 rounded">
                      {errors.general}
                    </div>
                  )}

                  {/* Email 欄位 */}
                  <div className="h-[94px] flex flex-col justify-start gap-2">
                    <Label htmlFor="email">
                      Email帳號<span className="text-destructive">*</span>
                    </Label>
                    <Input
                      className={errors.email ? 'border-destructive' : ''}
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      disabled={isLoading}
                    />
                    <div className="h-4 flex items-center">
                      {errors.email && (
                        <div className="text-destructive text-sm">
                          {errors.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 姓名欄位 */}
                  <div className="h-[94px] flex flex-col justify-start gap-2">
                    <Label htmlFor="name">
                      姓名<span className="text-destructive">*</span>
                    </Label>
                    <Input
                      className={errors.name ? 'border-destructive' : ''}
                      id="name"
                      type="text"
                      placeholder="請輸入您的姓名"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange('name', e.target.value)
                      }
                      disabled={isLoading}
                    />
                    <div className="h-4 flex items-center">
                      {errors.name && (
                        <div className="text-destructive text-sm">
                          {errors.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 手機號碼欄位 */}
                  <div className="h-[94px] flex flex-col justify-start gap-2">
                    <Label htmlFor="phone">手機號碼</Label>
                    <Input
                      className={errors.phone ? 'border-destructive' : ''}
                      id="phone"
                      type="tel"
                      placeholder="請輸入手機號碼"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                      disabled={isLoading}
                    />
                    <div className="h-4 flex items-center">
                      {errors.phone && (
                        <div className="text-destructive text-sm">
                          {errors.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 密碼欄位 */}
                  <div className="h-[94px] flex flex-col justify-start gap-2">
                    <Label htmlFor="password">
                      密碼<span className="text-destructive">*</span>
                    </Label>
                    <Input
                      className={errors.password ? 'border-destructive' : ''}
                      id="password"
                      type="password"
                      placeholder="請輸入密碼"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange('password', e.target.value)
                      }
                      disabled={isLoading}
                    />
                    <div className="h-4 flex items-center">
                      {errors.password && (
                        <div className="text-destructive text-sm">
                          {errors.password}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 確認密碼欄位 */}
                  <div className="h-[94px] flex flex-col justify-start gap-2">
                    <Label htmlFor="confirmPassword">
                      確認密碼<span className="text-destructive">*</span>
                    </Label>
                    <Input
                      className={
                        errors.confirmPassword ? 'border-destructive' : ''
                      }
                      id="confirmPassword"
                      type="password"
                      placeholder="請再次輸入密碼"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange('confirmPassword', e.target.value)
                      }
                      disabled={isLoading}
                    />
                    <div className="h-4 flex items-center">
                      {errors.confirmPassword && (
                        <div className="text-destructive text-sm">
                          {errors.confirmPassword}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? '註冊中...' : '註冊'}
                    </Button>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm">
                  已有帳號?{' '}
                  <a href="/login" className="underline underline-offset-4">
                    前往登入
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
