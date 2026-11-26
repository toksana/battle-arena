'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

const REVEAL_OFFSET_PX = 6;
const REVEAL_DURATION_S = 0.25;

interface RevealProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li';
}

/** Fades and lifts content in as it streams; reduced motion keeps only the fade. */
export const Reveal = ({ children, className, as = 'div' }: RevealProps) => {
  const Component = as === 'li' ? motion.li : motion.div;
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: REVEAL_OFFSET_PX }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: REVEAL_DURATION_S, ease: 'easeOut' }}
    >
      {children}
    </Component>
  );
};
