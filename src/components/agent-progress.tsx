import { memo, useCallback, useMemo } from "react";
import { Message } from "@/types/types";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  InfoIcon,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useLocalStorage from "@/hooks/use-local-storage";
import { AnimatePresence, motion } from "framer-motion";
import {
  AIProcessingSpinner,
  CodeGenerationSpinner,
} from "@/components/ui/smart-spinner";

interface AgentProgressProps {
  message: Message;
  messages?: Message[];
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  isOverallLoading?: boolean;
  isCurrentQueryActive?: boolean;
}

function PureAgentProgress({
  message,
  messages = [],
  isExpanded: propExpanded = true,
  onToggle,
  isOverallLoading,
  isCurrentQueryActive,
}: AgentProgressProps) {
  const [expandedSteps, setExpandedSteps] = useLocalStorage<
    Record<string, boolean>
  >("agent-progress-steps-expanded", {});

  const expanded = propExpanded;

  const toggleExpanded = useCallback(() => {
    if (onToggle) {
      onToggle(!expanded);
    }
  }, [expanded, onToggle]);

  const toggleStepExpanded = useCallback(
    (messageId: string) => {
      setExpandedSteps((prev) => ({
        ...prev,
        [messageId]: !prev[messageId],
      }));
    },
    [setExpandedSteps]
  );

  const progressMessages = useMemo(() => {
    const allMessages: Message[] = [];

    if (message && message.type === "progress" && message.id) {
      console.log("AgentProgress - Current message:", message);
      allMessages.push(message);
    }

    if (Array.isArray(messages)) {
      console.log("AgentProgress - All messages:", messages);
      messages.forEach((msg) => {
        if (
          msg &&
          msg.type === "progress" &&
          msg.id &&
          !allMessages.some((existing) => existing.id === msg.id)
        ) {
          allMessages.push(msg);
        }
      });
    }

    return allMessages.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [message, messages]);

  const getContentText = (msg: Message): string => {
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

  // Helper function to determine if progress content is substantial
  const hasSubstantialContent = useMemo(() => {
    if (progressMessages.length === 0) return false;

    return progressMessages.some((msg) => {
      const content = getContentText(msg);

      // Check for analysis markers
      if (
        content.includes("<start analysis>") ||
        content.includes("Analysis:") ||
        content.includes("## Analysis") ||
        content.includes("**Analysis**")
      ) {
        return true;
      }

      // Check for substantial descriptive content
      if (
        content.length > 100 &&
        (content.includes("Found") ||
          content.includes("Analyzing") ||
          content.includes("Identified") ||
          content.includes("Checking") ||
          content.includes("Reviewing") ||
          content.includes("Processing file") ||
          content.includes("Examining") ||
          content.includes("Searching"))
      ) {
        return true;
      }

      return false;
    });
  }, [progressMessages]);

  if (progressMessages.length === 0) return null;

  return (
    <div className="w-full bg-background/80 rounded-lg border border-border/30 shadow-sm">
      <div className="w-full">
        <button
          onClick={toggleExpanded}
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-500/5 hover:bg-blue-500/10 transition-all w-full border-b border-blue-500/10"
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20">
            {/* Show loading spinner when overall loading OR when there are active progress messages 
                BUT only if we don't have substantial content yet (to avoid conflicting with ThinkingMessage) */}
            {(isOverallLoading || isCurrentQueryActive) &&
            !hasSubstantialContent ? (
              <AIProcessingSpinner size="sm" className="text-blue-500" />
            ) : hasSubstantialContent ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <AIProcessingSpinner size="sm" className="text-blue-500" />
            )}
          </div>
          <div className="flex-1 flex items-center gap-2 text-nav text-blue-500">
            <span className="font-medium">Agent Progress</span>
            <span className="text-xs text-blue-500/70">
              ({progressMessages.length} steps)
            </span>
            {/* Add processing indicator when active */}
            {(isOverallLoading || isCurrentQueryActive) && (
              <span className="text-xs text-blue-600 animate-pulse">
                • Processing
              </span>
            )}
            {expanded ? (
              <ChevronDown className="w-4 h-4 ml-auto" />
            ) : (
              <ChevronRight className="w-4 h-4 ml-auto" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {expanded && progressMessages.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 px-3 py-2">
                {progressMessages.map((msg, index) => {
                  if (!msg.id) return null;

                  const isLatest = index === 0;

                  const mainText = getContentText(msg);

                  return (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      key={msg.id}
                      className={cn(
                        "flex flex-col gap-2 text-nav rounded-md p-2 transition-colors",
                        isLatest && isCurrentQueryActive
                          ? "bg-blue-500/10 border border-blue-500/20"
                          : "bg-muted/30 border border-border/30"
                      )}
                    >
                      <button
                        onClick={() => toggleStepExpanded(msg.id!)}
                        className="flex items-center gap-3 w-full text-left"
                      >
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 shrink-0">
                          {/* Show spinner for latest step when actively processing, or for any step that seems incomplete */}
                          {(isLatest &&
                            (isCurrentQueryActive || isOverallLoading)) ||
                          (msg.content &&
                            typeof msg.content === "string" &&
                            (msg.content.includes("Processing...") ||
                              msg.content.length < 10)) ? (
                            <CodeGenerationSpinner
                              size="sm"
                              className="text-blue-500"
                            />
                          ) : (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
                              Step {progressMessages.length - index}
                            </span>
                            {msg.details?.description && (
                              <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                                {msg.details.description}
                              </span>
                            )}
                          </div>
                        </div>
                        {expandedSteps[msg.id] ? (
                          <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedSteps[msg.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{
                              height: "auto",
                              opacity: 1,
                              marginTop: "8px",
                            }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden pl-8"
                          >
                            <div className="p-3 rounded-md bg-background border border-border/50">
                              <h4 className="font-semibold mb-1 text-nav flex items-center">
                                <InfoIcon className="w-4 h-4 mr-2 text-blue-500" />
                                Execution Details:
                              </h4>

                              {/* Display step details if available */}
                              {(() => {
                                console.log("Message details:", msg.details); // Debug log
                                return msg.details ? (
                                  <div className="mb-3 p-2 bg-blue-500/5 border border-blue-500/10 rounded">
                                    {msg.details.description && (
                                      <h5 className="text-xs font-semibold text-blue-500 mb-2">
                                        {msg.details.description}
                                      </h5>
                                    )}

                                    {/* Display the response from the step */}
                                    {msg.details.response && (
                                      <div className="text-xs whitespace-pre-wrap bg-muted/30 p-2 rounded-md border border-border/30">
                                        {msg.details.response}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-xs text-red-500">
                                    Details object is missing
                                  </div>
                                );
                              })()}

                              {/* Handle different content formats */}
                              <div className="text-xs text-muted-foreground space-y-2">
                                {Array.isArray(msg.content) ? (
                                  // Render structured content items
                                  msg.content.map((item, i) => {
                                    // Skip rendering the main text item which is already shown above
                                    if (
                                      item.type === "text" &&
                                      item.text === mainText
                                    ) {
                                      return null;
                                    }

                                    // Show additional text information
                                    if (
                                      item.type === "text" &&
                                      item.text &&
                                      item.text !== mainText
                                    ) {
                                      return (
                                        <div key={i} className="mb-2">
                                          <p>{item.text}</p>
                                        </div>
                                      );
                                    }

                                    // Show tool code with syntax highlighting
                                    else if (
                                      item.type === "tool_code" &&
                                      item.text
                                    ) {
                                      return (
                                        <div key={i} className="mb-2">
                                          <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-blue-500">
                                            <Code className="w-3 h-3" />
                                            <span>Tool Code:</span>
                                          </div>
                                          <pre className="bg-muted/50 p-2 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                                            <code>{item.text}</code>
                                          </pre>
                                        </div>
                                      );
                                    }

                                    // Show tool output
                                    else if (
                                      item.type === "tool_code_output" &&
                                      item.text
                                    ) {
                                      return (
                                        <div key={i} className="mb-2">
                                          <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-green-500">
                                            <span>Output:</span>
                                          </div>
                                          <pre className="bg-muted/50 p-2 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                                            <code>{item.text}</code>
                                          </pre>
                                        </div>
                                      );
                                    }

                                    return null;
                                  })
                                ) : // If no content array but we have details
                                msg.details ? (
                                  <p>See step information above.</p>
                                ) : (
                                  // Simple string content, already rendered in main text
                                  <p>No additional details available.</p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const AgentProgress = memo(PureAgentProgress);
