'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { CoachCard } from '@/components/card/coach-card'

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

export default function CoachSection({ coaches = [] }) {
  const router = useRouter()

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {coaches?.length &&
          coaches?.slice(0, 4).map((coach) => (
            <motion.div
              variants={fadeUpVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={coach.id}
              key={coach.id}
            >
              <CoachCard data={coach} />
            </motion.div>
          ))}
      </div>
      <div className="flex flex-col items-center">
        <Button
          variant="highlight"
          size="lg"
          className="w-full md:w-auto"
          onClick={() => router.push(`/course`)}
        >
          查看更多
        </Button>
      </div>
    </>
  )
}
