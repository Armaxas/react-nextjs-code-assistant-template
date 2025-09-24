"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ClipboardList, X, Sparkles, Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AgentScratchpadToggleProps {
  isOpen: boolean;
  onClick: () => void;
  hasActiveProgress?: boolean;
}

export function AgentScratchpadToggle({
  isOpen,
  onClick,
  hasActiveProgress = false,
}: AgentScratchpadToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onClick}
            variant="outline"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full transition-all duration-300 relative overflow-hidden",
              isOpen
                ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/40 text-blue-500 shadow-lg shadow-blue-500/25"
                : hasActiveProgress
                  ? "bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30 text-orange-500"
                  : "bg-background border-border hover:border-blue-500/30 hover:bg-blue-500/5"
            )}
          >
            {/* Animated background effect */}
            <AnimatePresence>
              {(isOpen || hasActiveProgress) && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
              )}
            </AnimatePresence>

            {/* Pulsing ring for active progress */}
            <AnimatePresence>
              {hasActiveProgress && !isOpen && (
                <motion.div
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.8, 0, 0.8],
                  }}
                  exit={{ scale: 1, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-2 border-orange-500"
                />
              )}
            </AnimatePresence>

            {/* Icon with animation */}
            <motion.div
              animate={isOpen ? { rotate: 0 } : { rotate: 0 }}
              transition={{ duration: 0.3 }}
              className="relative z-10"
            >
              {isOpen ? (
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-4 w-4" />
                </motion.div>
              ) : hasActiveProgress ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <ClipboardList className="h-4 w-4" />
                </motion.div>
              )}
            </motion.div>

            {/* Sparkle effects */}
            <AnimatePresence>
              {isOpen && (
                <>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0, rotate: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        rotate: [0, 180, 360],
                        x: [0, (i - 1) * 15, 0],
                        y: [0, (i - 1) * 10, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                      className="absolute"
                    >
                      <Sparkles className="h-2 w-2 text-blue-400" />
                    </motion.div>
                  ))}
                </>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="font-medium">
        <div className="text-center">
          <div>
            {isOpen ? "Close Agent Scratchpad" : "Open Agent Scratchpad"}
          </div>
          {hasActiveProgress && !isOpen && (
            <div className="text-xs text-orange-400 mt-1">
              Agent is thinking...
            </div>
          )}
          {isOpen && (
            <div className="text-xs text-blue-400 mt-1">
              Multiple visualization modes available
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
