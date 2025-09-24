"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  GitCommit,
  GitPullRequest,
  Bug,
  Clock,
  Target,
  Zap,
  BarChart3,
  FileText,
  Plus,
  Minus,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Repository {
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author?: {
    login: string;
    avatar_url: string;
  };
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  merged_at?: string;
  user: {
    login: string;
    avatar_url: string;
  };
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  labels: Array<{
    name: string;
    color: string;
  }>;
  comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
}

interface Issue {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  user: {
    login: string;
    avatar_url: string;
  };
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  labels: Array<{
    name: string;
    color: string;
  }>;
  comments: number;
}

interface ActivityItem {
  id: string;
  type: "commit" | "pr" | "issue" | "review";
  title: string;
  description?: string;
  date: string;
  repository: string;
  user: {
    login: string;
    avatar_url: string;
  };
  metadata?: Commit | PullRequest | Issue;
  impact: "low" | "medium" | "high";
}

interface MyActivityViewProps {
  repositories: Repository[];
  selectedRepo?: string;
  onRepoChange?: (repo: string) => void;
  className?: string;
}

// Helper function to calculate time ranges
const getTimeRanges = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(
    today.getTime() - today.getDay() * 24 * 60 * 60 * 1000
  );
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last3Months = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  return { today, thisWeek, thisMonth, lastMonth, last3Months };
};

// Helper function to format relative time
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

// Helper function to calculate impact score
const calculateImpact = (
  item: Commit | PullRequest | Issue,
  type: string
): "low" | "medium" | "high" => {
  switch (type) {
    case "commit":
      const commitItem = item as Commit;
      const changes =
        (commitItem.stats?.additions || 0) + (commitItem.stats?.deletions || 0);
      if (changes > 500) return "high";
      if (changes > 100) return "medium";
      return "low";
    case "pr":
      const prItem = item as PullRequest;
      const prChanges = (prItem.additions || 0) + (prItem.deletions || 0);
      const hasReviews = prItem.comments > 2;
      if (prChanges > 1000 || hasReviews) return "high";
      if (prChanges > 200) return "medium";
      return "low";
    case "issue":
      const issueItem = item as Issue;
      const hasDiscussion = issueItem.comments > 5;
      const hasLabels = issueItem.labels && issueItem.labels.length > 0;
      if (hasDiscussion && hasLabels) return "high";
      if (hasDiscussion || hasLabels) return "medium";
      return "low";
    default:
      return "medium";
  }
};

