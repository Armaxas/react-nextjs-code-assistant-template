/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from "next/link";
import React, { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock, InlineCode } from "@/components/code-block";

const components: Partial<Components> = {
  code: ({ node, className, children, ...props }) => {
    // Check if this is inline code by examining the parent node or className
    const isInline = !className || !className.includes("language-");
    // In React Markdown v9+, the content sometimes comes wrapped in quotes
    // due to how the markdown processor translates certain content
    // Let's completely override how content is rendered

    // Process the children to remove quotes and fix common issues
    let processedChildren = children;
    if (typeof children === "string") {
      // More comprehensive approach to handle quotes and formatting markers
      processedChildren = children
        .replace(/^['"]([\s\S]*)['"]$/gm, "$1") // Quotes around the entire content
        .replace(/^['"](.*)['"]$/gm, "$1") // Quotes around each line
        .replace(/`([^`]+)`/g, "$1") // Remove backticks
        .replace(/^```\w*\s*/gm, "") // Remove code fence markers
        .replace(/```\w*\s*$/gm, "") // Remove closing code fence markers
        .replace(/^'''\w*\s*/gm, "") // Remove triple-quote markers
        .replace(/'''\w*\s*$/gm, "") // Remove closing triple-quote markers
        .replace(/^''apex\s*/gm, "") // Remove ''apex markers specifically
        .replace(/^\/\/\s*Code\s*\(snippet\).*$/gm, ""); // Remove "// Code (snippet)" lines
    }

    // Use InlineCode for inline code blocks
    if (isInline) {
      // For inline code, prevent React Markdown from processing it further
      return <InlineCode>{processedChildren}</InlineCode>;
    }

    // Extract language from className if present
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : undefined;

    // Use CodeBlock for code blocks with language
    return (
      <CodeBlock className={className} {...props}>
        {processedChildren}
      </CodeBlock>
    );
  },
  pre: ({ children }) => <>{children}</>,
  // Enhanced paragraph styling
  p: ({ node, children, ...props }) => {
    return (
      <p className="my-1.5 leading-relaxed text-inherit text-main" {...props}>
        {children}
      </p>
    );
  },
  ol: ({ node, children, ...props }) => {
    return (
      <ol
        className="list-decimal list-outside ml-5 my-3 leading-relaxed"
        {...props}
      >
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-1 leading-normal text-main" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul
        className="list-disc list-outside ml-5 my-3 leading-relaxed"
        {...props}
      >
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    );
  },
  em: ({ node, children, ...props }) => {
    return (
      <span className="italic text-inherit" {...props}>
        {children}
      </span>
    );
  },
  a: ({ node, children, ...props }) => {
    return (
      // @ts-expect-error error
      <Link
        className="text-blue-500 hover:underline font-medium transition-colors"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="text-3xl font-bold mt-7 mb-3 tracking-tight" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2
        className="text-header-md font-semibold mt-6 mb-3 tracking-tight"
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3
        className="text-header-sm font-semibold mt-5 mb-2 tracking-tight"
        {...props}
      >
        {children}
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="text-nav font-semibold mt-4 mb-2" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="text-base font-semibold mt-4 mb-2" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="text-sm font-semibold mt-4 mb-2" {...props}>
        {children}
      </h6>
    );
  },
  blockquote: ({ node, children, ...props }) => {
    return (
      <blockquote
        className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 py-1 my-3 italic text-gray-700 dark:text-gray-300"
        {...props}
      >
        {children}
      </blockquote>
    );
  },
  hr: ({ node, ...props }) => {
    return (
      <hr
        className="my-6 border-t border-gray-200 dark:border-gray-800"
        {...props}
      />
    );
  },
  table: ({ node, children, ...props }) => {
    return (
      <div className="overflow-x-auto my-4">
        <table
          className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm"
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },
  thead: ({ node, children, ...props }) => {
    return (
      <thead className="bg-gray-50 dark:bg-gray-900/50" {...props}>
        {children}
      </thead>
    );
  },
  tbody: ({ node, children, ...props }) => {
    return (
      <tbody
        className="divide-y divide-gray-200 dark:divide-gray-800"
        {...props}
      >
        {children}
      </tbody>
    );
  },
  tr: ({ node, children, ...props }) => {
    return (
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/20" {...props}>
        {children}
      </tr>
    );
  },
  th: ({ node, children, ...props }) => {
    return (
      <th
        className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300"
        {...props}
      >
        {children}
      </th>
    );
  },
  td: ({ node, children, ...props }) => {
    return (
      <td className="px-4 py-3" {...props}>
        {children}
      </td>
    );
  },
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
