'use client'

// react
import { useRouter, useParams } from 'next/navigation'
// icons
import { ArrowLeft } from 'lucide-react'
// ui components
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
// 自定義 components
import { AppSidebar } from '@/components/admin/app-sidebar'
import { SiteHeader } from '@/components/admin/site-header'
import ProductForm from '@/components/admin/product-form'

export default function EditProductPage() {
  // ===== 路由和搜尋參數處理 =====
  const router = useRouter()
  const params = useParams()
  const productId = params.id

  // ===== 事件處理函數 =====
  const handleCancel = () => {
    router.push('/admin/shop/product')
  }

  return (
    <SidebarProvider
      style={{
        '--sidebar-width': 'calc(var(--spacing) * 72)',
        '--header-height': 'calc(var(--spacing) * 12)',
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="修改商品" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
              {/* 返回按鈕 */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回列表
                </Button>
              </div>

              {/* 表單組件 */}
              <ProductForm
                mode="edit"
                productId={productId}
                title="修改商品"
                description="請填寫以下資訊來修改商品"
                submitButtonText="修改商品"
                loadingButtonText="修改中..."
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
