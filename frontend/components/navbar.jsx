'use client'
import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { ChevronDownIcon } from 'lucide-react'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { getAvatarUrl } from '@/api/member/user'

// Combined logo component using your SVG files
const Logo = (props) => {
  return (
    <div className="flex items-center" {...props}>
      {/* Sportify text logo */}
      <svg
        width="160"
        height="29"
        viewBox="0 0 243 29"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        // className="hidden sm:block"
      >
        <path
          d="M0.01,28.51c5.89-0.02,13.39,0.01,19.28,0.03c5.29-0.26,9.81-2.86,10.6-8.39c0.38-2.58-0.65-5.45-2.62-7.03
        c-1.53-1.22-3.45-1.7-5.33-2c-2.08-0.33-4.18-0.43-6.27-0.55c-1.23-0.07-2.47-0.14-3.69-0.32C11.21,10.15,10.12,9.88,9.94,9
        c-0.15-0.73,0.45-1.37,1.13-1.48c0.41-0.02,0.82-0.03,1.23-0.05h17.58l0.75-6.94c-0.87-0.01-1.75-0.02-2.62-0.02
        c-2.04-0.02-4.07-0.03-6.1-0.04c-2.31-0.01-4.63-0.01-6.94,0.01c-1.08,0.01-2.17-0.02-3.25,0.06c-2.52,0.2-5.26,1.02-7.1,2.88
        c-1.73,1.74-2.38,4.54-2.25,7c0.02,0.93,0.41,1.8,0.78,2.63c0.48,1.15,1.51,1.93,2.53,2.55c2.32,1.33,5.01,1.59,7.6,1.77
        c1.37,0.09,2.77,0.17,4.15,0.24c1.39,0.07,3.04,0.09,4.25,0.89c0.61,0.4,0.77,1.13,0.46,1.78c-0.37,0.79-1.15,1.08-1.95,1.2
        c-6.13,0.13-13.05,0-19.17,0.06C1.01,21.97,0.21,26.91,0.01,28.51L0.01,28.51z"
        />
        <path
          d="M56.46,0.51l-20.49-0.1l-1.06,6.97h19.34c1.67,0,3.02,1.37,3.02,3.07v0.58c0,2.35-1.88,4.26-4.2,4.26
        c0,0-12.01-0.01-12.08-0.01l0.69-4.77H34.3l-2.67,18.1h7.39L40,21.94h12.94c6.7,0,11.94-5.51,11.94-12.3V9.06
        C64.88,4.22,61.23,0.51,56.46,0.51L56.46,0.51z"
        />
        <path
          d="M88.37,0h-7.34c-8.37,0-15.15,6.87-15.15,15.35v2.95c0,5.91,4.73,10.7,10.56,10.7h6.57
        c8.79,0,15.92-7.22,15.92-16.13V10.7C98.93,4.79,94.2,0,88.37,0L88.37,0z M91.17,13.55c0,4.53-3.62,8.2-8.09,8.2h-4.15
        c-2.96,0-5.37-2.43-5.37-5.44v-1.5c0-4.31,3.45-7.8,7.7-7.8h4.54c2.96,0,5.37,2.43,5.37,5.44V13.55z"
        />
        <path
          d="M132.57,9.87V9.31c0-4.74-3.8-8.59-8.48-8.59h-19.94l-1.01,6.74h19.11c1.69,0,3.05,1.38,3.05,3.09
        c0,2.24-1.79,4.05-4,4.05H109.4l0.6-4.08h-7.46l-2.62,17.77h7.46l1.05-7.15h5.6l7.46,7.12l10.07,0.03l-7.95-7.85
        C128.76,19.37,132.57,15.51,132.57,9.87L132.57,9.87z"
        />
        <path d="M163.48,0.66h-28.87l-1.04,7.05h10.5l-3.04,20.63h7.39l3.04-20.63h10.99L163.48,0.66z" />
        <path d="M171.97,28.34h-7.48l4.1-27.67h7.48L171.97,28.34z" />
        <path
          d="M208.96,7.71L210,0.66h-28.87l-1.04,7.05h0.02l-0.77,5.21h-0.02l-1.04,7.05h0.03l-1.24,8.37h7.39l1.23-8.37
        h21.46l1.04-7.05h-21.46l0.77-5.21H208.96z"
        />
        <path d="M242.73,0.61h-8.76l-9.38,11.64l-5.64-11.61H211l9.06,18.86l-1.31,8.88h7.24l1.31-8.88h0.01L242.73,0.61z" />
      </svg>

      {/* Sportify graphic logo */}
      <Image
        src="/logo.svg"
        alt="sportify logo"
        width={36}
        height={36}
        style={{ objectFit: 'contain' }}
        priority
        className="hidden sm:block"
      />
    </div>
  )
}

// Hamburger icon component
const HamburgerIcon = ({ className, ...props }) => (
  <svg
    className={cn('pointer-events-none', className)}
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M4 12L20 12"
      className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
    />
    <path
      d="M4 12H20"
      className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
    />
    <path
      d="M4 12H20"
      className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
    />
  </svg>
)

// Default navigation links
const defaultNavigationLinks = [
  { href: '/venue', label: '場地預訂' },
  { href: '/shop', label: '購物商城' },
  { href: '/team', label: '揪團組隊' },
  { href: '/course', label: '課程報名' },
]

