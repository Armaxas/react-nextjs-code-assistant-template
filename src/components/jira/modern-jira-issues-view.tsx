import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { type JiraIssue } from "@/services/jira-service";
import {
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { JiraIssueDetailsModal } from "./jira-issue-details-modal";
import { formatDistanceToNow } from "date-fns";
import { AISummary } from "@/components/ui/ai-summary";

interface ModernJiraIssuesViewProps {
  jiraIssues: JiraIssue[];
  onGenerateSummary?: (issues: JiraIssue[]) => Promise<string>;
  onCheckCachedSummary?: (issues: JiraIssue[]) => string | null; // Cache-only check without API calls
  className?: string;
  autoGenerateSummary?: boolean; // Controls whether to auto-generate summary when issues are available
}

export function ModernJiraIssuesView({
  jiraIssues,
  onGenerateSummary,
  onCheckCachedSummary,
  className = "",
  autoGenerateSummary = false, // eslint-disable-line @typescript-eslint/no-unused-vars
}: ModernJiraIssuesViewProps) {
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] =
    useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedIssue, setSelectedIssue] = useState<JiraIssue | undefined>(
    undefined
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [lastAnalyzedIssueKeys, setLastAnalyzedIssueKeys] =
    useState<string>("");

  const jiraBaseUrl =
    process.env.NEXT_PUBLIC_JIRA_BASE_URL || "https://jira.company.com";

  // Create a stable cache key from issue keys
  const currentIssueKeys = jiraIssues
    .map((issue) => issue.key)
    .sort()
    .join(",");

  // Reset component state when JIRA issues change (different PR context)
  useEffect(() => {
    if (currentIssueKeys !== lastAnalyzedIssueKeys) {
      console.log(
        "[ModernJiraIssuesView] JIRA issues changed, resetting state",
        { currentIssueKeys, lastAnalyzedIssueKeys }
      );
      setAiSummary("");
      setIsGeneratingSummary(false);
      setLastAnalyzedIssueKeys("");
    }
  }, [currentIssueKeys, lastAnalyzedIssueKeys]);

  // Check for cached summary when component mounts or issues change
  useEffect(() => {
    const checkCachedSummary = async () => {
      if (!onCheckCachedSummary || jiraIssues.length === 0) return;

      // Don't check cache if we already have a summary for these issues
      if (aiSummary && lastAnalyzedIssueKeys === currentIssueKeys) return;

      try {
        console.log(
          "[ModernJiraIssuesView] Checking for cached summary for issues:",
          currentIssueKeys
        );

        // Call the cache-only function to avoid unwanted API calls
        const summary = onCheckCachedSummary(jiraIssues);

        if (
          summary &&
          summary.trim() &&
          summary !== "No JIRA issues to analyze."
        ) {
          console.log(
            "[ModernJiraIssuesView] Found cached summary for issues:",
            currentIssueKeys
          );
          setAiSummary(summary);
          setLastAnalyzedIssueKeys(currentIssueKeys);
        }
      } catch (error) {
        console.warn(
          "[ModernJiraIssuesView] Error checking cached summary:",
          error
        );
        // Don't set error state here since this is just a cache check
      }
    };

    // Only check cache if we don't have a summary and aren't currently generating one
    if (
      !aiSummary &&
      !isGeneratingSummary &&
      currentIssueKeys &&
      jiraIssues.length > 0
    ) {
      // Add a small delay to avoid race conditions with component mounting
      const timeoutId = setTimeout(checkCachedSummary, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [
    currentIssueKeys,
    onCheckCachedSummary,
    jiraIssues,
    aiSummary,
    isGeneratingSummary,
    lastAnalyzedIssueKeys,
  ]);

  const generateSummary = useCallback(async () => {
    if (!onGenerateSummary || jiraIssues.length === 0) return;

    // Don't regenerate if we already have a summary for these exact issues
    if (aiSummary && lastAnalyzedIssueKeys === currentIssueKeys) {
      console.log(
        "[ModernJiraIssuesView] Summary already exists for these issues, skipping"
      );
      return;
    }

    setIsGeneratingSummary(true);
    try {
      console.log(
        "[ModernJiraIssuesView] Generating summary for issues:",
        currentIssueKeys
      );
      const summary = await onGenerateSummary(jiraIssues);
      setAiSummary(summary);
      setLastAnalyzedIssueKeys(currentIssueKeys);
      console.log("[ModernJiraIssuesView] Successfully generated summary");
    } catch (error) {
      console.error("Error generating JIRA issues summary:", error);
      setAiSummary("Failed to generate summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [
    onGenerateSummary,
    jiraIssues,
    aiSummary,
    lastAnalyzedIssueKeys,
    currentIssueKeys,
  ]);

  // Note: Auto-generation removed to prevent duplicate API calls.
  // Summary generation is now controlled by the parent component.

  const handleRefreshSummary = useCallback(() => {
    // Force regeneration by clearing the cache tracking
    setLastAnalyzedIssueKeys("");
    setAiSummary("");
    generateSummary();
  }, [generateSummary]);

  const handleIssueClick = (issue: JiraIssue) => {
    setSelectedIssue(issue);
    setIsDetailsModalOpen(true);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // No issues to display
  if (!jiraIssues || jiraIssues.length === 0) {
    return null;
  }

  // Get issues to display based on expanded state
  const displayIssues = isExpanded ? jiraIssues : jiraIssues.slice(0, 4);
  const hasMoreIssues = jiraIssues.length > 4;

  // Get status icon
  const getStatusIcon = (statusCategory: string) => {
    switch (statusCategory) {
      case "done":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "indeterminate":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "new":
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "highest":
      case "critical":
        return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700";
      case "low":
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700";
      case "lowest":
        return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700";
    }
  };

  return (
    <>
      <Card
        className={`h-full border-gray-800 bg-gray-900/50 flex flex-col overflow-hidden w-full ${className}`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              <span className="font-semibold text-gray-900 dark:text-slate-200">
                Related JIRA Issues
              </span>
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
              >
                {jiraIssues.length}
              </Badge>
            </div>
            {onGenerateSummary && (
              <div className="flex gap-2">
                {!aiSummary && !isGeneratingSummary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSummary}
                    className="hover:bg-blue-50 dark:hover:bg-slate-600/70"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Issues
                  </Button>
                )}
                {aiSummary && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshSummary}
                    disabled={isGeneratingSummary}
                    className="hover:bg-blue-50 dark:hover:bg-slate-600/70"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isGeneratingSummary ? "animate-spin" : ""}`}
                    />
                    Refresh Analysis
                  </Button>
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* AI-generated summary */}
          {onGenerateSummary && (
            <div className="relative">
              {isGeneratingSummary ? (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-700">
                  <div className="flex items-center justify-center space-x-3">
                    <Spinner className="text-blue-600 dark:text-blue-400" />
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                        Generating AI analysis...
                      </span>
                    </div>
                  </div>
                </div>
              ) : aiSummary ? (
                <div className="bg-gray-900/50 rounded-md">
                  <div className="flex items-center mb-3">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                        AI Analysis Summary
                      </span>
                    </div>
                  </div>
                  <AISummary
                    summary={aiSummary}
                    isLoading={isGeneratingSummary}
                    variant="compact"
                  />
                </div>
              ) : null}
            </div>
          )}

          {/* Issues Grid */}
          <div className="grid gap-3">
            {displayIssues.map((issue) => (
              <div
                key={issue.key}
                className="rounded-md border border-gray-800 bg-gray-900/70 p-2 overflow-hidden"
                onClick={() => handleIssueClick(issue)}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      {issue.issuetype?.iconUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={issue.issuetype.iconUrl}
                          alt={issue.issuetype.name}
                          className="w-4 h-4"
                        />
                      )}
                      {getStatusIcon(issue.status.statusCategory.key)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-blue-600 text-sm dark:text-blue-400">
                          {issue.key}
                        </span>
                        <span className="text-gray-400 dark:text-slate-500">
                          •
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            issue.status.statusCategory.key === "done"
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
                              : issue.status.statusCategory.key === "new"
                                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
                                : issue.status.statusCategory.key ===
                                    "indeterminate"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700"
                                  : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                          }`}
                        >
                          {issue.status.name}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 dark:text-slate-200">
                        {issue.summary}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleIssueClick(issue);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `${jiraBaseUrl}/browse/${issue.key}`,
                          "_blank"
                        );
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                  <div className="flex items-center space-x-4">
                    {issue.priority && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${getPriorityColor(issue.priority.name)}`}
                      >
                        {issue.priority.name}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-xs bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                    >
                      {issue.issuetype.name}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-3">
                    {issue.assignee && (
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{issue.assignee.displayName}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(issue.updated), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Show more/less button */}
            {hasMoreIssues && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full border border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-colors dark:border-slate-600 dark:hover:border-blue-600 dark:hover:bg-slate-700/50"
                onClick={toggleExpand}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show {jiraIssues.length - 4} More Issues
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <JiraIssueDetailsModal
        issue={selectedIssue}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </>
  );
}
