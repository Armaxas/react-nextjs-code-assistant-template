"use client";

import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 px-2 py-1">
      <motion.div
        className="h-1.5 w-1.5 rounded-full bg-blue-500"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: 0,
        }}
      />
      <motion.div
        className="h-1.5 w-1.5 rounded-full bg-purple-500"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: 0.2,
        }}
      />
      <motion.div
        className="h-1.5 w-1.5 rounded-full bg-blue-500"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: 0.4,
        }}
      />
    </div>
  );
}
