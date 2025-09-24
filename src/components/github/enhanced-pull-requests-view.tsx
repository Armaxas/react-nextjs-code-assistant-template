"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2,
  GitPullRequest,
  Clock,
  RefreshCw,
  Circle,
  FileText,
  ChevronRight,
  Link,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { generateJiraIssuesSummary } from "@/services/jira-ai-service";
import { ModernJiraIssuesView } from "@/components/jira/modern-jira-issues-view";
import { FileDiffViewer } from "./file-diff-viewer";
import { jiraSummaryCache } from "@/services/jira-summary-cache";

interface PullRequestsViewProps {
  repoName: string;
  className?: string;
  selectedModel?: string;
}

// Simple component to display JIRA issue badges (for the PR list view)
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
  selectedModel,
}: PullRequestsViewProps) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [selectedFile, setSelectedFile] = useState<PullRequestFile | null>(
    null
  );
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [prFiles, setPrFiles] = useState<PullRequestFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingJira, setIsLoadingJira] = useState(false);
  const [jiraAttempted, setJiraAttempted] = useState<Set<number>>(new Set());
  const [jiraErrors, setJiraErrors] = useState<Record<number, string>>({});

  // Use refs to track ongoing requests and prevent race conditions
  const activeSummaryRequestRef = useRef<AbortController | null>(null);
  const currentPRIdRef = useRef<number | null>(null);

  // Cleanup function to cancel ongoing summary requests
  const cancelActiveSummaryRequest = useCallback(() => {
    if (activeSummaryRequestRef.current) {
      console.log("Cancelling active summary request");
      activeSummaryRequestRef.current.abort();
      activeSummaryRequestRef.current = null;
      setIsSummarizing(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelActiveSummaryRequest();
    };
  }, [cancelActiveSummaryRequest]);

  // Fetch pull requests based on the selected repository and filter
  const loadPullRequests = async () => {
    if (!repoName) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching PRs for:", repoName, "with filter:", filter);
      const prs = await fetchPullRequests(repoName, filter);
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

    // Cancel any existing summary request
    cancelActiveSummaryRequest();

    // Set current PR ID for tracking
    currentPRIdRef.current = pr.id;

    // Create new AbortController for this request
    const abortController = new AbortController();
    activeSummaryRequestRef.current = abortController;

    setIsSummarizing(true);

    try {
      // Check if request was cancelled before starting
      if (abortController.signal.aborted) {
        console.log("Request was cancelled before starting");
        return;
      }

      // OPTIMIZATION: Start parallel operations for faster processing
      console.log("Starting optimized parallel data collection for PR:", pr.id);

      // Promise 1: Fetch PR files (use cached if available for this specific PR)
      const filesPromise = (async () => {
        try {
          // Check if files are already available from previous fetch for this specific PR
          if (prFiles && prFiles.length > 0 && selectedPR?.id === pr.id) {
            console.log("Using cached PR files for summary");
            return prFiles;
          }

          console.log("Fetching fresh PR files for AI summary...");
          const filesData = await fetchPullRequestFiles(repoName, pr.number);
          setPrFiles(filesData.files);
          return filesData.files;
        } catch (error) {
          console.error("Error fetching PR files for summary:", error);
          return [];
        }
      })();

      // Promise 2: Pre-build base content while files are loading (synchronous operations)
      const baseContentPromise = Promise.resolve().then(() => {
        let baseContent = `
        Title: ${pr.title}
        Author: ${pr.user.login}
        Description: ${pr.body || "No description provided"}
        Changed files: ${pr.changed_files || "Unknown"}
        Additions: ${pr.additions || "Unknown"}
        Deletions: ${pr.deletions || "Unknown"}
        Status: ${pr.state}
      `;

        // Add JIRA context if available (this is synchronous)
        if (pr.jiraIssues && pr.jiraIssues.length > 0) {
          baseContent += `\n\nRelated JIRA Issues:\n`;
          pr.jiraIssues.forEach((issue, index) => {
            baseContent += `\n${index + 1}. ${issue.key}: ${issue.summary || "No summary"}`;
            baseContent += `\n   - Status: ${issue.status?.name || "Unknown"}`;
            baseContent += `\n   - Type: ${issue.issuetype?.name || "Unknown"}`;
            if (issue.assignee) {
              baseContent += `\n   - Assignee: ${issue.assignee.displayName}`;
            }
            if (issue.description && issue.description.length > 0) {
              const truncatedDesc =
                issue.description.length > 300
                  ? issue.description.substring(0, 300) + "..."
                  : issue.description;
              baseContent += `\n   - Description: ${truncatedDesc}`;
            }
            baseContent += `\n`;
          });
        }

        return baseContent;
      });

      // Wait for both operations to complete in parallel
      const [currentPRFiles, baseContent] = await Promise.all([
        filesPromise,
        baseContentPromise,
      ]);

      // Check if request was cancelled after parallel operations
      if (abortController.signal.aborted) {
        console.log("Request was cancelled after parallel data collection");
        return;
      }

      // OPTIMIZATION: Build final content with file details
      let prContent = baseContent;

      // Add detailed file changes if available
      if (currentPRFiles && currentPRFiles.length > 0) {
        prContent += `\n\nFile Changes:\n`;

        currentPRFiles.forEach((file, index) => {
          prContent += `\n${index + 1}. ${file.filename} (${file.status})`;
          prContent += `\n   - Additions: +${file.additions}, Deletions: -${file.deletions}`;

          // Include patch/diff content for meaningful analysis (truncate if too long)
          if (file.patch) {
            const truncatedPatch =
              file.patch.length > 2000
                ? file.patch.substring(0, 2000) + "\n... (content truncated)"
                : file.patch;
            prContent += `\n   - Code Changes:\n${truncatedPatch}`;
          }
          prContent += `\n`;
        });

        // Add summary of file types changed
        const fileExtensions = currentPRFiles.map((f) => {
          const ext = f.filename.split(".").pop()?.toLowerCase();
          return ext || "no-extension";
        });
        const uniqueExtensions = [...new Set(fileExtensions)];
        prContent += `\nFile Types Modified: ${uniqueExtensions.join(", ")}`;
      }

      // Check if request was cancelled before making API call
      if (abortController.signal.aborted) {
        console.log("Request was cancelled before API call");
        return;
      }

      console.log("Calling generateAISummary API with enhanced content...");
      const summary = await generateAISummary(
        prContent,
        "pull_request",
        selectedModel
      );
      console.log("Received AI summary:", summary);

      // Check if request was cancelled after API call
      if (abortController.signal.aborted) {
        console.log("Request was cancelled after API call");
        return;
      }

      // Check if this is still the current PR (user might have selected a different one)
      if (currentPRIdRef.current !== pr.id) {
        console.log("PR selection changed, discarding summary");
        return;
      }

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
      // Handle AbortError specifically (including different ways it can manifest)
      if (
        err instanceof Error &&
        (err.name === "AbortError" ||
          err.message.includes("aborted") ||
          err.message.includes("signal is aborted"))
      ) {
        console.log("Summary generation was cancelled");
        return;
      }

      console.error("Error generating PR summary:", err);

      // Only update with error message if this is still the current PR
      if (currentPRIdRef.current === pr.id) {
        const errorMessage = "Unable to generate summary. Please try again.";

        setPullRequests((prevPRs) =>
          prevPRs.map((item) =>
            item.id === pr.id ? { ...item, ai_summary: errorMessage } : item
          )
        );

        if (selectedPR && selectedPR.id === pr.id) {
          setSelectedPR({ ...selectedPR, ai_summary: errorMessage });
        }
      }
    } finally {
      // Only clear the loading state if this is still the current request
      if (activeSummaryRequestRef.current === abortController) {
        console.log("Setting isSummarizing to false");
        setIsSummarizing(false);
        activeSummaryRequestRef.current = null;
      }
    }
  };

  // Fetch files for a specific pull request
  const fetchPRFiles = async (pr: PullRequest) => {
    console.log("Fetching files for PR:", pr.id);
    setIsLoadingFiles(true);

    try {
      const data = await fetchPullRequestFiles(repoName, pr.number);
      console.log("Received PR files data:", data);

      // Check for and deduplicate any files with the same filename+sha combination
      const originalFiles = data.files;
      const uniqueFiles = originalFiles.filter(
        (file, index, array) =>
          array.findIndex(
            (f) => f.filename === file.filename && f.sha === file.sha
          ) === index
      );

      // Log deduplication info if duplicates were found
      if (originalFiles.length !== uniqueFiles.length) {
        console.warn(
          `Removed ${originalFiles.length - uniqueFiles.length} duplicate files in PR #${pr.number}`,
          {
            original: originalFiles.length,
            unique: uniqueFiles.length,
            duplicates: originalFiles
              .filter(
                (file, index, array) =>
                  array.findIndex(
                    (f) => f.filename === file.filename && f.sha === file.sha
                  ) !== index
              )
              .map((f) => ({ filename: f.filename, sha: f.sha })),
          }
        );
      }

      setPrFiles(uniqueFiles);

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

  // Fetch JIRA data for the selected PR
  const fetchJiraDataForSelectedPR = async (pr: PullRequest) => {
    if (isLoadingJira) return; // Prevent concurrent requests

    setIsLoadingJira(true);
    setJiraErrors((prev) => ({ ...prev, [pr.number]: "" })); // Clear any previous errors

    try {
      console.log(`[JIRA] Fetching JIRA data for PR #${pr.number}`);
      const jiraData = await fetchJiraDataForPR(repoName, pr);

      // Update the PR with JIRA data
      const updatedPR = {
        ...pr,
        jiraIssues: jiraData.jiraIssues,
        jiraReferences: jiraData.jiraReferences,
      };

      // Update both the selected PR and the PR in the list
      setSelectedPR(updatedPR);
      setPullRequests((prevPRs) =>
        prevPRs.map((p) => (p.id === pr.id ? updatedPR : p))
      );

      // Mark as attempted
      setJiraAttempted((prev) => new Set(prev).add(pr.number));

      console.log(
        `[JIRA] Successfully fetched ${jiraData.jiraIssues.length} JIRA issues for PR #${pr.number}`
      );

      // Always generate AI summary after JIRA data is fetched (with or without JIRA issues)
      // This ensures we get the most complete analysis possible
      if (!updatedPR.ai_summary && !isSummarizing) {
        console.log(
          "Generating AI summary with complete context for PR:",
          updatedPR.id
        );
        generatePRSummary(updatedPR);
      }
    } catch (error) {
      console.error(
        `[JIRA] Error fetching JIRA data for PR #${pr.number}:`,
        error
      );

      // Store the error but still mark as attempted
      setJiraErrors((prev) => ({
        ...prev,
        [pr.number]:
          error instanceof Error ? error.message : "Failed to fetch JIRA data",
      }));
      setJiraAttempted((prev) => new Set(prev).add(pr.number));
    } finally {
      setIsLoadingJira(false);
    }
  };

  // Generate JIRA issues summary with caching
  const generateJiraIssuesSummaryWithCache = async (
    issues: JiraIssue[]
  ): Promise<string> => {
    if (!issues || issues.length === 0) {
      return "No JIRA issues to analyze.";
    }

    // Create cache key based on issue keys
    const issueKeys = issues.map((issue) => issue.key).sort();

    // Ensure we have the current PR context
    const currentPR = selectedPR;
    if (!currentPR) {
      console.warn("[JIRA] No selected PR context for summary generation");
      return "No PR context available for JIRA analysis.";
    }

    console.log(
      `[JIRA] Generating summary for PR #${currentPR.number} with issues: ${issueKeys.join(", ")}`
    );

    // Check if we have a cached summary for this specific PR and issue combination
    const cachedSummary = jiraSummaryCache.getCachedSummary(
      issueKeys,
      currentPR.number,
      repoName
    );

    if (cachedSummary) {
      console.log(
        `[JIRA] Using cached summary for PR #${currentPR.number} with issues: ${issueKeys.join(", ")}`
      );
      return cachedSummary;
    }

    try {
      console.log(
        `[JIRA] Generating new summary for PR #${currentPR.number} with issues: ${issueKeys.join(", ")}`
      );
      const summary = await generateJiraIssuesSummary(issues, selectedModel);

      // Cache the summary with PR context
      jiraSummaryCache.cacheSummary(
        summary,
        issueKeys,
        currentPR.number,
        repoName
      );

      console.log(
        `[JIRA] Cached summary for PR #${currentPR.number} with issues: ${issueKeys.join(", ")}`
      );

      return summary;
    } catch (error) {
      console.error("Error generating JIRA summary:", error);
      return "Failed to generate JIRA analysis. Please try again.";
    }
  };

  // Cache-only function for checking JIRA summaries without API calls
  const checkJiraIssuesCachedSummary = (issues: JiraIssue[]): string | null => {
    if (!issues || issues.length === 0) {
      return null;
    }

    // Create cache key based on issue keys
    const issueKeys = issues.map((issue) => issue.key).sort();

    // Ensure we have the current PR context
    const currentPR = selectedPR;
    if (!currentPR) {
      return null;
    }

    // Check cache only - no API calls
    const cachedSummary = jiraSummaryCache.getCachedSummary(
      issueKeys,
      currentPR.number,
      repoName
    );

    if (cachedSummary) {
      console.log(
        `[JIRA] Cache hit for PR #${currentPR.number} with issues: ${issueKeys.join(", ")}`
      );
    }

    return cachedSummary;
  };

  // Handle PR selection with improved flow to prevent duplicate API calls
  const handlePRClick = async (pr: PullRequest) => {
    console.log("Selecting PR:", pr.id, "Current summary:", pr.ai_summary);

    // If the same PR is already selected and we're currently summarizing, don't interrupt
    if (selectedPR?.id === pr.id && isSummarizing) {
      console.log("Same PR already selected and summarizing, ignoring click");
      return;
    }

    // Cancel any ongoing summary requests for previous PRs
    cancelActiveSummaryRequest();

    // Get the latest version of the PR from pullRequests array
    const currentPR = pullRequests.find((p) => p.id === pr.id) || pr;
    console.log("Latest PR state:", currentPR.ai_summary);

    setSelectedPR(currentPR);
    setSelectedFile(null); // Reset file selection
    setPrFiles([]); // Clear previous PR's file data

    // Update current PR ID tracking
    currentPRIdRef.current = currentPR.id;

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

    // Check if we need to fetch JIRA data first
    const needsJiraData =
      !currentPR.jiraIssues &&
      !isLoadingJira &&
      !jiraAttempted.has(currentPR.number);

    if (needsJiraData) {
      console.log("Fetching JIRA data first for PR:", currentPR.id);
      // Set loading state immediately to prevent section from disappearing
      setIsLoadingJira(true);

      // Fetch JIRA data first, AI summary will be generated in the success callback
      await fetchJiraDataForSelectedPR(currentPR);
    } else {
      // JIRA data is already available or has been attempted, generate AI summary if needed
      if (!currentPR.ai_summary && !isSummarizing) {
        console.log("Starting summary generation for PR:", currentPR.id);
        generatePRSummary(currentPR);
      }

      // If JIRA issues exist, check if we have cached summary
      if (currentPR.jiraIssues && currentPR.jiraIssues.length > 0) {
        const issueKeys = currentPR.jiraIssues.map((issue) => issue.key).sort();
        const cachedSummary = jiraSummaryCache.getCachedSummary(
          issueKeys,
          currentPR.number,
          repoName
        );

        if (cachedSummary) {
          console.log(
            `[JIRA] Found cached summary for PR #${currentPR.number}`
          );
        }
      }
    }
  };

  // Handle file selection
  const handleFileClick = (file: PullRequestFile) => {
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

  // If a file is selected, show the file diff viewer
  if (selectedFile && selectedPR) {
    return (
      <FileDiffViewer
        file={selectedFile}
        repoName={repoName}
        prNumber={selectedPR.number}
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

      {/* Filter Tabs - Fixed */}
      <div className="flex-none px-4 py-2 border-b border-gray-800/50 bg-gray-950">
        <Tabs
          defaultValue="all"
          onValueChange={(value) =>
            setFilter(value as "all" | "open" | "closed")
          }
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content - Flexible Height with Two Independent Scroll Areas */}
      <div className="flex-1 flex flex-row min-h-0 h-[calc(100vh-140px)]">
        {/* PR List Sidebar - Independent Scroll Container */}
        <div className="w-1/3 min-w-[320px] max-w-[400px] border-r border-gray-800/50 bg-gray-950/50 flex flex-col h-full">
          {error ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
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
            </div>
          ) : isLoading ? (
            <div className="h-full flex flex-col justify-center items-center py-10 px-4">
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
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
              <GitPullRequest className="h-12 w-12 mb-2 text-gray-500" />
              <p>No pull requests found</p>
              <p className="text-sm">
                {filter === "all"
                  ? "This repository has no pull requests."
                  : `No ${filter} pull requests found.`}
              </p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="space-y-2 p-4">
                {pullRequests.map((pr) => (
                  <Card
                    key={pr.id}
                    className={`cursor-pointer border-gray-800 hover:bg-gray-900/80 transition-all ${
                      selectedPR?.id === pr.id
                        ? "border-blue-500 bg-gray-900/80"
                        : "bg-gray-900/50"
                    }`}
                    onClick={() => handlePRClick(pr)}
                  >
                    <CardHeader className="py-3 px-4">
                      <div className="flex justify-between items-start gap-2 w-full">
                        <CardTitle className="text-sm leading-tight line-clamp-2 flex-1">
                          {pr.title}
                        </CardTitle>
                        <div className="flex-shrink-0">
                          {getStatusBadge(pr.state)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>#{pr.number}</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeDate(pr.created_at)}</span>
                      </div>
                      {/* JIRA Issues Display */}
                      {pr.jiraIssues && pr.jiraIssues.length > 0 && (
                        <div className="mt-2">
                          <JiraIssuesDisplay jiraIssues={pr.jiraIssues} />
                        </div>
                      )}
                    </CardHeader>
                    <CardFooter className="pt-0 pb-3 px-4 flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={pr.user.avatar_url}
                          alt={pr.user.login}
                        />
                        <AvatarFallback>
                          {pr.user.login.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs truncate">{pr.user.login}</span>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PR Details Area - Fixed Height with Independent Scrolling */}
        <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
          {selectedPR ? (
            <div className="h-full flex flex-col overflow-hidden">
              {/* PR Header */}
              <div className="p-4 border-b border-gray-800/50 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {getStatusBadge(selectedPR.state)}
                  <span className="text-sm text-muted-foreground">
                    #{selectedPR.number}
                  </span>
                </div>
                <h1 className="text-xl font-semibold leading-tight break-words mb-2">
                  {selectedPR.title}
                </h1>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={selectedPR.user.avatar_url}
                      alt={selectedPR.user.login}
                    />
                    <AvatarFallback>
                      {selectedPR.user.login.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-400">
                    Opened by{" "}
                    <span className="font-semibold text-white">
                      {selectedPR.user.login}
                    </span>{" "}
                    on {new Date(selectedPR.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* PR Content */}
              <div className="flex-1 overflow-y-auto h-0 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <div className="p-4 space-y-4">
                  {/* AI Summary */}
                  <div>
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
                      summary={selectedPR.ai_summary}
                      isLoading={isSummarizing}
                    />
                  </div>

                  <Separator />

                  {/* Description */}
                  <div>
                    <h3 className="mb-2 font-semibold">Description</h3>
                    <div className="bg-gray-900/50 p-3 rounded-md max-h-40 overflow-y-auto">
                      <p className="text-sm whitespace-pre-line">
                        {selectedPR.body || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Enhanced JIRA Issues Section - Show loading state or content */}
                  {((selectedPR.jiraIssues &&
                    selectedPR.jiraIssues.length > 0) ||
                    isLoadingJira ||
                    jiraAttempted.has(selectedPR.number)) && (
                    <div>
                      {isLoadingJira ? (
                        <Card className="border-gray-800 bg-gray-900/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                              <span className="font-semibold text-gray-900 dark:text-slate-200">
                                Related JIRA Issues
                              </span>
                              <div className="flex items-center gap-2 ml-auto">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                <span className="text-sm text-gray-500">
                                  Loading...
                                </span>
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-center py-8">
                              <div className="flex items-center gap-3">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                <span className="text-gray-400">
                                  Analyzing JIRA issues...
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : selectedPR.jiraIssues &&
                        selectedPR.jiraIssues.length > 0 ? (
                        <ModernJiraIssuesView
                          key={`jira-${selectedPR.number}-${selectedPR.jiraIssues
                            .map((i) => i.key)
                            .sort()
                            .join(",")}`}
                          jiraIssues={selectedPR.jiraIssues}
                          onGenerateSummary={generateJiraIssuesSummaryWithCache}
                          onCheckCachedSummary={checkJiraIssuesCachedSummary}
                        />
                      ) : jiraAttempted.has(selectedPR.number) ? (
                        <Card className="border-gray-800 bg-gray-900/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <div className="w-1 h-6 bg-gray-600 rounded-full"></div>
                              <span className="font-semibold text-gray-900 dark:text-slate-200">
                                Related JIRA Issues
                              </span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-center py-6">
                              <div className="text-center">
                                {jiraErrors[selectedPR.number] ? (
                                  <>
                                    <p className="text-red-400 text-sm mb-2">
                                      {jiraErrors[selectedPR.number]}
                                    </p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Clear the error and attempt state, then retry
                                        setJiraErrors((prev) => ({
                                          ...prev,
                                          [selectedPR.number]: "",
                                        }));
                                        setJiraAttempted((prev) => {
                                          const newSet = new Set(prev);
                                          newSet.delete(selectedPR.number);
                                          return newSet;
                                        });
                                        fetchJiraDataForSelectedPR(selectedPR);
                                      }}
                                      className="text-xs"
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Retry
                                    </Button>
                                  </>
                                ) : (
                                  <p className="text-gray-500 text-sm">
                                    No JIRA issues found for this pull request.
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : null}
                    </div>
                  )}

                  {/* File Statistics */}
                  {selectedPR.additions !== undefined ||
                  selectedPR.deletions !== undefined ||
                  selectedPR.changed_files !== undefined ? (
                    <>
                      <Separator />
                      <div>
                        <h3 className="mb-3 font-semibold">Changes</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-gray-900/50 p-3 rounded-md">
                            <p className="text-xs text-muted-foreground mb-1">
                              Files Changed
                            </p>
                            <p className="text-lg font-semibold">
                              {selectedPR.changed_files || "?"}
                            </p>
                          </div>
                          <div className="bg-gray-900/50 p-3 rounded-md">
                            <p className="text-xs text-muted-foreground mb-1">
                              Additions
                            </p>
                            <p className="text-lg font-semibold text-green-500">
                              +{selectedPR.additions || "?"}
                            </p>
                          </div>
                          <div className="bg-gray-900/50 p-3 rounded-md">
                            <p className="text-xs text-muted-foreground mb-1">
                              Deletions
                            </p>
                            <p className="text-lg font-semibold text-red-500">
                              -{selectedPR.deletions || "?"}
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
                  {prFiles && prFiles.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="mb-3 font-semibold">Changed Files</h3>
                        <div className="space-y-2">
                          {prFiles
                            .filter(
                              (file, index, array) =>
                                array.findIndex(
                                  (f) =>
                                    f.filename === file.filename &&
                                    f.sha === file.sha
                                ) === index
                            )
                            .map((file, index) => (
                              <div
                                key={`${file.filename}-${file.sha}-${index}`}
                                className="rounded-md border border-gray-800 bg-gray-900/50 p-3 hover:bg-gray-900/70 cursor-pointer transition-colors"
                                onClick={() => handleFileClick(file)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                    <span className="text-sm truncate font-mono">
                                      {file.filename}
                                    </span>
                                    {file.status === "added" && (
                                      <Badge className="bg-green-700/40 text-green-400 text-xs">
                                        Added
                                      </Badge>
                                    )}
                                    {file.status === "removed" && (
                                      <Badge className="bg-red-700/40 text-red-400 text-xs">
                                        Deleted
                                      </Badge>
                                    )}
                                    {file.status === "modified" && (
                                      <Badge className="bg-blue-700/40 text-blue-400 text-xs">
                                        Modified
                                      </Badge>
                                    )}
                                    {file.status === "renamed" && (
                                      <Badge className="bg-purple-700/40 text-purple-400 text-xs">
                                        Renamed
                                      </Badge>
                                    )}
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
                  onClick={() => window.open(selectedPR.html_url, "_blank")}
                >
                  View on GitHub
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground h-full overflow-y-auto">
              <div className="text-center">
                <GitPullRequest className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p className="text-lg">Select a Pull Request</p>
                <p className="text-sm">
                  Choose a pull request from the list to view its details.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
