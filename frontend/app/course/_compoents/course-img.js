import Image from 'next/image'

export default function CourseImg({ imgs = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-4 lg:gap-6 w-full max-w-[1148px] mx-auto px-4 sm:px-0">
      {imgs.map((img, index) => {
        return (
          <div
            key={img.id}
            className="w-full overflow-hidden rounded-lg shadow-lg sm:shadow-none"
          >
            <Image
              width={540}
              height={350}
              src={img.src}
              alt={img.alt}
              className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, 540px"
            />
          </div>
        )
      })}
    </div>
  )
}
