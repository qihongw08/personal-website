"use client";

import { motion, type HTMLMotionProps } from "motion/react";

type FadeInWhenVisibleProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
  threshold?: number;
};

export function FadeInWhenVisible({
  children,
  delay = 0,
  y = 40,
  threshold = 0.1,
  ...rest
}: FadeInWhenVisibleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: threshold }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
