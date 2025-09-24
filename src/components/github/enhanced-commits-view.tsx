"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  GitCommit,
  RefreshCw,
  Calendar,
  Circle,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AISummary } from "@/components/ui/ai-summary";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchCommits,
  Commit,
  generateAISummary,
  fetchCommitFiles,
  CommitFile,
} from "@/services/github-assistant-service";
import { FileDiffViewer } from "./file-diff-viewer";

interface CommitsViewProps {
  repoName: string;
  className?: string;
  selectedModel?: string;
}

export function CommitsView({
  repoName,
  className = "",
  selectedModel,
}: CommitsViewProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [selectedFile, setSelectedFile] = useState<CommitFile | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [commitFiles, setCommitFiles] = useState<CommitFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Fetch commits based on the selected repository
  const loadCommits = async () => {
    if (!repoName) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetchedCommits = await fetchCommits(repoName);

      // Deduplicate commits based on SHA to prevent React key duplication errors
      const uniqueCommits = fetchedCommits.filter(
        (commit, index, array) =>
          array.findIndex((c) => c.sha === commit.sha) === index
      );

      // Log deduplication info if duplicates were found
      if (fetchedCommits.length !== uniqueCommits.length) {
        console.warn(
          `Removed ${fetchedCommits.length - uniqueCommits.length} duplicate commits`,
          { original: fetchedCommits.length, unique: uniqueCommits.length }
        );
      }

      setCommits(uniqueCommits);
    } catch (err) {
      setError("Failed to load commits. Please try again.");
      console.error(`Error loading commits for ${repoName}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoName]);

  // Generate AI summary for a commit
  const generateCommitSummary = async (commit: Commit) => {
    if (commit.ai_summary) {
      console.log("Skipping summary generation - already has summary");
      return;
    }

    console.log("generateCommitSummary called for commit:", commit.sha);
    setIsSummarizing(true);

    try {
      // Always fetch fresh commit files data for AI summary generation
      // This ensures we don't use stale data from previous commit selections
      console.log("Fetching fresh commit files for AI summary...");
      let currentCommitFiles: CommitFile[] = [];
      try {
        const filesData = await fetchCommitFiles(repoName, commit.sha);
        currentCommitFiles = filesData.files;
        setCommitFiles(currentCommitFiles);
      } catch (error) {
        console.error("Error fetching commit files for summary:", error);
        currentCommitFiles = [];
      }

      // Prepare enhanced commit content with file changes
      let commitContent = `
        Message: ${commit.commit.message}
        Author: ${commit.commit.author.name} <${commit.commit.author.email}>
        Date: ${commit.commit.author.date}
        GitHub Username: ${commit.author?.login || "Unknown"}
      `;

      // Add detailed file changes if available
      if (currentCommitFiles && currentCommitFiles.length > 0) {
        commitContent += `\n\nFile Changes:\n`;

        currentCommitFiles.forEach((file, index) => {
          commitContent += `\n${index + 1}. ${file.filename} (${file.status})`;
          commitContent += `\n   - Additions: +${file.additions}, Deletions: -${file.deletions}`;

          // Include patch/diff content for meaningful analysis (truncate if too long)
          if (file.patch) {
            const truncatedPatch =
              file.patch.length > 2000
                ? file.patch.substring(0, 2000) + "\n... (content truncated)"
                : file.patch;
            commitContent += `\n   - Code Changes:\n${truncatedPatch}`;
          }
          commitContent += `\n`;
        });

        // Add summary of file types changed
        const fileExtensions = currentCommitFiles.map((f) => {
          const ext = f.filename.split(".").pop()?.toLowerCase();
          return ext || "no-extension";
        });
        const uniqueExtensions = [...new Set(fileExtensions)];
        commitContent += `\nFile Types Modified: ${uniqueExtensions.join(", ")}`;
      }

      console.log("Calling generateAISummary API with enhanced content...");
      const summary = await generateAISummary(
        commitContent,
        "commit",
        selectedModel
      );
      console.log("Received AI summary for commit:", summary);

      const processedSummary = String(summary || "").trim();
      if (!processedSummary) {
        throw new Error("Received empty summary from API");
      }

      const updatedCommit = { ...commit, ai_summary: processedSummary };

      setCommits((prevCommits) => {
        const updatedCommits = prevCommits.map((item) =>
          item.sha === commit.sha ? updatedCommit : item
        );
        return updatedCommits;
      });

      setSelectedCommit(updatedCommit);
    } catch (err) {
      console.error("Error generating commit summary:", err);
      const errorMessage = "Unable to generate summary. Please try again.";

      setCommits((prevCommits) =>
        prevCommits.map((item) =>
          item.sha === commit.sha ? { ...item, ai_summary: errorMessage } : item
        )
      );

      if (selectedCommit && selectedCommit.sha === commit.sha) {
        setSelectedCommit({ ...selectedCommit, ai_summary: errorMessage });
      }
    } finally {
      setIsSummarizing(false);
    }
  };

  // Fetch files for a specific commit
  const fetchCommitFilesList = async (commit: Commit) => {
    console.log("Fetching files for commit:", commit.sha);
    setIsLoadingFiles(true);

    try {
      const data = await fetchCommitFiles(repoName, commit.sha);
      console.log("Received commit files data:", data);

      setCommitFiles(data.files);

      // Update the commit with file statistics
      const updatedCommit = {
        ...commit,
        stats: {
          additions: data.stats.additions,
          deletions: data.stats.deletions,
          total: data.stats.total,
        },
      };

      setCommits((prevCommits) =>
        prevCommits.map((item) =>
          item.sha === commit.sha ? updatedCommit : item
        )
      );

      if (selectedCommit && selectedCommit.sha === commit.sha) {
        setSelectedCommit(updatedCommit);
      }
    } catch (err) {
      console.error("Error fetching commit files:", err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Handle commit selection
  const handleCommitClick = (commit: Commit) => {
    console.log("Selecting commit:", commit.sha);

    const currentCommit = commits.find((c) => c.sha === commit.sha) || commit;
    setSelectedCommit(currentCommit);
    setSelectedFile(null); // Reset file selection
    setCommitFiles([]); // Clear previous commit's file data

    // Generate summary if not already available
    if (!currentCommit.ai_summary && !isSummarizing) {
      generateCommitSummary(currentCommit);
    }

    // Fetch commit files if not already fetched
    if (!currentCommit.stats && !isLoadingFiles) {
      fetchCommitFilesList(currentCommit);
    }
  };

  // Handle file selection
  const handleFileClick = (file: CommitFile) => {
    setSelectedFile(file);
  };

  // Format date to relative time
  const formatRelativeDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    }

    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
  };

  // Get file status badge
  const getFileStatusBadge = (status: string) => {
    switch (status) {
      case "added":
        return (
          <Badge className="bg-green-700/40 text-green-400 text-xs">
            Added
          </Badge>
        );
      case "removed":
        return (
          <Badge className="bg-red-700/40 text-red-400 text-xs">Deleted</Badge>
        );
      case "modified":
        return (
          <Badge className="bg-blue-700/40 text-blue-400 text-xs">
            Modified
          </Badge>
        );
      case "renamed":
        return (
          <Badge className="bg-purple-700/40 text-purple-400 text-xs">
            Renamed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        );
    }
  };

  // If a file is selected, show the file diff viewer
  if (selectedFile && selectedCommit) {
    return (
      <FileDiffViewer
        file={selectedFile}
        repoName={repoName}
        commitSha={selectedCommit.sha}
        onBack={() => setSelectedFile(null)}
        className={className}
      />
    );
  }

  return (
    <div className={`h-screen max-h-screen w-full flex flex-col ${className}`}>
      {/* Header - Fixed */}
      <div className="flex-none flex items-center justify-between p-4 border-b border-gray-800/50 bg-gray-950">
        <div className="flex items-center gap-2 flex-shrink-0 min-w-0 overflow-hidden max-w-[80%]">
          <GitCommit className="h-5 w-5 text-purple-500 flex-shrink-0" />
          <h2 className="text-lg font-semibold truncate">
            {repoName ? `Commits - ${repoName}` : "Commits"}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadCommits}
          disabled={isLoading}
          title="Refresh commits"
          className="flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main Content - Flexible Height with Two Independent Scroll Areas */}
      <div className="flex-1 flex flex-row min-h-0 h-[calc(100vh-80px)]">
        {/* Commits List Sidebar - Independent Scroll Container */}
        <div className="w-1/3 min-w-[320px] max-w-[400px] border-r border-gray-800/50 bg-gray-950/50 flex flex-col h-full">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="rounded-md bg-red-900/30 border border-red-700/50 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="bg-red-500/20 p-1.5 rounded-full mt-0.5">
                    <Circle className="h-3 w-3 fill-red-500 text-red-500" />
                  </span>
                  <div>
                    <p className="font-medium text-red-300 mb-1">{error}</p>
                    <p className="text-xs text-red-400/80">
                      Please check your network connection or GitHub API
                      permissions.
                    </p>
                    <Button
                      onClick={loadCommits}
                      variant="outline"
                      size="sm"
                      className="mt-2 bg-red-900/20 border-red-700/50 text-red-300 hover:bg-red-900/40 hover:text-red-200"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Try Again
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col justify-center items-center h-full py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-3 relative">
                <div className="absolute inset-0 rounded-full border-t-2 border-purple-400 animate-spin"></div>
                <div className="absolute inset-0 rounded-full border-purple-400 border-2 opacity-20"></div>
                <GitCommit className="h-5 w-5 text-purple-400" />
              </div>
              <p className="text-gray-400 font-medium">Loading commits...</p>
            </div>
          ) : commits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
              <GitCommit className="h-12 w-12 mb-2 text-gray-500" />
              <p>No commits found</p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="space-y-2 p-4">
                {commits.map((commit, index) => (
                  <Card
                    key={`enhanced-commits-view-${commit.sha}-${index}`}
                    className={`cursor-pointer border-gray-800 hover:bg-gray-900/80 transition-all ${
                      selectedCommit?.sha === commit.sha
                        ? "border-purple-500 bg-gray-900/80"
                        : "bg-gray-900/50"
                    }`}
                    onClick={() => handleCommitClick(commit)}
                  >
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm leading-tight line-clamp-2">
                        {commit.commit.message.split("\n")[0]}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <code className="bg-gray-800/50 px-1 py-0.5 rounded text-xs">
                          {commit.sha.slice(0, 7)}
                        </code>
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatRelativeDate(commit.commit.author.date)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardFooter className="pt-0 pb-3 px-4 flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={commit.author?.avatar_url}
                          alt={commit.commit.author.name}
                        />
                        <AvatarFallback>
                          {commit.commit.author.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs truncate">
                        {commit.commit.author.name}
                      </span>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Commit Details Area - Fixed Height with Independent Scrolling */}
        <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
          {selectedCommit ? (
            <div className="h-full flex flex-col overflow-hidden">
              {/* Commit Header */}
              <div className="p-4 border-b border-gray-800/50 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <code className="bg-gray-800/50 px-2 py-1 rounded text-sm">
                    {selectedCommit.sha.slice(0, 10)}
                  </code>
                  <Badge variant="outline" className="text-xs">
                    Commit
                  </Badge>
                </div>
                <h1 className="text-xl font-semibold leading-tight break-words mb-2">
                  {selectedCommit.commit.message.split("\n")[0]}
                </h1>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={selectedCommit.author?.avatar_url}
                      alt={selectedCommit.commit.author.name}
                    />
                    <AvatarFallback>
                      {selectedCommit.commit.author.name
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-400">
                    Committed by{" "}
                    <span className="font-semibold text-white">
                      {selectedCommit.commit.author.name}
                    </span>{" "}
                    on{" "}
                    {new Date(
                      selectedCommit.commit.author.date
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Commit Content */}
              <div className="flex-1 overflow-y-auto h-0 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <div className="p-4 space-y-4">
                  {/* AI Summary */}
                  <div>
                    <h3 className="mb-2 font-semibold flex items-center gap-2">
                      <svg
                        className="h-4 w-4 text-purple-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      AI Summary
                    </h3>
                    <AISummary
                      summary={selectedCommit.ai_summary}
                      isLoading={isSummarizing}
                    />
                  </div>

                  <Separator />

                  {/* Full Commit Message */}
                  <div>
                    <h3 className="mb-2 font-semibold">Commit Message</h3>
                    <div className="bg-gray-900/50 p-3 rounded-md max-h-40 overflow-y-auto">
                      <p className="text-sm whitespace-pre-line font-mono">
                        {selectedCommit.commit.message}
                      </p>
                    </div>
                  </div>

                  {/* File Statistics */}
                  {selectedCommit.stats ? (
                    <>
                      <Separator />
                      <div>
                        <h3 className="mb-3 font-semibold">Changes</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-gray-900/50 p-3 rounded-md">
                            <p className="text-xs text-muted-foreground mb-1">
                              Total Changes
                            </p>
                            <p className="text-lg font-semibold">
                              {selectedCommit.stats.total}
                            </p>
                          </div>
                          <div className="bg-gray-900/50 p-3 rounded-md">
                            <p className="text-xs text-muted-foreground mb-1">
                              Additions
                            </p>
                            <p className="text-lg font-semibold text-green-500">
                              +{selectedCommit.stats.additions}
                            </p>
                          </div>
                          <div className="bg-gray-900/50 p-3 rounded-md">
                            <p className="text-xs text-muted-foreground mb-1">
                              Deletions
                            </p>
                            <p className="text-lg font-semibold text-red-500">
                              -{selectedCommit.stats.deletions}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    isLoadingFiles && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-muted-foreground">
                            Loading file changes...
                          </span>
                        </div>
                      </>
                    )
                  )}

                  {/* Changed Files List */}
                  {commitFiles && commitFiles.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="mb-3 font-semibold">Changed Files</h3>
                        <div className="space-y-2">
                          {commitFiles.map((file, index) => (
                            <div
                              key={index}
                              className="rounded-md border border-gray-800 bg-gray-900/50 p-3 hover:bg-gray-900/70 cursor-pointer transition-colors"
                              onClick={() => handleFileClick(file)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <FileText className="h-4 w-4 text-purple-400 flex-shrink-0" />
                                  <span className="text-sm truncate font-mono">
                                    {file.filename}
                                  </span>
                                  {getFileStatusBadge(file.status)}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="text-green-500">
                                    +{file.additions}
                                  </span>
                                  <span className="text-red-500">
                                    -{file.deletions}
                                  </span>
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-800/50 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(selectedCommit.html_url, "_blank")}
                >
                  View on GitHub
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground h-full overflow-y-auto">
              <div className="text-center">
                <GitCommit className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p className="text-lg">Select a Commit</p>
                <p className="text-sm">
                  Choose a commit from the list to view its details.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
