'use client'

import * as React from 'react'
import { FaCheck } from 'react-icons/fa'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/**
 * Step component for displaying a progress stepper
 *
 * @param {Object} props
 * @param {Array} props.steps - Array of step objects with { id, title, completed, active }
 * @param {string} props.orientation - 'horizontal' or 'vertical' (default: 'horizontal')
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onStepClick - Callback when a step is clicked
 */
export function Step({
  steps = [],
  orientation = 'horizontal',
  className,
  onStepClick,
  ...props
}) {
  const isHorizontal = orientation === 'horizontal'

  return (
    <div
      className={cn(
        'flex',
        isHorizontal ? 'items-center space-x-4' : 'flex-col space-y-4',
        className
      )}
      {...props}
    >
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div
            className={cn(
              'flex items-center',
              isHorizontal ? 'flex-col' : 'flex-row space-x-3',
              onStepClick && 'cursor-pointer'
            )}
            onClick={() => onStepClick?.(step, index)}
          >
            {/* Step number/icon */}
            <Badge
              variant={
                step.completed
                  ? 'default'
                  : step.active
                    ? 'default'
                    : 'secondary'
              }
              className={cn(
                'flex items-center justify-center rounded-full transition-colors',
                step.completed || step.active
                  ? 'bg-highlight text-highlight-foreground'
                  : 'bg-muted text-muted-foreground',
                'w-8 h-8 text-sm font-medium'
              )}
            >
              {step.completed ? <FaCheck className="w-4 h-4" /> : step.id}
            </Badge>

            {/* Step title */}
            <span
              className={cn(
                'text-sm font-medium transition-colors',
                isHorizontal ? 'mt-2 text-center' : 'ml-0',
                step.completed || step.active
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {step.title}
            </span>
          </div>

          {/* Separator line */}
          {index < steps.length - 1 && (
            <Separator
              orientation={isHorizontal ? 'horizontal' : 'vertical'}
              className={cn(isHorizontal ? 'flex-1 h-px' : 'w-px h-8 ml-4')}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

/**
 * Example usage:
 *
 * const steps = [
 *   { id: 1, title: "選擇場館", completed: true },
 *   { id: 2, title: "選擇時間", completed: true },
 *   { id: 3, title: "填寫資料", active: true },
 *   { id: 4, title: "付款確認", completed: false }
 * ]
 *
 * <Step
 *   steps={steps}
 *   orientation="horizontal"
 *   onStepClick={(step, index) => console.log('Clicked step:', step)}
 * />
 */

export default Step
