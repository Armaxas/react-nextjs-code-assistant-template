"use client";

import React, { useState, useEffect } from "react";
import { FileText, ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PullRequestFile,
  CommitFile,
  fetchPullRequestFileDiff,
  fetchCommitFileDiff,
} from "@/services/github-assistant-service";

interface FileDiffViewerProps {
  file: PullRequestFile | CommitFile;
  repoName: string;
  prNumber?: number;
  commitSha?: string;
  onBack: () => void;
  className?: string;
}

export function FileDiffViewer({
  file,
  repoName,
  prNumber,
  commitSha,
  onBack,
  className = "",
}: FileDiffViewerProps) {
  const [diffContent, setDiffContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadDiff = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let diff: string;
        if (prNumber) {
          // For pull requests
          diff = await fetchPullRequestFileDiff(
            repoName,
            prNumber,
            file.filename
          );
        } else if (commitSha) {
          // For commits - we'll need to add this function
          diff = await fetchCommitFileDiff(repoName, commitSha, file.filename);
        } else {
          throw new Error("Either prNumber or commitSha must be provided");
        }
        setDiffContent(diff);
      } catch (err) {
        setError("Failed to load file diff. Please try again.");
        console.error("Error loading file diff:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDiff();
  }, [repoName, prNumber, commitSha, file.filename]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(diffContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "added":
        return (
          <Badge className="bg-green-700/40 text-green-400 border-green-600/50">
            Added
          </Badge>
        );
      case "removed":
        return (
          <Badge className="bg-red-700/40 text-red-400 border-red-600/50">
            Deleted
          </Badge>
        );
      case "modified":
        return (
          <Badge className="bg-blue-700/40 text-blue-400 border-blue-600/50">
            Modified
          </Badge>
        );
      case "renamed":
        return (
          <Badge className="bg-purple-700/40 text-purple-400 border-purple-600/50">
            Renamed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDiffLine = (line: string, index: number) => {
    const lineNumber = index + 1;
    let lineClass = "text-gray-300";
    let bgClass = "";
    let prefix = " ";

    if (line.startsWith("+")) {
      lineClass = "text-green-400";
      bgClass = "bg-green-900/20";
      prefix = "+";
    } else if (line.startsWith("-")) {
      lineClass = "text-red-400";
      bgClass = "bg-red-900/20";
      prefix = "-";
    } else if (line.startsWith("@@")) {
      lineClass = "text-blue-400";
      bgClass = "bg-blue-900/20";
      prefix = "@";
    }

    return (
      <div
        key={index}
        className={`flex items-start gap-2 px-2 py-0.5 text-sm font-mono ${bgClass} hover:bg-gray-800/50`}
      >
        <span className="text-gray-500 text-xs w-12 flex-shrink-0 text-right">
          {lineNumber}
        </span>
        <span className={`flex-shrink-0 w-4 ${lineClass}`}>{prefix}</span>
        <span className={`flex-1 break-all ${lineClass}`}>
          {line.slice(1) || " "}
        </span>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{file.filename}</h2>
            {file.status === "renamed" && file.previous_filename && (
              <p className="text-sm text-gray-400 truncate">
                Renamed from: {file.previous_filename}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(file.status)}
          <Badge variant="outline" className="text-xs">
            <span className="text-green-400">+{file.additions}</span>
            <span className="mx-1">/</span>
            <span className="text-red-400">-{file.deletions}</span>
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-3 relative">
              <div className="absolute inset-0 rounded-full border-t-2 border-blue-400 animate-spin"></div>
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-gray-400 font-medium">Loading file diff...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="rounded-md bg-red-900/30 border border-red-700/50 p-4 text-sm max-w-md">
              <p className="font-medium text-red-300 mb-1">{error}</p>
              <p className="text-xs text-red-400/80">
                The file diff could not be loaded. It might be too large or
                binary.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Diff Header */}
            <div className="flex items-center justify-between p-3 bg-gray-900/50 border-b border-gray-800/50">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Showing changes for</span>
                <code className="px-2 py-1 bg-gray-800/50 rounded text-xs">
                  {file.filename}
                </code>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="text-gray-400 hover:text-white"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Diff
                  </>
                )}
              </Button>
            </div>

            {/* Diff Content */}
            <ScrollArea className="flex-1">
              <div className="bg-gray-950/50">
                {diffContent ? (
                  diffContent
                    .split("\n")
                    .map((line, index) => formatDiffLine(line, index))
                ) : (
                  <div className="p-4 text-center text-gray-400">
                    <p>No diff content available</p>
                    <p className="text-xs mt-1">
                      This might be a binary file or the diff is too large to
                      display.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-3 border-t border-gray-800/50 bg-gray-900/30">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{file.additions + file.deletions} lines changed</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(file.blob_url, "_blank")}
                  className="text-xs h-auto py-1 px-2"
                >
                  View on GitHub
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
