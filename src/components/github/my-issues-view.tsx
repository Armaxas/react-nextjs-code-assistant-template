"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  ExternalLink,
  Sparkles,
  BarChart3,
  PieChart,
  Target,
  MessageSquare,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchUserRepositories } from "@/actions/github-actions";

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  assignee?: {
    login: string;
    avatar_url: string;
  } | null;
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  labels: Array<{
    name: string;
    color: string;
    description?: string;
  }>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
  comments: number;
  repository?: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    language?: string;
  };
}

interface IssueAnalytics {
  total_issues: number;
  open_issues: number;
  closed_issues: number;
  avg_resolution_time: number;
  response_rate: number;
  most_common_labels: Array<{ name: string; count: number; color: string }>;
  issue_types_distribution: { [key: string]: number };
  priority_distribution: { [key: string]: number };
  activity_trend: Array<{ date: string; count: number }>;
  collaboration_metrics: {
    avg_comments_per_issue: number;
    issues_with_assignees: number;
    self_assigned_issues: number;
  };
  productivity_score: number;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  language?: string;
  html_url: string;
}

export function MyIssuesView({
  onAskQuestion,
}: {
  onAskQuestion?: (question: string) => void;
}) {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [analytics, setAnalytics] = useState<IssueAnalytics | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRepo, setSelectedRepo] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<"all" | "open" | "closed">(
    "all"
  );
  const [selectedLabel, setSelectedLabel] = useState<string>("all");

  // Helper functions for analytics
  const calculateAverageResolutionTime = (issueData: GitHubIssue[]): number => {
    const closedIssues = issueData.filter(
      (issue) => issue.closed_at && issue.created_at
    );
    if (closedIssues.length === 0) return 0;

    const totalTime = closedIssues.reduce((sum, issue) => {
      const created = new Date(issue.created_at).getTime();
      const closed = new Date(issue.closed_at!).getTime();
      return sum + (closed - created);
    }, 0);

    return Math.round(totalTime / closedIssues.length / (1000 * 60 * 60 * 24)); // Convert to days
  };

  const calculateResponseRate = (issueData: GitHubIssue[]): number => {
    const issuesWithComments = issueData.filter(
      (issue) => issue.comments > 0
    ).length;
    return issueData.length > 0
      ? Math.round((issuesWithComments / issueData.length) * 100)
      : 0;
  };

  const getMostCommonLabels = (
    issueData: GitHubIssue[]
  ): Array<{ name: string; count: number; color: string }> => {
    const labelCount: { [key: string]: { count: number; color: string } } = {};

    issueData.forEach((issue) => {
      issue.labels.forEach((label) => {
        if (labelCount[label.name]) {
          labelCount[label.name].count++;
        } else {
          labelCount[label.name] = { count: 1, color: label.color };
        }
      });
    });

    return Object.entries(labelCount)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([name, data]) => ({ name, count: data.count, color: data.color }));
  };

  const getIssueTypesDistribution = (
    issueData: GitHubIssue[]
  ): { [key: string]: number } => {
    const types: { [key: string]: number } = {
      bug: 0,
      feature: 0,
      enhancement: 0,
      documentation: 0,
      question: 0,
      other: 0,
    };

    issueData.forEach((issue) => {
      const labels = issue.labels.map((l) => l.name.toLowerCase());
      if (labels.some((l) => l.includes("bug") || l.includes("error"))) {
        types.bug++;
      } else if (
        labels.some((l) => l.includes("feature") || l.includes("new"))
      ) {
        types.feature++;
      } else if (
        labels.some(
          (l) => l.includes("enhancement") || l.includes("improvement")
        )
      ) {
        types.enhancement++;
      } else if (
        labels.some((l) => l.includes("doc") || l.includes("readme"))
      ) {
        types.documentation++;
      } else if (
        labels.some((l) => l.includes("question") || l.includes("help"))
      ) {
        types.question++;
      } else {
        types.other++;
      }
    });

    return types;
  };

  const getPriorityDistribution = (
    issueData: GitHubIssue[]
  ): { [key: string]: number } => {
    const priorities: { [key: string]: number } = {
      high: 0,
      medium: 0,
      low: 0,
      unknown: 0,
    };

    issueData.forEach((issue) => {
      const labels = issue.labels.map((l) => l.name.toLowerCase());
      if (
        labels.some(
          (l) =>
            l.includes("high") || l.includes("urgent") || l.includes("critical")
        )
      ) {
        priorities.high++;
      } else if (
        labels.some((l) => l.includes("medium") || l.includes("normal"))
      ) {
        priorities.medium++;
      } else if (labels.some((l) => l.includes("low") || l.includes("minor"))) {
        priorities.low++;
      } else {
        priorities.unknown++;
      }
    });

    return priorities;
  };

  const getActivityTrend = (
    issueData: GitHubIssue[]
  ): Array<{ date: string; count: number }> => {
    const last30Days: { [key: string]: number } = {};
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      last30Days[dateStr] = 0;
    }

    issueData.forEach((issue) => {
      const createdDate = new Date(issue.created_at)
        .toISOString()
        .split("T")[0];
      if (last30Days.hasOwnProperty(createdDate)) {
        last30Days[createdDate]++;
      }
    });

    return Object.entries(last30Days).map(([date, count]) => ({ date, count }));
  };

  const calculateProductivityScore = (issueData: GitHubIssue[]): number => {
    const closedIssues = issueData.filter(
      (issue) => issue.state === "closed"
    ).length;
    const totalIssues = issueData.length;
    const recentActivity = issueData.filter((issue) => {
      const updated = new Date(issue.updated_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return updated > sevenDaysAgo;
    }).length;

    const completionRate =
      totalIssues > 0 ? (closedIssues / totalIssues) * 50 : 0;
    const activityScore = Math.min(recentActivity * 10, 50);

    return Math.round(completionRate + activityScore);
  };

  const generateAnalytics = useCallback(async (issueData: GitHubIssue[]) => {
    try {
      const analytics: IssueAnalytics = {
        total_issues: issueData.length,
        open_issues: issueData.filter((issue) => issue.state === "open").length,
        closed_issues: issueData.filter((issue) => issue.state === "closed")
          .length,
        avg_resolution_time: calculateAverageResolutionTime(issueData),
        response_rate: calculateResponseRate(issueData),
        most_common_labels: getMostCommonLabels(issueData),
        issue_types_distribution: getIssueTypesDistribution(issueData),
        priority_distribution: getPriorityDistribution(issueData),
        activity_trend: getActivityTrend(issueData),
        collaboration_metrics: {
          avg_comments_per_issue:
            issueData.reduce((sum, issue) => sum + issue.comments, 0) /
            issueData.length,
          issues_with_assignees: issueData.filter(
            (issue) => issue.assignees.length > 0
          ).length,
          self_assigned_issues: issueData.filter(
            (issue) => issue.assignee?.login === issue.user.login
          ).length,
        },
        productivity_score: calculateProductivityScore(issueData),
      };

      setAnalytics(analytics);
    } catch (error) {
      console.error("Error generating analytics:", error);
    }
  }, []);

  const fetchIssueData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch repositories first
      const repos = await fetchUserRepositories();
      // Convert GitHubRepo to Repository type
      const convertedRepos: Repository[] = repos.map((repo) => ({
        ...repo,
        description: repo.description ?? undefined,
        language: "Unknown",
        visibility: "public", // Default visibility
        updated_at: new Date().toISOString(),
        private: false,
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
      }));
      setRepositories(convertedRepos);

      // Fetch issues across repositories
      const allIssues: GitHubIssue[] = [];
      const reposToFetch =
        selectedRepo === "all"
          ? repos.slice(0, 10)
          : repos.filter((r) => r.full_name === selectedRepo);

      for (const repo of reposToFetch) {
        try {
          const response = await fetch(
            `/api/github/issues?org=${repo.full_name.split("/")[0]}&repo=${repo.name}&state=${selectedState === "all" ? "all" : selectedState}&per_page=100`
          );
          if (response.ok) {
            const data = await response.json();
            const repoIssues = data.issues.map((issue: GitHubIssue) => ({
              ...issue,
              repository: {
                id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                html_url: repo.html_url,
                language: "Unknown",
              },
            }));
            allIssues.push(...repoIssues);
          }
        } catch (error) {
          console.error(`Error fetching issues for ${repo.name}:`, error);
        }
      }

      // Filter by label if selected
      const filteredIssues =
        selectedLabel === "all"
          ? allIssues
          : allIssues.filter((issue) =>
              issue.labels.some((label) => label.name === selectedLabel)
            );

      setIssues(filteredIssues);
      await generateAnalytics(filteredIssues);
    } catch (error) {
      console.error("Error fetching issue data:", error);
      setError("Failed to fetch issue data");
    } finally {
      setLoading(false);
    }
  }, [selectedRepo, selectedState, selectedLabel, generateAnalytics]);

  useEffect(() => {
    fetchIssueData();
  }, [fetchIssueData]);

  // Get unique labels for filter
  const uniqueLabels = useMemo(() => {
    const labels = new Set<string>();
    issues.forEach((issue) => {
      issue.labels.forEach((label) => labels.add(label.name));
    });
    return Array.from(labels).sort();
  }, [issues]);

  // Filtered issues based on current selections
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (
        selectedRepo !== "all" &&
        issue.repository?.full_name !== selectedRepo
      )
        return false;
      if (selectedState !== "all" && issue.state !== selectedState)
        return false;
      if (
        selectedLabel !== "all" &&
        !issue.labels.some((label) => label.name === selectedLabel)
      )
        return false;
      return true;
    });
  }, [issues, selectedRepo, selectedState, selectedLabel]);

  const getStateColor = (state: string) => {
    return state === "open"
      ? "bg-green-900/30 text-green-300 border-green-700/50"
      : "bg-purple-900/30 text-purple-300 border-purple-700/50";
  };

  const getStateIcon = (state: string) => {
    return state === "open" ? (
      <AlertCircle className="h-3 w-3" />
    ) : (
      <CheckCircle className="h-3 w-3" />
    );
  };

  const getPriorityColor = (labels: Array<{ name: string; color: string }>) => {
    const labelNames = labels.map((l) => l.name.toLowerCase());
    if (
      labelNames.some(
        (l) =>
          l.includes("high") || l.includes("urgent") || l.includes("critical")
      )
    ) {
      return "text-red-400";
    } else if (labelNames.some((l) => l.includes("medium"))) {
      return "text-yellow-400";
    } else if (labelNames.some((l) => l.includes("low"))) {
      return "text-green-400";
    }
    return "text-gray-400";
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Error Loading Data
        </h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <Button onClick={fetchIssueData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">My Issues</h2>
              <p className="text-sm text-gray-400">
                Track and analyze your issue management patterns
              </p>
            </div>
          </div>
          <Button
            onClick={() =>
              onAskQuestion?.(
                "Analyze my issue patterns and suggest workflow improvements"
              )
            }
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Insights
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white text-sm"
          >
            <option value="all">All Repositories</option>
            {repositories.map((repo) => (
              <option key={repo.id} value={repo.full_name}>
                {repo.name}
              </option>
            ))}
          </select>
          <select
            value={selectedState}
            onChange={(e) =>
              setSelectedState(e.target.value as "all" | "open" | "closed")
            }
            className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white text-sm"
          >
            <option value="all">All States</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={selectedLabel}
            onChange={(e) => setSelectedLabel(e.target.value)}
            className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white text-sm"
          >
            <option value="all">All Labels</option>
            {uniqueLabels.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <TabsList className="mx-6 mt-4 grid w-full max-w-md grid-cols-3 bg-gray-900/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="list">Issue List</TabsTrigger>
          </TabsList>

          <div className="flex-1 p-6 overflow-auto">
            <TabsContent value="overview" className="space-y-6">
              {analytics && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">
                              Total Issues
                            </p>
                            <p className="text-2xl font-bold text-white">
                              {analytics.total_issues}
                            </p>
                          </div>
                          <AlertCircle className="h-8 w-8 text-orange-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">
                              Resolution Rate
                            </p>
                            <p className="text-2xl font-bold text-green-400">
                              {analytics.total_issues > 0
                                ? Math.round(
                                    (analytics.closed_issues /
                                      analytics.total_issues) *
                                      100
                                  )
                                : 0}
                              %
                            </p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-green-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">
                              Avg Resolution
                            </p>
                            <p className="text-2xl font-bold text-purple-400">
                              {analytics.avg_resolution_time}d
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-purple-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">
                              Productivity
                            </p>
                            <p className="text-2xl font-bold text-blue-400">
                              {analytics.productivity_score}
                            </p>
                          </div>
                          <Target className="h-8 w-8 text-blue-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts and Insights */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <Tag className="h-5 w-5" />
                          Most Common Labels
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analytics.most_common_labels
                            .slice(0, 5)
                            .map((label) => (
                              <div
                                key={label.name}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                      backgroundColor: `#${label.color}`,
                                    }}
                                  />
                                  <span className="text-gray-300 text-sm">
                                    {label.name}
                                  </span>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className="bg-gray-800 text-gray-300"
                                >
                                  {label.count}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <PieChart className="h-5 w-5" />
                          Issue Types
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(
                            analytics.issue_types_distribution
                          ).map(([type, count]) => (
                            <div
                              key={type}
                              className="flex items-center justify-between"
                            >
                              <span className="text-gray-300 capitalize">
                                {type}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-blue-400 h-2 rounded-full"
                                    style={{
                                      width: `${(count / analytics.total_issues) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm text-gray-400 w-8">
                                  {count}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <Users className="h-5 w-5" />
                          Collaboration Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">
                                Avg Comments/Issue
                              </span>
                              <span className="text-white">
                                {Math.round(
                                  analytics.collaboration_metrics
                                    .avg_comments_per_issue
                                )}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">
                                Issues with Assignees
                              </span>
                              <span className="text-blue-400">
                                {
                                  analytics.collaboration_metrics
                                    .issues_with_assignees
                                }
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">
                                Self-assigned
                              </span>
                              <span className="text-purple-400">
                                {
                                  analytics.collaboration_metrics
                                    .self_assigned_issues
                                }
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">
                                Response Rate
                              </span>
                              <span className="text-green-400">
                                {analytics.response_rate}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <BarChart3 className="h-5 w-5" />
                          Priority Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(analytics.priority_distribution).map(
                            ([priority, count]) => (
                              <div
                                key={priority}
                                className="flex items-center justify-between"
                              >
                                <span
                                  className={`capitalize ${
                                    priority === "high"
                                      ? "text-red-300"
                                      : priority === "medium"
                                        ? "text-yellow-300"
                                        : priority === "low"
                                          ? "text-green-300"
                                          : "text-gray-300"
                                  }`}
                                >
                                  {priority}
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 bg-gray-700 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        priority === "high"
                                          ? "bg-red-400"
                                          : priority === "medium"
                                            ? "bg-yellow-400"
                                            : priority === "low"
                                              ? "bg-green-400"
                                              : "bg-gray-400"
                                      }`}
                                      style={{
                                        width: `${(count / analytics.total_issues) * 100}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-sm text-gray-400 w-8">
                                    {count}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Sparkles className="h-5 w-5" />
                    AI-Powered Issue Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                      <h4 className="font-semibold text-blue-300 mb-2">
                        Workflow Analysis
                      </h4>
                      <p className="text-gray-300 text-sm">
                        Your issue management shows good engagement with the
                        community. You respond to {analytics?.response_rate}% of
                        issues with comments. Consider implementing issue
                        templates to standardize reporting.
                      </p>
                    </div>
                    <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                      <h4 className="font-semibold text-green-300 mb-2">
                        Strengths
                      </h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Good issue resolution rate</li>
                        <li>• Active in issue discussions</li>
                        <li>• Consistent labeling practices</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-orange-900/20 border border-orange-700/50 rounded-lg">
                      <h4 className="font-semibold text-orange-300 mb-2">
                        Improvement Areas
                      </h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Consider faster initial response times</li>
                        <li>• Implement priority labeling system</li>
                        <li>• Add issue assignment workflow</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredIssues.slice(0, 20).map((issue, index) => (
                    <motion.div
                      key={issue.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getStateColor(issue.state)}>
                                  {getStateIcon(issue.state)}
                                  <span className="ml-1 capitalize">
                                    {issue.state}
                                  </span>
                                </Badge>
                                {issue.repository && (
                                  <Badge variant="outline" className="text-xs">
                                    {issue.repository.name}
                                  </Badge>
                                )}
                                <div
                                  className={`w-2 h-2 rounded-full ${getPriorityColor(issue.labels)}`}
                                />
                              </div>
                              <h3 className="font-semibold text-white mb-1 truncate">
                                #{issue.number} {issue.title}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(
                                    issue.created_at
                                  ).toLocaleDateString()}
                                </span>
                                {issue.comments > 0 && (
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    {issue.comments}
                                  </span>
                                )}
                                {issue.assignee && (
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {issue.assignee.login}
                                  </span>
                                )}
                              </div>
                              {issue.labels.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {issue.labels.slice(0, 3).map((label) => (
                                    <Badge
                                      key={label.name}
                                      variant="outline"
                                      className="text-xs"
                                      style={{
                                        borderColor: `#${label.color}40`,
                                        color: `#${label.color}`,
                                      }}
                                    >
                                      {label.name}
                                    </Badge>
                                  ))}
                                  {issue.labels.length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-400"
                                    >
                                      +{issue.labels.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(issue.html_url, "_blank")
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export default MyIssuesView;
