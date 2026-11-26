'use client';

import { motion, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';

const SCORE_SPRING = { stiffness: 180, damping: 26 };

/** Counts toward the latest score; screen readers get the exact value, not the tween. */
export const AnimatedScore = ({ score }: { score: number }) => {
  const spring = useSpring(score, SCORE_SPRING);
  const rounded = useTransform(spring, (value) => Math.round(value));

  useEffect(() => {
    spring.set(score);
  }, [spring, score]);

  return (
    <span className="font-mono text-2xl font-semibold tabular-nums">
      <motion.span aria-hidden>{rounded}</motion.span>
      <span className="sr-only">{`Score ${score} of 100`}</span>
    </span>
  );
};
