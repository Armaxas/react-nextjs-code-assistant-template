"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  X,
  Brain,
  Code2,
  Search,
  Database,
  Network,
  CheckCircle2,
  GitBranch,
  Zap,
  Activity,
  Cpu,
  Timer,
  Workflow,
  TrendingUp,
  Sparkles,
  MoreHorizontal,
  FileText,
  Layers,
  Terminal,
  Map,
} from "lucide-react";
import { Message } from "@/types/types";
import { cn } from "@/lib/utils";
import { useSidebar } from "./ui/sidebar";

interface FlowAgentScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
  messages?: Message[];
  isLoading: boolean;
  progressMessages: Message[];
  onSwitchStyle?: () => void; // Add style switcher prop
}

// Helper to extract text content from message
const getContentText = (
  content: string | Array<{ type: string; text: string }>
) => {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    const textItem = content.find((item) => item.type === "text");
    return textItem?.text || "Processing...";
  }
  return "Processing...";
};

// Helper function to analyze query type and complexity
const analyzeQuery = (content: string) => {
  const lowerContent = content.toLowerCase();

  // Determine query type
  let queryType = "general";
  let icon = Activity;
  let complexity = "medium";
  let estimatedTime = "2-5 min";

  if (
    lowerContent.includes("code") ||
    lowerContent.includes("implement") ||
    lowerContent.includes("build") ||
    lowerContent.includes("create")
  ) {
    queryType = "development";
    icon = Code2;
    complexity = "high";
    estimatedTime = "5-10 min";
  } else if (
    lowerContent.includes("search") ||
    lowerContent.includes("find") ||
    lowerContent.includes("look") ||
    lowerContent.includes("get")
  ) {
    queryType = "research";
    icon = Search;
    complexity = "low";
    estimatedTime = "1-3 min";
  } else if (
    lowerContent.includes("analyz") ||
    lowerContent.includes("review") ||
    lowerContent.includes("check") ||
    lowerContent.includes("examine")
  ) {
    queryType = "analysis";
    icon = Brain;
    complexity = "high";
    estimatedTime = "3-8 min";
  } else if (
    lowerContent.includes("data") ||
    lowerContent.includes("information") ||
    lowerContent.includes("fetch")
  ) {
    queryType = "data";
    icon = Database;
    complexity = "medium";
    estimatedTime = "2-5 min";
  }

  // Determine complexity based on length and keywords
  if (
    content.length > 200 ||
    lowerContent.includes("complex") ||
    lowerContent.includes("detailed") ||
    lowerContent.includes("comprehensive")
  ) {
    complexity = "high";
    estimatedTime = "5-15 min";
  } else if (
    content.length < 50 ||
    lowerContent.includes("simple") ||
    lowerContent.includes("quick") ||
    lowerContent.includes("brief")
  ) {
    complexity = "low";
    estimatedTime = "1-2 min";
  }

  return {
    type: queryType,
    icon,
    complexity,
    estimatedTime,
    wordCount: content.split(/\s+/).length,
    hasCodeKeywords:
      /\b(function|class|const|let|var|import|export|interface|type)\b/i.test(
        content
      ),
    hasFileKeywords:
      /\b(file|folder|directory|path|\.js|\.ts|\.tsx|\.jsx|\.py|\.java)\b/i.test(
        content
      ),
  };
};

