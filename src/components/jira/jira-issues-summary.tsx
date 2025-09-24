import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { type JiraIssue } from "@/services/jira-service";
import { ExternalLink, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { JiraIssueDetailsModal } from "./jira-issue-details-modal";
import { Markdown } from "@/components/markdown";

interface JiraIssuesSummaryProps {
  jiraIssues: JiraIssue[];
  onGenerateSummary?: (issues: JiraIssue[]) => Promise<string>;
}

export function JiraIssuesSummary({
  jiraIssues,
  onGenerateSummary,
}: JiraIssuesSummaryProps) {
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] =
    useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedIssue, setSelectedIssue] = useState<JiraIssue | undefined>(
    undefined
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  const jiraBaseUrl =
    process.env.NEXT_PUBLIC_JIRA_BASE_URL || "https://jira.company.com";

  const generateSummary = useCallback(async () => {
    if (!onGenerateSummary || jiraIssues.length === 0) return;

    setIsGeneratingSummary(true);
    try {
      const summary = await onGenerateSummary(jiraIssues);
      setAiSummary(summary);
    } catch (error) {
      console.error("Error generating JIRA issues summary:", error);
      setAiSummary("Failed to generate summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [onGenerateSummary, jiraIssues]);

  useEffect(() => {
    // Auto-generate summary if there are issues and the callback is provided
    if (
      jiraIssues.length > 0 &&
      onGenerateSummary &&
      !aiSummary &&
      !isGeneratingSummary
    ) {
      generateSummary();
    }
  }, [
    jiraIssues,
    onGenerateSummary,
    aiSummary,
    isGeneratingSummary,
    generateSummary,
  ]);

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
  const displayIssues = isExpanded ? jiraIssues : jiraIssues.slice(0, 3);
  const hasMoreIssues = jiraIssues.length > 3;

  return (
    <>
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-md flex items-center justify-between">
            <span>Related JIRA Issues ({jiraIssues.length})</span>
            {onGenerateSummary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={generateSummary}
                disabled={isGeneratingSummary}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${isGeneratingSummary ? "animate-spin" : ""}`}
                />
                Refresh Summary
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* AI-generated summary */}
          {onGenerateSummary && (
            <div className="mb-4">
              {isGeneratingSummary ? (
                <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 rounded-xl border border-blue-200 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 dark:border-blue-700">
                  <div className="flex items-center gap-2 justify-center">
                    <Spinner className="text-blue-500 dark:text-blue-400" />
                    <span className="text-sm text-gray-600 dark:text-slate-300">
                      Generating AI summary...
                    </span>
                  </div>
                </div>
              ) : aiSummary ? (
                <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center mb-3">
                    <div className="p-1 bg-white dark:bg-slate-800 rounded-full shadow-sm mr-2">
                      <svg
                        className="h-4 w-4 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      AI Analysis Summary
                    </span>
                  </div>
                  <div className="bg-white/70 p-4 rounded-lg border border-white/50 dark:bg-slate-800/70 dark:border-slate-700/50">
                    <Markdown>{aiSummary}</Markdown>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* List of issues */}
          <div className="space-y-2">
            {displayIssues.map((issue) => (
              <div
                key={issue.key}
                className="p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => handleIssueClick(issue)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {issue.issuetype?.iconUrl && (
                      <Image
                        src={issue.issuetype.iconUrl}
                        alt={issue.issuetype.name}
                        width={16}
                        height={16}
                        className="w-4 h-4"
                      />
                    )}
                    <span className="font-medium">
                      {issue.key}: {issue.summary}
                    </span>
                  </div>
                  <a
                    href={`${jiraBaseUrl}/browse/${issue.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      issue.status.statusCategory.key === "done"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : issue.status.statusCategory.key === "new"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : issue.status.statusCategory.key === "indeterminate"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                            : "bg-gray-100 text-gray-800 border-gray-300"
                    }`}
                  >
                    {issue.status.name}
                  </Badge>
                  {issue.priority && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-purple-100 text-purple-800 border-purple-300"
                    >
                      {issue.priority.name}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-100 text-gray-800 border-gray-300"
                  >
                    {issue.issuetype.name}
                  </Badge>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  {issue.assignee && (
                    <span className="mr-3">
                      Assignee: {issue.assignee.displayName}
                    </span>
                  )}
                  <span>
                    Updated: {new Date(issue.updated).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}

            {/* Show more/less button */}
            {hasMoreIssues && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-gray-500"
                onClick={toggleExpand}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show {jiraIssues.length - 3} More
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
