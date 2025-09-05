'use client'

import Link from 'next/link'
import Autoplay from 'embla-carousel-autoplay'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  AntaIcon,
  AsicsIcon,
  ButterflyIcon,
  MizunoIcon,
  MoltenIcon,
  SpaldingIcon,
  VictorIcon,
  WilsonIcon,
  YonexIcon,
  NikeIcon,
} from '@/components/icons/brand-icons'

// 品牌圖標映射
const brandIconMap = {
  anta: AntaIcon,
  asics: AsicsIcon,
  butterfly: ButterflyIcon,
  mizuno: MizunoIcon,
  molten: MoltenIcon,
  spalding: SpaldingIcon,
  victor: VictorIcon,
  wilson: WilsonIcon,
  yonex: YonexIcon,
  Nike: NikeIcon,
}

// 定義 Brand 欄位
const brandItems = [
  { iconKey: 'butterfly', label: 'Butterfly' },
  { iconKey: 'molten', label: 'Molten' },
  { iconKey: 'spalding', label: 'Spalding' },
  { iconKey: 'victor', label: 'VICTOR' },
  { iconKey: 'wilson', label: 'Wilson' },
  { iconKey: 'yonex', label: 'Yonex' },
  { iconKey: 'anta', label: 'Anta' },
  { iconKey: 'asics', label: 'Asics' },
  { iconKey: 'mizuno', label: 'Mizuno' },
  { iconKey: 'Nike', label: 'Nike' },
]

const productHomeIcons = ['anta', 'asics', 'mizuno', 'Nike']

export default function BrandCarousel({ brandIdMap = {} }) {
  const autoplay = Autoplay({ delay: 2000, stopOnInteraction: true })

  return (
    <Carousel
      plugins={[autoplay]}
      onMouseEnter={autoplay.stop}
      onMouseLeave={autoplay.reset}
      className="relative w-full px-4 sm:px-12 overflow-hidden"
    >
      <CarouselContent className="-ml-2 md:-ml-4">
        {brandItems.map((brandItem, idx) => {
          const IconComponent = brandIconMap[brandItem.iconKey]
          const brandId = brandIdMap[brandItem.label.toLowerCase()]
          const href = productHomeIcons.includes(brandItem.iconKey)
            ? `/shop?page=1`
            : brandId
              ? `/shop?brandId=${brandId}&page=1`
              : `/shop?keyword=${encodeURIComponent(brandItem.label)}&page=1`
          return (
            <CarouselItem
              key={`${brandItem.iconKey}-${idx}`}
              className="pl-2 md:pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
            >
              <Link
                href={href}
                className="group flex items-center justify-center transition-all duration-300 hover:scale-105"
              >
                {IconComponent ? (
                  <IconComponent className="w-20 h-20 text-foreground transition-opacity duration-300" />
                ) : (
                  <span className="text-base">{brandItem.label}</span>
                )}
              </Link>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur hover:bg-background" />
      <CarouselNext className="hidden sm:flex right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur hover:bg-background" />
    </Carousel>
  )
}
