"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  GitPullRequest,
  Clock,
  RefreshCw,
  Circle,
  Link,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AISummary } from "@/components/ui/ai-summary";
import {
  fetchPullRequests,
  PullRequest,
  generateAISummary,
  fetchPullRequestFiles,
  PullRequestFile,
  fetchJiraDataForPR,
} from "@/services/github-assistant-service";
import { JiraIssue } from "@/services/jira-service";

interface PullRequestsViewProps {
  repoName: string;
  className?: string;
}

// Component to display JIRA issues
const JiraIssuesDisplay: React.FC<{ jiraIssues?: JiraIssue[] }> = ({
  jiraIssues,
}) => {
  if (!jiraIssues || jiraIssues.length === 0) {
    return null;
  }

  const jiraBaseUrl =
    process.env.NEXT_PUBLIC_JIRA_BASE_URL ||
    "https://your-jira-instance.atlassian.net";
  const displayLimit = 2;
  const hasMore = jiraIssues.length > displayLimit;
  const displayIssues = jiraIssues.slice(0, displayLimit);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {displayIssues.map((issue) => (
        <Badge
          key={issue.key}
          variant="outline"
          className="text-xs bg-blue-900/20 border-blue-600/50 text-blue-300 hover:bg-blue-900/40 cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            window.open(`${jiraBaseUrl}/browse/${issue.key}`, "_blank");
          }}
        >
          <Link className="h-3 w-3 mr-1" />
          {issue.key}
        </Badge>
      ))}
      {hasMore && (
        <Badge
          variant="outline"
          className="text-xs bg-gray-900/20 border-gray-600/50 text-gray-400"
        >
          +{jiraIssues.length - displayLimit} more
        </Badge>
      )}
    </div>
  );
};

