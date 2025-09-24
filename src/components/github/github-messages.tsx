"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Message } from "@/types/types";
import {
  GitBranch,
  User,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Share,
  Check,
} from "lucide-react";
import { TypingIndicator } from "./typing-indicator";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

// Define a component for a single message
const GithubMessage = ({ message }: { message: Message }) => {
  const [showActions, setShowActions] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { theme, systemTheme } = useTheme();
  const selectedTheme = theme !== "system" ? theme : systemTheme;

  const isUser = message.role === "user";

  const handleCopy = () => {
    const content =
      typeof message.content === "string"
        ? message.content
        : JSON.stringify(message.content);
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "w-full min-w-0 flex",
        isUser ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.3,
        }}
        className={cn(
          "rounded-lg p-2.5 sm:p-3 relative overflow-hidden w-full max-w-5xl",
          isUser
            ? selectedTheme === "dark"
              ? "bg-blue-900/30 border border-blue-500/20"
              : "bg-blue-50 border border-blue-200"
            : selectedTheme === "dark"
              ? "bg-gray-900 border border-gray-800"
              : "bg-white border border-gray-200"
        )}
      >
        <div className="flex items-start min-w-0">
          <div
            className={cn(
              "flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3",
              isUser ? "bg-blue-500" : "bg-purple-500"
            )}
          >
            {isUser ? (
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            ) : (
              <GitBranch className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "mb-1 text-xs font-semibold",
                isUser
                  ? selectedTheme === "dark"
                    ? "text-blue-400"
                    : "text-blue-600"
                  : selectedTheme === "dark"
                    ? "text-purple-400"
                    : "text-purple-600"
              )}
            >
              {isUser ? "You" : "GitHub Assistant"}
            </div>

            <div
              className={cn(
                "prose overflow-hidden",
                selectedTheme === "dark" ? "prose-invert" : "",
                "prose-xs sm:prose-sm" // Smaller font size for better message density
              )}
              style={{
                overflowWrap: "break-word",
                wordBreak: "break-word",
                maxWidth: "100%",
                width: "100%",
                fontSize: "0.875rem", // Standard text size for messages
                lineHeight: 1.5,
              }}
            >
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline = !match;
                    return !isInline ? (
                      <div className="syntax-highlighter-wrapper max-w-full overflow-auto">
                        <div className="relative group">
                          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-1 bg-gray-800 rounded hover:bg-gray-700 text-gray-300"
                              onClick={() =>
                                navigator.clipboard.writeText(String(children))
                              }
                              title="Copy code"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <SyntaxHighlighter
                            // @ts-expect-error - Type mismatch with style prop
                            style={dracula}
                            language={match ? match[1] : "text"}
                            PreTag="div"
                            {...props}
                            customStyle={{
                              fontSize: "0.75rem",
                              maxWidth: "100%",
                              margin: 0,
                              borderRadius: "0.375rem",
                              padding: "0.75rem 1rem",
                            }}
                            codeTagProps={{
                              style: {
                                fontFamily: "var(--font-mono)",
                                lineHeight: 1.5,
                              },
                            }}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  p: ({ children }) => (
                    <p className="break-words">{children}</p>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {typeof message.content === "string"
                  ? message.content
                  : JSON.stringify(message.content)}
              </ReactMarkdown>
            </div>

            <div className="flex items-center flex-wrap gap-x-2 mt-0.5">
              {!isUser && message.metadata && message.metadata.analysis && (
                <span className="text-xs italic text-blue-500 font-medium">
                  Analysis for {message.metadata.analysis}
                </span>
              )}
              <span className="text-xs text-gray-500">
                {message.createdAt instanceof Date
                  ? message.createdAt.toLocaleTimeString()
                  : message.createdAt
                    ? new Date(message.createdAt).toLocaleTimeString()
                    : new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "absolute bottom-0.5 sm:bottom-0 right-1 sm:right-4 flex items-center space-x-1 sm:space-x-2 p-1 sm:p-1.5 rounded-md shadow-lg z-10",
              selectedTheme === "dark"
                ? "bg-gray-800/90 border border-blue-600/30"
                : "bg-white/95 border border-blue-200"
            )}
          >
            <button
              className={cn(
                "p-1.5 rounded hover:scale-110 transition-all",
                selectedTheme === "dark"
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-100"
              )}
              onClick={handleCopy}
              title="Copy message"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-blue-500" />
              )}
            </button>

            <button
              className={cn(
                "p-1.5 rounded hover:scale-110 transition-all",
                selectedTheme === "dark"
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-100"
              )}
              title="Share message"
            >
              <Share className="w-4 h-4 text-blue-500" />
            </button>

            {!isUser && (
              <>
                <button
                  className={cn(
                    "p-1.5 rounded hover:scale-110 transition-all",
                    selectedTheme === "dark"
                      ? "hover:bg-gray-700"
                      : "hover:bg-gray-100"
                  )}
                  title="Thumbs up"
                >
                  <ThumbsUp className="w-4 h-4 text-blue-500" />
                </button>

                <button
                  className={cn(
                    "p-1.5 rounded hover:scale-110 transition-all",
                    selectedTheme === "dark"
                      ? "hover:bg-gray-700"
                      : "hover:bg-gray-100"
                  )}
                  title="Thumbs down"
                >
                  <ThumbsDown className="w-4 h-4 text-blue-500" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export function GithubMessages({
  messages,
  isLoading,
}: {
  messages: Message[];
  isLoading?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesLengthRef = useRef(messages.length);
  const lastMessageContentRef = useRef<string | null>(null);

  // If we have messages, store the content of the last message for comparison
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const content =
        typeof lastMessage.content === "string"
          ? lastMessage.content
          : JSON.stringify(lastMessage.content);
      lastMessageContentRef.current = content;
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current && shouldAutoScroll) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [shouldAutoScroll]);

  // Fixed scroll event handling to properly respect manual scrolling
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Only consider it at bottom if very close to bottom (20px threshold)
    const scrollBottomThreshold = 20;
    const isAtBottom =
      scrollHeight - scrollTop - clientHeight < scrollBottomThreshold;

    // When a scroll event occurs, always assume it's a user action first
    // This is the key fix - we need to immediately respect user scrolling
    if (!isAtBottom) {
      // User has explicitly scrolled away from bottom
      setShouldAutoScroll(false);
      if (!userHasScrolled) {
        setUserHasScrolled(true);
      }
    } else if (isAtBottom && !shouldAutoScroll) {
      // User scrolled back to bottom - re-enable auto-scroll
      setShouldAutoScroll(true);
    }
  }, [userHasScrolled, shouldAutoScroll]);

  // Track if component has mounted
  const hasInitializedRef = useRef(false);

  // Initial scroll to bottom only on first mount
  useEffect(() => {
    // Only scroll on initial mount, not on subsequent updates
    if (!hasInitializedRef.current && messages.length > 0) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        hasInitializedRef.current = true;
      }, 100);
    }
  }, [messages.length]); // Only depend on messages.length, not the entire messages array

  // Improved scroll handling for new messages, respecting user scroll position
  useEffect(() => {
    if (messages.length === 0) return;

    // Check if a new message was added
    const newMessageArrived = messages.length > messagesLengthRef.current;

    // Check if content of the last message was updated (streaming response)
    const lastMessage = messages[messages.length - 1];
    const lastContent =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    // Update our refs for next comparison (do this before any scroll decisions)
    messagesLengthRef.current = messages.length;
    // const previousContent = lastMessageContentRef.current; // Unused variable commented out
    lastMessageContentRef.current = lastContent;

    // Only scroll if we should auto-scroll AND either:
    // 1. This is a brand new message (not just content update)
    // 2. User hasn't manually scrolled yet
    if ((newMessageArrived || !userHasScrolled) && shouldAutoScroll) {
      // Small delay to ensure DOM has updated before scrolling
      setTimeout(scrollToBottom, 10);
    }
  }, [messages, scrollToBottom, shouldAutoScroll, userHasScrolled]);

  // Completely disable the mutation observer if user has scrolled up
  // This prevents any unexpected auto-scrolling when content changes
  useEffect(() => {
    let observer: MutationObserver | null = null;

    // Only create and attach the observer if auto-scroll is enabled
    if (shouldAutoScroll && !userHasScrolled) {
      observer = new MutationObserver((mutations) => {
        let contentAdded = false;

        // Check if any of the mutations added content that would affect scroll height
        for (const mutation of mutations) {
          if (
            (mutation.type === "childList" && mutation.addedNodes.length > 0) ||
            mutation.type === "characterData"
          ) {
            contentAdded = true;
            break;
          }
        }

        if (contentAdded) {
          // Verify we're still at bottom before scrolling
          if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 20;

            if (isAtBottom) {
              // Small delay to ensure DOM has fully updated
              setTimeout(scrollToBottom, 15);
            }
          }
        }
      });

      const current = scrollRef.current;
      if (current) {
        observer.observe(current, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [scrollToBottom, shouldAutoScroll, userHasScrolled]);

  return (
    <div className="relative flex-1 w-full max-w-full min-w-0 h-full">
      <div
        ref={scrollRef}
        className="w-full h-full max-w-full min-w-0 overflow-y-auto pb-4 px-1 md:px-3 scroll-smooth"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#4a5568 #1f2937",
          overflowY: "auto", // Explicitly set overflow-y
          overscrollBehavior: "contain", // Prevent scroll chaining
        }}
        onScroll={handleScroll}
      >
        <div className="flex flex-col space-y-4 w-full min-h-full justify-end">
          {messages.map((message, idx) => (
            <GithubMessage
              key={`ghmsg-${message.id || idx}-${idx}`}
              message={message}
            />
          ))}

          {/* Typing indicator when model is generating a response but no assistant message is visible yet */}
          {isLoading && !messages.some((msg) => msg.role === "assistant") && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 w-full"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3 bg-purple-500">
                <GitBranch className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="bg-gray-900 border border-gray-800 p-3 rounded-lg flex-grow">
                <div className="mb-1 text-xs font-semibold text-purple-400">
                  GitHub Assistant
                </div>
                <div className="mt-1">
                  <TypingIndicator />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Improved scroll to bottom button - only shown when auto-scroll is disabled */}
      {!shouldAutoScroll && messages.length > 1 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => {
            // Force scroll to bottom and re-enable auto-scroll
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
            setShouldAutoScroll(true);
          }}
          className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg z-10 transition-all duration-200 hover:shadow-blue-500/20 flex items-center space-x-2"
          title="Scroll to bottom"
        >
          <span className="text-xs font-medium mr-1">New messages</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </motion.button>
      )}
    </div>
  );
}
