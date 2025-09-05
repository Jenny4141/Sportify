'use client'

import { motion } from 'framer-motion'

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

export default function AnimatedSection({
  children,
  custom = 0,
  className = '',
}) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      custom={custom}
      className={className}
    >
      {children}
    </motion.div>
  )
}