// Enhanced step categorization with richer metadata
const getFlowNodeType = (content: string) => {
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes("search") ||
    lowerContent.includes("query") ||
    lowerContent.includes("find")
  ) {
    return {
      type: "search",
      icon: Search,
      gradient: "from-blue-400 via-blue-500 to-blue-600",
      shadowColor: "shadow-blue-500/30",
      glowColor: "rgba(59, 130, 246, 0.4)",
      bgPattern: "bg-gradient-to-br from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      category: "Information Retrieval",
      priority: "medium",
    };
  }
  if (
    lowerContent.includes("analyz") ||
    lowerContent.includes("process") ||
    lowerContent.includes("think")
  ) {
    return {
      type: "analysis",
      icon: Brain,
      gradient: "from-purple-400 via-purple-500 to-purple-600",
      shadowColor: "shadow-purple-500/30",
      glowColor: "rgba(147, 51, 234, 0.4)",
      bgPattern: "bg-gradient-to-br from-purple-50 to-purple-100",
      borderColor: "border-purple-200",
      category: "Intelligence Processing",
      priority: "high",
    };
  }
  if (
    lowerContent.includes("code") ||
    lowerContent.includes("implement") ||
    lowerContent.includes("build")
  ) {
    return {
      type: "code",
      icon: Code2,
      gradient: "from-emerald-400 via-emerald-500 to-emerald-600",
      shadowColor: "shadow-emerald-500/30",
      glowColor: "rgba(16, 185, 129, 0.4)",
      bgPattern: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      borderColor: "border-emerald-200",
      category: "Code Generation",
      priority: "high",
    };
  }
  if (
    lowerContent.includes("data") ||
    lowerContent.includes("fetch") ||
    lowerContent.includes("retrieve")
  ) {
    return {
      type: "data",
      icon: Database,
      gradient: "from-orange-400 via-orange-500 to-orange-600",
      shadowColor: "shadow-orange-500/30",
      glowColor: "rgba(249, 115, 22, 0.4)",
      bgPattern: "bg-gradient-to-br from-orange-50 to-orange-100",
      borderColor: "border-orange-200",
      category: "Data Operations",
      priority: "medium",
    };
  }
  if (
    lowerContent.includes("network") ||
    lowerContent.includes("connect") ||
    lowerContent.includes("api")
  ) {
    return {
      type: "network",
      icon: Network,
      gradient: "from-cyan-400 via-cyan-500 to-cyan-600",
      shadowColor: "shadow-cyan-500/30",
      glowColor: "rgba(6, 182, 212, 0.4)",
      bgPattern: "bg-gradient-to-br from-cyan-50 to-cyan-100",
      borderColor: "border-cyan-200",
      category: "Network Operations",
      priority: "medium",
    };
  }

  return {
    type: "system",
    icon: Cpu,
    gradient: "from-slate-400 via-slate-500 to-slate-600",
    shadowColor: "shadow-slate-500/30",
    glowColor: "rgba(100, 116, 139, 0.4)",
    bgPattern: "bg-gradient-to-br from-slate-50 to-slate-100",
    borderColor: "border-slate-200",
    category: "System Process",
    priority: "low",
  };
};

