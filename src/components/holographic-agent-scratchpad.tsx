"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
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
  Sparkles,
  Eye,
  Activity,
  Zap,
  Timer,
  TrendingUp,
  Layers,
  Cpu,
  GitBranch,
  Terminal,
  FileText,
  ChevronDown,
  Maximize,
  Volume2,
} from "lucide-react";
import { Message } from "@/types/types";
import { cn } from "@/lib/utils";
import { useSidebar } from "./ui/sidebar";

interface HolographicAgentScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
  messages?: Message[];
  isLoading: boolean;
  progressMessages: Message[];
  onSwitchStyle?: () => void; // Add style switcher prop
}

// Advanced holographic step categorization with 3D properties
const getHoloType = (content: string) => {
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes("search") ||
    lowerContent.includes("query") ||
    lowerContent.includes("find")
  ) {
    return {
      type: "search",
      icon: Search,
      color: "#3b82f6",
      glow: "rgba(59, 130, 246, 0.4)",
      name: "Neural Search",
      holographicColor: "from-blue-400 via-cyan-500 to-blue-600",
      dimension: "Z-Axis Scanning",
      frequency: "7.2 GHz",
      depth: 4,
      rotationAxis: "y",
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
      color: "#8b5cf6",
      glow: "rgba(139, 92, 246, 0.4)",
      name: "Quantum Analysis",
      holographicColor: "from-purple-400 via-violet-500 to-purple-600",
      dimension: "Multi-Dimensional",
      frequency: "12.8 GHz",
      depth: 6,
      rotationAxis: "x",
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
      color: "#10b981",
      glow: "rgba(16, 185, 129, 0.4)",
      name: "Code Matrix",
      holographicColor: "from-emerald-400 via-green-500 to-emerald-600",
      dimension: "Binary Space",
      frequency: "15.6 GHz",
      depth: 8,
      rotationAxis: "z",
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
      color: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.4)",
      name: "Data Stream",
      holographicColor: "from-amber-400 via-orange-500 to-amber-600",
      dimension: "Data Lattice",
      frequency: "9.4 GHz",
      depth: 5,
      rotationAxis: "x",
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
      color: "#06b6d4",
      glow: "rgba(6, 182, 212, 0.4)",
      name: "Network Mesh",
      holographicColor: "from-cyan-400 via-teal-500 to-cyan-600",
      dimension: "Mesh Topology",
      frequency: "11.2 GHz",
      depth: 7,
      rotationAxis: "y",
    };
  }

  return {
    type: "default",
    icon: Cpu,
    color: "#6b7280",
    glow: "rgba(107, 114, 128, 0.4)",
    name: "System Process",
    holographicColor: "from-slate-400 via-gray-500 to-slate-600",
    dimension: "Core Processing",
    frequency: "5.8 GHz",
    depth: 3,
    rotationAxis: "z",
  };
};

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

// Holographic animation variants
const holographicVariants = {
  idle: {
    rotateY: 0,
    rotateX: 0,
    scale: 1,
    transition: { duration: 2, ease: "easeInOut" },
  },
  active: {
    rotateY: [0, 5, -5, 0],
    rotateX: [0, 2, -2, 0],
    scale: [1, 1.02, 1],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
  },
  hover: {
    rotateY: 10,
    rotateX: 5,
    scale: 1.05,
    transition: { duration: 0.3 },
  },
};

// Enhanced query analysis for holographic display
const analyzeHolographicQuery = (content: string) => {
  const lowerContent = content.toLowerCase();
  const wordCount = content.split(/\s+/).length;

  let complexity = "Standard";
  let priorityLevel = "Medium";
  let estimatedEnergy = "2.4 kW";
  let processingLayers = 3;

  if (
    content.length > 200 ||
    lowerContent.includes("complex") ||
    lowerContent.includes("detailed")
  ) {
    complexity = "High-Dimensional";
    priorityLevel = "Critical";
    estimatedEnergy = "4.8 kW";
    processingLayers = 7;
  } else if (
    content.length < 50 ||
    lowerContent.includes("simple") ||
    lowerContent.includes("quick")
  ) {
    complexity = "Linear";
    priorityLevel = "Low";
    estimatedEnergy = "1.2 kW";
    processingLayers = 2;
  }

  return {
    complexity,
    priorityLevel,
    estimatedEnergy,
    processingLayers,
    wordCount,
    quantumState: Math.random() > 0.5 ? "Superposition" : "Entangled",
    resonanceFreq: `${(Math.random() * 10 + 5).toFixed(1)} GHz`,
    dimensionalDepth: Math.floor(Math.random() * 5) + 3,
    hasCodeSignatures: /\b(function|class|const|let|var|import|export)\b/i.test(
      content
    ),
    hasFileReferences: /\b(file|folder|\.js|\.ts|\.tsx|\.jsx)\b/i.test(content),
    energySignature: `${(Math.random() * 100).toFixed(1)}%`,
  };
};

