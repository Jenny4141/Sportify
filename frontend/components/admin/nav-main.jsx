'use client'

import { IconPlus, IconChartHistogram } from '@tabler/icons-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronRightIcon } from '@radix-ui/react-icons'

export function NavMain({ items }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear mt-2"
            >
              <IconChartHistogram />
              <span>數據圖表</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconPlus />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) =>
            item.items ? (
              <Collapsible key={item.title}>
                <CollapsibleTrigger asChild>
                  <SidebarMenuItem className="group">
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      <ChevronRightIcon className="ml-auto size-4 transition-transform group-data-[state=open]:rotate-90" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                  <div className="pl-8 space-y-1">
                    {item.items.map((subitem) => (
                      <SidebarMenuItem key={subitem.title}>
                        <SidebarMenuButton asChild tooltip={subitem.title}>
                          <Link href={subitem.url}>
                            <span>{subitem.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
