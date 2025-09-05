'use client'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import { ChevronsUpDownIcon, PlusIcon } from 'lucide-react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const MIN_WIDTH = 140

const ComboboxContext = createContext({
  data: [],
  type: 'item',
  value: '',
  onValueChange: () => {},
  open: false,
  onOpenChange: () => {},
  width: MIN_WIDTH,
  setWidth: () => {},
  inputValue: '',
  setInputValue: () => {},
})

export const Combobox = ({
  data,
  type,
  defaultValue,
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  ...props
}) => {
  const [value, onValueChange] = useControllableState({
    defaultProp: defaultValue ?? '',
    prop: controlledValue,
    onChange: controlledOnValueChange,
  })
  const [open, onOpenChange] = useControllableState({
    defaultProp: defaultOpen,
    prop: controlledOpen,
    onChange: controlledOnOpenChange,
  })
  const [width, setWidth] = useState(200)
  const [inputValue, setInputValue] = useState('')

  return (
    <ComboboxContext.Provider
      value={{
        type,
        value,
        onValueChange,
        open,
        onOpenChange,
        data,
        width,
        setWidth,
        inputValue,
        setInputValue,
      }}
    >
      <Popover {...props} onOpenChange={onOpenChange} open={open} />
    </ComboboxContext.Provider>
  )
}

export const ComboboxTrigger = ({ children, ...props }) => {
  const { value, data, type, setWidth } = useContext(ComboboxContext)
  const ref = useRef(null)

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.target.offsetWidth
        if (newWidth) {
          setWidth?.(newWidth)
        }
      }
    })

    if (ref.current) {
      resizeObserver.observe(ref.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [setWidth])

  const mergedStyle = { ...(props.style || {}) }
  if (!mergedStyle.minWidth) mergedStyle.minWidth = MIN_WIDTH

  return (
    <PopoverTrigger asChild>
      <Button variant="outline" {...props} ref={ref} style={mergedStyle}>
        {children ?? (
          <span className="flex w-full items-center justify-between gap-2">
            {value
              ? data.find((item) => item.value === value)?.label
              : `請選擇${type}`}
            <ChevronsUpDownIcon
              className="shrink-0 text-muted-foreground"
              size={16}
            />
          </span>
        )}
      </Button>
    </PopoverTrigger>
  )
}

export const ComboboxContent = ({ className, popoverOptions, ...props }) => {
  const { width } = useContext(ComboboxContext)

  // Ensure content is at least MIN_WIDTH and otherwise match trigger width
  const contentWidth = Math.max(width || 0, MIN_WIDTH)

  return (
    <PopoverContent
      className={cn('p-0', className)}
      style={{ width: contentWidth, minWidth: MIN_WIDTH }}
      {...popoverOptions}
    >
      <Command {...props} />
    </PopoverContent>
  )
}

export const ComboboxInput = ({
  value: controlledValue,
  defaultValue,
  onValueChange: controlledOnValueChange,
  ...props
}) => {
  const { type, inputValue, setInputValue } = useContext(ComboboxContext)

  const [value, onValueChange] = useControllableState({
    defaultProp: defaultValue ?? inputValue,
    prop: controlledValue,
    onChange: (newValue) => {
      // Sync with context state
      setInputValue(newValue)
      // Call external onChange if provided
      controlledOnValueChange?.(newValue)
    },
  })

  return (
    <CommandInput
      onValueChange={onValueChange}
      placeholder={`請搜尋${type}...`}
      value={value}
      {...props}
    />
  )
}

export const ComboboxList = (props) => <CommandList {...props} />

export const ComboboxEmpty = ({ children, ...props }) => {
  const { type } = useContext(ComboboxContext)

  return (
    <CommandEmpty {...props}>{children ?? `沒有該${type}資料`}</CommandEmpty>
  )
}

export const ComboboxGroup = (props) => <CommandGroup {...props} />

export const ComboboxItem = (props) => {
  const { onValueChange, onOpenChange } = useContext(ComboboxContext)

  return (
    <CommandItem
      onSelect={(currentValue) => {
        onValueChange(currentValue)
        onOpenChange(false)
      }}
      {...props}
    />
  )
}

export const ComboboxSeparator = (props) => <CommandSeparator {...props} />

export const ComboboxCreateNew = ({ onCreateNew, children, className }) => {
  const { inputValue, type, onValueChange, onOpenChange } =
    useContext(ComboboxContext)

  if (!inputValue.trim()) {
    return null
  }

  const handleCreateNew = () => {
    onCreateNew(inputValue.trim())
    onValueChange(inputValue.trim())
    onOpenChange(false)
  }

  return (
    <button
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      onClick={handleCreateNew}
      type="button"
    >
      {children ? (
        children(inputValue)
      ) : (
        <>
          <PlusIcon className="h-4 w-4 text-muted-foreground" />
          <span>
            Create new {type}: "{inputValue}"
          </span>
        </>
      )}
    </button>
  )
}
