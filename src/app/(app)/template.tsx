"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Route transition: a quick scan-line wipe as each page mounts. */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
      // Drop the clip once revealed so menus and shadows are never clipped.
      animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)", transitionEnd: { clipPath: "none" } }}
      transition={{ duration: 0.28, ease: [0.7, 0, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
