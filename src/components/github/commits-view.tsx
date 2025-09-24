"use client";

import React, { useState, useEffect } from "react";
import { Loader2, GitCommit, RefreshCw, Calendar, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AISummary } from "@/components/ui/ai-summary";
import {
  fetchCommits,
  Commit,
  generateAISummary,
} from "@/services/github-assistant-service";

interface CommitsViewProps {
  repoName: string;
  className?: string;
}

export function CommitsView({ repoName, className = "" }: CommitsViewProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

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
    // If already summarizing or has a summary, don't regenerate
    if (commit.ai_summary) {
      console.log("Skipping summary generation - already has summary");
      return;
    }

    console.log("generateCommitSummary called for commit:", commit.sha);
    setIsSummarizing(true);

    try {
      // Prepare commit content for summary
      const commitContent = `
        Message: ${commit.commit.message}
        Author: ${commit.commit.author.name} <${commit.commit.author.email}>
        Date: ${commit.commit.author.date}
        GitHub Username: ${commit.author?.login || "Unknown"}
      `;

      console.log("Calling generateAISummary API...");
      const summary = await generateAISummary(commitContent, "commit");
      console.log("Received AI summary for commit:", summary);
      console.log("Summary length:", summary?.length);
      console.log("Summary type:", typeof summary);

      // Force summary to be a string and trim whitespace
      const processedSummary = String(summary || "").trim();
      if (!processedSummary) {
        throw new Error("Received empty summary from API");
      }
      console.log("Processed summary:", processedSummary);

      // Update both states atomically to ensure consistency
      const updatedCommit = { ...commit, ai_summary: processedSummary };

      setCommits((prevCommits) => {
        // Get fresh commits state
        const updatedCommits = prevCommits.map((item) =>
          item.sha === commit.sha ? updatedCommit : item
        );

        // Update selectedCommit in the same render cycle
        setSelectedCommit((prev) =>
          prev?.sha === commit.sha ? updatedCommit : prev
        );

        return updatedCommits;
      });
    } catch (err) {
      console.error("Error generating commit summary:", err);
      const errorMessage = "Unable to generate summary. Please try again.";

      // Update both states with error message
      setCommits((prevCommits) => {
        const updatedCommits = prevCommits.map((item) =>
          item.sha === commit.sha ? { ...item, ai_summary: errorMessage } : item
        );

        setSelectedCommit((prev) =>
          prev?.sha === commit.sha
            ? { ...prev, ai_summary: errorMessage }
            : prev
        );

        return updatedCommits;
      });

      // Re-throw so error handling higher up can display UI feedback
      throw err;
    } finally {
      setIsSummarizing(false);
    }
  };

  // Handle commit selection
  const handleCommitClick = (commit: Commit) => {
    console.log(
      "Selecting commit:",
      commit.sha,
      "Current summary:",
      commit.ai_summary
    );

    // Get the latest version of the commit from commits array
    const currentCommit = commits.find((c) => c.sha === commit.sha) || commit;
    console.log("Latest commit state:", currentCommit.ai_summary);

    // Update selection immediately
    setSelectedCommit(currentCommit);

    // If commit doesn't have a summary and we're not already generating one, start generation
    if (!currentCommit.ai_summary && !isSummarizing) {
      console.log("Starting summary generation for commit:", currentCommit.sha);
      generateCommitSummary(currentCommit).catch((err) => {
        console.error("Error generating summary:", err);
        // Error state already handled in generateCommitSummary
      });
    }
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

  // Format first line of commit message
  const formatCommitMessage = (message: string): string => {
    const firstLine = message.split("\n")[0];
    return firstLine;
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCommit className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Commits - {repoName}</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadCommits}
          disabled={isLoading}
          title="Refresh commits"
          className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-900/30 border border-red-700/50 p-4 text-sm">
          <div className="flex items-start gap-3">
            <span className="bg-red-500/20 p-1.5 rounded-full mt-0.5">
              <Circle className="h-3 w-3 fill-red-500 text-red-500" />
            </span>
            <div>
              <p className="font-medium text-red-300 mb-1">{error}</p>
              <p className="text-xs text-red-400/80">
                Please check your network connection or GitHub API permissions.
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
      )}

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-20rem)]">
        {/* Commits List */}
        <div className="md:w-1/2 h-full">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-full py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-3 relative">
                <div className="absolute inset-0 rounded-full border-t-2 border-blue-400 animate-spin"></div>
                <div className="absolute inset-0 rounded-full border-blue-400 border-2 opacity-20"></div>
                <GitCommit className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-gray-400 font-medium">
                Loading commit history...
              </p>
            </div>
          ) : commits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <GitCommit className="h-12 w-12 mb-2 text-gray-500" />
              <p>No commits found</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3">
                {commits.map((commit, index) => (
                  <Card
                    key={`basic-commits-view-${commit.sha}-${index}`}
                    className={`cursor-pointer border-gray-800 hover:bg-gray-900/80 transition ${
                      selectedCommit?.sha === commit.sha
                        ? "border-blue-500 bg-gray-900/80"
                        : "bg-gray-900/50"
                    }`}
                    onClick={() => handleCommitClick(commit)}
                  >
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm line-clamp-1">
                        {formatCommitMessage(commit.commit.message)}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono text-xs">
                          {commit.sha.substring(0, 7)}
                        </span>
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatRelativeDate(commit.commit.author.date)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardFooter className="pt-0 pb-3 px-4 flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        {commit.author ? (
                          <AvatarImage
                            src={commit.author.avatar_url}
                            alt={commit.author.login}
                          />
                        ) : null}
                        <AvatarFallback>
                          {(commit.author?.login || commit.commit.author.name)
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">
                        {commit.author?.login || commit.commit.author.name}
                      </span>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Commit Details */}
        <div className="md:w-1/2 h-full">
          {selectedCommit ? (
            <Card className="h-full border-gray-800 bg-gray-900/50">
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">
                    {selectedCommit.sha.substring(0, 7)}
                  </span>
                </div>
                <CardTitle className="break-words whitespace-pre-line text-base">
                  {formatCommitMessage(selectedCommit.commit.message)}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    {selectedCommit.author ? (
                      <AvatarImage
                        src={selectedCommit.author.avatar_url}
                        alt={selectedCommit.author.login}
                      />
                    ) : null}
                    <AvatarFallback>
                      {(
                        selectedCommit.author?.login ||
                        selectedCommit.commit.author.name
                      )
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <CardDescription>
                    Committed by{" "}
                    <span className="font-semibold">
                      {selectedCommit.author?.login ||
                        selectedCommit.commit.author.name}
                    </span>{" "}
                    on{" "}
                    {new Date(
                      selectedCommit.commit.author.date
                    ).toLocaleDateString()}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="mb-2 font-semibold flex items-center gap-2">
                    <svg
                      className="h-4 w-4 text-blue-500"
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

                <Separator className="my-4" />

                <h3 className="mb-2 font-semibold">Full Message</h3>
                <ScrollArea className="h-40">
                  <p className="text-sm whitespace-pre-line">
                    {selectedCommit.commit.message}
                  </p>
                </ScrollArea>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs text-muted-foreground mb-1">
                      Author
                    </h4>
                    <p className="text-sm">
                      {selectedCommit.commit.author.name}
                    </p>
                    <p className="text-xs text-muted-foreground break-all">
                      {selectedCommit.commit.author.email}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs text-muted-foreground mb-1">
                      Committer
                    </h4>
                    <p className="text-sm">
                      {selectedCommit.commit.committer?.name ||
                        selectedCommit.commit.author.name}
                    </p>
                    <p className="text-xs text-muted-foreground break-all">
                      {selectedCommit.commit.committer?.email ||
                        selectedCommit.commit.author.email}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(selectedCommit.html_url, "_blank")}
                >
                  View on GitHub
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <GitCommit className="h-12 w-12 mb-2 text-gray-500" />
              <p>Select a commit to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
