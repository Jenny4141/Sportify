'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { getCenterImageUrl } from '@/api/venue/image'

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      delay: i * 0.3,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
}

function renderStars(data) {
  const rating = data.averageRating ?? 0
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          className={cn(
            'h-4 w-4',
            i < fullStars
              ? 'fill-yellow-400 text-yellow-400'
              : i === fullStars && hasHalfStar
                ? 'fill-yellow-400/50 text-yellow-400'
                : 'stroke-yellow-400 text-muted'
          )}
          key={`star-${data.id}-position-${i + 1}`}
        />
      ))}
      {rating > 0 && (
        <span className="ml-1 text-xs text-accent">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  )
}

export default function VenueCarousel({ centers = [] }) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      custom={2}
      className="flex-2 relative"
    >
      <Carousel className="w-full">
        <CarouselContent>
          {centers && centers.length > 0 ? (
            centers.slice(1, 6).map((center, index) => (
              <CarouselItem
                key={center.id || index}
                className="flex justify-center"
              >
                <Link
                  href={`/venue/${center.id}`}
                  className="w-full h-full block"
                >
                  <div className="relative w-full h-[300px] md:h-[532px] rounded-lg overflow-hidden">
                    {center.images && center.images.length > 0 ? (
                      <Image
                        alt={center.name || `場館 ${index + 1}`}
                        className={cn(
                          'object-cover transition-transform duration-300 ease-in-out hover:scale-105'
                        )}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        src={getCenterImageUrl(center.images[0])}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                        <div className="text-center">
                          <div className="text-lg font-medium">
                            {center.name || `場館 ${index + 1}`}
                          </div>
                          <div className="text-sm mt-2">暫無圖片</div>
                        </div>
                      </div>
                    )}
                    {/* 場館名稱疊加層 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <h3 className="text-white font-semibold text-lg">
                        {center.name || `場館 ${index + 1}`}
                      </h3>
                      {center.location && (
                        <p className="text-white/80 text-sm">
                          {center.location.name || center.location}
                        </p>
                      )}
                      {center.averageRating && <div>{renderStars(center)}</div>}
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))
          ) : (
            <CarouselItem className="flex justify-center">
              <div className="w-full h-[400px] flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-medium">暫無場館資料</div>
                  <div className="text-sm mt-2">請稍後再試</div>
                </div>
              </div>
            </CarouselItem>
          )}
        </CarouselContent>
        <CarouselPrevious className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10" />
        <CarouselNext className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10" />
      </Carousel>
    </motion.div>
  )
}