// User Menu Component
const UserMenu = ({
  userName = 'User',
  userEmail = 'user@example.com',
  userAvatar,
  userRole = 'guest',
  onItemClick,
  onLogout,
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        className="text-accent-foreground hover:bg-accent/50 hover:text-accent-foreground"
      >
        <Avatar className="h-7 w-7">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback className="text-xs">
            {userName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
        <ChevronDownIcon className="text-foreground h-3 w-3 ml-1" />
        <span className="sr-only">User menu</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      className="w-56"
      sideOffset={8}
      avoidCollisions={true}
    >
      <DropdownMenuLabel>
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{userName}</p>
          <p className="text-xs leading-none text-muted-foreground">
            {userEmail}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onItemClick?.('profile')}>
        <Link href="/member/member-data">個人檔案</Link>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onItemClick?.('member')}>
        <Link href="/member">會員中心</Link>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onItemClick?.('billing')}>
        購物車
      </DropdownMenuItem>
      {userRole === 'admin' && (
        <DropdownMenuItem onClick={() => onItemClick?.('admin')}>
          後臺管理系統
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onItemClick?.('logout')}>
        登出
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

export const Navbar = React.forwardRef(
  (
    {
      className,
      logo = <Logo />,
      logoHref = '/',
      navigationLinks = defaultNavigationLinks,
      signInText = '登入',
      signInHref = '/login',
      signUpText = '註冊',
      signUpHref = '/register',
      onSignInClick,
      onSignUpClick,
      onUserItemClick,
      ...props
    },
    ref
  ) => {
    const [isMobile, setIsMobile] = useState(false)
    const containerRef = useRef(null)
    const { user, isAuthenticated, logout } = useAuth()
    const router = useRouter()

    const handleLogout = () => {
      logout()
    }

    const handleUserItemClick = (action) => {
      if (action === 'logout') {
        handleLogout()
      } else if (action === 'admin') {
        // 使用 window.location.href 強制重新載入
        window.location.href = '/admin'
      } else if (action === 'profile') {
        router.push('/member/member-data')
      } else if (action === 'member') {
        router.push('/member')
      } else if (action === 'billing') {
        router.push('/shop/order')
      }
    }

    useEffect(() => {
      const checkWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth
          setIsMobile(width < 768) // 768px is md breakpoint
        }
      }

      checkWidth()

      const resizeObserver = new ResizeObserver(checkWidth)
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current)
      }

      return () => {
        resizeObserver.disconnect()
      }
    }, [])

    // Combine refs
    const combinedRef = React.useCallback(
      (node) => {
        containerRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref]
    )

    return (
      <header
        ref={combinedRef}
        className={cn(
          'sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 [&_*]:no-underline overflow-x-hidden',
          className
        )}
        {...props}
      >
        <div className="container mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex items-center gap-2">
            {/* Mobile menu trigger */}
            {isMobile && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="group h-9 w-9 hover:bg-accent hover:text-accent-foreground"
                    variant="ghost"
                    size="icon"
                  >
                    <HamburgerIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-30 p-2 border shadow-md"
                >
                  <NavigationMenu className="max-w-none">
                    <NavigationMenuList className="flex-col items-start gap-1">
                      {navigationLinks.map((link, index) => (
                        <NavigationMenuItem key={index} className="w-full">
                          {/* 手機版主導航選項 */}
                          <Link
                            href={link.href}
                            className={cn(
                              'flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer no-underline',
                              link.active
                                ? 'bg-accent text-accent-foreground'
                                : 'text-accent-foreground hover:text-primary hover:bg-primary/10'
                            )}
                          >
                            {link.label}
                          </Link>
                        </NavigationMenuItem>
                      ))}
                    </NavigationMenuList>
                  </NavigationMenu>
                </PopoverContent>
              </Popover>
            )}
            {/* Main nav */}
            <div className="flex items-center gap-6">
              <Link
                href={logoHref}
                className="flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <div className="text-2xl">{logo}</div>
              </Link>
              {/* Navigation menu */}
              {!isMobile && (
                <NavigationMenu className="flex">
                  <NavigationMenuList className="gap-1">
                    {navigationLinks.map((link, index) => (
                      <NavigationMenuItem key={index}>
                        {/* 電腦版主導航選項 */}
                        <Link
                          href={link.href}
                          className={cn(
                            'group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer no-underline',
                            link.active
                              ? 'bg-accent text-accent-foreground'
                              : 'text-foreground hover:text-accent-foreground'
                          )}
                        >
                          {link.label}
                        </Link>
                      </NavigationMenuItem>
                    ))}
                  </NavigationMenuList>
                </NavigationMenu>
              )}
            </div>
          </div>
          {/* Right side */}
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs sm:text-sm font-medium hover:bg-accent hover:text-accent-foreground px-3 sm:px-4 h-9 rounded-full shadow-sm"
                  asChild
                >
                  <Link href={signInHref}>{signInText}</Link>
                </Button>
                <Link href={signUpHref}>
                  <div className="p-[1px] sm:p-[2px] bg-gradient-to-r from-orange-600 to-purple-600 rounded-full">
                    <div className="bg-background transition-colors hover:bg-background/50 px-3 sm:px-4 py-1 sm:py-2 h-8 sm:h-9 rounded-full light:bg-background/50  text-foreground text-xs sm:text-sm flex items-center justify-center whitespace-nowrap">
                      {signUpText}
                    </div>
                  </div>
                </Link>
              </>
            ) : (
              <UserMenu
                userName={user?.name || '使用者'}
                userEmail={user?.email || 'user@example.com'}
                userAvatar={getAvatarUrl(user?.avatar)}
                userRole={user?.role}
                onItemClick={handleUserItemClick}
                onLogout={handleLogout}
              />
            )}
          </div>
        </div>
      </header>
    )
  }
)

Navbar.displayName = 'Navbar'

export { Logo, HamburgerIcon }
