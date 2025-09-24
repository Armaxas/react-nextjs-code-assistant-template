"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MessageThinkingSpinnerProps {
  className?: string;
  size?: "md" | "lg" | "xl";
}

export function MessageThinkingSpinner({
  className,
  size = "lg",
}: MessageThinkingSpinnerProps) {
  const sizeClasses = {
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Outer pulsing ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-sky-400/30"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.7, 0.2, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Middle rotating ring */}
      <motion.div
        className="absolute inset-1 rounded-full border-2 border-dashed border-sky-500/50"
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: {
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          },
          scale: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      />

      {/* Inner thinking dots */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-1.5 h-1.5 bg-sky-500 rounded-full"
              animate={{
                y: [-2, -6, -2],
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      {/* Interactive sparkles */}
      {[0, 1, 2, 3].map((index) => (
        <motion.div
          key={`sparkle-${index}`}
          className="absolute w-1 h-1 bg-sky-400 rounded-full"
          style={{
            top: `${20 + Math.sin((index * Math.PI) / 2) * 30}%`,
            left: `${20 + Math.cos((index * Math.PI) / 2) * 30}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: index * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Central core with breathing effect */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: [0.9, 1.1, 0.9],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-2 h-2 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full shadow-lg shadow-sky-500/50" />
      </motion.div>

      {/* Trailing particles */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 48">
        {[0, 1, 2].map((index) => (
          <motion.circle
            key={`particle-${index}`}
            cx="24"
            cy="24"
            r="1"
            fill="currentColor"
            className="text-sky-400/70"
            animate={{
              r: [0, 2, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.7,
              ease: "easeOut",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// Alternative brain-wave inspired thinking spinner
export function BrainWaveThinkingSpinner({
  className,
  size = "lg",
}: MessageThinkingSpinnerProps) {
  const sizeClasses = {
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg className="w-full h-full" viewBox="0 0 48 48">
        {/* Brain wave paths */}
        {[0, 1, 2].map((index) => (
          <motion.path
            key={`wave-${index}`}
            d={`M ${8 + index * 4} 24 Q ${16 + index * 4} ${16 - index * 2} ${24 + index * 4} 24 Q ${32 + index * 4} ${32 + index * 2} ${40 + index * 4} 24`}
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-sky-400"
            opacity={0.7 - index * 0.2}
            initial={{ pathLength: 0 }}
            animate={{
              pathLength: [0, 1, 0],
              strokeWidth: [1, 3, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Central neural node */}
        <motion.circle
          cx="24"
          cy="24"
          r="3"
          fill="currentColor"
          className="text-sky-500"
          animate={{
            r: [2, 4, 2],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Synaptic connections */}
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <motion.circle
            key={`synapse-${index}`}
            cx={24 + Math.cos((index * Math.PI) / 3) * 12}
            cy={24 + Math.sin((index * Math.PI) / 3) * 12}
            r="1.5"
            fill="currentColor"
            className="text-sky-300"
            animate={{
              scale: [0.5, 1.5, 0.5],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// Quantum thought bubble spinner
export function QuantumThoughtSpinner({
  className,
  size = "lg",
}: MessageThinkingSpinnerProps) {
  const sizeClasses = {
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Main thought bubble */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400/20 to-blue-500/20 border border-sky-400/30"
        animate={{
          scale: [0.9, 1.05, 0.9],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Smaller thought bubbles */}
      {[0, 1, 2].map((index) => (
        <motion.div
          key={`bubble-${index}`}
          className="absolute w-3 h-3 bg-sky-400/40 rounded-full"
          style={{
            bottom: `${-10 - index * 8}px`,
            left: `${45 + index * 4}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, index % 2 === 0 ? 5 : -5, 0],
            scale: [0.8 - index * 0.1, 1.2 - index * 0.1, 0.8 - index * 0.1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: index * 0.4,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Quantum particles inside */}
      <div className="absolute inset-2 flex items-center justify-center">
        {[0, 1, 2, 3, 4].map((index) => (
          <motion.div
            key={`quantum-${index}`}
            className="absolute w-1 h-1 bg-sky-300 rounded-full"
            animate={{
              x: [0, Math.cos(index * 1.2) * 15, 0],
              y: [0, Math.sin(index * 1.2) * 15, 0],
              scale: [0.5, 1.5, 0.5],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Central processing core */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className="w-2 h-2 bg-sky-500 rounded-full shadow-lg shadow-sky-500/50" />
      </motion.div>
    </div>
  );
}
