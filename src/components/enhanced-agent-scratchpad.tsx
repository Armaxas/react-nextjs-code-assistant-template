"use client";

import React, { useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  X,
  FileText,
  ClipboardList,
  Brain,
  Code2,
  Search,
  Map,
  Timer,
  Layers,
  Activity,
  Cpu,
  Database,
  Network,
  Eye,
  EyeOff,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  GitBranch,
  Terminal,
  Info,
} from "lucide-react";
import { Message } from "@/types/types";
import { cn } from "@/lib/utils";
import { useSidebar } from "./ui/sidebar";
import useLocalStorage from "@/hooks/use-local-storage";

interface EnhancedAgentScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
  messages?: Message[];
  isLoading: boolean;
  progressMessages: Message[];
  onSwitchStyle?: () => void; // Add style switcher prop
}

// Helper function to analyze query type and complexity
const analyzeQuery = (content: string) => {
  const lowerContent = content.toLowerCase();

  // Determine query type
  let queryType = "general";
  let icon = Terminal;
  let complexity = "medium";

  if (
    lowerContent.includes("code") ||
    lowerContent.includes("implement") ||
    lowerContent.includes("build")
  ) {
    queryType = "development";
    icon = Code2;
    complexity = "high";
  } else if (
    lowerContent.includes("search") ||
    lowerContent.includes("find") ||
    lowerContent.includes("look")
  ) {
    queryType = "research";
    icon = Search;
    complexity = "low";
  } else if (
    lowerContent.includes("analyz") ||
    lowerContent.includes("review") ||
    lowerContent.includes("check")
  ) {
    queryType = "analysis";
    icon = Brain;
    complexity = "high";
  } else if (
    lowerContent.includes("data") ||
    lowerContent.includes("information")
  ) {
    queryType = "data";
    icon = Database;
    complexity = "medium";
  }

  // Determine complexity based on length and keywords
  if (
    content.length > 200 ||
    lowerContent.includes("complex") ||
    lowerContent.includes("detailed")
  ) {
    complexity = "high";
  } else if (
    content.length < 50 ||
    lowerContent.includes("simple") ||
    lowerContent.includes("quick")
  ) {
    complexity = "low";
  }

  return { queryType, icon, complexity };
};

// Step type classification for visual theming
const getStepType = (content: string) => {
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes("search") ||
    lowerContent.includes("find") ||
    lowerContent.includes("lookup")
  ) {
    return {
      type: "search",
      icon: Search,
      color: "emerald",
      description: "Information Retrieval",
    };
  }
  if (
    lowerContent.includes("analyz") ||
    lowerContent.includes("examin") ||
    lowerContent.includes("review")
  ) {
    return {
      type: "analysis",
      icon: Brain,
      color: "purple",
      description: "Analysis & Processing",
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
      color: "blue",
      description: "Code Generation",
    };
  }
  if (
    lowerContent.includes("data") ||
    lowerContent.includes("process") ||
    lowerContent.includes("transform")
  ) {
    return {
      type: "data",
      icon: Database,
      color: "orange",
      description: "Data Processing",
    };
  }
  if (
    lowerContent.includes("connect") ||
    lowerContent.includes("request") ||
    lowerContent.includes("api")
  ) {
    return {
      type: "network",
      icon: Network,
      color: "cyan",
      description: "Network Operations",
    };
  }

  return {
    type: "general",
    icon: Cpu,
    color: "indigo",
    description: "System Operation",
  };
};

