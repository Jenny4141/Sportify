'use client'
import { RadioGroup } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { CircleIcon } from 'lucide-react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Choicebox = ({ className, ...props }) => (
  <RadioGroup className={cn('w-full', className)} {...props} />
)

export const ChoiceboxItem = ({ className, children, ...props }) => (
  <RadioGroupPrimitive.Item
    asChild
    className={cn(
      'text-left',
      '[&[data-state="checked"]]:border-primary',
      '[&[data-state="checked"]]:bg-accent'
    )}
    {...props}
  >
    <Card
      className={cn(
        'flex cursor-pointer flex-row items-start justify-between rounded-md p-4 shadow-none transition-all hover:bg-accent/50',
        className
      )}
    >
      {children}
    </Card>
  </RadioGroupPrimitive.Item>
)

export const ChoiceboxItemHeader = ({ className, ...props }) => (
  <CardHeader className={cn('flex-1 p-0', className)} {...props} />
)

export const ChoiceboxItemTitle = ({ className, ...props }) => (
  <CardTitle
    className={cn('flex items-center gap-2 text-sm', className)}
    {...props}
  />
)

export const ChoiceboxItemSubtitle = ({ className, ...props }) => (
  <span
    className={cn('font-normal text-muted-foreground text-xs', className)}
    {...props}
  />
)

export const ChoiceboxItemDescription = ({ className, ...props }) => (
  <CardDescription className={cn('text-sm', className)} {...props} />
)

export const ChoiceboxItemContent = ({ className, ...props }) => (
  <CardContent
    className={cn(
      'flex aspect-square size-4 shrink-0 items-center justify-center rounded-full border border-input p-0 text-primary shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40',
      className
    )}
    {...props}
  />
)

export const ChoiceboxItemIndicator = ({ className, ...props }) => (
  <RadioGroupPrimitive.Indicator asChild {...props}>
    <CircleIcon className={cn('size-2 fill-primary', className)} />
  </RadioGroupPrimitive.Indicator>
)
