"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

// 1. Neural Network Spinner - Perfect for AI assistant
export function NeuralSpinner({ className, size = "md" }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" className="w-full h-full">
        {/* Neural nodes */}
        <motion.circle
          cx="6"
          cy="6"
          r="2"
          fill="currentColor"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
        />
        <motion.circle
          cx="18"
          cy="6"
          r="2"
          fill="currentColor"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
        <motion.circle
          cx="12"
          cy="12"
          r="2"
          fill="currentColor"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        />
        <motion.circle
          cx="6"
          cy="18"
          r="2"
          fill="currentColor"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        />
        <motion.circle
          cx="18"
          cy="18"
          r="2"
          fill="currentColor"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
        />

        {/* Neural connections */}
        <motion.path
          d="M6 6 L12 12 L18 6"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.path
          d="M6 18 L12 12 L18 18"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
      </svg>
    </div>
  );
}

// 2. Code Pulse Spinner - Perfect for coding assistant
export function CodePulseSpinner({ className, size = "md" }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" className="w-full h-full">
        {/* Code brackets */}
        <motion.path
          d="M7 8l-4 4 4 4"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0.3, scale: 0.8 }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.path
          d="M17 8l4 4-4 4"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0.3, scale: 0.8 }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />

        {/* Central pulse */}
        <motion.circle
          cx="12"
          cy="12"
          r="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: [0.5, 1.5, 0.5],
            opacity: [0, 0.7, 0],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </svg>
    </div>
  );
}

// 3. Quantum Dots Spinner - Futuristic and interactive
export function QuantumDotsSpinner({ className, size = "md" }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg viewBox="0 0 24 24" className="w-full h-full">
        {[0, 1, 2, 3, 4].map((index) => (
          <motion.circle
            key={index}
            cx="12"
            cy="12"
            r={2 + index * 0.5}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 1, 1.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.2,
            }}
          />
        ))}

        {/* Center dot */}
        <motion.circle
          cx="12"
          cy="12"
          r="1.5"
          fill="currentColor"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
    </div>
  );
}

// 4. Orbital Spinner - Modern and scientific
export function OrbitalSpinner({ className, size = "md" }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <motion.div
        className="w-full h-full relative"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 24 24" className="w-full h-full">
          {/* Orbital paths */}
          <ellipse
            cx="12"
            cy="12"
            rx="8"
            ry="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
          />
          <ellipse
            cx="12"
            cy="12"
            rx="4"
            ry="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
          />

          {/* Orbiting particles */}
          <motion.circle
            cx="20"
            cy="12"
            r="1.5"
            fill="currentColor"
            animate={{
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
          <motion.circle
            cx="12"
            cy="4"
            r="1.5"
            fill="currentColor"
            animate={{
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.5,
            }}
          />

          {/* Center core */}
          <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.8" />
        </svg>
      </motion.div>
    </div>
  );
}

// 5. Matrix Rain Spinner - Tech/coding themed
export function MatrixSpinner({ className, size = "md" }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={cn("relative overflow-hidden", sizeClasses[size], className)}
    >
      <svg viewBox="0 0 24 24" className="w-full h-full">
        {[0, 1, 2, 3].map((col) => (
          <g key={col}>
            {[0, 1, 2, 3, 4].map((row) => (
              <motion.rect
                key={`${col}-${row}`}
                x={4 + col * 4}
                y={2 + row * 3}
                width="2"
                height="2"
                fill="currentColor"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: col * 0.2 + row * 0.1,
                }}
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

// 6. DNA Helix Spinner - Scientific and modern
export function DNASpinner({ className, size = "md" }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <motion.svg
        viewBox="0 0 24 24"
        className="w-full h-full"
        animate={{ rotateY: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        {/* DNA strands */}
        <motion.path
          d="M8 4 Q12 8 16 12 Q12 16 8 20"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.path
          d="M16 4 Q12 8 8 12 Q12 16 16 20"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />

        {/* Base pairs */}
        {[6, 10, 14, 18].map((y, index) => (
          <motion.line
            key={y}
            x1="8"
            y1={y}
            x2="16"
            y2={y}
            stroke="currentColor"
            strokeWidth="1"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scaleX: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
            }}
          />
        ))}
      </motion.svg>
    </div>
  );
}

// Default spinner component with multiple variants
export function ModernSpinner({
  className,
  size = "md",
  variant = "neural",
}: SpinnerProps & {
  variant?: "neural" | "code" | "quantum" | "orbital" | "matrix" | "dna";
}) {
  const spinners = {
    neural: NeuralSpinner,
    code: CodePulseSpinner,
    quantum: QuantumDotsSpinner,
    orbital: OrbitalSpinner,
    matrix: MatrixSpinner,
    dna: DNASpinner,
  };

  const SpinnerComponent = spinners[variant];
  return <SpinnerComponent className={className} size={size} />;
}