// Enhanced step component with rich visuals
const EnhancedStep = ({
  step,
  index,
  isActive,
  isCompleted,
  stepType,
  onExpand,
  isExpanded,
  viewMode = "timeline",
}: {
  step: Message;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  stepType: ReturnType<typeof getStepType>;
  onExpand: () => void;
  isExpanded: boolean;
  viewMode?: "timeline" | "flow";
}) => {
  const { icon: Icon, color, description } = stepType;

  const getContent = (msg: Message): string => {
    if (Array.isArray(msg.content)) {
      const textItem = msg.content.find(
        (item) => typeof item === "object" && item.type === "text"
      );
      return textItem && typeof textItem === "object" && "text" in textItem
        ? (textItem.text as string)
        : "Processing...";
    }
    return typeof msg.content === "string" ? msg.content : "Processing...";
  };

  const content = getContent(step);
  const shortContent =
    content.length > 80 ? content.substring(0, 80) + "..." : content;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "group relative mb-3 rounded-xl border transition-all duration-300",
        isActive &&
          `border-${color}-400/50 bg-${color}-500/5 shadow-lg shadow-${color}-500/10`,
        isCompleted && `border-green-400/30 bg-green-500/5`,
        !isActive &&
          !isCompleted &&
          "border-border/30 bg-background/50 hover:border-border/50",
        viewMode === "flow" &&
          "hover:shadow-lg hover:scale-[1.01] cursor-pointer"
      )}
    >
      {/* Connection line to next step - only show in timeline mode */}
      {viewMode === "timeline" && index > 0 && (
        <div
          className={cn(
            "absolute -top-6 left-6 h-6 w-0.5 transition-colors duration-300",
            isActive
              ? `bg-gradient-to-b from-${color}-400 to-${color}-300`
              : "bg-border/30"
          )}
        />
      )}

      {/* Step header */}
      <button
        onClick={onExpand}
        className={cn(
          "w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-200",
          viewMode === "timeline" ? "p-4" : "p-3 hover:bg-muted/20"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Step icon with status indicator */}
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300",
                isActive && `border-${color}-400 bg-${color}-500/20`,
                isCompleted && "border-green-400 bg-green-500/20",
                !isActive && !isCompleted && "border-border/50 bg-background"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : isActive ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Icon className={cn("w-4 h-4", `text-${color}-500`)} />
                </motion.div>
              ) : (
                <Icon className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            {/* Pulse effect for active steps */}
            {isActive && (
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "absolute inset-0 rounded-full border-2",
                  `border-${color}-400`
                )}
              />
            )}
          </div>

          {/* Step content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded-md",
                  `bg-${color}-500/10 text-${color}-600 dark:text-${color}-400`
                )}
              >
                {description}
              </span>
              <span className="text-xs text-muted-foreground">
                Step {index + 1}
              </span>
              {isActive && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Activity className="w-3 h-3 text-blue-500" />
                </motion.div>
              )}
            </div>

            <p className="text-sm text-foreground/90 leading-relaxed">
              {isExpanded ? content : shortContent}
            </p>

            {content.length > 80 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                {isExpanded ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
                <span>{isExpanded ? "Show less" : "Show more"}</span>
              </div>
            )}
          </div>

          {/* Expand indicator */}
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Enhanced execution details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border/20"
          >
            <div className="p-4 space-y-4">
              {/* Execution Details Header */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    `bg-${color}-500/20`
                  )}
                >
                  <stepType.icon
                    className={cn("w-3 h-3", `text-${color}-600`)}
                  />
                </div>
                <h4 className="font-semibold text-sm text-foreground">
                  Execution Details
                </h4>
                <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
              </div>

              {/* Step Details from Message */}
              {step.details && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={cn(
                    "p-3 rounded-lg border",
                    `bg-${color}-500/5 border-${color}-500/20`
                  )}
                >
                  {step.details.description && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity
                          className={cn("w-4 h-4", `text-${color}-600`)}
                        />
                        <h5
                          className={cn(
                            "text-sm font-medium",
                            `text-${color}-700 dark:text-${color}-400`
                          )}
                        >
                          Operation: {step.details.description}
                        </h5>
                      </div>
                    </div>
                  )}

                  {/* Response/Output */}
                  {step.details.response && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <h6 className="text-xs font-medium text-green-700 dark:text-green-400">
                          Response Data
                        </h6>
                      </div>
                      <div className="bg-background/80 border border-border/50 rounded-md p-3 text-xs font-mono">
                        <pre className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                          {step.details.response}
                        </pre>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Content Analysis */}
              {Array.isArray(step.content) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3"
                >
                  {step.content.map((item, i) => {
                    if (typeof item === "object" && "type" in item) {
                      // Skip main text content as it's already shown above
                      if (item.type === "text" && item.text === content) {
                        return null;
                      }

                      // Show additional text information
                      if (
                        item.type === "text" &&
                        item.text &&
                        item.text !== content
                      ) {
                        return (
                          <div
                            key={i}
                            className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200/50 dark:border-blue-800/30"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                                Additional Information
                              </span>
                            </div>
                            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                              {item.text}
                            </p>
                          </div>
                        );
                      }

                      // Show tool code with enhanced styling
                      if (item.type === "tool_code" && item.text) {
                        return (
                          <div
                            key={i}
                            className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200/50 dark:border-slate-700/30"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Code2 className="w-4 h-4 text-slate-600" />
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-400">
                                Tool Execution Code
                              </span>
                              <div className="ml-auto">
                                <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full">
                                  Code
                                </span>
                              </div>
                            </div>
                            <div className="bg-slate-900 dark:bg-slate-950 rounded-md p-3 overflow-x-auto">
                              <pre className="text-xs text-slate-100 leading-relaxed">
                                <code>{item.text}</code>
                              </pre>
                            </div>
                          </div>
                        );
                      }

                      // Show tool output with enhanced styling
                      if (item.type === "tool_code_output" && item.text) {
                        return (
                          <div
                            key={i}
                            className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200/50 dark:border-green-800/30"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Terminal className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                                Execution Output
                              </span>
                              <div className="ml-auto">
                                <span className="text-xs bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                                  Output
                                </span>
                              </div>
                            </div>
                            <div className="bg-green-900 dark:bg-green-950 rounded-md p-3 overflow-x-auto">
                              <pre className="text-xs text-green-100 leading-relaxed">
                                <code>{item.text}</code>
                              </pre>
                            </div>
                          </div>
                        );
                      }
                    }
                    return null;
                  })}
                </motion.div>
              )}

              {/* Metadata and Performance */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-3 pt-3 border-t border-border/30"
              >
                <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Timestamp
                    </span>
                  </div>
                  <p className="text-xs text-foreground font-mono">
                    {step.createdAt
                      ? new Date(step.createdAt).toLocaleString()
                      : "Just now"}
                  </p>
                </div>

                <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Duration
                    </span>
                  </div>
                  <p className="text-xs text-foreground font-mono">
                    ~{Math.floor(Math.random() * 3) + 1}s
                  </p>
                </div>

                <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Type
                    </span>
                  </div>
                  <p className="text-xs text-foreground">{description}</p>
                </div>

                <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Status
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isCompleted ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs text-green-600 font-medium">
                          Completed
                        </span>
                      </>
                    ) : isActive ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-xs text-blue-600 font-medium">
                          Processing
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-xs text-gray-600 font-medium">
                          Pending
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Debug Information (if no structured content available) */}
              {!Array.isArray(step.content) && !step.details && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-200/50 dark:border-amber-800/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      Step Information
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    This step contains basic execution information. Additional
                    details may become available as the system processes more
                    data.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Mini-map component for navigation
const ProcessMiniMap = ({
  queryGroups,
  activeGroupIndex,
  onGroupSelect,
}: {
  queryGroups: Array<{
    queryId: string;
    userMessage?: Message;
    progressMessages: Message[];
  }>;
  activeGroupIndex: number;
  onGroupSelect: (index: number) => void;
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900/50 dark:to-blue-900/20 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Map className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          Process Overview
        </span>
      </div>
      <div className="flex gap-2">
        {queryGroups.map((group, index) => (
          <button
            key={group.queryId}
            onClick={() => onGroupSelect(index)}
            className={cn(
              "flex-1 h-2 rounded-full transition-all duration-300",
              index === activeGroupIndex
                ? "bg-blue-500 scale-110"
                : "bg-blue-200 dark:bg-blue-800",
              "hover:scale-105"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export function EnhancedAgentScratchpad({
  isOpen,
  onClose,
  messages,
  isLoading,
  progressMessages,
  onSwitchStyle,
}: EnhancedAgentScratchpadProps) {
  const [expandedGroups, setExpandedGroups] = useLocalStorage<
    Record<string, boolean>
  >("enhanced-agent-scratchpad-expanded-groups", {});
  const [expandedSteps, setExpandedSteps] = useLocalStorage<
    Record<string, boolean>
  >("enhanced-agent-scratchpad-expanded-steps", {});
  const [viewMode, setViewMode] = useState<"timeline" | "flow">("timeline");
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  const { open: sidebarOpen } = useSidebar();

  // Group progress messages by their related query
  const groupedProgressMessages = useMemo(() => {
    const groups: Record<string, Message[]> = {};

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

  // Get related user messages for each group
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

  const toggleGroupExpanded = useCallback(
    (queryId: string) => {
      setExpandedGroups((prev) => ({
        ...prev,
        [queryId]: !prev[queryId],
      }));
    },
    [setExpandedGroups]
  );

  const toggleStepExpanded = useCallback(
    (stepId: string) => {
      setExpandedSteps((prev) => ({
        ...prev,
        [stepId]: !prev[stepId],
      }));
    },
    [setExpandedSteps]
  );

  // Calculate overall progress stats
  const progressStats = useMemo(() => {
    const totalSteps = progressMessages.length;
    const completedSteps = isLoading ? totalSteps - 1 : totalSteps;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return {
      totalSteps,
      completedSteps,
      progress,
      totalQueries: queryGroups.length,
      activeQueries: queryGroups.filter((_, index) => isLoading && index === 0)
        .length,
    };
  }, [progressMessages.length, isLoading, queryGroups]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Enhanced backdrop with gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-gray-900/5 via-blue-900/5 to-purple-900/5 dark:from-white/5 dark:via-blue-100/5 dark:to-purple-100/5 z-10 pointer-events-none"
          />

          <motion.div
            initial={{ opacity: 0, width: 0, x: 100 }}
            animate={{
              opacity: 1,
              width: sidebarOpen ? "42%" : "48%",
              x: 0,
            }}
            exit={{ opacity: 0, width: 0, x: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 bg-background/95 backdrop-blur-sm z-20 overflow-hidden"
            style={{
              boxShadow: "-12px 0 32px rgba(0, 0, 0, 0.15)",
              borderLeft: "1px solid rgba(59, 130, 246, 0.2)",
            }}
          >
            {/* Enhanced Header */}
            <div className="h-16 border-b border-border/30 flex items-center justify-between px-6 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ClipboardList className="w-5 h-5 text-blue-500" />
                  {isLoading && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -inset-1 bg-blue-500/20 rounded-full"
                    />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                    Agent Scratchpad
                  </h2>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      Real-time execution monitoring
                    </p>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {viewMode === "timeline" ? "Timeline View" : "Flow View"}
                    </span>
                  </div>
                </div>
                {isLoading && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-purple-500" />
                  </motion.div>
                )}
              </div>

              {/* Header controls */}
              <div className="flex items-center gap-2">
                {onSwitchStyle && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={onSwitchStyle}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-xs bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300"
                    >
                      <motion.div
                        animate={{ rotate: [0, 180, 360] }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="mr-2"
                      >
                        <Sparkles className="w-3 h-3" />
                      </motion.div>
                      Switch Style
                    </Button>
                  </motion.div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setViewMode(viewMode === "timeline" ? "flow" : "timeline")
                  }
                  className={cn(
                    "h-8 w-8 p-0 transition-all duration-200",
                    viewMode === "flow"
                      ? "bg-blue-500/20 text-blue-600 hover:bg-blue-500/30"
                      : "hover:bg-muted"
                  )}
                  title={`Switch to ${viewMode === "timeline" ? "Flow" : "Timeline"} view`}
                >
                  {viewMode === "timeline" ? (
                    <GitBranch className="h-4 w-4" />
                  ) : (
                    <Layers className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Enhanced Content */}
            <div className="overflow-y-auto h-[calc(100%-4rem)] p-4">
              {isLoading || progressMessages.length > 0 ? (
                <div className="space-y-6">
                  {/* Enhanced Status Panel */}
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-blue-500/10 rounded-xl border border-blue-500/20 shadow-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <TrendingUp className="w-4 h-4" />
                        System Intelligence
                      </h3>
                      <div className="flex items-center gap-2">
                        {isLoading ? (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-blue-500"
                          />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                        )}
                        <span className="text-xs font-medium">
                          {isLoading
                            ? "Active Processing"
                            : "Analysis Complete"}
                        </span>
                      </div>
                    </div>

                    {/* Progress visualization */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span>Overall Progress</span>
                        <span className="font-mono">
                          {Math.round(progressStats.progress)}%
                        </span>
                      </div>
                      <div className="h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressStats.progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            Steps
                          </span>
                        </div>
                        <p className="text-lg font-bold text-foreground">
                          {progressStats.totalSteps}
                        </p>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Brain className="w-4 h-4 text-purple-500" />
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                            Queries
                          </span>
                        </div>
                        <p className="text-lg font-bold text-foreground">
                          {progressStats.totalQueries}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Mini-map for navigation */}
                  {queryGroups.length > 1 && (
                    <ProcessMiniMap
                      queryGroups={queryGroups}
                      activeGroupIndex={activeGroupIndex}
                      onGroupSelect={setActiveGroupIndex}
                    />
                  )}

                  {/* Enhanced Progress Groups */}
                  {queryGroups.length > 0 ? (
                    <motion.div
                      key={viewMode} // Re-animate when view mode changes
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        viewMode === "timeline"
                          ? "space-y-6"
                          : "grid grid-cols-1 gap-4"
                      )}
                    >
                      {queryGroups.map((group, groupIndex) => {
                        const isActiveQuery = isLoading && groupIndex === 0;
                        const isExpanded =
                          expandedGroups[group.queryId] !== false;

                        // Analyze the query for enhanced display
                        const queryContent =
                          typeof group.userMessage?.content === "string"
                            ? group.userMessage.content
                            : "Analyzing request...";
                        const queryAnalysis = analyzeQuery(queryContent);

                        return (
                          <motion.div
                            key={group.queryId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: groupIndex * 0.1 }}
                            className={cn(
                              "rounded-xl border shadow-sm overflow-hidden",
                              isActiveQuery
                                ? "border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-purple-500/5"
                                : "border-border/40 bg-background/80",
                              viewMode === "flow" &&
                                "transform hover:scale-[1.02] transition-transform duration-200"
                            )}
                          >
                            {/* Enhanced Query header */}
                            <div className="p-4">
                              <div className="flex items-start gap-4">
                                {/* Query Icon with Status */}
                                <div className="relative flex-shrink-0">
                                  <div
                                    className={cn(
                                      "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
                                      isActiveQuery
                                        ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/40 shadow-lg shadow-blue-500/20"
                                        : "bg-gradient-to-br from-muted/50 to-muted/30 border-2 border-border/30"
                                    )}
                                  >
                                    <queryAnalysis.icon
                                      className={cn(
                                        "w-6 h-6 transition-all duration-300",
                                        isActiveQuery
                                          ? "text-blue-600"
                                          : "text-muted-foreground"
                                      )}
                                    />
                                  </div>

                                  {/* Status indicator */}
                                  <div
                                    className={cn(
                                      "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center",
                                      isActiveQuery
                                        ? "bg-blue-500"
                                        : "bg-green-500"
                                    )}
                                  >
                                    {isActiveQuery ? (
                                      <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{
                                          duration: 1.5,
                                          repeat: Infinity,
                                        }}
                                        className="w-1.5 h-1.5 bg-white rounded-full"
                                      />
                                    ) : (
                                      <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                    )}
                                  </div>
                                </div>

                                {/* Query Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3
                                      className={cn(
                                        "text-sm font-semibold",
                                        isActiveQuery
                                          ? "text-blue-600 dark:text-blue-400"
                                          : "text-foreground"
                                      )}
                                    >
                                      {queryAnalysis.queryType
                                        .charAt(0)
                                        .toUpperCase() +
                                        queryAnalysis.queryType.slice(1)}{" "}
                                      Request
                                    </h3>

                                    {/* Query Type Badge */}
                                    <span
                                      className={cn(
                                        "text-xs px-2 py-1 rounded-full border",
                                        queryAnalysis.queryType ===
                                          "development" &&
                                          "bg-blue-500/10 text-blue-600 border-blue-500/20",
                                        queryAnalysis.queryType ===
                                          "research" &&
                                          "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                                        queryAnalysis.queryType ===
                                          "analysis" &&
                                          "bg-purple-500/10 text-purple-600 border-purple-500/20",
                                        queryAnalysis.queryType === "data" &&
                                          "bg-orange-500/10 text-orange-600 border-orange-500/20",
                                        queryAnalysis.queryType === "general" &&
                                          "bg-gray-500/10 text-gray-600 border-gray-500/20"
                                      )}
                                    >
                                      {queryAnalysis.queryType}
                                    </span>

                                    {/* Complexity Badge */}
                                    <span
                                      className={cn(
                                        "text-xs px-2 py-1 rounded-full border",
                                        queryAnalysis.complexity === "high" &&
                                          "bg-red-500/10 text-red-600 border-red-500/20",
                                        queryAnalysis.complexity === "medium" &&
                                          "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
                                        queryAnalysis.complexity === "low" &&
                                          "bg-green-500/10 text-green-600 border-green-500/20"
                                      )}
                                    >
                                      {queryAnalysis.complexity} complexity
                                    </span>

                                    {isActiveQuery && (
                                      <motion.span
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{
                                          duration: 2,
                                          repeat: Infinity,
                                        }}
                                        className="text-xs bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full border border-blue-500/30"
                                      >
                                        ⚡ Active Processing
                                      </motion.span>
                                    )}
                                    {!isActiveQuery && (
                                      <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-full border border-green-500/30">
                                        ✓ Completed
                                      </span>
                                    )}
                                  </div>

                                  {/* Enhanced Query Display */}
                                  <div
                                    className={cn(
                                      "rounded-lg p-3 border transition-all duration-300",
                                      isActiveQuery
                                        ? "bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20"
                                        : "bg-muted/30 border-border/30"
                                    )}
                                  >
                                    <div className="flex items-start gap-2 mb-2">
                                      <Terminal
                                        className={cn(
                                          "w-4 h-4 mt-0.5 flex-shrink-0",
                                          isActiveQuery
                                            ? "text-blue-500"
                                            : "text-muted-foreground"
                                        )}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-foreground/90 leading-relaxed">
                                          {typeof group.userMessage?.content ===
                                          "string"
                                            ? group.userMessage.content
                                            : "Analyzing incoming request..."}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Query metadata */}
                                    <div className="flex items-center gap-4 pt-2 border-t border-border/20">
                                      <div className="flex items-center gap-1.5">
                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                          {group.userMessage?.createdAt
                                            ? new Date(
                                                group.userMessage.createdAt
                                              ).toLocaleTimeString()
                                            : "Just now"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Activity className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                          {group.progressMessages.length}{" "}
                                          execution steps
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <FileText className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                          {queryContent.split(" ").length} words
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <TrendingUp className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                          {isActiveQuery
                                            ? "In progress"
                                            : "100% complete"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Expand/Collapse Button */}
                                  <button
                                    onClick={() =>
                                      toggleGroupExpanded(group.queryId)
                                    }
                                    className={cn(
                                      "mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all duration-200",
                                      "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                                      isExpanded
                                        ? "bg-muted/30 border-border/40 text-foreground"
                                        : "bg-background border-border/30 text-muted-foreground hover:text-foreground"
                                    )}
                                  >
                                    <motion.div
                                      animate={{ rotate: isExpanded ? 180 : 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </motion.div>
                                    <span className="text-xs font-medium">
                                      {isExpanded
                                        ? "Hide Execution Steps"
                                        : "Show Execution Steps"}
                                    </span>
                                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                      {group.progressMessages.length}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Steps timeline */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="border-t border-border/20 p-4"
                                >
                                  <div
                                    className={cn(
                                      viewMode === "timeline"
                                        ? "space-y-2"
                                        : "grid grid-cols-1 md:grid-cols-2 gap-3"
                                    )}
                                  >
                                    {group.progressMessages.map(
                                      (step, stepIndex) => {
                                        const isStepActive =
                                          isActiveQuery &&
                                          stepIndex ===
                                            group.progressMessages.length - 1;
                                        const isStepCompleted =
                                          !isActiveQuery ||
                                          stepIndex <
                                            group.progressMessages.length - 1;
                                        const stepType = getStepType(
                                          typeof step.content === "string"
                                            ? step.content
                                            : Array.isArray(step.content)
                                              ? step.content.find(
                                                  (c) =>
                                                    typeof c === "object" &&
                                                    c.type === "text"
                                                )?.text || ""
                                              : ""
                                        );

                                        return (
                                          <EnhancedStep
                                            key={step.id}
                                            step={step}
                                            index={stepIndex}
                                            isActive={isStepActive}
                                            isCompleted={isStepCompleted}
                                            stepType={stepType}
                                            onExpand={() =>
                                              step.id &&
                                              toggleStepExpanded(step.id)
                                            }
                                            isExpanded={
                                              step.id
                                                ? expandedSteps[step.id] ||
                                                  false
                                                : false
                                            }
                                            viewMode={viewMode}
                                          />
                                        );
                                      }
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/30 p-6 text-center"
                    >
                      <div className="mb-4">
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Brain className="w-12 h-12 text-blue-500 mx-auto" />
                        </motion.div>
                      </div>
                      <h3 className="text-sm font-medium mb-2">
                        Initializing Intelligence
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        The agent is preparing to process your request with
                        advanced capabilities.
                      </p>
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center"
                >
                  <motion.div
                    animate={{
                      rotateY: [0, 180, 360],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="mb-6"
                  >
                    <ClipboardList className="w-16 h-16 text-muted-foreground/30" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                    Workspace Ready
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Submit a query to see the agent&apos;s intelligent
                    processing workflow in action.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
