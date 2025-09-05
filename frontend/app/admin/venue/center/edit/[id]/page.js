'use client'

// ===== 依賴項匯入 =====
import { useRouter, useParams } from 'next/navigation'
import { AppSidebar } from '@/components/admin/app-sidebar'
import { SiteHeader } from '@/components/admin/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import CenterForm from '@/components/admin/center-form'

export default function EditCenterPage() {
  const router = useRouter()
  const params = useParams()
  const centerId = params.id

  const handleCancel = () => {
    router.push('/admin/venue/center')
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
        <SiteHeader title="編輯運動中心" />
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
              <CenterForm
                mode="edit"
                centerId={centerId}
                title="編輯運動中心"
                description="請填寫以下資訊來編輯運動中心"
                submitButtonText="編輯中心"
                loadingButtonText="編輯中..."
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