export function HolographicAgentScratchpad({
  isOpen,
  onClose,
  isLoading,
  progressMessages,
  onSwitchStyle,
  messages,
}: HolographicAgentScratchpadProps) {
  const { open } = useSidebar();

  // Holographic interface state
  const [viewAngle, setViewAngle] = useState({ x: 0, y: 0 });
  const [, setSelectedNode] = useState<string | null>(null);
  const [holographicMode, setHolographicMode] = useState<
    "matrix" | "neural" | "quantum"
  >("matrix");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {}
  );
  // const [scannerActive, setScannerActive] = useState(false); // Unused state commented out

  // Enhanced holographic steps with 3D properties
  const holoSteps = useMemo(() => {
    return progressMessages.map((message, index) => ({
      ...message,
      ...getHoloType(getContentText(message.content)),
      index,
      isCompleted: !isLoading || index < progressMessages.length - 1,
      isActive: isLoading && index === progressMessages.length - 1,
      holoId: `holo-${index}`,
      quantumSignature: Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase(),
      energyLevel: Math.floor(Math.random() * 100) + 1,
      stabilityIndex: Math.random() * 100,
    }));
  }, [progressMessages, isLoading]);

  // Group progress messages by query (similar to enhanced version)
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

  // Auto-rotate view in holographic mode
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setViewAngle((prev) => ({
        x: prev.x + 0.5,
        y: prev.y + 0.3,
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Toggle node expansion
  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  }, []);

  // Handle node selection
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNode((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 400, rotateY: -30, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
          exit={{ opacity: 0, x: 400, rotateY: 30, scale: 0.8 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            "fixed top-0 right-0 h-full shadow-2xl z-50 flex flex-col perspective-1000",
            "border-l border-cyan-400/30 backdrop-blur-xl",
            open ? "w-[40%]" : "w-[45%]"
          )}
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(15, 23, 42, 0.95) 0%, 
                rgba(30, 58, 138, 0.92) 25%, 
                rgba(88, 28, 135, 0.92) 50%,
                rgba(6, 182, 212, 0.9) 75%, 
                rgba(15, 23, 42, 0.95) 100%
              )
            `,
            backdropFilter: "blur(25px)",
            transform: `rotateY(${viewAngle.y * 0.1}deg) rotateX(${viewAngle.x * 0.05}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Advanced Holographic Grid Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 25% 25%, rgba(6, 182, 212, 0.4) 0%, transparent 50%),
                  radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
                  linear-gradient(rgba(6, 182, 212, 0.2) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(6, 182, 212, 0.2) 1px, transparent 1px)
                `,
                backgroundSize: "200% 200%, 200% 200%, 30px 30px, 30px 30px",
              }}
            />

            {/* Floating Holographic Particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: `linear-gradient(45deg, ${["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b"][i % 4]}, transparent)`,
                  boxShadow: `0 0 20px ${["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b"][i % 4]}`,
                }}
                animate={{
                  x: [0, Math.random() * 400, 0],
                  y: [0, Math.random() * 600, 0],
                  z: [0, Math.random() * 100 - 50, 0],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  duration: 8 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Enhanced Holographic Header */}
          <motion.div
            className="flex-none p-6 border-b border-cyan-400/30 relative overflow-hidden"
            style={{ transform: "translateZ(20px)" }}
          >
            {/* Header Background Effects */}
            <motion.div
              animate={{
                background: [
                  "linear-gradient(90deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1))",
                  "linear-gradient(90deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 rounded-lg"
            />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{
                    rotateY: [0, 360],
                    boxShadow: [
                      "0 0 30px rgba(6, 182, 212, 0.6)",
                      "0 0 50px rgba(139, 92, 246, 0.6)",
                      "0 0 30px rgba(6, 182, 212, 0.6)",
                    ],
                  }}
                  transition={{
                    rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
                    boxShadow: { duration: 2, repeat: Infinity },
                  }}
                  className="w-4 h-4 rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400"
                  style={{ transformStyle: "preserve-3d" }}
                />
                <div>
                  <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400">
                    Holographic Neural Interface
                  </h2>
                  <p className="text-xs text-cyan-300/80 mt-1">
                    3D Quantum Processing Matrix • {holoSteps.length} Active
                    Nodes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Holographic Mode Selector */}
                <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg p-1 border border-cyan-400/30">
                  {(["matrix", "neural", "quantum"] as const).map((mode) => (
                    <motion.button
                      key={mode}
                      onClick={() => setHolographicMode(mode)}
                      className={cn(
                        "px-3 py-1 text-xs rounded transition-all duration-300",
                        holographicMode === mode
                          ? "bg-cyan-400/20 text-cyan-300 shadow-lg"
                          : "text-cyan-400/60 hover:text-cyan-300"
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </motion.button>
                  ))}
                </div>

                {onSwitchStyle && (
                  <Button
                    onClick={onSwitchStyle}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-400/30 hover:border-cyan-400/50 text-cyan-300 hover:text-cyan-200 transition-all duration-300"
                  >
                    <GitBranch className="w-3 h-3 mr-2" />
                    Switch Interface
                  </Button>
                )}

                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-red-500/20 text-white/70 hover:text-red-400 transition-all duration-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Holographic Stats Dashboard */}
            <motion.div
              className="grid grid-cols-4 gap-4 mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {[
                {
                  icon: Activity,
                  label: "Nodes",
                  value: holoSteps.length,
                  color: "cyan",
                },
                {
                  icon: Zap,
                  label: "Energy",
                  value: `${(holoSteps.length * 2.4).toFixed(1)}kW`,
                  color: "purple",
                },
                {
                  icon: Timer,
                  label: "Frequency",
                  value: "12.8 GHz",
                  color: "emerald",
                },
                {
                  icon: TrendingUp,
                  label: "Stability",
                  value: "98.7%",
                  color: "amber",
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className={cn(
                    "bg-slate-900/30 rounded-lg p-3 border backdrop-blur-sm",
                    `border-${stat.color}-400/30`
                  )}
                  style={{
                    boxShadow: `0 0 20px rgba(${
                      stat.color === "cyan"
                        ? "6, 182, 212"
                        : stat.color === "purple"
                          ? "139, 92, 246"
                          : stat.color === "emerald"
                            ? "16, 185, 129"
                            : "245, 158, 11"
                    }, 0.1)`,
                    transform: `translateZ(${5 + i * 2}px)`,
                  }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: `0 0 30px rgba(${
                      stat.color === "cyan"
                        ? "6, 182, 212"
                        : stat.color === "purple"
                          ? "139, 92, 246"
                          : stat.color === "emerald"
                            ? "16, 185, 129"
                            : "245, 158, 11"
                    }, 0.3)`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                    <span className={`text-xs text-${stat.color}-300`}>
                      {stat.label}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">{stat.value}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Holographic Content with 3D Perspective */}
          <div
            className="flex-1 overflow-hidden relative"
            style={{ perspective: "1000px" }}
          >
            <div className="h-full overflow-y-auto p-6 custom-scrollbar">
              {holoSteps.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center justify-center h-full text-cyan-300/60"
                  style={{ transform: "translateZ(30px)" }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotateY: [0, 360, 0],
                      rotateX: [0, 15, 0],
                    }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="relative mb-6"
                  >
                    <Eye className="h-20 w-20" />
                    <motion.div
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.8, 0.3],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl"
                    />
                  </motion.div>
                  <p className="text-center font-medium text-lg">
                    Holographic Matrix Ready
                  </p>
                  <p className="text-xs text-cyan-400/50 mt-2">
                    Awaiting neural input stream...
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-8">
                  {/* Enhanced Quantum Query Analysis */}
                  {queryGroups.length > 0 && (
                    <motion.div
                      className="space-y-6"
                      style={{ transform: "translateZ(20px)" }}
                    >
                      {queryGroups.map((group, groupIndex) => {
                        const isActiveQuery = isLoading && groupIndex === 0;
                        const queryContent =
                          typeof group.userMessage?.content === "string"
                            ? group.userMessage.content
                            : "Analyzing quantum input...";

                        const holoAnalysis =
                          analyzeHolographicQuery(queryContent);

                        return (
                          <motion.div
                            key={group.queryId}
                            initial={{ opacity: 0, z: -100, rotateX: -15 }}
                            animate={{ opacity: 1, z: 0, rotateX: 0 }}
                            transition={{ delay: groupIndex * 0.2 }}
                            className="relative"
                            style={{ transformStyle: "preserve-3d" }}
                          >
                            {/* Quantum Query Container */}
                            <motion.div
                              className={cn(
                                "relative rounded-2xl border-2 p-6 backdrop-blur-xl overflow-hidden",
                                isActiveQuery
                                  ? "border-cyan-400/60 bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-cyan-500/10"
                                  : "border-cyan-400/30 bg-gradient-to-br from-slate-800/20 via-slate-700/10 to-slate-800/20"
                              )}
                              style={{
                                boxShadow: isActiveQuery
                                  ? "0 0 50px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                                  : "0 0 20px rgba(6, 182, 212, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                                transform: `translateZ(${isActiveQuery ? 30 : 10}px)`,
                              }}
                              variants={holographicVariants}
                              animate={isActiveQuery ? "active" : "idle"}
                              whileHover="hover"
                            >
                              {/* Quantum Field Background */}
                              {isActiveQuery && (
                                <motion.div
                                  animate={{
                                    background: [
                                      "radial-gradient(circle at 0% 0%, rgba(6, 182, 212, 0.2) 0%, transparent 70%)",
                                      "radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.2) 0%, transparent 70%)",
                                      "radial-gradient(circle at 0% 100%, rgba(6, 182, 212, 0.2) 0%, transparent 70%)",
                                      "radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.2) 0%, transparent 70%)",
                                    ],
                                  }}
                                  transition={{ duration: 4, repeat: Infinity }}
                                  className="absolute inset-0 rounded-2xl"
                                />
                              )}

                              <div className="relative z-10">
                                <div className="flex items-start gap-5">
                                  {/* Holographic Query Icon */}
                                  <motion.div
                                    animate={{
                                      rotateY: isActiveQuery ? [0, 360] : 0,
                                      scale: isActiveQuery ? [1, 1.1, 1] : 1,
                                    }}
                                    transition={{
                                      rotateY: {
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "linear",
                                      },
                                      scale: { duration: 2, repeat: Infinity },
                                    }}
                                    className="relative"
                                    style={{ transformStyle: "preserve-3d" }}
                                  >
                                    <div
                                      className="w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-cyan-400/50"
                                      style={{
                                        background:
                                          "linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))",
                                        boxShadow:
                                          "0 0 30px rgba(6, 182, 212, 0.4)",
                                      }}
                                    >
                                      <FileText className="w-8 h-8 text-cyan-300" />
                                    </div>
                                    {isActiveQuery && (
                                      <motion.div
                                        animate={{
                                          scale: [1, 1.5, 1],
                                          opacity: [0.3, 0.7, 0.3],
                                        }}
                                        transition={{
                                          duration: 2,
                                          repeat: Infinity,
                                        }}
                                        className="absolute inset-0 rounded-2xl border-2 border-cyan-400"
                                      />
                                    )}
                                  </motion.div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-4">
                                      <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                                        Quantum Query Analysis
                                      </h3>
                                      <motion.span
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{
                                          duration: 1.5,
                                          repeat: Infinity,
                                        }}
                                        className="text-xs bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 px-3 py-1 rounded-full border border-cyan-400/30"
                                      >
                                        {holoAnalysis.quantumState}
                                      </motion.span>
                                      {isActiveQuery && (
                                        <motion.span
                                          animate={{
                                            boxShadow: [
                                              "0 0 10px rgba(6, 182, 212, 0.5)",
                                              "0 0 20px rgba(139, 92, 246, 0.5)",
                                              "0 0 10px rgba(6, 182, 212, 0.5)",
                                            ],
                                          }}
                                          transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                          }}
                                          className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full border border-cyan-400/50"
                                        >
                                          ACTIVE SCAN
                                        </motion.span>
                                      )}
                                    </div>

                                    {/* Quantum Input Display */}
                                    <div className="bg-slate-900/50 rounded-xl p-4 border border-cyan-400/30 mb-4">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Terminal className="w-4 h-4 text-cyan-400" />
                                        <span className="text-sm font-medium text-cyan-300">
                                          Neural Input Stream
                                        </span>
                                        <div className="ml-auto text-xs text-cyan-400/70">
                                          ID:{" "}
                                          {group.queryId
                                            ?.substring(0, 8)
                                            .toUpperCase()}
                                        </div>
                                      </div>
                                      <p className="text-sm text-cyan-100 leading-relaxed font-mono">
                                        {queryContent}
                                      </p>
                                    </div>

                                    {/* Holographic Analysis Grid */}
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                      {[
                                        {
                                          label: "Complexity",
                                          value: holoAnalysis.complexity,
                                          icon: Layers,
                                          color: "cyan",
                                        },
                                        {
                                          label: "Priority",
                                          value: holoAnalysis.priorityLevel,
                                          icon: Zap,
                                          color: "purple",
                                        },
                                        {
                                          label: "Energy",
                                          value: holoAnalysis.estimatedEnergy,
                                          icon: Activity,
                                          color: "emerald",
                                        },
                                        {
                                          label: "Frequency",
                                          value: holoAnalysis.resonanceFreq,
                                          icon: Volume2,
                                          color: "amber",
                                        },
                                        {
                                          label: "Dimensions",
                                          value: `${holoAnalysis.dimensionalDepth}D`,
                                          icon: Maximize,
                                          color: "cyan",
                                        },
                                        {
                                          label: "Stability",
                                          value: holoAnalysis.energySignature,
                                          icon: TrendingUp,
                                          color: "purple",
                                        },
                                      ].map((metric, i) => (
                                        <motion.div
                                          key={metric.label}
                                          className={cn(
                                            "bg-slate-900/30 rounded-lg p-3 border backdrop-blur-sm",
                                            `border-${metric.color}-400/30`
                                          )}
                                          style={{
                                            transform: `translateZ(${5 + i}px)`,
                                            boxShadow: `0 0 15px rgba(${
                                              metric.color === "cyan"
                                                ? "6, 182, 212"
                                                : metric.color === "purple"
                                                  ? "139, 92, 246"
                                                  : metric.color === "emerald"
                                                    ? "16, 185, 129"
                                                    : "245, 158, 11"
                                            }, 0.1)`,
                                          }}
                                          whileHover={{
                                            scale: 1.05,
                                            boxShadow: `0 0 25px rgba(${
                                              metric.color === "cyan"
                                                ? "6, 182, 212"
                                                : metric.color === "purple"
                                                  ? "139, 92, 246"
                                                  : metric.color === "emerald"
                                                    ? "16, 185, 129"
                                                    : "245, 158, 11"
                                            }, 0.3)`,
                                          }}
                                        >
                                          <div className="flex items-center gap-2 mb-1">
                                            <metric.icon
                                              className={`w-3 h-3 text-${metric.color}-400`}
                                            />
                                            <span
                                              className={`text-xs text-${metric.color}-300`}
                                            >
                                              {metric.label}
                                            </span>
                                          </div>
                                          <p className="text-xs font-bold text-white">
                                            {metric.value}
                                          </p>
                                        </motion.div>
                                      ))}
                                    </div>

                                    {/* Processing Status */}
                                    <div className="flex items-center gap-4 text-xs">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={cn(
                                            "w-2 h-2 rounded-full",
                                            isActiveQuery
                                              ? "bg-cyan-400 animate-pulse"
                                              : "bg-emerald-400"
                                          )}
                                        />
                                        <span className="text-slate-300">
                                          Status:{" "}
                                          {isActiveQuery
                                            ? "Quantum Processing"
                                            : "Analysis Complete"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Activity className="w-3 h-3 text-cyan-400" />
                                        <span className="text-slate-300">
                                          {group.progressMessages.length} Neural
                                          Pathways
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                  {/* 3D Holographic Processing Nodes */}
                  <motion.div
                    className="space-y-8"
                    style={{ transform: "translateZ(15px)" }}
                  >
                    {holoSteps.map((step, index) => {
                      const Icon = step.icon;
                      const delay = index * 0.15;
                      const isExpanded = expandedNodes[step.holoId];

                      return (
                        <motion.div
                          key={step.holoId}
                          initial={{
                            opacity: 0,
                            y: 50,
                            rotateX: -30,
                            scale: 0.8,
                          }}
                          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                          transition={{ delay, duration: 0.6, type: "spring" }}
                          className="relative"
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          {/* Holographic Connection Beam */}
                          {index < holoSteps.length - 1 && (
                            <motion.div
                              initial={{ opacity: 0, scaleY: 0 }}
                              animate={{ opacity: 0.8, scaleY: 1 }}
                              transition={{ delay: delay + 0.4, duration: 0.8 }}
                              className="absolute left-12 top-24 w-1 h-16 z-0"
                              style={{
                                background: `linear-gradient(to bottom, ${step.color}, ${holoSteps[index + 1]?.color || step.color})`,
                                boxShadow: `0 0 20px ${step.glow}`,
                                transform: "translateZ(5px)",
                              }}
                            >
                              {/* Energy Flow Animation */}
                              <motion.div
                                animate={{
                                  y: [-20, 64],
                                  opacity: [0, 1, 0],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                  delay: delay + 1,
                                }}
                                className="absolute w-full h-6 rounded-full"
                                style={{
                                  background: `linear-gradient(to bottom, transparent, ${step.color}, transparent)`,
                                  filter: "blur(2px)",
                                }}
                              />
                            </motion.div>
                          )}

                          {/* Main Holographic Node */}
                          <motion.div
                            className={cn(
                              "relative rounded-2xl border-2 backdrop-blur-xl overflow-hidden cursor-pointer",
                              step.isActive
                                ? "border-cyan-400/60 bg-gradient-to-br from-cyan-500/15 via-purple-500/10 to-cyan-500/15"
                                : step.isCompleted
                                  ? "border-emerald-400/50 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-emerald-500/10"
                                  : "border-slate-600/40 bg-gradient-to-br from-slate-800/20 via-slate-700/10 to-slate-800/20"
                            )}
                            style={{
                              boxShadow: step.isActive
                                ? `0 0 40px ${step.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                                : step.isCompleted
                                  ? `0 0 25px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                                  : `0 0 15px rgba(100, 116, 139, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)`,
                              transform: `translateZ(${step.isActive ? 25 : step.isCompleted ? 15 : 5}px) rotateY(${step.isActive ? 2 : 0}deg)`,
                            }}
                            variants={holographicVariants}
                            animate={
                              step.isActive
                                ? "active"
                                : step.isCompleted
                                  ? "idle"
                                  : "idle"
                            }
                            whileHover="hover"
                            onClick={() => handleNodeSelect(step.holoId)}
                          >
                            {/* Quantum Field Effects */}
                            {step.isActive && (
                              <>
                                <motion.div
                                  animate={{
                                    background: [
                                      `radial-gradient(circle at 20% 20%, ${step.glow} 0%, transparent 70%)`,
                                      `radial-gradient(circle at 80% 80%, ${step.glow} 0%, transparent 70%)`,
                                      `radial-gradient(circle at 20% 80%, ${step.glow} 0%, transparent 70%)`,
                                      `radial-gradient(circle at 80% 20%, ${step.glow} 0%, transparent 70%)`,
                                    ],
                                  }}
                                  transition={{ duration: 3, repeat: Infinity }}
                                  className="absolute inset-0 rounded-2xl"
                                />
                                <motion.div
                                  animate={{
                                    rotate: [0, 360],
                                    scale: [1, 1.1, 1],
                                  }}
                                  transition={{
                                    rotate: {
                                      duration: 8,
                                      repeat: Infinity,
                                      ease: "linear",
                                    },
                                    scale: { duration: 2, repeat: Infinity },
                                  }}
                                  className="absolute inset-2 rounded-xl border border-cyan-400/30"
                                  style={{
                                    background: `conic-gradient(from 0deg, transparent, ${step.glow}, transparent)`,
                                  }}
                                />
                              </>
                            )}

                            <div className="relative z-10 p-6">
                              <div className="flex items-start gap-5">
                                {/* 3D Holographic Icon */}
                                <motion.div
                                  animate={
                                    step.isActive
                                      ? {
                                          rotateY: [0, 360],
                                          rotateX: [0, 15, 0],
                                          scale: [1, 1.1, 1],
                                        }
                                      : {}
                                  }
                                  transition={{
                                    rotateY: {
                                      duration: 4,
                                      repeat: Infinity,
                                      ease: "linear",
                                    },
                                    rotateX: { duration: 3, repeat: Infinity },
                                    scale: { duration: 2, repeat: Infinity },
                                  }}
                                  className="relative"
                                  style={{ transformStyle: "preserve-3d" }}
                                >
                                  <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center border-2"
                                    style={{
                                      background: `linear-gradient(135deg, ${step.color}, ${step.color}90)`,
                                      borderColor: step.color,
                                      boxShadow: `0 0 30px ${step.glow}`,
                                      transform: "translateZ(10px)",
                                    }}
                                  >
                                    <Icon className="h-8 w-8 text-white" />
                                  </div>

                                  {/* Orbital Rings */}
                                  {step.isActive && (
                                    <>
                                      <motion.div
                                        animate={{ rotateZ: [0, 360] }}
                                        transition={{
                                          duration: 3,
                                          repeat: Infinity,
                                          ease: "linear",
                                        }}
                                        className="absolute inset-0 rounded-full border-2 opacity-50"
                                        style={{
                                          borderColor: step.color,
                                          transform:
                                            "translateZ(5px) rotateX(60deg)",
                                        }}
                                      />
                                      <motion.div
                                        animate={{ rotateZ: [360, 0] }}
                                        transition={{
                                          duration: 4,
                                          repeat: Infinity,
                                          ease: "linear",
                                        }}
                                        className="absolute inset-0 rounded-full border-2 opacity-30"
                                        style={{
                                          borderColor: step.color,
                                          transform:
                                            "translateZ(8px) rotateY(60deg)",
                                        }}
                                      />
                                    </>
                                  )}
                                </motion.div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <span
                                        className="text-sm font-bold px-3 py-1 rounded-lg text-white"
                                        style={{
                                          background: `linear-gradient(135deg, ${step.color}40, ${step.color}60)`,
                                          boxShadow: `0 0 15px ${step.glow}`,
                                        }}
                                      >
                                        {step.name}
                                      </span>
                                      <div className="text-xs text-cyan-300/70 font-mono">
                                        {step.quantumSignature}
                                      </div>
                                    </div>

                                    {/* Status Indicators */}
                                    <div className="flex items-center gap-2">
                                      {step.isCompleted && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"
                                          style={{
                                            boxShadow:
                                              "0 0 15px rgba(16, 185, 129, 0.5)",
                                          }}
                                        >
                                          <CheckCircle2 className="h-3 w-3 text-white" />
                                        </motion.div>
                                      )}
                                      {step.isActive && (
                                        <motion.div
                                          animate={{
                                            scale: [1, 1.2, 1],
                                            rotate: [0, 180, 360],
                                          }}
                                          transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                          }}
                                          className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center"
                                          style={{
                                            boxShadow:
                                              "0 0 15px rgba(6, 182, 212, 0.5)",
                                          }}
                                        >
                                          <Sparkles className="h-3 w-3 text-white" />
                                        </motion.div>
                                      )}

                                      {/* Expansion Toggle */}
                                      <motion.button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleNodeExpansion(step.holoId);
                                        }}
                                        className="w-8 h-8 rounded-lg bg-slate-800/50 border border-cyan-400/30 flex items-center justify-center hover:bg-slate-700/50 transition-all duration-300"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        <motion.div
                                          animate={{
                                            rotate: isExpanded ? 180 : 0,
                                          }}
                                          transition={{ duration: 0.3 }}
                                        >
                                          <ChevronDown className="w-4 h-4 text-cyan-400" />
                                        </motion.div>
                                      </motion.button>
                                    </div>
                                  </div>

                                  <p className="text-sm text-white/90 leading-relaxed mb-4">
                                    {getContentText(step.content)}
                                  </p>

                                  {/* Holographic Metrics */}
                                  <div className="grid grid-cols-3 gap-3 mb-4">
                                    {[
                                      {
                                        label: "Energy",
                                        value: `${step.energyLevel}%`,
                                        color: step.color,
                                      },
                                      {
                                        label: "Frequency",
                                        value: step.frequency,
                                        color: step.color,
                                      },
                                      {
                                        label: "Depth",
                                        value: `${step.depth}D`,
                                        color: step.color,
                                      },
                                    ].map((metric, i) => (
                                      <div
                                        key={metric.label}
                                        className="bg-slate-900/30 rounded-lg p-2 border border-slate-600/30 text-center"
                                        style={{
                                          boxShadow: `0 0 10px ${step.glow}`,
                                          transform: `translateZ(${i + 1}px)`,
                                        }}
                                      >
                                        <div className="text-xs text-slate-400">
                                          {metric.label}
                                        </div>
                                        <div className="text-sm font-bold text-white">
                                          {metric.value}
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Quantum Progress Bar */}
                                  <div className="relative h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: step.isCompleted
                                          ? "100%"
                                          : step.isActive
                                            ? "70%"
                                            : "0%",
                                      }}
                                      transition={{ duration: 1.5, delay }}
                                      className="h-full rounded-full relative"
                                      style={{
                                        background: `linear-gradient(90deg, ${step.color}, ${step.color}80)`,
                                        boxShadow: `0 0 15px ${step.glow}`,
                                      }}
                                    >
                                      {step.isActive && (
                                        <motion.div
                                          animate={{ x: [-20, 150] }}
                                          transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "linear",
                                          }}
                                          className="absolute inset-0 w-5 bg-white/30 rounded-full"
                                          style={{ filter: "blur(2px)" }}
                                        />
                                      )}
                                    </motion.div>
                                  </div>
                                </div>
                              </div>

                              {/* Expanded Details Section */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{
                                      height: 0,
                                      opacity: 0,
                                      rotateX: -15,
                                    }}
                                    animate={{
                                      height: "auto",
                                      opacity: 1,
                                      rotateX: 0,
                                    }}
                                    exit={{
                                      height: 0,
                                      opacity: 0,
                                      rotateX: -15,
                                    }}
                                    transition={{ duration: 0.4 }}
                                    className="border-t border-cyan-400/30 mt-6 pt-6"
                                    style={{ transformStyle: "preserve-3d" }}
                                  >
                                    {/* Detailed Node Analysis */}
                                    <div className="space-y-4">
                                      <h4 className="text-lg font-bold text-cyan-300 mb-4">
                                        Neural Node Analysis
                                      </h4>

                                      {/* Content Analysis */}
                                      {Array.isArray(step.content) && (
                                        <div className="space-y-3">
                                          {step.content.map((item, i) => {
                                            if (
                                              typeof item === "object" &&
                                              "type" in item
                                            ) {
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
                                                    animate={{
                                                      opacity: 1,
                                                      y: 0,
                                                    }}
                                                    transition={{
                                                      delay: i * 0.1,
                                                    }}
                                                    className="bg-slate-900/50 rounded-lg p-4 border border-emerald-400/30"
                                                    style={{
                                                      transform: `translateZ(${i + 5}px)`,
                                                    }}
                                                  >
                                                    <div className="flex items-center gap-2 mb-3">
                                                      <Code2 className="w-4 h-4 text-emerald-400" />
                                                      <span className="text-sm font-medium text-emerald-300">
                                                        Quantum Code Execution
                                                      </span>
                                                    </div>
                                                    <pre className="text-xs text-emerald-100 bg-slate-950 rounded p-3 overflow-x-auto">
                                                      <code>{item.text}</code>
                                                    </pre>
                                                  </motion.div>
                                                );
                                              }

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
                                                    animate={{
                                                      opacity: 1,
                                                      y: 0,
                                                    }}
                                                    transition={{
                                                      delay: i * 0.1,
                                                    }}
                                                    className="bg-slate-900/50 rounded-lg p-4 border border-cyan-400/30"
                                                    style={{
                                                      transform: `translateZ(${i + 5}px)`,
                                                    }}
                                                  >
                                                    <div className="flex items-center gap-2 mb-3">
                                                      <Terminal className="w-4 h-4 text-cyan-400" />
                                                      <span className="text-sm font-medium text-cyan-300">
                                                        Neural Output Stream
                                                      </span>
                                                    </div>
                                                    <pre className="text-xs text-cyan-100 bg-slate-950 rounded p-3 overflow-x-auto">
                                                      <code>{item.text}</code>
                                                    </pre>
                                                  </motion.div>
                                                );
                                              }
                                            }
                                            return null;
                                          })}
                                        </div>
                                      )}

                                      {/* Holographic Metrics Dashboard */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-900/30 rounded-lg p-4 border border-purple-400/30">
                                          <h5 className="text-sm font-medium text-purple-300 mb-2">
                                            Quantum Properties
                                          </h5>
                                          <div className="space-y-2 text-xs">
                                            <div className="flex justify-between">
                                              <span className="text-slate-400">
                                                Dimension:
                                              </span>
                                              <span className="text-white">
                                                {step.dimension}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-slate-400">
                                                Stability:
                                              </span>
                                              <span className="text-white">
                                                {step.stabilityIndex.toFixed(1)}
                                                %
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-slate-400">
                                                Rotation Axis:
                                              </span>
                                              <span className="text-white">
                                                {step.rotationAxis.toUpperCase()}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="bg-slate-900/30 rounded-lg p-4 border border-cyan-400/30">
                                          <h5 className="text-sm font-medium text-cyan-300 mb-2">
                                            Processing Status
                                          </h5>
                                          <div className="space-y-2 text-xs">
                                            <div className="flex justify-between">
                                              <span className="text-slate-400">
                                                Node ID:
                                              </span>
                                              <span className="text-white font-mono">
                                                {step.holoId}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-slate-400">
                                                Index:
                                              </span>
                                              <span className="text-white">
                                                {step.index + 1}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-slate-400">
                                                State:
                                              </span>
                                              <span
                                                className={cn(
                                                  "font-medium",
                                                  step.isActive
                                                    ? "text-cyan-300"
                                                    : step.isCompleted
                                                      ? "text-emerald-300"
                                                      : "text-slate-300"
                                                )}
                                              >
                                                {step.isActive
                                                  ? "Active"
                                                  : step.isCompleted
                                                    ? "Complete"
                                                    : "Pending"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Quantum Processing Indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      className="flex items-center justify-center p-8"
                      style={{ transform: "translateZ(20px)" }}
                    >
                      <motion.div
                        className="relative bg-gradient-to-br from-cyan-500/20 via-purple-500/10 to-cyan-500/20 rounded-2xl border border-cyan-400/40 backdrop-blur-xl p-6"
                        style={{
                          boxShadow:
                            "0 0 40px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                        }}
                        animate={{
                          boxShadow: [
                            "0 0 40px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                            "0 0 60px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                            "0 0 40px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {/* Holographic Scanner Lines */}
                        <motion.div
                          animate={{
                            background: [
                              "linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.8), transparent)",
                              "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.8), transparent)",
                              "linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.8), transparent)",
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 rounded-2xl"
                        />

                        <div className="flex items-center gap-6 relative z-10">
                          {/* 3D Rotating Core */}
                          <motion.div
                            animate={{
                              rotateY: [0, 360],
                              rotateX: [0, 15, 0],
                              scale: [1, 1.1, 1],
                            }}
                            transition={{
                              rotateY: {
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear",
                              },
                              rotateX: { duration: 2, repeat: Infinity },
                              scale: { duration: 1.5, repeat: Infinity },
                            }}
                            className="relative"
                            style={{ transformStyle: "preserve-3d" }}
                          >
                            <div
                              className="w-12 h-12 rounded-xl border-2 border-cyan-400 flex items-center justify-center"
                              style={{
                                background:
                                  "linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.3))",
                                boxShadow: "0 0 30px rgba(6, 182, 212, 0.5)",
                                transform: "translateZ(10px)",
                              }}
                            >
                              <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                                className="w-6 h-6 border-2 border-cyan-300 border-t-transparent rounded-full"
                              />
                            </div>

                            {/* Orbital Elements */}
                            {[...Array(3)].map((_, i) => (
                              <motion.div
                                key={i}
                                animate={{
                                  rotateZ: [0, 360],
                                  opacity: [0.3, 0.8, 0.3],
                                }}
                                transition={{
                                  rotateZ: {
                                    duration: 2 + i,
                                    repeat: Infinity,
                                    ease: "linear",
                                  },
                                  opacity: {
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.3,
                                  },
                                }}
                                className="absolute inset-0 rounded-full border border-cyan-400/50"
                                style={{
                                  transform: `translateZ(${i * 2}px) rotateX(${60 + i * 30}deg)`,
                                }}
                              />
                            ))}
                          </motion.div>

                          <div className="flex-1">
                            <motion.h3
                              animate={{ opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-300"
                            >
                              Quantum Neural Processing
                            </motion.h3>
                            <p className="text-sm text-cyan-300/80 mt-1">
                              Analyzing dimensional data streams...
                            </p>

                            {/* Processing Metrics */}
                            <div className="flex items-center gap-4 mt-3 text-xs">
                              {[
                                { label: "Frequency", value: "12.8 GHz" },
                                { label: "Dimensions", value: "7D+" },
                                { label: "Quantum State", value: "Entangled" },
                              ].map((metric, i) => (
                                <motion.div
                                  key={metric.label}
                                  animate={{ opacity: [0.5, 1, 0.5] }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                  }}
                                  className="flex items-center gap-1 text-cyan-300/70"
                                >
                                  <span>{metric.label}:</span>
                                  <span className="font-mono text-cyan-200">
                                    {metric.value}
                                  </span>
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* Energy Visualization */}
                          <div className="flex flex-col gap-1">
                            {[...Array(5)].map((_, i) => (
                              <motion.div
                                key={i}
                                animate={{
                                  scaleX: [0.3, 1, 0.3],
                                  opacity: [0.3, 1, 0.3],
                                }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  delay: i * 0.1,
                                }}
                                className="h-1 w-8 rounded-full"
                                style={{
                                  background: `linear-gradient(90deg, rgba(6, 182, 212, 0.8), rgba(139, 92, 246, 0.8))`,
                                  boxShadow: "0 0 5px rgba(6, 182, 212, 0.5)",
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
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
