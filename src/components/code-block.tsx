"use client";

import useColorScheme from "@/hooks/use-color-scheme";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// Change to CommonJS imports which often have better TypeScript compatibility
import {
  vscDarkPlus,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
// Import for creating custom theme
import merge from "lodash.merge";
import { cn } from "@/lib/utils";

// Enhanced custom dark theme with a modern professional look
const customDarkTheme = merge({}, vscDarkPlus, {
  'code[class*="language-"]': {
    color: "#f1f5f9", // slate-100 for better contrast and readability
    background: "#131722", // Slightly blue-shifted dark background (trading/coding platforms often use this)
    textShadow: "none",
    fontFamily: "'Söhne Mono', Menlo, Monaco, Consolas, monospace",
    fontSize: "0.875rem", // 14px for code blocks
    letterSpacing: "0.01em",
  },
  'pre[class*="language-"]': {
    background: "#131722",
    borderRadius: "0.5rem",
    padding: "1.25rem",
    boxShadow:
      "0 4px 15px -3px rgba(0, 0, 0, 0.25), 0 2px 8px -2px rgba(0, 0, 0, 0.15)",
  },
  comment: {
    color: "#8496ac", // A muted blue-gray that stands out but isn't distracting
    fontStyle: "italic",
  },
  punctuation: {
    color: "#94a3b8", // slate-400
  },
  property: {
    color: "#c084fc", // purple-400, vibrant but not harsh
  },
  string: {
    color: "#4ade80", // green-400, slightly brighter for better visibility
  },
  operator: {
    color: "#f472b6", // pink-400, softer than before
  },
  keyword: {
    color: "#60a5fa", // blue-400, slightly brighter
    fontWeight: "500",
  },
  "class-name": {
    color: "#fbbf24", // amber-400, better contrast
    fontWeight: "500",
  },
  function: {
    color: "#818cf8", // indigo-400, clearer and more vibrant
  },
  boolean: {
    color: "#fb7185", // rose-400, softer red
  },
  number: {
    color: "#22d3ee", // cyan-400, brighter for better visibility
  },
  tag: {
    color: "#f87171", // red-400, softer red
    fontWeight: "500",
  },
  selector: {
    color: "#a78bfa", // violet-400, brighter for better visibility
  },
  "attr-name": {
    color: "#fbbf24", // amber-400, consistent with class-name
  },
  "attr-value": {
    color: "#4ade80", // green-400, consistent with string
  },
  namespace: {
    color: "#94a3b8", // slate-400
    opacity: 0.9,
  },
  doctype: {
    color: "#94a3b8", // slate-400
    fontStyle: "italic",
  },
  prolog: {
    color: "#94a3b8", // slate-400
  },
  cdata: {
    color: "#94a3b8", // slate-400
  },
  // Additional syntax elements for better coverage
  regex: {
    color: "#f472b6", // pink-400, similar to operator
  },
  important: {
    color: "#f97316", // orange-500, attention-grabbing
    fontWeight: "bold",
  },
  entity: {
    color: "#94a3b8", // slate-400
    cursor: "help",
  },
  inserted: {
    color: "#4ade80", // green-400, for git diffs
  },
  deleted: {
    color: "#f87171", // red-400, for git diffs
  },
  url: {
    color: "#60a5fa", // blue-400
    textDecoration: "underline",
  },
  constant: {
    color: "#fb7185", // rose-400, consistent with boolean
  },
  variable: {
    color: "#e2e8f0", // slate-200
  },
  builtin: {
    color: "#c084fc", // purple-400
  },
});

// Enhanced custom light theme with a refined professional look
const customLightTheme = merge({}, oneLight, {
  'code[class*="language-"]': {
    color: "#1e293b", // slate-800, richer text color
    background: "#f8fafc", // slate-50, cleaner than gray
    textShadow: "none",
    fontFamily:
      "'JetBrains Mono', 'Fira Code', 'Roboto Mono', 'SF Mono', Menlo, Monaco, Consolas, monospace",
    fontSize: "0.9rem",
    letterSpacing: "0.01em",
  },
  'pre[class*="language-"]': {
    background: "#f8fafc", // slate-50
    borderRadius: "0.5rem",
    padding: "1.25rem",
    boxShadow:
      "0 4px 15px -3px rgba(0, 0, 0, 0.1), 0 2px 8px -2px rgba(0, 0, 0, 0.05)",
  },
  comment: {
    color: "#64748b", // slate-500, subtle but readable
    fontStyle: "italic",
  },
  punctuation: {
    color: "#64748b", // slate-500
  },
  property: {
    color: "#8b5cf6", // violet-500, vibrant but professional
  },
  string: {
    color: "#10b981", // emerald-500, brighter than before
  },
  operator: {
    color: "#ec4899", // pink-500, consistent across themes
  },
  keyword: {
    color: "#3b82f6", // blue-500, brighter and more modern
    fontWeight: "500",
  },
  "class-name": {
    color: "#f59e0b", // amber-500, more readable
    fontWeight: "500",
  },
  function: {
    color: "#6366f1", // indigo-500, brighter and more modern
  },
  boolean: {
    color: "#ef4444", // red-500, brighter
  },
  number: {
    color: "#06b6d4", // cyan-500
  },
  tag: {
    color: "#ef4444", // red-500, consistent with boolean
    fontWeight: "500",
  },
  selector: {
    color: "#8b5cf6", // violet-500
  },
  "attr-name": {
    color: "#f59e0b", // amber-500, consistent with class-name
  },
  "attr-value": {
    color: "#10b981", // emerald-500, consistent with string
  },
  namespace: {
    color: "#64748b", // slate-500
    opacity: 0.9,
  },
  doctype: {
    color: "#64748b", // slate-500
    fontStyle: "italic",
  },
  prolog: {
    color: "#64748b", // slate-500
  },
  cdata: {
    color: "#64748b", // slate-500
  },
  // Additional syntax elements for better coverage
  regex: {
    color: "#ec4899", // pink-500, same as operator
  },
  important: {
    color: "#ea580c", // orange-600, attention-grabbing
    fontWeight: "bold",
  },
  entity: {
    color: "#64748b", // slate-500
    cursor: "help",
  },
  inserted: {
    color: "#10b981", // emerald-500, for git diffs
  },
  deleted: {
    color: "#ef4444", // red-500, for git diffs
  },
  url: {
    color: "#3b82f6", // blue-500
    textDecoration: "underline",
  },
  constant: {
    color: "#ef4444", // red-500
  },
  variable: {
    color: "#334155", // slate-700
  },
  builtin: {
    color: "#8b5cf6", // violet-500
  },
});

/**
 * Enhanced CodeBlock component that properly handles code blocks with syntax highlighting
 * and aggressively cleans any backtick formatting issues.
 */

// Enhanced function to get language-specific indicator color
const getLanguageColor = (language: string): string => {
  switch (language.toLowerCase()) {
    case "javascript":
      return "bg-amber-400"; // Brighter yellow for JS
    case "typescript":
      return "bg-blue-500"; // Classic blue for TS
    case "python":
      return "bg-emerald-500"; // Fresh emerald for Python
    case "jsx":
      return "bg-sky-400"; // Light blue for JSX
    case "tsx":
      return "bg-indigo-500"; // Indigo for TSX
    case "html":
      return "bg-orange-500"; // Orange for HTML
    case "css":
      return "bg-violet-500"; // Violet for CSS
    case "scss":
      return "bg-fuchsia-500"; // Fuchsia for SCSS
    case "json":
      return "bg-amber-500"; // Amber for JSON
    case "java":
      return "bg-red-500"; // Red for Java
    case "ruby":
      return "bg-rose-600"; // Rose for Ruby
    case "php":
      return "bg-indigo-400"; // Indigo for PHP
    case "go":
      return "bg-cyan-500"; // Cyan for Go
    case "rust":
      return "bg-orange-600"; // Orange for Rust
    case "shell":
      return "bg-teal-600"; // Teal for Shell
    case "bash":
      return "bg-teal-500"; // Teal for Bash
    case "sql":
      return "bg-blue-600"; // Blue for SQL
    case "graphql":
      return "bg-pink-500"; // Pink for GraphQL
    case "markdown":
      return "bg-blue-400"; // Light blue for Markdown
    case "yaml":
      return "bg-violet-500"; // Violet for YAML
    case "xml":
      return "bg-amber-500"; // Amber for XML
    case "apex":
      return "bg-blue-500"; // Blue for Apex
    case "lwc":
      return "bg-sky-500"; // Sky blue for LWC
    case "c":
      return "bg-blue-700"; // Dark blue for C
    case "cpp":
      return "bg-blue-600"; // Blue for C++
    case "csharp":
      return "bg-green-700"; // Dark green for C#
    case "swift":
      return "bg-orange-500"; // Orange for Swift
    case "kotlin":
      return "bg-purple-500"; // Purple for Kotlin
    case "dart":
      return "bg-sky-500"; // Sky blue for Dart
    case "r":
      return "bg-blue-500"; // Blue for R
    case "powershell":
      return "bg-blue-600"; // Blue for PowerShell
    case "dockerfile":
      return "bg-blue-800"; // Dark blue for Dockerfile
    case "hcl":
      return "bg-violet-600"; // Violet for HCL (Terraform)
    default:
      return "bg-slate-500"; // Default to slate instead of gray
  }
};

export function CodeBlock({
  className,
  children = "",
  ...rest
}: {
  className?: string;
  children?: string | React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const systemColorScheme = useColorScheme();
  const { theme } = useTheme();
  let colorScheme = theme;
  if (theme === "system") {
    colorScheme = systemColorScheme;
  }

  // Add assisted text based on language
  const assistedTextHTML = String("<!-- Assisted by IBM Granite -->\n");
  const assistedTextJS = String("// Assisted by IBM Granite\n");
  const assistedTextCSS = String("/* Assisted by IBM Granite */\n");
  let assistedText = "";

  // Detect language from code content when not specified or is generic "text"
  const detectLanguage = (content: string): string => {
    // Check for Apex code patterns
    if (
      content.includes("public class") ||
      content.includes("private class") ||
      content.includes("@IsTest") ||
      content.includes("System.assert") ||
      content.includes("trigger ") ||
      content.includes("Apex")
    ) {
      return "apex";
    }
    // Check for LWC or Aura
    else if (
      (content.includes("<template") || content.includes("<aura:")) &&
      content.includes("</")
    ) {
      return "html";
    }
    // Check for JavaScript
    else if (
      content.includes("function") ||
      content.includes("const ") ||
      content.includes("let ") ||
      content.includes("import ")
    ) {
      return "javascript";
    }
    return "text";
  };

  // Extract language from className
  let match = /language-(\w+)/.exec(className ?? "");

  // Try to detect language from content if it's "text" or not specified
  if (!match || match[1] === "text") {
    const detectedLang = detectLanguage(String(children));
    if (detectedLang !== "text") {
      // Create synthetic match result as a proper RegExpExecArray
      const syntheticMatch = Object.assign(
        ["language-" + detectedLang, detectedLang],
        {
          index: 0,
          input: "language-" + detectedLang,
          groups: undefined,
        }
      ) as RegExpExecArray;
      match = syntheticMatch;
      // Update className to include detected language
      className = "language-" + detectedLang;
    }
  }

  // Set appropriate header comment based on language
  if (match) {
    switch (match[1]) {
      case "html":
      case "xml":
        assistedText = assistedTextHTML;
        break;
      case "css":
        assistedText = assistedTextCSS;
        break;
      case "javascript":
      case "apex":
        assistedText = assistedTextJS;
        break;
      case "lwc":
        assistedText = assistedTextHTML;
        break;
      default:
        assistedText = assistedTextJS;
    }
  }

  // State for copy button
  const [copied, setCopied] = useState(false);

  // Aggressively clean up code content to handle various formatting issues
  const cleanCodeContent = () => {
    const content = String(children);

    // Split into lines to remove problematic backtick lines
    const lines = content.split("\n");

    // Filter out lines that contain backtick markers
    const cleanedLines = lines.filter((line) => {
      // Remove lines that just contain backticks with optional language
      if (/^```+\s*\w*\s*$/.test(line.trim())) {
        return false;
      }

      // Remove lines with Markdown headers like "# Test Stub Implementations for..."
      if (/^#+\s+Test\s+(Stub|Methods|Class)/.test(line.trim())) {
        return false;
      }

      return true;
    });

    // Join the filtered lines
    let cleanedContent = cleanedLines.join("\n");

    // Additional cleanup for inline backticks
    cleanedContent = cleanedContent
      .replace(/```\w*\s*$/gm, "") // Remove closing code fence markers
      .replace(/```\w*\s*$/g, "") // Backup for global mode not catching all
      .replace(/^```\w*\s*/gm, "") // Remove opening code fence markers
      .replace(/^```\w*\s*/g, "") // Backup for global mode not catching all
      .replace(/^'''\w*\s*/gm, "") // Remove triple-quote markers
      .replace(/'''\w*\s*$/gm, "") // Remove closing triple-quote markers
      .replace(/^''apex\s*/gm, "") // Remove ''apex markers specifically
      .replace(/^'''\s*/gm, "") // Remove any triple quotes
      .replace(/'''\s*$/gm, ""); // Remove any trailing triple quotes

    // Remove comment indicators that might have leaked through
    cleanedContent = cleanedContent
      .replace(/^\/\/\s*Code\s*\(snippet\).*$/gm, "") // Remove "// Code (snippet)" lines
      .replace(/^\/\/\s*snippet.*$/gm, ""); // Remove other types of code comment markers

    // Remove surrounding quotes if they exist around the entire content
    // This helps with quotes that sometimes get added around entire code blocks
    if (
      (cleanedContent.startsWith("'") && cleanedContent.endsWith("'")) ||
      (cleanedContent.startsWith('"') && cleanedContent.endsWith('"'))
    ) {
      // Check if the quotes wrap the entire content and are not part of the code
      // by verifying there's more than just the quotes themselves
      if (cleanedContent.length > 2) {
        cleanedContent = cleanedContent.slice(1, -1);
      }
    }

    return cleanedContent.trim();
  };

  const displayCode = cleanCodeContent();

  // Skip rendering if the code is empty after cleaning
  if (!displayCode.trim()) {
    return null;
  }

  return match ? (
    <div className="relative my-5 shadow-sm hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800/60">
      <div className="py-[10px] pl-[16px] bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/90 dark:to-slate-800 w-full text-sm border-b border-slate-200/70 dark:border-slate-700/80 rounded-t-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${getLanguageColor(match[1])} shadow-sm shadow-black/10 dark:shadow-white/5`}
            ></span>
            {match[1]}
          </span>
          <button
            className="px-2.5 py-1 mr-2.5 text-xs bg-slate-200/70 dark:bg-slate-700/70 hover:bg-slate-300/70 dark:hover:bg-slate-600/70 rounded transition-colors flex items-center gap-1.5 hover:shadow-sm"
            onClick={() => {
              navigator.clipboard.writeText(displayCode);
              setCopied(true);
              setTimeout(() => {
                setCopied(false);
              }, 2000);
            }}
            aria-label="Copy code"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  Copied!
                </span>
              </>
            ) : (
              <>
                <CopyIcon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        PreTag="div"
        language={match[1].toLowerCase()}
        // Using direct style assignment with a direct cast to any to bypass type checking
        // This is a pragmatic solution for libraries with complex/mismatched type definitions
        // @ts-expect-error - This is necessary to use these styles with SyntaxHighlighter
        style={colorScheme === "dark" ? customDarkTheme : customLightTheme}
        wrapLongLines={true}
        wrapLines={true}
        customStyle={{
          whiteSpace: "pre-wrap",
          margin: "0",
          borderBottomLeftRadius: "0.5rem",
          borderBottomRightRadius: "0.5rem",
          borderTopLeftRadius: "0",
          borderTopRightRadius: "0",
          border: "1px solid",
          borderColor:
            colorScheme === "dark"
              ? "rgba(30, 41, 59, 0.5)" // slate-800 with transparency
              : "rgba(241, 245, 249, 0.7)", // slate-100 with transparency
          boxShadow:
            colorScheme === "dark"
              ? "0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
              : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        }}
        codeTagProps={{
          style: {
            whiteSpace: "pre-wrap",
            fontFamily: "'Söhne Mono', Menlo, Monaco, Consolas, monospace",
            fontSize: "0.875rem", // 14px for code blocks
            letterSpacing: "0.01em",
          },
        }}
        {...rest}
      >
        {assistedText + displayCode}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code
      {...rest}
      className={`${className} text-code px-[0.4rem] py-[0.15rem] bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 font-mono tracking-tight`}
    >
      {children}
    </code>
  );
} // Enhanced InlineCode component that directly renders the content without quotes
export const InlineCode = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const { theme } = useTheme();
  let colorScheme = theme;

  if (theme === "system") {
    colorScheme = systemColorScheme;
  }

  return (
    <code
      className={cn(
        "relative rounded-md px-1.5 py-0.5 font-mono text-code font-medium before:content-none after:content-none",
        {
          "bg-blue-100 text-blue-700 ring-1 ring-blue-200":
            colorScheme === "light",
          "bg-grey-900/30 text-grey-300 ring-1 ring-grey-800":
            colorScheme === "dark",
        }
      )}
      // This data attribute will help us identify if quotes are being added during rendering
      data-no-quotes="true"
    >
      {children}
    </code>
  );
};
