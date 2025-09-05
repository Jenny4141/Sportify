'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function HeroBanner({
  backgroundImage = '/banner/venue-banner.jpg',
  title = '馬上預訂動起來',
  overlayOpacity = 'bg-slate-900/50',
  children,
  onSearch,
  className = '',
  containerClassName = '',
  titleClassName = 'text-4xl text-white font-bold',
  ...props
}) {
  return (
    <div
      className={`relative w-full bg-cover bg-center px-4 md:px-6 mb-60 md:mb-5 ${className}`}
      style={{ backgroundImage: `url('${backgroundImage}')` }}
      {...props}
    >
      <div className={`absolute inset-0 ${overlayOpacity}`}></div>
      <div
        className={`relative container mx-auto flex flex-col h-70 max-w-screen-xl items-center justify-end gap-4 translate-y-60 md:translate-y-5 ${containerClassName}`}
      >
        <h2 className={titleClassName}>{title}</h2>
        <div className="w-full flex flex-col md:flex-row justify-center items-center gap-5 md:items-end">
          {children}
        </div>
      </div>
    </div>
  )
}

// 搜尋表單子元件
export function SearchField({
  fields = [],
  onSearch,
  searchButtonText = '搜尋',
  searchButtonProps = {},
}) {
  return (
    <>
      {fields.map((field, index) => (
        <div key={index} className="w-full space-y-2 flex-1">
          <Label className="text-white">{field.label}</Label>
          {field.component}
        </div>
      ))}
      <Button
        variant="highlight"
        className="w-full md:w-auto h-10 shadow-md"
        onClick={onSearch}
        {...searchButtonProps}
      >
        {searchButtonText}
      </Button>
    </>
  )
}
