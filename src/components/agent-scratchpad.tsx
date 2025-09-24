"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, FileText, ClipboardList, Sparkles } from "lucide-react";
import { Message } from "@/types/types";
import { AgentProgress } from "./agent-progress";
import useLocalStorage from "@/hooks/use-local-storage";
import { useSidebar } from "./ui/sidebar";
import { cn } from "@/lib/utils";

interface AgentScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
  messages?: Message[];
  isLoading: boolean;
  progressMessages: Message[];
  onSwitchStyle?: () => void;
}

export function AgentScratchpad({
  isOpen,
  onClose,
  messages,
  isLoading,
  progressMessages,
  onSwitchStyle,
}: AgentScratchpadProps) {
  const [expandedGroups, setExpandedGroups] = useLocalStorage<
    Record<string, boolean>
  >("agent-scratchpad-expanded-groups", {});
  const { open: sidebarOpen } = useSidebar();

  // Group progress messages by their related query
  const groupedProgressMessages = React.useMemo(() => {
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
  const queryGroups = React.useMemo(() => {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/5 dark:bg-white/5 z-10 pointer-events-none"
          />
          <motion.div
            initial={{ opacity: 0, width: 0, x: 100 }}
            animate={{
              opacity: 1,
              width: sidebarOpen ? "40%" : "45%",
              x: 0,
            }}
            exit={{ opacity: 0, width: 0, x: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 bg-background z-20 overflow-hidden"
            style={{
              boxShadow: "-8px 0 24px rgba(0, 0, 0, 0.12)",
              borderLeft: "3px solid rgba(59, 130, 246, 0.2)",
            }}
          >
            {/* Scratchpad Header */}
            <div className="h-16 border-b border-border/30 flex items-center justify-between px-6 bg-background">
              <div className="flex items-center gap-2 text-header-sm font-semibold">
                <ClipboardList className="w-4 h-4 text-blue-500" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                  Agent Scratchpad
                </span>
                {isLoading && (
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse ml-2"></span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {onSwitchStyle && (
                  <Button
                    onClick={onSwitchStyle}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300"
                  >
                    <Sparkles className="w-3 h-3 mr-2" />
                    Switch Style
                  </Button>
                )}
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

            {/* Scratchpad Content */}
            <div className="overflow-y-auto h-[calc(100%-4rem)] p-4">
              {isLoading || progressMessages.length > 0 ? (
                <div className="space-y-4">
                  {/* Status Panel */}
                  <div className="bg-blue-500/5 rounded-lg border border-blue-500/20 shadow-sm p-3">
                    <h3 className="text-header-sm font-medium flex items-center gap-2 mb-2 text-blue-500">
                      <FileText className="w-4 h-4" />
                      Agent Status
                    </h3>
                    <div className="flex items-center gap-2 mb-3 text-main">
                      {isLoading ? (
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      )}
                      <span className="font-medium text-foreground">
                        {isLoading ? "Processing" : "Completed"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-md border border-blue-200/50 dark:border-blue-800/30">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {progressMessages.length}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Steps
                        </span>
                      </div>

                      <div className="w-px h-4 bg-blue-300/50 dark:bg-blue-600/50"></div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30">
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                            {queryGroups.length}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                          {queryGroups.length === 1 ? "Query" : "Queries"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress grouped by query */}
                  {queryGroups.length > 0 ? (
                    <div className="space-y-6">
                      {queryGroups.map((group, groupIndex) => {
                        const isActiveQuery = isLoading && groupIndex === 0;

                        return (
                          <div
                            key={group.queryId}
                            className={cn(
                              "rounded-lg border shadow-sm p-3",
                              isActiveQuery
                                ? "bg-blue-500/5 border-blue-500/20"
                                : "bg-muted/20 border-border/40"
                            )}
                          >
                            <div className="mb-3 border-b border-border/30 pb-2">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-medium flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-blue-500" />
                                  <span
                                    className={
                                      isActiveQuery
                                        ? "text-blue-500"
                                        : "text-foreground"
                                    }
                                  >
                                    Query
                                  </span>
                                </h3>
                                {isActiveQuery && (
                                  <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded-full ml-auto">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground pl-6 line-clamp-2">
                                {typeof group.userMessage?.content === "string"
                                  ? group.userMessage.content
                                  : "Processing query..."}
                              </p>
                            </div>

                            <AgentProgress
                              message={
                                group.progressMessages[
                                  group.progressMessages.length - 1
                                ]
                              }
                              messages={group.progressMessages}
                              isExpanded={
                                expandedGroups[group.queryId] !== false
                              }
                              onToggle={(expanded) => {
                                setExpandedGroups((prev) => ({
                                  ...prev,
                                  [group.queryId]: expanded,
                                }));
                              }}
                              isOverallLoading={isLoading}
                              isCurrentQueryActive={isActiveQuery}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-lg border border-border/30 shadow-sm p-4 mt-4">
                      <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        Execution Context
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        The agent is processing your request using a series of
                        steps. You can track the progress above.
                      </p>
                      <div className="text-xs rounded-md bg-background p-2">
                        <pre className="whitespace-pre-wrap break-words">
                          {`Agent is currently working on your request. This panel will show additional details as they become available.`}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <ClipboardList className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    The agent scratchpad will display execution details when you
                    submit a query.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
