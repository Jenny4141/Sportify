import '@/style/globals.css'
import { Toaster } from 'sonner'
import { Noto_Sans_TC } from 'next/font/google'
import { AuthProvider } from '@/contexts/auth-context'
import { VenueProvider } from '@/contexts/venue-context'
import { ThemeProvider } from '@/components/ui/theme-provider'

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

export const metadata = {
  title: 'Sportify',
  description: 'Make Sport Simplify',
}

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      <VenueProvider>
        <html lang="zh-Hant" suppressHydrationWarning>
          <head />
          <body className={notoSansTC.className}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster position="top-right" richColors />
            </ThemeProvider>
          </body>
        </html>
      </VenueProvider>
    </AuthProvider>
  )
}
