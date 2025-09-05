'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  IconCheckupList,
  IconShoppingCart,
  IconUsers,
  IconChalkboardTeacher,
} from '@tabler/icons-react'

import { NavDocuments } from '@/components/admin/nav-documents'
import { NavMain } from '@/components/admin/nav-main'
import { NavSecondary } from '@/components/admin/nav-secondary'
import { NavUser } from '@/components/admin/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/auth-context'

const Logo = (props) => {
  return (
    <div className="flex items-center w-full" {...props}>
      {/* Sportify text logo */}
      <svg
        width="160"
        height="29"
        viewBox="0 0 243 29"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full h-auto"
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

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/vercel.svg',
  },
  navMain: [
    {
      title: '場地預訂',
      url: '/admin/venue',
      icon: IconCheckupList,
      items: [
        {
          title: '場館管理',
          url: '/admin/venue/center',
        },
        {
          title: '開放時間管理',
          url: '/admin/venue/time-slot',
        },
        {
          title: '場地管理',
          url: '/admin/venue/court',
        },
        {
          title: '場地價格設定',
          url: '/admin/venue/court-time-slot',
        },
        {
          title: '訂單管理',
          url: '/admin/venue/reservation',
        },
      ],
    },
    {
      title: '購物商城',
      url: '/admin/shop',
      icon: IconShoppingCart,
      items: [
        {
          title: '商品管理',
          url: '/admin/shop/product',
        },
        {
          title: '訂單管理',
          url: '/admin/shop/order',
        },
      ],
    },
    {
      title: '揪團組隊',
      url: '#',
      icon: IconUsers,
    },
    {
      title: '課程報名',
      url: '#',
      icon: IconChalkboardTeacher,
    },
  ],
  /* navClouds: [
    {
      title: 'Capture',
      icon: IconCamera,
      isActive: true,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
    {
      title: 'Proposal',
      icon: IconFileDescription,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
    {
      title: 'Prompts',
      icon: IconFileAi,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '#',
      icon: IconSettings,
    },
    {
      title: 'Get Help',
      url: '#',
      icon: IconHelp,
    },
    {
      title: 'Search',
      url: '#',
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: 'Data Library',
      url: '#',
      icon: IconDatabase,
    },
    {
      name: 'Reports',
      url: '#',
      icon: IconReport,
    },
    {
      name: 'Word Assistant',
      url: '#',
      icon: IconFileWord,
    },
  ], */
}

export function AppSidebar({ ...props }) {
  const { user } = useAuth()
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/admin" className="relative">
                <Logo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user || ''} />
      </SidebarFooter>
    </Sidebar>
  )
}
