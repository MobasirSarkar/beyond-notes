"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Page container + a short fade/slide as each window mounts. */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="page pt-(--section-gap)"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
