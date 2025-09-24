"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AISummaryProps {
  summary?: string | null;
  isLoading?: boolean;
  className?: string;
  variant?: "default" | "compact";
}

export function AISummary({
  summary,
  isLoading = false,
  className,
  variant = "default",
}: AISummaryProps) {
  const containerClass = cn(
    "bg-gray-900/50 rounded-md",
    variant === "compact" ? "p-2" : "p-3",
    className
  );

  if (isLoading || !summary) {
    return (
      <div className={cn(containerClass, "flex items-center gap-2")}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-sm text-gray-400">
          {isLoading ? "Generating summary..." : "No summary available"}
        </span>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <ReactMarkdown
        className={cn(
          "prose prose-sm prose-invert max-w-none",
          "prose-headings:text-gray-200 prose-headings:font-semibold prose-headings:mb-2 prose-headings:mt-3 first:prose-headings:mt-0",
          "prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-3 last:prose-p:mb-0",
          "prose-ul:text-gray-300 prose-ul:mb-3 prose-ul:list-disc prose-ul:pl-4",
          "prose-ol:text-gray-300 prose-ol:mb-3 prose-ol:list-decimal prose-ol:pl-4",
          "prose-li:mb-1 prose-li:leading-relaxed",
          "prose-strong:text-white prose-strong:font-semibold",
          "prose-em:text-gray-200 prose-em:italic",
          "prose-code:text-blue-300 prose-code:bg-gray-800/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs",
          "prose-pre:bg-gray-800/50 prose-pre:border prose-pre:border-gray-700/50 prose-pre:rounded-md prose-pre:p-3",
          "prose-blockquote:border-l-4 prose-blockquote:border-blue-500/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-400",
          "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
        )}
        components={{
          h1: ({ children, ...props }) => (
            <h1
              className="text-base font-semibold text-gray-200 mb-2 mt-3 first:mt-0"
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              className="text-sm font-semibold text-gray-200 mb-2 mt-3 first:mt-0"
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              className="text-sm font-semibold text-gray-200 mb-1 mt-2 first:mt-0"
              {...props}
            >
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p
              className="text-sm text-gray-300 leading-relaxed mb-3 last:mb-0"
              {...props}
            >
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul
              className="text-sm text-gray-300 mb-3 list-disc pl-4 space-y-1"
              {...props}
            >
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol
              className="text-sm text-gray-300 mb-3 list-decimal pl-4 space-y-1"
              {...props}
            >
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed" {...props}>
              {children}
            </li>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-white" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic text-gray-200" {...props}>
              {children}
            </em>
          ),
          code: ({ children, ...props }) => (
            <code
              className="text-blue-300 bg-gray-800/50 px-1 py-0.5 rounded text-xs font-mono"
              {...props}
            >
              {children}
            </code>
          ),
          pre: ({ children, ...props }) => (
            <pre
              className="bg-gray-800/50 border border-gray-700/50 rounded-md p-3 overflow-x-auto text-xs font-mono"
              {...props}
            >
              {children}
            </pre>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-blue-500/50 pl-4 italic text-gray-400 my-3"
              {...props}
            >
              {children}
            </blockquote>
          ),
        }}
      >
        {summary}
      </ReactMarkdown>
    </div>
  );
}