export function FlowAgentScratchpad({
  isOpen,
  onClose,
  isLoading,
  progressMessages,
  onSwitchStyle,
  messages,
}: FlowAgentScratchpadProps) {
  const { open } = useSidebar();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {}
  );

  const flowNodes = useMemo(() => {
    return progressMessages.map((message, index) => ({
      id: `node-${index}`,
      ...message,
      ...getFlowNodeType(getContentText(message.content)),
      index,
      isCompleted: !isLoading || index < progressMessages.length - 1,
      isActive: isLoading && index === progressMessages.length - 1,
      duration: Math.random() * 3 + 2,
      progress:
        !isLoading || index < progressMessages.length - 1
          ? 100
          : Math.random() * 70 + 20,
    }));
  }, [progressMessages, isLoading]);

  // Group progress messages by their related query (like Enhanced scratchpad)
  const groupedProgressMessages = useMemo(() => {
    const groups: Record<string, typeof progressMessages> = {};
    progressMessages.forEach((message) => {
      if (message.relatedToQuery) {
        if (!groups[message.relatedToQuery]) {
          groups[message.relatedToQuery] = [];
        }
        groups[message.relatedToQuery].push(message);
      }
    });
    return groups;
  }, [progressMessages]);

  const queryGroups = useMemo(() => {
    return Object.entries(groupedProgressMessages)
      .map(([queryId, progressMsgs]) => {
        const userMessage = messages?.find(
          (msg) => msg.id === queryId && msg.role === "user"
        );
        return {
          queryId,
          userMessage,
          progressMessages: progressMsgs,
        };
      })
      .sort((a, b) => {
        const timeA = a.userMessage?.createdAt
          ? new Date(a.userMessage.createdAt).getTime()
          : 0;
        const timeB = b.userMessage?.createdAt
          ? new Date(b.userMessage.createdAt).getTime()
          : 0;
        return timeB - timeA;
      });
  }, [groupedProgressMessages, messages]);

  const activeStep = isLoading ? flowNodes.length - 1 : -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 400, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 400, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            "fixed top-0 right-0 h-full shadow-2xl z-50 flex flex-col",
            "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
            "border-l border-slate-700/50 backdrop-blur-sm",
            open ? "w-[40%]" : "w-[45%]"
          )}
          style={{
            background: `
              radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 70% 60%, rgba(147, 51, 234, 0.08) 0%, transparent 50%),
              linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(30, 41, 59) 50%, rgb(15, 23, 42) 100%)
            `,
          }}
        >
          {/* Animated Background Grid */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: "24px 24px",
              }}
            />
          </div>

          {/* Flowing Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60"
                animate={{
                  x: [-20, window.innerWidth || 800],
                  y: [
                    Math.random() * (window.innerHeight || 600),
                    Math.random() * (window.innerHeight || 600),
                  ],
                }}
                transition={{
                  duration: 8 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                  ease: "linear",
                }}
              />
            ))}
          </div>

          {/* Header with Flow Controls */}
          <div className="flex-none p-4 border-b border-slate-700/50 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(59, 130, 246, 0.5)",
                      "0 0 30px rgba(147, 51, 234, 0.5)",
                      "0 0 20px rgba(59, 130, 246, 0.5)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
                />
                <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-blue-400" />
                  Flow Network
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {onSwitchStyle && (
                  <Button
                    onClick={onSwitchStyle}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 hover:text-emerald-200 transition-all duration-300"
                  >
                    <GitBranch className="w-3 h-3 mr-2" />
                    Switch Style
                  </Button>
                )}
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-red-500/20 text-white/70 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Flow Stats */}
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2 text-blue-300">
                <Activity className="w-4 h-4" />
                <span>{flowNodes.length} Processing Nodes</span>
              </div>
              <div className="flex items-center gap-2 text-purple-300">
                <TrendingUp className="w-4 h-4" />
                <span>{isLoading ? "Active Flow" : "Flow Complete"}</span>
              </div>
              {activeStep >= 0 && (
                <div className="flex items-center gap-2 text-emerald-300">
                  <Zap className="w-4 h-4" />
                  <span>Processing Step {activeStep + 1}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-cyan-300">
                <Timer className="w-4 h-4" />
                <span>
                  {progressMessages.length > 0
                    ? `${progressMessages.filter((_, i) => !isLoading || i < progressMessages.length - 1).length}/${progressMessages.length} Complete`
                    : "Ready"}
                </span>
              </div>
            </div>
          </div>

          {/* Flow Network Canvas */}
          <div className="flex-1 overflow-hidden relative">
            <div className="h-full overflow-y-auto p-6 custom-scrollbar">
              {flowNodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="relative"
                  >
                    <Workflow className="h-16 w-16 mb-4" />
                    <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl" />
                  </motion.div>
                  <p className="text-center font-medium">Flow Network Ready</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Nodes will appear as processes execute
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Query Context Section */}
                  {queryGroups.length > 0 && (
                    <div className="space-y-6">
                      {queryGroups.map((group, groupIndex) => {
                        const isActiveQuery = isLoading && groupIndex === 0;
                        const queryContent =
                          typeof group.userMessage?.content === "string"
                            ? group.userMessage.content
                            : "Processing query...";

                        // Analyze the query for enhanced display
                        const queryAnalysis = analyzeQuery(queryContent);
                        const QueryIcon = queryAnalysis.icon;

                        return (
                          <motion.div
                            key={group.queryId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: groupIndex * 0.1 }}
                            className={cn(
                              "rounded-xl border-2 p-5 transition-all duration-300 relative overflow-hidden",
                              isActiveQuery
                                ? "border-blue-400/50 bg-blue-500/5 shadow-lg shadow-blue-500/10"
                                : "border-slate-600/30 bg-slate-800/20"
                            )}
                            style={{
                              background: isActiveQuery
                                ? `linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.04) 100%)`
                                : `linear-gradient(135deg, rgba(100, 116, 139, 0.05) 0%, rgba(71, 85, 105, 0.03) 100%)`,
                            }}
                          >
                            {/* Animated Border Flow for Active Query */}
                            {isActiveQuery && (
                              <motion.div
                                animate={{
                                  background: [
                                    "linear-gradient(0deg, transparent, rgba(59, 130, 246, 0.3), transparent)",
                                    "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)",
                                    "linear-gradient(180deg, transparent, rgba(59, 130, 246, 0.3), transparent)",
                                    "linear-gradient(270deg, transparent, rgba(59, 130, 246, 0.3), transparent)",
                                  ],
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute inset-0 rounded-xl pointer-events-none"
                              />
                            )}

                            <div className="relative z-10">
                              <div className="flex items-start gap-4">
                                <motion.div
                                  animate={
                                    isActiveQuery
                                      ? {
                                          boxShadow: [
                                            "0 0 20px rgba(59, 130, 246, 0.4)",
                                            "0 0 30px rgba(147, 51, 234, 0.4)",
                                            "0 0 20px rgba(59, 130, 246, 0.4)",
                                          ],
                                          scale: [1, 1.05, 1],
                                        }
                                      : {}
                                  }
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center border-2",
                                    "bg-gradient-to-br from-blue-500 to-purple-500",
                                    isActiveQuery
                                      ? "border-blue-300/50"
                                      : "border-blue-400/30"
                                  )}
                                >
                                  <QueryIcon className="w-6 h-6 text-white" />
                                </motion.div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-lg font-semibold text-white/90">
                                      Query Analysis
                                    </h3>
                                    <span
                                      className={cn(
                                        "text-xs font-semibold px-3 py-1 rounded-full",
                                        "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                                      )}
                                    >
                                      {queryAnalysis.type
                                        .charAt(0)
                                        .toUpperCase() +
                                        queryAnalysis.type.slice(1)}
                                    </span>
                                    {isActiveQuery && (
                                      <motion.span
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{
                                          duration: 1.5,
                                          repeat: Infinity,
                                        }}
                                        className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-400/30"
                                      >
                                        Processing
                                      </motion.span>
                                    )}
                                  </div>

                                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 mb-4">
                                    <p className="text-sm text-slate-200 leading-relaxed font-medium">
                                      {queryContent}
                                    </p>
                                  </div>

                                  {/* Query Analysis Details */}
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3 text-xs">
                                        <div className="flex items-center gap-2">
                                          <TrendingUp className="w-3 h-3 text-blue-400" />
                                          <span className="text-slate-400">
                                            Complexity:
                                          </span>
                                        </div>
                                        <span
                                          className={cn(
                                            "font-semibold capitalize",
                                            queryAnalysis.complexity ===
                                              "high" && "text-red-400",
                                            queryAnalysis.complexity ===
                                              "medium" && "text-yellow-400",
                                            queryAnalysis.complexity ===
                                              "low" && "text-green-400"
                                          )}
                                        >
                                          {queryAnalysis.complexity}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs">
                                        <div className="flex items-center gap-2">
                                          <Timer className="w-3 h-3 text-purple-400" />
                                          <span className="text-slate-400">
                                            Est. Time:
                                          </span>
                                        </div>
                                        <span className="text-slate-300 font-medium">
                                          {queryAnalysis.estimatedTime}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3 text-xs">
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-3 h-3 text-emerald-400" />
                                          <span className="text-slate-400">
                                            Words:
                                          </span>
                                        </div>
                                        <span className="text-slate-300 font-medium">
                                          {queryAnalysis.wordCount}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs">
                                        <div className="flex items-center gap-2">
                                          <Activity className="w-3 h-3 text-cyan-400" />
                                          <span className="text-slate-400">
                                            Steps:
                                          </span>
                                        </div>
                                        <span className="text-slate-300 font-medium">
                                          {group.progressMessages.length}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Query Features */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {queryAnalysis.hasCodeKeywords && (
                                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full border border-emerald-500/30">
                                        Code Related
                                      </span>
                                    )}
                                    {queryAnalysis.hasFileKeywords && (
                                      <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full border border-orange-500/30">
                                        File Operations
                                      </span>
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-slate-400">
                                      <span>Status:</span>
                                      <span
                                        className={cn(
                                          "font-medium",
                                          isActiveQuery
                                            ? "text-blue-300"
                                            : "text-emerald-300"
                                        )}
                                      >
                                        {isActiveQuery
                                          ? "Processing..."
                                          : "Completed"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Flow Nodes */}
                  {flowNodes.map((node, index) => {
                    const Icon = node.icon;
                    const delay = index * 0.15;
                    const isConnected = index < flowNodes.length - 1;

                    return (
                      <div key={node.id} className="relative">
                        {/* Connection Flow Line */}
                        {isConnected && (
                          <div className="absolute left-8 top-20 w-0.5 h-16 z-0">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "100%" }}
                              transition={{ delay: delay + 0.3, duration: 0.6 }}
                              className="w-full bg-gradient-to-b from-slate-600 via-blue-500/50 to-slate-600 rounded-full relative overflow-hidden"
                            >
                              {/* Flowing Energy */}
                              <motion.div
                                animate={{
                                  y: [-20, 64],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                  delay: delay + 1,
                                }}
                                className="absolute w-full h-4 bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-80"
                              />
                            </motion.div>
                          </div>
                        )}

                        {/* Flow Node */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.3, x: -50 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          transition={{
                            delay,
                            duration: 0.6,
                            type: "spring",
                            stiffness: 200,
                            damping: 20,
                          }}
                          className="relative z-10"
                        >
                          <div
                            className={cn(
                              "relative rounded-2xl border-2 transition-all duration-500 overflow-hidden",
                              node.bgPattern,
                              node.borderColor,
                              node.isActive &&
                                "ring-2 ring-blue-400/50 ring-offset-2 ring-offset-slate-900",
                              node.isCompleted && "border-emerald-300/50",
                              !node.isActive &&
                                !node.isCompleted &&
                                "border-slate-600/50"
                            )}
                            style={{
                              background: node.isActive
                                ? `linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)`
                                : node.isCompleted
                                  ? `linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 182, 212, 0.03) 100%)`
                                  : `linear-gradient(135deg, rgba(100, 116, 139, 0.05) 0%, rgba(71, 85, 105, 0.03) 100%)`,
                              boxShadow: node.isActive
                                ? `0 8px 32px ${node.glowColor}, 0 0 0 1px rgba(59, 130, 246, 0.1)`
                                : node.isCompleted
                                  ? `0 4px 16px rgba(16, 185, 129, 0.2)`
                                  : `0 2px 8px rgba(0, 0, 0, 0.3)`,
                            }}
                          >
                            {/* Animated Border Flow */}
                            {node.isActive && (
                              <motion.div
                                animate={{
                                  background: [
                                    "linear-gradient(0deg, transparent, rgba(59, 130, 246, 0.5), transparent)",
                                    "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)",
                                    "linear-gradient(180deg, transparent, rgba(59, 130, 246, 0.5), transparent)",
                                    "linear-gradient(270deg, transparent, rgba(59, 130, 246, 0.5), transparent)",
                                  ],
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 rounded-2xl"
                              />
                            )}

                            {/* Node Content */}
                            <div className="relative p-5">
                              <div className="flex items-start gap-4">
                                {/* Node Icon */}
                                <div className="relative flex-shrink-0">
                                  <motion.div
                                    animate={
                                      node.isActive
                                        ? {
                                            scale: [1, 1.1, 1],
                                            rotate: [0, 360],
                                          }
                                        : {}
                                    }
                                    transition={{
                                      scale: { duration: 2, repeat: Infinity },
                                      rotate: {
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "linear",
                                      },
                                    }}
                                    className={cn(
                                      "w-12 h-12 rounded-xl flex items-center justify-center",
                                      "bg-gradient-to-br border-2",
                                      node.gradient,
                                      node.isActive
                                        ? "border-blue-300/50"
                                        : "border-white/20",
                                      node.shadowColor
                                    )}
                                    style={{
                                      boxShadow: node.isActive
                                        ? `0 0 20px ${node.glowColor}`
                                        : `0 4px 12px rgba(0, 0, 0, 0.3)`,
                                    }}
                                  >
                                    <Icon className="h-6 w-6 text-white" />
                                  </motion.div>

                                  {/* Status Indicator */}
                                  <div className="absolute -top-1 -right-1">
                                    {node.isCompleted ? (
                                      <CheckCircle2 className="h-5 w-5 text-emerald-400 bg-slate-900 rounded-full" />
                                    ) : node.isActive ? (
                                      <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{
                                          duration: 1,
                                          repeat: Infinity,
                                        }}
                                        className="h-5 w-5 bg-blue-400 rounded-full border-2 border-slate-900"
                                      />
                                    ) : (
                                      <div className="h-5 w-5 bg-slate-600 rounded-full border-2 border-slate-900" />
                                    )}
                                  </div>
                                </div>

                                {/* Node Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span
                                      className={cn(
                                        "text-xs font-semibold px-2 py-1 rounded-md",
                                        "bg-gradient-to-r text-white",
                                        node.gradient
                                      )}
                                    >
                                      {node.category}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      Node {index + 1}
                                    </span>
                                    {node.isActive && (
                                      <motion.div
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{
                                          duration: 1.5,
                                          repeat: Infinity,
                                        }}
                                      >
                                        <Sparkles className="w-3 h-3 text-blue-400" />
                                      </motion.div>
                                    )}
                                  </div>

                                  <h3 className="font-medium text-white/90 mb-2 capitalize">
                                    {node.type} Process
                                  </h3>

                                  <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                                    {getContentText(node.content)}
                                  </p>

                                  {/* Progress Bar */}
                                  <div className="mt-3 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-slate-400">
                                        Progress
                                      </span>
                                      <span className="text-slate-300">
                                        {Math.round(node.progress)}%
                                      </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${node.progress}%` }}
                                        transition={{
                                          delay: delay + 0.5,
                                          duration: 1.5,
                                        }}
                                        className={cn(
                                          "h-full rounded-full bg-gradient-to-r",
                                          node.gradient
                                        )}
                                        style={{
                                          boxShadow: `0 0 8px ${node.glowColor}`,
                                        }}
                                      />
                                    </div>
                                  </div>

                                  {/* Execution Time */}
                                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                                    <div className="flex items-center gap-1">
                                      <Timer className="w-3 h-3" />
                                      <span>{node.duration.toFixed(1)}s</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Activity className="w-3 h-3" />
                                      <span className="capitalize">
                                        {node.priority} Priority
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Expand Button */}
                                <Button
                                  onClick={() =>
                                    setExpandedNodes((prev) => ({
                                      ...prev,
                                      [node.id]: !prev[node.id],
                                    }))
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="self-start h-8 w-8 p-0 hover:bg-slate-700/50 text-slate-400 hover:text-white"
                                >
                                  <motion.div
                                    animate={{
                                      rotate: expandedNodes[node.id] ? 90 : 0,
                                    }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </motion.div>
                                </Button>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            <AnimatePresence>
                              {expandedNodes[node.id] && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="border-t border-slate-600/30 pt-6"
                                >
                                  <div className="space-y-6">
                                    {/* Full Content Analysis */}
                                    <div>
                                      <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                        <Brain className="w-4 h-4 text-blue-400" />
                                        Execution Details
                                      </h4>
                                      <div className="bg-slate-900/80 rounded-lg p-4 border border-slate-700/50">
                                        <pre className="text-sm text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                                          {getContentText(node.content)}
                                        </pre>
                                      </div>
                                    </div>

                                    {/* Content Type Analysis */}
                                    {Array.isArray(node.content) && (
                                      <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                          <Layers className="w-4 h-4 text-purple-400" />
                                          Content Components
                                        </h4>

                                        {node.content.map((item, i) => {
                                          if (
                                            typeof item === "object" &&
                                            "type" in item
                                          ) {
                                            const content = getContentText(
                                              node.content
                                            );

                                            // Skip main text content as it's already shown above
                                            if (
                                              item.type === "text" &&
                                              item.text === content
                                            ) {
                                              return null;
                                            }

                                            // Show additional text information
                                            if (
                                              item.type === "text" &&
                                              item.text &&
                                              item.text !== content
                                            ) {
                                              return (
                                                <motion.div
                                                  key={i}
                                                  initial={{
                                                    opacity: 0,
                                                    y: 10,
                                                  }}
                                                  animate={{ opacity: 1, y: 0 }}
                                                  transition={{
                                                    delay: i * 0.1,
                                                  }}
                                                  className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30"
                                                >
                                                  <div className="flex items-center gap-2 mb-3">
                                                    <FileText className="w-4 h-4 text-blue-400" />
                                                    <span className="text-sm font-medium text-blue-300">
                                                      Additional Information
                                                    </span>
                                                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                                                      Text
                                                    </span>
                                                  </div>
                                                  <p className="text-sm text-blue-200 leading-relaxed">
                                                    {item.text}
                                                  </p>
                                                </motion.div>
                                              );
                                            }

                                            // Show tool code with enhanced styling
                                            if (
                                              item.type === "tool_code" &&
                                              item.text
                                            ) {
                                              return (
                                                <motion.div
                                                  key={i}
                                                  initial={{
                                                    opacity: 0,
                                                    y: 10,
                                                  }}
                                                  animate={{ opacity: 1, y: 0 }}
                                                  transition={{
                                                    delay: i * 0.1,
                                                  }}
                                                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/50"
                                                >
                                                  <div className="flex items-center gap-2 mb-3">
                                                    <Code2 className="w-4 h-4 text-emerald-400" />
                                                    <span className="text-sm font-medium text-emerald-300">
                                                      Tool Execution Code
                                                    </span>
                                                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
                                                      Code
                                                    </span>
                                                  </div>
                                                  <div className="bg-slate-950 rounded-md p-3 overflow-x-auto border border-slate-700/30">
                                                    <pre className="text-xs text-emerald-100 leading-relaxed">
                                                      <code>{item.text}</code>
                                                    </pre>
                                                  </div>
                                                </motion.div>
                                              );
                                            }

                                            // Show tool output with enhanced styling
                                            if (
                                              item.type ===
                                                "tool_code_output" &&
                                              item.text
                                            ) {
                                              return (
                                                <motion.div
                                                  key={i}
                                                  initial={{
                                                    opacity: 0,
                                                    y: 10,
                                                  }}
                                                  animate={{ opacity: 1, y: 0 }}
                                                  transition={{
                                                    delay: i * 0.1,
                                                  }}
                                                  className="bg-green-500/10 rounded-lg p-4 border border-green-500/30"
                                                >
                                                  <div className="flex items-center gap-2 mb-3">
                                                    <Terminal className="w-4 h-4 text-green-400" />
                                                    <span className="text-sm font-medium text-green-300">
                                                      Execution Output
                                                    </span>
                                                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                                                      Output
                                                    </span>
                                                  </div>
                                                  <div className="bg-slate-950 rounded-md p-3 overflow-x-auto border border-green-500/20">
                                                    <pre className="text-xs text-green-100 leading-relaxed whitespace-pre-wrap">
                                                      {item.text}
                                                    </pre>
                                                  </div>
                                                </motion.div>
                                              );
                                            }

                                            // Show response data
                                            if (
                                              item.type === "response" &&
                                              item.text
                                            ) {
                                              return (
                                                <motion.div
                                                  key={i}
                                                  initial={{
                                                    opacity: 0,
                                                    y: 10,
                                                  }}
                                                  animate={{ opacity: 1, y: 0 }}
                                                  transition={{
                                                    delay: i * 0.1,
                                                  }}
                                                  className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30"
                                                >
                                                  <div className="flex items-center gap-2 mb-3">
                                                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                                                    <span className="text-sm font-medium text-purple-300">
                                                      Response Data
                                                    </span>
                                                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                                                      Response
                                                    </span>
                                                  </div>
                                                  <div className="bg-slate-900/50 rounded-md p-3 border border-purple-500/20">
                                                    <pre className="text-sm text-purple-100 whitespace-pre-wrap leading-relaxed">
                                                      {item.text}
                                                    </pre>
                                                  </div>
                                                </motion.div>
                                              );
                                            }
                                          }
                                          return null;
                                        })}
                                      </div>
                                    )}

                                    {/* Enhanced Performance Metrics */}
                                    <div className="grid grid-cols-2 gap-6">
                                      <div className="space-y-4">
                                        <h5 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                          <TrendingUp className="w-4 h-4 text-blue-400" />
                                          Performance Metrics
                                        </h5>
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                            <div className="flex items-center gap-2">
                                              <Timer className="w-3 h-3 text-blue-400" />
                                              <span className="text-xs text-slate-400">
                                                Execution Time:
                                              </span>
                                            </div>
                                            <span className="text-sm text-slate-200 font-mono">
                                              {node.duration.toFixed(2)}s
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                            <div className="flex items-center gap-2">
                                              <Activity className="w-3 h-3 text-purple-400" />
                                              <span className="text-xs text-slate-400">
                                                Priority Level:
                                              </span>
                                            </div>
                                            <span
                                              className={cn(
                                                "text-sm font-medium capitalize",
                                                node.priority === "high" &&
                                                  "text-red-400",
                                                node.priority === "medium" &&
                                                  "text-yellow-400",
                                                node.priority === "low" &&
                                                  "text-green-400"
                                              )}
                                            >
                                              {node.priority}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                            <div className="flex items-center gap-2">
                                              <Cpu className="w-3 h-3 text-emerald-400" />
                                              <span className="text-xs text-slate-400">
                                                Completion:
                                              </span>
                                            </div>
                                            <span className="text-sm text-slate-200 font-mono">
                                              {Math.round(node.progress)}%
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="space-y-4">
                                        <h5 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                          <Network className="w-4 h-4 text-cyan-400" />
                                          Flow Context
                                        </h5>
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                            <div className="flex items-center gap-2">
                                              <GitBranch className="w-3 h-3 text-cyan-400" />
                                              <span className="text-xs text-slate-400">
                                                Node ID:
                                              </span>
                                            </div>
                                            <span className="text-sm text-slate-200 font-mono">
                                              {node.id}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                            <div className="flex items-center gap-2">
                                              <Layers className="w-3 h-3 text-orange-400" />
                                              <span className="text-xs text-slate-400">
                                                Type:
                                              </span>
                                            </div>
                                            <span className="text-sm text-slate-200 capitalize">
                                              {node.type}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                            <div className="flex items-center gap-2">
                                              <Map className="w-3 h-3 text-pink-400" />
                                              <span className="text-xs text-slate-400">
                                                Position:
                                              </span>
                                            </div>
                                            <span className="text-sm text-slate-200">
                                              {node.index + 1} of{" "}
                                              {flowNodes.length}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Flow Execution Summary */}
                                    <div className="bg-gradient-to-r from-slate-800/30 to-slate-700/20 rounded-lg p-4 border border-slate-600/30">
                                      <h5 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-yellow-400" />
                                        Execution Summary
                                      </h5>
                                      <div className="space-y-2 text-sm text-slate-300">
                                        <p>
                                          <strong className="text-slate-200">
                                            Category:
                                          </strong>{" "}
                                          <span className="text-blue-300">
                                            {node.category}
                                          </span>
                                        </p>
                                        <p>
                                          <strong className="text-slate-200">
                                            Function:
                                          </strong>{" "}
                                          This node handles {node.type}{" "}
                                          operations with {node.priority}{" "}
                                          priority level, processing data
                                          through the agent&apos;s execution
                                          pipeline.
                                        </p>
                                        <p>
                                          <strong className="text-slate-200">
                                            Status:
                                          </strong>{" "}
                                          <span
                                            className={cn(
                                              "font-medium",
                                              node.isCompleted &&
                                                "text-emerald-400",
                                              node.isActive && "text-blue-400",
                                              !node.isCompleted &&
                                                !node.isActive &&
                                                "text-slate-400"
                                            )}
                                          >
                                            {node.isCompleted
                                              ? "✓ Successfully completed"
                                              : node.isActive
                                                ? "⚡ Currently processing"
                                                : "⏳ Waiting in queue"}
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}

                  {/* Active Processing Indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center p-6"
                    >
                      <div className="flex items-center gap-4 px-6 py-3 bg-blue-500/10 rounded-xl border border-blue-500/30 backdrop-blur-sm">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full"
                        />
                        <span className="text-sm text-blue-300 font-medium">
                          Processing next node in flow...
                        </span>
                        <div className="flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2,
                              }}
                              className="w-1 h-1 bg-blue-400 rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
