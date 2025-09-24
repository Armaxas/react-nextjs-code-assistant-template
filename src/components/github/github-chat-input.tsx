"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Paperclip,
  SendHorizontal,
  GitBranch,
  GitCommit,
  GitPullRequest,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export function GithubChatInput({
  input,
  setInput,
  onSend,
  isLoading,
  attachments = [],
  setAttachments = () => {},
}: {
  input: string;
  setInput: (value: string) => void;
  onSend: (content: string, attachments?: File[]) => void;
  isLoading: boolean;
  attachments?: File[];
  setAttachments?: (value: File[] | ((prev: File[]) => File[])) => void;
}) {
  const { theme, systemTheme } = useTheme();
  const selectedTheme = theme !== "system" ? theme : systemTheme;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showSuggestions, setShowSuggestions] = useState(false);

  // Adjust textarea height based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const newAttachments = [...prev];
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  // Handle sending message
  const handleSend = () => {
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSend(input, attachments);
      setInput("");
      setAttachments([]);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "Explain the changes in PR #1234",
    "Summarize recent commits to main branch",
    "Compare branch feature/x with main",
    "List all open issues with label 'bug'",
  ];

  return (
    <div className="p-4">
      {/* Suggestions */}
      {showSuggestions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mb-4 flex flex-wrap gap-2",
            selectedTheme === "dark" ? "" : ""
          )}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className={cn(
                "px-3 py-2 rounded-md text-sm transition-colors flex items-center",
                selectedTheme === "dark"
                  ? "bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 border border-blue-500/20"
                  : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
              )}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {index === 0 && <GitPullRequest className="w-4 h-4 mr-2" />}
              {index === 1 && <GitCommit className="w-4 h-4 mr-2" />}
              {index === 2 && <GitBranch className="w-4 h-4 mr-2" />}
              {index === 3 && <GitPullRequest className="w-4 h-4 mr-2" />}
              {suggestion}
            </button>
          ))}
        </motion.div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className={cn(
                "px-3 py-2 rounded-md text-sm flex items-center",
                selectedTheme === "dark"
                  ? "bg-gray-800 text-gray-300 border border-gray-700"
                  : "bg-gray-100 text-gray-700 border border-gray-200"
              )}
            >
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div
        className={cn(
          "flex items-end rounded-lg border transition-all",
          selectedTheme === "dark"
            ? "bg-gray-900 border-gray-800 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20"
            : "bg-white border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-300/50"
        )}
      >
        <textarea
          ref={textareaRef}
          className={cn(
            "flex-1 max-h-[200px] resize-none p-3 bg-transparent focus:outline-none",
            selectedTheme === "dark" ? "text-gray-200" : "text-gray-800"
          )}
          placeholder="Ask about repositories, pull requests, commits..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          onFocus={() => setShowSuggestions(true)}
        />

        <div className="flex items-center px-3 py-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileChange}
          />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "p-2 rounded-full",
              selectedTheme === "dark"
                ? "hover:bg-gray-800"
                : "hover:bg-gray-100"
            )}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip
              className={cn(
                "w-5 h-5",
                selectedTheme === "dark" ? "text-gray-400" : "text-gray-500"
              )}
            />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "p-2 rounded-full ml-1",
              input.trim() || attachments.length > 0
                ? selectedTheme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-500 hover:bg-blue-600"
                : selectedTheme === "dark"
                  ? "bg-gray-800 text-gray-600"
                  : "bg-gray-200 text-gray-500"
            )}
            onClick={handleSend}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <SendHorizontal
                className={cn(
                  "w-5 h-5",
                  input.trim() || attachments.length > 0
                    ? "text-white"
                    : selectedTheme === "dark"
                      ? "text-gray-600"
                      : "text-gray-500"
                )}
              />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