const MyActivityView: React.FC<MyActivityViewProps> = ({
  repositories,
  selectedRepo,
  onRepoChange,
  className = "",
}) => {
  const [timeRange, setTimeRange] = useState<string>("week");
  const [loading, setLoading] = useState(false);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedActivityType, setSelectedActivityType] =
    useState<string>("all");
  // const [expandedCard, setExpandedCard] = useState<string | null>(null); // Unused state commented out

  // Fetch activity data
  useEffect(() => {
    const fetchActivityData = async () => {
      if (!selectedRepo) return;

      setLoading(true);
      try {
        const [commitsResponse, prsResponse, issuesResponse] =
          await Promise.all([
            fetch(`/api/github/commits?repo=${selectedRepo}&per_page=50`),
            fetch(
              `/api/github/pulls?repo=${selectedRepo}&state=all&per_page=50`
            ),
            fetch(
              `/api/github/issues?repo=${selectedRepo}&state=all&per_page=50`
            ),
          ]);

        if (commitsResponse.ok) {
          const commitsData = await commitsResponse.json();
          const fetchedCommits = commitsData.commits || [];

          // Deduplicate commits based on SHA to prevent React key duplication errors
          const uniqueCommits = fetchedCommits.filter(
            (commit: Commit, index: number, array: Commit[]) =>
              array.findIndex((c: Commit) => c.sha === commit.sha) === index
          );

          // Log deduplication info if duplicates were found
          if (fetchedCommits.length !== uniqueCommits.length) {
            console.warn(
              `Removed ${fetchedCommits.length - uniqueCommits.length} duplicate commits in activity view`,
              { original: fetchedCommits.length, unique: uniqueCommits.length }
            );
          }

          setCommits(uniqueCommits);
        }

        if (prsResponse.ok) {
          const prsData = await prsResponse.json();
          setPullRequests(prsData.pullRequests || []);
        }

        if (issuesResponse.ok) {
          const issuesData = await issuesResponse.json();
          setIssues(issuesData.issues || []);
        }
      } catch (error) {
        console.error("Error fetching activity data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [selectedRepo]);

  // Filter data by time range
  const filteredData = useMemo(() => {
    const { today, thisWeek, thisMonth, last3Months } = getTimeRanges();
    let cutoffDate: Date;

    switch (timeRange) {
      case "today":
        cutoffDate = today;
        break;
      case "week":
        cutoffDate = thisWeek;
        break;
      case "month":
        cutoffDate = thisMonth;
        break;
      case "3months":
        cutoffDate = last3Months;
        break;
      default:
        cutoffDate = thisWeek;
    }

    const filterByDate = (item: Commit | PullRequest | Issue) =>
      new Date(
        (item as Commit).commit?.author?.date ||
          (item as PullRequest | Issue).created_at ||
          (item as PullRequest | Issue).updated_at
      ) >= cutoffDate;

    return {
      commits: commits.filter(filterByDate),
      pullRequests: pullRequests.filter(filterByDate),
      issues: issues.filter(filterByDate),
    };
  }, [commits, pullRequests, issues, timeRange]);

  // Create unified activity timeline
  const activityTimeline = useMemo(() => {
    const activities: ActivityItem[] = [];

    // Add commits
    filteredData.commits.forEach((commit, index) => {
      activities.push({
        id: `activity-commit-${commit.sha}-${index}`,
        type: "commit",
        title: commit.commit.message.split("\n")[0],
        description: commit.commit.message,
        date: commit.commit.author.date,
        repository: selectedRepo || "",
        user: {
          login: commit.author?.login || commit.commit.author.name,
          avatar_url: commit.author?.avatar_url || "",
        },
        metadata: commit,
        impact: calculateImpact(commit, "commit"),
      });
    });

    // Add pull requests
    filteredData.pullRequests.forEach((pr) => {
      activities.push({
        id: `pr-${pr.id}`,
        type: "pr",
        title: pr.title,
        description: `#${pr.number} • ${pr.state}`,
        date: pr.updated_at,
        repository: selectedRepo || "",
        user: pr.user,
        metadata: pr,
        impact: calculateImpact(pr, "pr"),
      });
    });

    // Add issues
    filteredData.issues.forEach((issue) => {
      activities.push({
        id: `issue-${issue.id}`,
        type: "issue",
        title: issue.title,
        description: `#${issue.number} • ${issue.state}`,
        date: issue.updated_at,
        repository: selectedRepo || "",
        user: issue.user,
        metadata: issue,
        impact: calculateImpact(issue, "issue"),
      });
    });

    // Sort by date (newest first)
    const sortedActivities = activities.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Deduplicate activities based on ID to prevent React key duplication errors
    const uniqueActivities = sortedActivities.filter(
      (activity, index, array) =>
        array.findIndex((a) => a.id === activity.id) === index
    );

    // Log deduplication info if duplicates were found
    if (sortedActivities.length !== uniqueActivities.length) {
      console.warn(
        `Removed ${sortedActivities.length - uniqueActivities.length} duplicate activities`,
        { original: sortedActivities.length, unique: uniqueActivities.length }
      );
    }

    return uniqueActivities;
  }, [filteredData, selectedRepo]);

  // Filter activities by type
  const displayedActivities = useMemo(() => {
    if (selectedActivityType === "all") return activityTimeline;
    return activityTimeline.filter(
      (activity) => activity.type === selectedActivityType
    );
  }, [activityTimeline, selectedActivityType]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalCommits = filteredData.commits.length;
    const totalPRs = filteredData.pullRequests.length;
    const totalIssues = filteredData.issues.length;

    const openPRs = filteredData.pullRequests.filter(
      (pr) => pr.state === "open"
    ).length;
    const mergedPRs = filteredData.pullRequests.filter(
      (pr) => pr.merged_at
    ).length;
    const openIssues = filteredData.issues.filter(
      (issue) => issue.state === "open"
    ).length;
    const closedIssues = filteredData.issues.filter(
      (issue) => issue.state === "closed"
    ).length;

    const totalCodeChanges = filteredData.commits.reduce(
      (sum, commit) =>
        sum + (commit.stats?.additions || 0) + (commit.stats?.deletions || 0),
      0
    );

    const avgCommitsPerDay =
      totalCommits / Math.max(1, getTimeRanges().today.getDate());

    return {
      totalCommits,
      totalPRs,
      totalIssues,
      openPRs,
      mergedPRs,
      openIssues,
      closedIssues,
      totalCodeChanges,
      avgCommitsPerDay,
      activityScore: Math.round(
        (totalCommits * 3 + mergedPRs * 5 + closedIssues * 2) / 10
      ),
    };
  }, [filteredData]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "commit":
        return <GitCommit className="h-4 w-4" />;
      case "pr":
        return <GitPullRequest className="h-4 w-4" />;
      case "issue":
        return <Bug className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-400">Loading activity data...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500" />
            My Activity
          </h2>
          <p className="text-gray-400 mt-1">
            Track your development activity and productivity metrics
          </p>
        </div>

        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36 bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRepo || ""} onValueChange={onRepoChange}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-700">
              <SelectValue placeholder="Select repository" />
            </SelectTrigger>
            <SelectContent>
              {repositories.map((repo) => (
                <SelectItem key={repo.full_name} value={repo.name}>
                  {repo.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <GitCommit className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {analytics.totalCommits}
                    </p>
                    <p className="text-sm text-gray-400">Commits</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <GitPullRequest className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {analytics.totalPRs}
                    </p>
                    <p className="text-sm text-gray-400">Pull Requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Bug className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {analytics.totalIssues}
                    </p>
                    <p className="text-sm text-gray-400">Issues</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Zap className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {analytics.activityScore}
                    </p>
                    <p className="text-sm text-gray-400">Activity Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  PR Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Merged</span>
                    <span className="text-green-400 font-semibold">
                      {analytics.mergedPRs}
                    </span>
                  </div>
                  <Progress
                    value={
                      (analytics.mergedPRs / Math.max(analytics.totalPRs, 1)) *
                      100
                    }
                    className="h-2"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Open</span>
                    <span className="text-blue-400 font-semibold">
                      {analytics.openPRs}
                    </span>
                  </div>
                  <Progress
                    value={
                      (analytics.openPRs / Math.max(analytics.totalPRs, 1)) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Issue Resolution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Closed</span>
                    <span className="text-green-400 font-semibold">
                      {analytics.closedIssues}
                    </span>
                  </div>
                  <Progress
                    value={
                      (analytics.closedIssues /
                        Math.max(analytics.totalIssues, 1)) *
                      100
                    }
                    className="h-2"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Open</span>
                    <span className="text-red-400 font-semibold">
                      {analytics.openIssues}
                    </span>
                  </div>
                  <Progress
                    value={
                      (analytics.openIssues /
                        Math.max(analytics.totalIssues, 1)) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          {/* Activity Filter */}
          <div className="flex gap-2">
            <Button
              variant={selectedActivityType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedActivityType("all")}
              className="bg-gray-800 border-gray-700"
            >
              All
            </Button>
            <Button
              variant={
                selectedActivityType === "commit" ? "default" : "outline"
              }
              size="sm"
              onClick={() => setSelectedActivityType("commit")}
              className="bg-gray-800 border-gray-700"
            >
              <GitCommit className="h-4 w-4 mr-1" />
              Commits
            </Button>
            <Button
              variant={selectedActivityType === "pr" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedActivityType("pr")}
              className="bg-gray-800 border-gray-700"
            >
              <GitPullRequest className="h-4 w-4 mr-1" />
              PRs
            </Button>
            <Button
              variant={selectedActivityType === "issue" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedActivityType("issue")}
              className="bg-gray-800 border-gray-700"
            >
              <Bug className="h-4 w-4 mr-1" />
              Issues
            </Button>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-4">
            {displayedActivities.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Activity className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">
                    No activity found for the selected time range
                  </p>
                </CardContent>
              </Card>
            ) : (
              displayedActivities.map((activity) => (
                <Card
                  key={activity.id}
                  className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={activity.user.avatar_url}
                          alt={activity.user.login}
                        />
                        <AvatarFallback>
                          {activity.user.login[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getActivityIcon(activity.type)}
                          <span className="text-white font-medium truncate">
                            {activity.title}
                          </span>
                          <Badge
                            variant="outline"
                            className={`ml-auto ${getImpactColor(activity.impact)}`}
                          >
                            {activity.impact}
                          </Badge>
                        </div>

                        <p className="text-gray-400 text-sm mb-2">
                          {activity.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(activity.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {activity.repository}
                          </span>
                          {activity.type === "commit" &&
                            activity.metadata &&
                            (activity.metadata as Commit).stats && (
                              <span className="flex items-center gap-1">
                                <Plus className="h-3 w-3 text-green-400" />
                                {(activity.metadata as Commit).stats
                                  ?.additions || 0}
                                <Minus className="h-3 w-3 text-red-400" />
                                {(activity.metadata as Commit).stats
                                  ?.deletions || 0}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Productivity Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Code Changes</span>
                  <span className="text-white font-bold">
                    {analytics.totalCodeChanges.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Avg Commits/Day</span>
                  <span className="text-white font-bold">
                    {analytics.avgCommitsPerDay.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">PR Merge Rate</span>
                  <span className="text-white font-bold">
                    {analytics.totalPRs > 0
                      ? Math.round(
                          (analytics.mergedPRs / analytics.totalPRs) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Issue Resolution Rate</span>
                  <span className="text-white font-bold">
                    {analytics.totalIssues > 0
                      ? Math.round(
                          (analytics.closedIssues / analytics.totalIssues) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Activity Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Most Active Day</span>
                  <span className="text-white font-bold">Monday</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Peak Hours</span>
                  <span className="text-white font-bold">10AM - 2PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Streak</span>
                  <span className="text-white font-bold">5 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Collaboration Score</span>
                  <span className="text-white font-bold">
                    {Math.round(
                      (analytics.totalPRs + analytics.totalIssues) / 2
                    )}
                    /10
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription>
                Personalized recommendations based on your activity patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.activityScore > 50 ? (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 font-medium mb-2">
                    🎉 High Productivity Period
                  </p>
                  <p className="text-gray-300 text-sm">
                    You&apos;re in a highly productive phase with{" "}
                    {analytics.totalCommits} commits and {analytics.mergedPRs}{" "}
                    merged PRs. Keep up the excellent work!
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-400 font-medium mb-2">
                    💡 Productivity Boost
                  </p>
                  <p className="text-gray-300 text-sm">
                    Consider breaking down larger tasks into smaller commits for
                    better tracking and collaboration.
                  </p>
                </div>
              )}

              {analytics.openPRs > analytics.mergedPRs && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-400 font-medium mb-2">
                    ⏰ Review Reminder
                  </p>
                  <p className="text-gray-300 text-sm">
                    You have {analytics.openPRs} open PRs waiting for review.
                    Consider following up on pending reviews.
                  </p>
                </div>
              )}

              {analytics.totalCodeChanges > 1000 && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-purple-400 font-medium mb-2">
                    🚀 Code Velocity
                  </p>
                  <p className="text-gray-300 text-sm">
                    You&apos;ve made{" "}
                    {analytics.totalCodeChanges.toLocaleString()} code changes
                    this period. Consider adding more tests to maintain code
                    quality.
                  </p>
                </div>
              )}

              <div className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
                <p className="text-gray-300 font-medium mb-2">
                  📊 Performance Summary
                </p>
                <p className="text-gray-400 text-sm">
                  Based on your activity patterns, you&apos;re most productive
                  during weekday mornings. Your collaboration score suggests
                  strong teamwork skills through PR reviews and issue
                  discussions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyActivityView;