export function PullRequestsView({
  repoName,
  className = "",
}: PullRequestsViewProps) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [prFiles, setPrFiles] = useState<PullRequestFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Fetch pull requests based on the selected repository and filter
  const loadPullRequests = async () => {
    if (!repoName) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching PRs for:", repoName, "with filter:", filter);
      const prs = await fetchPullRequests(repoName, filter);

      // Don't fetch JIRA data when loading the PR list
      // JIRA data will be fetched only when a specific PR is opened
      console.log("Fetched PRs:", prs.length);
      setPullRequests(prs);
    } catch (err) {
      setError("Failed to load pull requests. Please try again.");
      console.error(`Error loading pull requests for ${repoName}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPullRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoName, filter]);

  // Generate AI summary for a pull request
  const generatePRSummary = async (pr: PullRequest) => {
    console.log("generatePRSummary called for PR:", pr.id);
    setIsSummarizing(true);
    try {
      // Prepare PR content for summary
      const prContent = `
        Title: ${pr.title}
        Author: ${pr.user.login}
        Description: ${pr.body || "No description provided"}
        Changed files: ${pr.changed_files || "Unknown"}
        Additions: ${pr.additions || "Unknown"}
        Deletions: ${pr.deletions || "Unknown"}
        Status: ${pr.state}
      `;

      console.log("Calling generateAISummary API...");
      const summary = await generateAISummary(prContent, "pull_request");
      console.log("Received AI summary:", summary);
      console.log("Summary length:", summary.length);
      console.log("Summary type:", typeof summary);

      // Force summary to be a string and trim whitespace to ensure React detects the state change
      const processedSummary = String(summary).trim();
      console.log("Processed summary:", processedSummary);

      // Update both states atomically to ensure consistency
      const updatedPR = { ...pr, ai_summary: processedSummary };
      console.log("Updating states with:", updatedPR);

      setPullRequests((prevPRs) => {
        const updatedPRs = prevPRs.map((item) =>
          item.id === pr.id ? updatedPR : item
        );
        console.log(
          "Updated PRs:",
          updatedPRs.find((p) => p.id === pr.id)?.ai_summary
        );
        return updatedPRs;
      });

      // Always update the selectedPR with the complete updated PR object
      setSelectedPR(updatedPR);
      console.log("Updated selectedPR with:", updatedPR);
    } catch (err) {
      console.error("Error generating PR summary:", err);
      // Even if there's an error, update the PR with an error message
      // This ensures we don't get stuck in the "generating" state
      const errorMessage = "Unable to generate summary. Please try again.";

      setPullRequests((prevPRs) =>
        prevPRs.map((item) =>
          item.id === pr.id ? { ...item, ai_summary: errorMessage } : item
        )
      );

      if (selectedPR && selectedPR.id === pr.id) {
        setSelectedPR({ ...selectedPR, ai_summary: errorMessage });
      }
    } finally {
      console.log("Setting isSummarizing to false");
      setIsSummarizing(false);
    }
  };

  // Fetch files for a specific pull request
  const fetchPRFiles = async (pr: PullRequest) => {
    console.log("Fetching files for PR:", pr.id);
    setIsLoadingFiles(true);

    try {
      const data = await fetchPullRequestFiles(repoName, pr.number);
      console.log("Received PR files data:", data);

      setPrFiles(data.files);

      // Update the PR with file statistics
      const updatedPR = {
        ...pr,
        additions: data.summary.additions,
        deletions: data.summary.deletions,
        changed_files: data.summary.changed_files,
      };

      // Update the PR in the list and selected PR
      setPullRequests((prevPRs) =>
        prevPRs.map((item) => (item.id === pr.id ? updatedPR : item))
      );

      if (selectedPR && selectedPR.id === pr.id) {
        setSelectedPR(updatedPR);
      }
    } catch (err) {
      console.error("Error fetching PR files:", err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Handle PR selection
  const handlePRClick = async (pr: PullRequest) => {
    console.log("Selecting PR:", pr.id, "Current summary:", pr.ai_summary);

    // Get the latest version of the PR from pullRequests array
    const currentPR = pullRequests.find((p) => p.id === pr.id) || pr;
    console.log("Latest PR state:", currentPR.ai_summary);

    setSelectedPR(currentPR);

    // Fetch JIRA data if not already available
    if (!currentPR.jiraIssues) {
      console.log("Fetching JIRA data for PR:", currentPR.id);
      try {
        // Extract repository name from html_url or use repoName
        const repoPath =
          repoName || currentPR.html_url.split("/").slice(3, 5).join("/");
        const jiraData = await fetchJiraDataForPR(repoPath, currentPR);

        // Update the selected PR with JIRA data
        const updatedPR = {
          ...currentPR,
          jiraIssues: jiraData.jiraIssues,
          jiraReferences: jiraData.jiraReferences,
        };

        // Update the selected PR and the PR in the list
        setSelectedPR(updatedPR);
        setPullRequests((prevPRs) =>
          prevPRs.map((p) => (p.id === updatedPR.id ? updatedPR : p))
        );
      } catch (error) {
        console.error("Error fetching JIRA data for PR:", error);
      }
    }

    // Generate summary if not already available
    if (!currentPR.ai_summary && !isSummarizing) {
      console.log("Starting summary generation for PR:", currentPR.id);
      generatePRSummary(currentPR);
    }

    // Fetch PR files if not already fetched
    if (
      (!currentPR.additions ||
        !currentPR.deletions ||
        !currentPR.changed_files) &&
      !isLoadingFiles
    ) {
      console.log("Fetching files for PR:", currentPR.id);
      fetchPRFiles(currentPR);
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

  // Get status badge based on PR state
  const getStatusBadge = (state: string) => {
    switch (state) {
      case "open":
        return (
          <Badge variant="default" className="bg-green-600">
            Open
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="default" className="bg-red-600">
            Closed
          </Badge>
        );
      case "merged":
        return (
          <Badge variant="default" className="bg-purple-600">
            Merged
          </Badge>
        );
      default:
        return <Badge variant="outline">{state}</Badge>;
    }
  };

  return (
    <div
      className={`flex flex-col gap-4 w-full max-w-full overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-2 flex-shrink-0 min-w-0 overflow-hidden max-w-[80%]">
          <GitPullRequest className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <h2 className="text-lg font-semibold truncate">
            {repoName ? `Pull Requests - ${repoName}` : "Pull Requests"}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadPullRequests}
          disabled={isLoading}
          title="Refresh pull requests"
          className="flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Tabs
        defaultValue="all"
        onValueChange={(value) => setFilter(value as "all" | "open" | "closed")}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
      </Tabs>

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
                onClick={loadPullRequests}
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

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-20rem)] min-h-[400px] w-full max-w-full overflow-hidden">
        {/* PR List */}
        <div className="md:w-1/2 h-[300px] md:h-full mb-4 md:mb-0 min-w-0 flex-shrink overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-full py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-3 relative">
                <div className="absolute inset-0 rounded-full border-t-2 border-blue-400 animate-spin"></div>
                <div className="absolute inset-0 rounded-full border-blue-400 border-2 opacity-20"></div>
                <GitPullRequest className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-gray-400 font-medium">
                Loading pull requests...
              </p>
            </div>
          ) : pullRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <GitPullRequest className="h-12 w-12 mb-2 text-gray-500" />
              <p>No pull requests found</p>
            </div>
          ) : (
            <ScrollArea
              className="h-full pr-2 md:pr-4 w-full"
              style={{ scrollbarWidth: "thin" }}
            >
              <div className="space-y-3 pb-2 w-full absolute overflow-hidden">
                {pullRequests.map((pr) => (
                  <Card
                    key={pr.id}
                    className={`cursor-pointer border-gray-800 hover:bg-gray-900/80 transition ${
                      selectedPR?.id === pr.id
                        ? "border-blue-500 bg-gray-900/80"
                        : "bg-gray-900/50"
                    } overflow-hidden`}
                    onClick={() => handlePRClick(pr)}
                  >
                    <CardHeader className="py-2 sm:py-3 px-3 sm:px-4 overflow-hidden">
                      <div className="flex justify-between items-start gap-2 w-full">
                        <CardTitle className="text-xs sm:text-sm md:text-md truncate leading-tight min-w-0 max-w-[80%]">
                          {pr.title}
                        </CardTitle>
                        <div className="flex-shrink-0">
                          {getStatusBadge(pr.state)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground mt-1">
                        <span>#{pr.number}</span>
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span>{formatRelativeDate(pr.created_at)}</span>
                      </div>
                      {/* JIRA Issues Display */}
                      {pr.jiraIssues && pr.jiraIssues.length > 0 && (
                        <div className="mt-2">
                          <JiraIssuesDisplay jiraIssues={pr.jiraIssues} />
                        </div>
                      )}
                    </CardHeader>
                    <CardFooter className="pt-0 pb-2 sm:pb-3 px-3 sm:px-4 flex items-center gap-1.5 sm:gap-2">
                      <Avatar className="h-4 w-4 sm:h-5 sm:w-5">
                        <AvatarImage
                          src={pr.user.avatar_url}
                          alt={pr.user.login}
                        />
                        <AvatarFallback>
                          {pr.user.login.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] sm:text-xs">
                        {pr.user.login}
                      </span>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* PR Details */}
        <div className="md:w-1/2 h-[500px] md:h-full overflow-hidden flex flex-col min-w-0 flex-shrink">
          {selectedPR ? (
            <Card className="h-full border-gray-800 bg-gray-900/50 flex flex-col overflow-hidden w-full">
              <CardHeader className="flex-shrink-0 pb-2 sm:pb-4 overflow-hidden">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {getStatusBadge(selectedPR.state)}
                  <span className="text-sm text-muted-foreground">
                    #{selectedPR.number}
                  </span>
                </div>
                <CardTitle className="text-lg leading-tight break-words max-w-full overflow-hidden">
                  {selectedPR.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2 overflow-hidden">
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage
                      src={selectedPR.user.avatar_url}
                      alt={selectedPR.user.login}
                    />
                    <AvatarFallback>
                      {selectedPR.user.login.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <CardDescription className="text-xs sm:text-sm truncate min-w-0 max-w-full">
                    Opened by{" "}
                    <span className="font-semibold">
                      {selectedPR.user.login}
                    </span>{" "}
                    on {new Date(selectedPR.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent
                className="flex-1 overflow-auto pb-4"
                style={{ scrollbarWidth: "thin" }}
              >
                <div className="mb-3 md:mb-4">
                  <h3 className="mb-2 font-semibold flex items-center gap-2 text-sm md:text-base">
                    <svg
                      className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500"
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
                    summary={selectedPR.ai_summary}
                    isLoading={isSummarizing}
                    variant="compact"
                  />
                </div>

                <Separator className="my-3 md:my-4" />

                <h3 className="mb-2 font-semibold text-sm md:text-base">
                  Description
                </h3>
                <ScrollArea
                  className="h-28 sm:h-40"
                  style={{ scrollbarWidth: "thin" }}
                >
                  <p className="text-xs sm:text-sm whitespace-pre-line pb-1">
                    {selectedPR.body || "No description provided."}
                  </p>
                </ScrollArea>

                {/* File changes statistics */}
                {selectedPR.additions !== undefined ||
                selectedPR.deletions !== undefined ||
                selectedPR.changed_files !== undefined ? (
                  <>
                    <Separator className="my-3 md:my-4" />
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                      <div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Files Changed
                        </p>
                        <p className="text-base sm:text-lg font-semibold">
                          {selectedPR.changed_files || "?"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Additions
                        </p>
                        <p className="text-base sm:text-lg font-semibold text-green-500">
                          +{selectedPR.additions || "?"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Deletions
                        </p>
                        <p className="text-base sm:text-lg font-semibold text-red-500">
                          -{selectedPR.deletions || "?"}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  isLoadingFiles && (
                    <>
                      <Separator className="my-3 md:my-4" />
                      <div className="flex items-center justify-center py-3 sm:py-4">
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          Loading file changes...
                        </span>
                      </div>
                    </>
                  )
                )}

                {/* Changed Files List */}
                {prFiles && prFiles.length > 0 && (
                  <>
                    <Separator className="my-3 md:my-4" />
                    <h3 className="mb-2 font-semibold text-sm md:text-base">
                      Changed Files
                    </h3>
                    <ScrollArea
                      className="h-40 sm:h-60 pr-1 md:pr-4 mt-2"
                      style={{ scrollbarWidth: "thin" }}
                    >
                      <div className="space-y-2 pb-1">
                        {prFiles.map((file) => (
                          <div
                            key={file.sha}
                            className="rounded-md border border-gray-800 bg-gray-900/70 p-2 overflow-hidden"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-y-1 w-full">
                              <div className="flex items-center gap-2 truncate max-w-[70%] sm:max-w-[80%] min-w-0">
                                {file.status === "added" && (
                                  <span className="inline-flex text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded bg-green-700/40 text-green-400 whitespace-nowrap">
                                    Added
                                  </span>
                                )}
                                {file.status === "removed" && (
                                  <span className="inline-flex text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded bg-red-700/40 text-red-400 whitespace-nowrap">
                                    Deleted
                                  </span>
                                )}
                                {file.status === "modified" && (
                                  <span className="inline-flex text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded bg-blue-700/40 text-blue-400 whitespace-nowrap">
                                    Modified
                                  </span>
                                )}
                                {file.status === "renamed" && (
                                  <span className="inline-flex text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded bg-purple-700/40 text-purple-400 whitespace-nowrap">
                                    Renamed
                                  </span>
                                )}
                                <span className="text-[10px] sm:text-xs truncate">
                                  {file.filename}
                                </span>
                              </div>
                              <div className="text-[10px] sm:text-xs flex items-center gap-2 text-muted-foreground ml-auto">
                                <span className="text-green-500">
                                  +{file.additions}
                                </span>
                                <span className="text-red-500">
                                  -{file.deletions}
                                </span>
                              </div>
                            </div>
                            {file.status === "renamed" &&
                              file.previous_filename && (
                                <div className="mt-1 text-[10px] sm:text-xs text-muted-foreground truncate">
                                  was: {file.previous_filename}
                                </div>
                              )}
                            <div className="flex justify-end mt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 sm:h-6 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0"
                                onClick={() =>
                                  window.open(file.blob_url, "_blank")
                                }
                              >
                                View on GitHub
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex-shrink-0 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(selectedPR.html_url, "_blank")}
                >
                  View on GitHub
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <GitPullRequest className="h-12 w-12 mb-2 text-gray-500" />
              <p>Select a pull request to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
