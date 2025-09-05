// components/search-form.jsx
'use client'
import React from 'react'
import { Search, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function SearchForm({
  value,
  onChange,
  onSubmit,
  placeholder = '請輸入關鍵字...',
}) {
  const inputRef = React.useRef(null)
  const handleClear = () => {
    if (onChange) {
      const event = { target: { value: '' } }
      onChange(event)
    }
    if (inputRef.current) inputRef.current.focus()
  }
  return (
    <form
      onSubmit={onSubmit}
      className="flex items-center gap-2 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl"
    >
      <Label htmlFor="search" className="sr-only">
        Search
      </Label>
      <div className="relative flex items-center flex-1 min-w-0">
        <input
          type="text"
          id="search"
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="pl-3 border rounded-lg px-2 py-1.5 text-sm w-full min-w-0"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
            aria-label="清除搜尋"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="h-8 flex-shrink-0"
      >
        <span className="hidden lg:inline">搜尋</span>
        <Search className="lg-hidden" />
      </Button>
    </form>
  )
}
