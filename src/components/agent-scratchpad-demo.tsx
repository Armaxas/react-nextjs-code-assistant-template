"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GitBranch, Sparkles, ClipboardList, Play, Zap } from "lucide-react";
import { AgentScratchpad } from "./agent-scratchpad";
import { EnhancedAgentScratchpad } from "./enhanced-agent-scratchpad";
import { FlowAgentScratchpad } from "./flow-agent-scratchpad";
import { Message } from "@/types/types";
import { cn } from "@/lib/utils";

type ScratchpadVariant = "original" | "enhanced" | "flow";

interface AgentScratchpadDemoProps {
  isOpen: boolean;
  onClose: () => void;
  messages?: Message[];
  isLoading: boolean;
  progressMessages: Message[];
}

const variants = [
  {
    id: "original" as const,
    name: "Original Design",
    description: "Clean, professional timeline view",
    icon: ClipboardList,
    color: "blue",
    gradient: "from-blue-500 to-blue-600",
    features: [
      "Timeline Layout",
      "Step-by-step Progress",
      "Expandable Details",
    ],
  },
  {
    id: "enhanced" as const,
    name: "Enhanced Timeline",
    description: "Rich visuals with smart categorization",
    icon: Sparkles,
    color: "purple",
    gradient: "from-purple-500 to-pink-500",
    features: [
      "Smart Step Types",
      "Progress Analytics",
      "Mini-map Navigation",
      "Enhanced Animations",
    ],
  },
  {
    id: "flow" as const,
    name: "Flow Visualization",
    description: "Interactive network-style process flow",
    icon: GitBranch,
    color: "emerald",
    gradient: "from-emerald-500 to-teal-500",
    features: [
      "Node-based Flow",
      "Animated Connections",
      "Interactive Hover",
      "Organic Layout",
    ],
  },
];

export function AgentScratchpadDemo({
  isOpen,
  onClose,
  messages,
  isLoading,
  progressMessages,
}: AgentScratchpadDemoProps) {
  const [currentVariant, setCurrentVariant] =
    useState<ScratchpadVariant>("enhanced");
  const [showVariantSelector, setShowVariantSelector] = useState(false);

  const currentVariantInfo = variants.find((v) => v.id === currentVariant);

  const renderScratchpad = () => {
    const commonProps = {
      isOpen,
      messages,
      isLoading,
      progressMessages,
      onClose,
      onSwitchStyle: () => setShowVariantSelector(true), // Add style switcher
    };

    switch (currentVariant) {
      case "original":
        return <AgentScratchpad {...commonProps} />;
      case "enhanced":
        return <EnhancedAgentScratchpad {...commonProps} />;
      case "flow":
        return <FlowAgentScratchpad {...commonProps} />;
      default:
        return <EnhancedAgentScratchpad {...commonProps} />;
    }
  };

  return (
    <>
      {/* Variant Selector Modal */}
      <AnimatePresence>
        {showVariantSelector && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowVariantSelector(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed right-[0px] bottom-[0px] transform -translate-x-1/2 -translate-y-1/2 z-50"
            >
              <div className="bg-background/95 backdrop-blur-md rounded-2xl border border-border/50 shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">
                      Choose Your Agent Scratchpad Style
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Experience different visualization approaches for agent
                      progress monitoring
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVariantSelector(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {variants.map((variant) => {
                    const Icon = variant.icon;
                    const isSelected = currentVariant === variant.id;

                    return (
                      <motion.button
                        key={variant.id}
                        onClick={() => {
                          setCurrentVariant(variant.id);
                          setShowVariantSelector(false);
                        }}
                        className={cn(
                          "relative p-6 rounded-xl border-2 transition-all text-left group hover:scale-[1.02]",
                          isSelected
                            ? "border-blue-500/50 bg-blue-500/10 ring-2 ring-blue-500/20"
                            : "border-border/30 hover:border-border/50 hover:bg-muted/50"
                        )}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Background gradient */}
                        <div
                          className={cn(
                            "absolute inset-0 rounded-xl opacity-5 group-hover:opacity-10 transition-opacity",
                            `bg-gradient-to-br ${variant.gradient}`
                          )}
                        />

                        <div className="relative">
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className={cn(
                                "p-2 rounded-lg",
                                isSelected
                                  ? `bg-gradient-to-br ${variant.gradient} text-white`
                                  : "bg-muted text-muted-foreground group-hover:text-foreground"
                              )}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">
                                {variant.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {variant.description}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1 mb-4">
                            {variant.features.map((feature, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-xs text-muted-foreground"
                              >
                                <div
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    isSelected
                                      ? `bg-${variant.color}-500`
                                      : "bg-muted-foreground/50"
                                  )}
                                />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>

                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-2 text-xs font-medium text-blue-600"
                            >
                              <Zap className="w-3 h-3" />
                              Currently Active
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Each variant offers a unique perspective on agent
                      intelligence visualization
                    </div>
                    <Button
                      onClick={() => setShowVariantSelector(false)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Experience
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Current variant indicator */}
      <AnimatePresence>
        {isOpen && !showVariantSelector && currentVariantInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-6 z-25"
          >
            <div
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium text-white shadow-md",
                `bg-gradient-to-r ${currentVariantInfo.gradient}`
              )}
            >
              <div className="flex items-center gap-1">
                <currentVariantInfo.icon className="w-3 h-3" />
                <span>{currentVariantInfo.name}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render the selected scratchpad variant */}
      {isOpen && !showVariantSelector && renderScratchpad()}
    </>
  );
}
