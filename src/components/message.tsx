/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import cx from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useState, useRef, useMemo } from "react";
import { SparklesIcon } from "./icons";
import { Markdown } from "@/components/markdown";
import { MessageActions } from "@/components/message-actions";
import { CodeBlock } from "@/components/code-block";
import equal from "fast-deep-equal";
import { cn } from "@/lib/utils";
import { Message, Vote, FileAttachment } from "@/types/types";
import {
  FileText,
  Code,
  Eye,
  ChevronDown,
  ChevronRight,
  Brain,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import vscDarkPlus from "react-syntax-highlighter/dist/cjs/styles/prism/vsc-dark-plus";
import useColorScheme from "@/hooks/use-color-scheme";
import { MessageThinkingSpinner } from "@/components/ui/message-thinking-spinner";
import { useTheme } from "next-themes";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/user-utils";
import { useUserSession } from "@/hooks/use-user-session";

// Code message handling is now done in hooks/use-chat.tsx where code is formatted as markdown
// This directly leverages the existing markdown parser and code block components
const formatCodeForMarkdown = (
  content: string,
  language: string = "apex",
  filename?: string,
  codeType?: string
): string => {
  // Create a comment header if filename or codeType is provided
  let header = "";
  if (filename || codeType) {
    header = `// ${filename || "Code"}${codeType ? ` (${codeType})` : ""}\n`;
  }

  // Format as markdown code block
  return `\n\`\`\`${language}\n${header}${content}\n\`\`\`\n`;
};

// Analysis section component with improved visibility state
const AnalysisSection = ({
  content,
  isStreaming = false,
}: {
  content: string;
  isStreaming?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false); // Default to collapsed to save space

  return (
    <div className="my-3 border border-grey-200 dark:border-grey-800 rounded-lg bg-grey-50/50 dark:bg-grey-950/20">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-2.5 py-2 text-left hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-1.5">
          <Brain className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
            Thought Process {isStreaming && "(processing...)"}
          </span>
          {isStreaming && (
            <div className="ml-2">
              <MessageThinkingSpinner size="md" className="w-4 h-4" />
            </div>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
        ) : (
          <ChevronRight className="h-3 w-3 text-blue-600 dark:text-blue-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 text-sm text-blue-800 dark:text-blue-200 border-t border-grey-200 dark:border-grey-800">
              <div className="pt-3 font-medium italic opacity-90 prose prose-xs dark:prose-invert prose-p:my-1 prose-p:leading-relaxed max-w-none">
                <Markdown>{content}</Markdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper function to parse content and extract analysis sections with improved logic
const parseContentWithAnalysis = (content: string) => {
  const parts = [];
  let analysisContent = "";
  let hasActiveAnalysis = false;

  // Check for incomplete analysis (streaming case) - handle all possible end tag variations
  const incompleteAnalysisMatch = content.match(
    /<start analysis>((?:(?!<end analysis>|<\/start analysis>|<\/end analysis>)[\s\S])*?)$/
  );

  if (incompleteAnalysisMatch) {
    hasActiveAnalysis = true;
    analysisContent = incompleteAnalysisMatch[1];

    // Process content before the incomplete analysis
    const beforeIncomplete = content.slice(0, incompleteAnalysisMatch.index);

    // Process any complete analysis sections before the incomplete one - handle all end tag variations
    const completedAnalysisSections = beforeIncomplete.split(
      /<start analysis>|<end analysis>|<\/start analysis>|<\/end analysis>/
    );
    let isInAnalysis = false;

    for (let i = 0; i < completedAnalysisSections.length; i++) {
      const section = completedAnalysisSections[i].trim();
      if (!section) continue;

      if (isInAnalysis) {
        // This is analysis content
        parts.push({ type: "analysis", content: section });
        isInAnalysis = false;
      } else {
        // This is regular content
        // Check if this section was followed by <start analysis>
        const nextSectionExists = i < completedAnalysisSections.length - 1;
        if (nextSectionExists) {
          parts.push({ type: "content", content: section });
          isInAnalysis = true;
        } else {
          // Last section - add as content if not empty
          if (section) {
            parts.push({ type: "content", content: section });
          }
        }
      }
    }
  } else {
    // Process complete content with completed analysis sections - handle all end tag variations
    const sections = content.split(
      /(<start analysis>[\s\S]*?(?:<end analysis>|<\/start analysis>|<\/end analysis>))/
    );

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (!section.trim()) continue;

      // Check if this section is an analysis block - handle all end tag variations
      const analysisMatch = section.match(
        /<start analysis>([\s\S]*?)(?:<end analysis>|<\/start analysis>|<\/end analysis>)/
      );
      if (analysisMatch) {
        // This is an analysis section
        parts.push({ type: "analysis", content: analysisMatch[1].trim() });
      } else {
        // This is regular content
        const cleanSection = section.trim();
        if (cleanSection) {
          parts.push({ type: "content", content: cleanSection });
        }
      }
    }
  }

  return {
    parts,
    hasActiveAnalysis,
    activeAnalysisContent: analysisContent,
  };
};

// Persistent processing indicator component
const PersistentProcessingIndicator = ({
  isVisible,
  hasActiveAnalysis,
}: {
  isVisible: boolean;
  hasActiveAnalysis: boolean;
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 px-3 py-2 mt-2 rounded-lg bg-blue-500/10 border border-blue-500/20"
    >
      <MessageThinkingSpinner size="md" className="w-4 h-4 text-blue-500" />
      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
        {hasActiveAnalysis ? "Analyzing..." : "Processing next task..."}
      </span>
    </motion.div>
  );
};

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
}) => {
  const systemColorScheme = useColorScheme();
  const { theme } = useTheme();
  // Get current user session to access user data
  const { userSession } = useUserSession();

  let colorScheme = theme;
  if (theme === "system") {
    colorScheme = systemColorScheme;
  }
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Create a stable instance ID for this message component
  const messageInstanceId = useRef(
    `msg-${message.id || Math.random().toString(36).substring(2, 11)}`
  ).current;

  // Generate a stable dialog ID
  const dialogId = useRef(`dialog-${messageInstanceId}`).current;

  const isUser = message.role === "user";
  const hasFiles = message.files && message.files.length > 0;

  // Get user initials for avatar - consider both message.author data and current userSession
  // User session only contains _id and email properties (no name), so we use email for initials
  const userInitials = isUser
    ? message.author?.name
      ? getUserInitials(message.author.name) // Use author name if available in the message
      : userSession?.email
        ? getUserInitials(userSession.email) // Fall back to email from session for initials
        : "U" // Default fallback if no user data available
    : "";

  // Handle file preview
  const handleFileClick = (file: FileAttachment, e: React.MouseEvent) => {
    // Prevent default behavior
    e.preventDefault();
    e.stopPropagation();

    setPreviewFile(file);
    setPreviewOpen(true);
  };

  // Function to render file attachments
  const renderFileAttachments = () => {
    if (!hasFiles) return null;

    return (
      <div className="mt-2 mb-3 pb-3 border-b border-gray-800/30">
        <div className="text-secondary text-gray-400 mb-2 font-medium tracking-wide">
          Attached files:
        </div>
        <div className="flex flex-wrap gap-2">
          {message.files?.map((file, index) => (
            <div
              // Fixed key with stable id that doesn't change on re-renders
              key={`file-${file.id || index}-${messageInstanceId}`}
              className="group flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 border border-gray-800/50 text-sm"
            >
              <FileText className="h-3.5 w-3.5 text-blue-400" />
              <button
                className="text-white hover:text-blue-400 text-secondary flex items-center font-medium"
                onClick={(e) => handleFileClick(file, e)}
                type="button"
              >
                {file.name}
                <span className="ml-1.5 text-secondary text-gray-500">
                  {file.type}
                </span>
                <Eye className="h-3 w-3 ml-1.5 text-gray-500 hover:text-blue-400" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Generate a unique key for message actions
  const actionKey = `action-${messageInstanceId}`;

  // Parse content to extract analysis sections with improved logic
  const { parts, hasActiveAnalysis, activeAnalysisContent } = useMemo(() => {
    const content = typeof message.content === "string" ? message.content : "";
    return parseContentWithAnalysis(content);
  }, [message.content]);

  // Determine if we should show persistent loading indicator
  const shouldShowPersistentLoading = useMemo(() => {
    // Show persistent loading for assistant messages when:
    // 1. The message is currently loading (streaming)
    // 2. OR there's an active analysis section being streamed
    if (message.role !== "assistant") return false;

    if (isLoading) return true;
    if (hasActiveAnalysis) return true;

    // No longer checking for abrupt endings, as it's not a reliable indicator
    // of an ongoing task. The isLoading and hasActiveAnalysis flags are sufficient.
    return false;
  }, [message.role, isLoading, hasActiveAnalysis]);

  return (
    // IMPORTANT: The main fix - give AnimatePresence a key
    <AnimatePresence key={`anim-${messageInstanceId}`}>
      <motion.div
        key={`motion-${messageInstanceId}`}
        className="w-full mx-auto max-w-2xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            "flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
            {
              "w-full": mode === "edit",
              "group-data-[role=user]/message:w-fit": mode !== "edit",
            }
          )}
        >
          {message.role === "assistant" ? (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background shadow-sm">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          ) : (
            <Avatar className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shrink-0 shadow-md border border-purple-400/20">
              <AvatarFallback className="text-xs font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="flex flex-col gap-2 w-full">
            {/* Handle all message content - code blocks will be rendered by the markdown component */}
            {message.content && mode === "view" && (
              <div className="flex flex-row gap-2 items-start">
                <div
                  className={cn("flex flex-col gap-0.5", {
                    "bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-sm whitespace-pre-wrap break-all font-medium tracking-tight text-[0.95rem] leading-relaxed":
                      message.role === "user",
                    "font-normal tracking-wide text-main leading-relaxed":
                      message.role === "assistant",
                  })}
                >
                  {/* Display attached files at the top of user messages if there are any */}
                  {isUser && hasFiles && renderFileAttachments()}

                  {/* Display user info for user messages */}
                  {isUser && message.author && (
                    <div className="text-secondary opacity-70 mb-1 font-semibold">
                      {message.author.name || "User"}
                    </div>
                  )}

                  {/* Regular message content with analysis sections */}
                  <div
                    className={
                      message.role === "assistant"
                        ? "prose prose-slate dark:prose-invert prose-p:my-1.5 prose-p:leading-relaxed max-w-none"
                        : ""
                    }
                  >
                    {message.role === "assistant" &&
                    (parts.length > 0 || hasActiveAnalysis) ? (
                      // Render parsed content with analysis sections
                      <>
                        {parts.map((part, index) =>
                          part.type === "analysis" ? (
                            <AnalysisSection
                              key={`analysis-${index}`}
                              content={part.content}
                              isStreaming={false}
                            />
                          ) : (
                            <div key={`content-${index}`}>
                              <Markdown>{part.content}</Markdown>
                            </div>
                          )
                        )}
                        {hasActiveAnalysis && (
                          <AnalysisSection
                            content={activeAnalysisContent}
                            isStreaming={true}
                          />
                        )}

                        {/* Show persistent processing indicator when appropriate */}
                        <PersistentProcessingIndicator
                          isVisible={shouldShowPersistentLoading}
                          hasActiveAnalysis={hasActiveAnalysis}
                        />
                      </>
                    ) : (
                      // Fallback to regular content rendering
                      <>
                        <Markdown>{message.content as string}</Markdown>
                        {/* Show persistent processing indicator for simple loading messages */}
                        {shouldShowPersistentLoading && (
                          <PersistentProcessingIndicator
                            isVisible={true}
                            hasActiveAnalysis={hasActiveAnalysis}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <MessageActions
              key={actionKey}
              chatId={chatId}
              message={message}
              vote={vote}
              isLoading={isLoading}
            />
          </div>
        </div>
      </motion.div>

      {/* File preview dialog - Only render when open and has a file */}
      {previewOpen && previewFile && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen} key={dialogId}>
          <DialogContent className="sm:max-w-[70vw] max-h-[80vh] overflow-hidden flex flex-col border-0">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">{previewFile?.name}</span>
                  {previewFile?.type && (
                    <span className="text-xs text-muted-foreground">
                      {previewFile.type} -{" "}
                      {previewFile?.language || "plaintext"}
                    </span>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-auto flex-grow bg-background">
              <SyntaxHighlighter
                language={previewFile?.language || "plaintext"}
                style={colorScheme === "dark" ? vscDarkPlus : oneLight}
                showLineNumbers={true}
                customStyle={{
                  margin: 0,
                  borderRadius: "0",
                  padding: "1rem",
                  backgroundColor: "transparent",
                  fontSize: "0.9rem",
                }}
              >
                {previewFile?.content || ""}
              </SyntaxHighlighter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    // Add check for files
    if (!equal(prevProps.message.files, nextProps.message.files)) return false;

    return true;
  }
);

// Enhanced ThinkingMessage with more intelligent visibility
export const ThinkingMessage = () => {
  const role = "assistant";
  // Create a stable unique ID for the thinking message
  const thinkingId = useRef(
    `thinking-${Math.random().toString(36).substring(2, 11)}`
  ).current;

  return (
    <AnimatePresence key={`thinking-anim-${thinkingId}`}>
      <motion.div
        key={`thinking-motion-${thinkingId}`}
        className="w-full mx-auto max-w-2xl px-4 group/message "
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { delay: 0.3 } }}
        data-role={role}
      >
        <div
          className={cx(
            "flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl",
            {
              "group-data-[role=user]/message:bg-muted": true,
            }
          )}
        >
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border shadow-sm">
            <SparklesIcon size={14} />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-col gap-4 text-muted-foreground">
              <div className="relative flex items-center justify-center w-14 h-14">
                <MessageThinkingSpinner size="lg" className="text-sky-500" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
