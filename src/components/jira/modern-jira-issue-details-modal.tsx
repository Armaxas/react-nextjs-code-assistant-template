import React, { useState, useEffect, useCallback } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Dialog,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  Users,
  ListTodo,
  Tag,
  Layers,
  Bookmark,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  FileText,
  Settings,
} from "lucide-react";
import { type JiraIssue } from "@/services/jira-service";
import { generateSingleJiraIssueSummary } from "@/services/jira-ai-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Spinner } from "@/components/ui/spinner";

interface ModernJiraIssueDetailsModalProps {
  issue?: JiraIssue;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  aiSummary?: string;
}

export function ModernJiraIssueDetailsModal({
  issue,
  isOpen,
  onClose,
  isLoading = false,
  aiSummary: initialAiSummary,
}: ModernJiraIssueDetailsModalProps) {
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | undefined>(
    initialAiSummary
  );
  const [aiError, setAiError] = useState<string | null>(null);

  const jiraBaseUrl =
    process.env.NEXT_PUBLIC_JIRA_BASE_URL || "https://jira.company.com";

  const generateAiSummary = useCallback(async () => {
    if (!issue) return;

    setIsGeneratingAiSummary(true);
    setAiError(null);

    try {
      const summary = await generateSingleJiraIssueSummary(issue);

      // Check if the response indicates an error
      if (
        summary.startsWith("Error:") ||
        summary.includes("Failed to generate")
      ) {
        setAiError(summary);
        setAiSummary(undefined);
      } else {
        setAiSummary(summary);
      }
    } catch (error) {
      console.error("Error generating JIRA issue AI summary:", error);
      setAiError(
        error instanceof Error
          ? error.message
          : "Failed to generate AI summary. Please try again."
      );
    } finally {
      setIsGeneratingAiSummary(false);
    }
  }, [issue]);

  // Generate AI summary for this specific issue if not provided
  useEffect(() => {
    if (issue && !aiSummary && !isGeneratingAiSummary) {
      generateAiSummary();
    }
  }, [issue, aiSummary, generateAiSummary, isGeneratingAiSummary]);

  // Update aiSummary when initialAiSummary changes
  useEffect(() => {
    setAiSummary(initialAiSummary);
  }, [initialAiSummary]);

  const openInJira = () => {
    if (issue) {
      window.open(`${jiraBaseUrl}/browse/${issue.key}`, "_blank");
    }
  };

  // Get status icon
  const getStatusIcon = (statusCategory: string) => {
    switch (statusCategory) {
      case "done":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "indeterminate":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "new":
        return <AlertTriangle className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
        {isLoading || !issue ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {issue.issuetype?.iconUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={issue.issuetype.iconUrl}
                      alt={issue.issuetype.name}
                      className="w-6 h-6"
                    />
                  )}
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(issue.status.statusCategory.key)}
                    <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-slate-200">
                      {issue.key}
                    </DialogTitle>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openInJira}
                  className="shrink-0"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in JIRA
                </Button>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg text-gray-800 leading-tight dark:text-slate-200">
                  {issue.summary}
                </h2>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={`${
                      issue.status.statusCategory.key === "done"
                        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
                        : issue.status.statusCategory.key === "new"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
                          : issue.status.statusCategory.key === "indeterminate"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700"
                            : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                    }`}
                  >
                    {issue.status.name}
                  </Badge>
                  {issue.priority && (
                    <Badge
                      variant="outline"
                      className={getPriorityColor(issue.priority.name)}
                    >
                      {issue.priority.name} Priority
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                  >
                    {issue.issuetype.name}
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger
                  value="overview"
                  className="flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Details</span>
                </TabsTrigger>
                <TabsTrigger
                  value="ai-analysis"
                  className="flex items-center space-x-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>AI Analysis</span>
                  {isGeneratingAiSummary && <Spinner className="h-3 w-3" />}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Key Information Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-l-4 border-l-blue-500 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="dark:text-slate-200">People</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-slate-400">
                          Assignee
                        </span>
                        <span className="text-sm font-medium dark:text-slate-200">
                          {issue.assignee?.displayName || "Unassigned"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-slate-400">
                          Reporter
                        </span>
                        <span className="text-sm font-medium dark:text-slate-200">
                          {issue.reporter?.displayName || "Unknown"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center space-x-2">
                        <CalendarDays className="h-4 w-4 text-green-600" />
                        <span className="dark:text-slate-200">Timeline</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-slate-400">
                          Created
                        </span>
                        <span className="text-sm font-medium dark:text-slate-200">
                          {formatDistanceToNow(new Date(issue.created), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-slate-400">
                          Updated
                        </span>
                        <span className="text-sm font-medium dark:text-slate-200">
                          {formatDistanceToNow(new Date(issue.updated), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      {issue.resolutiondate && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-slate-400">
                            Resolved
                          </span>
                          <span className="text-sm font-medium dark:text-slate-200">
                            {formatDistanceToNow(
                              new Date(issue.resolutiondate),
                              { addSuffix: true }
                            )}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Description */}
                {issue.description && (
                  <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                        <span className="dark:text-slate-200">Description</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap dark:bg-slate-900/50 dark:text-slate-300">
                        {issue.description}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                        <span className="dark:text-slate-200">
                          Project Information
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-slate-400">
                          Project
                        </span>
                        <span className="text-sm font-medium dark:text-slate-200">
                          {issue.project.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-slate-400">
                          Key
                        </span>
                        <span className="text-sm font-medium font-mono dark:text-slate-200">
                          {issue.project.key}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                        <span className="dark:text-slate-200">Labels</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {issue.labels && issue.labels.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {issue.labels.map((label) => (
                            <Badge
                              key={label}
                              variant="secondary"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
                            >
                              {label}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-slate-400">
                          No labels assigned
                        </span>
                      )}
                    </CardContent>
                  </Card>

                  {issue.components && issue.components.length > 0 && (
                    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center space-x-2">
                          <ListTodo className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                          <span className="dark:text-slate-200">
                            Components
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {issue.components.map((comp) => (
                            <Badge
                              key={comp.name}
                              variant="outline"
                              className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700"
                            >
                              {comp.name}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {issue.fixVersions && issue.fixVersions.length > 0 && (
                    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center space-x-2">
                          <Bookmark className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                          <span className="dark:text-slate-200">
                            Fix Versions
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {issue.fixVersions.map((version) => (
                            <Badge
                              key={version.name}
                              variant="outline"
                              className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
                            >
                              {version.name}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ai-analysis" className="space-y-6 mt-6">
                {isGeneratingAiSummary ? (
                  <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="flex items-center space-x-3">
                          <Spinner className="text-purple-600 dark:text-purple-400" />
                          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-gray-600 dark:text-slate-300 font-medium">
                          Generating AI analysis...
                        </p>
                        <p className="text-sm text-gray-500 dark:text-slate-400 text-center max-w-md">
                          Our AI is analyzing the issue details, status, and
                          context to provide insights.
                        </p>
                        <div className="w-full max-w-md space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-5/6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : aiError ? (
                  <Card className="border-red-200 dark:border-red-700 bg-white dark:bg-slate-800">
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">
                            Error generating AI analysis
                          </h4>
                          <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                            {aiError}
                          </p>
                          <Button
                            size="sm"
                            onClick={generateAiSummary}
                            className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 dark:border-red-700"
                            variant="outline"
                          >
                            <RefreshCw className="h-3 w-3 mr-2" />
                            Try Again
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : aiSummary ? (
                  <Card className="border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center space-x-2">
                          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="dark:text-slate-200">
                            AI Analysis & Insights
                          </span>
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={generateAiSummary}
                          className="h-8 px-3"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Refresh
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 dark:from-purple-900/20 dark:to-blue-900/20">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-slate-300">
                          {aiSummary}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                    <CardContent className="pt-6">
                      <div className="text-center py-8 space-y-4">
                        <Sparkles className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto" />
                        <div>
                          <p className="text-gray-600 dark:text-slate-300 font-medium mb-2">
                            No AI analysis available
                          </p>
                          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                            Generate an AI-powered analysis of this JIRA issue
                            to get insights and recommendations.
                          </p>
                        </div>
                        <Button
                          onClick={generateAiSummary}
                          className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate AI Analysis
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
              <Button
                variant="outline"
                onClick={onClose}
                className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Close
              </Button>
              <Button
                onClick={openInJira}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in JIRA
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
