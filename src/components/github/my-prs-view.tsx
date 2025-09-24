"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GitPullRequest,
  Calendar,
  FileText,
  GitMerge,
  GitBranch,
  TrendingUp,
  AlertCircle,
  Clock,
  ExternalLink,
  Sparkles,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Minus,
  Target,
  Link,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGitHubCache } from "@/hooks/use-github-cache";
import {
  fetchUserRepositories,
  GitHubPullRequest,
} from "@/actions/github-actions";
import {
  fetchPullRequestFiles,
  fetchJiraDataForPR,
  type EnhancedPR as ServiceEnhancedPR,
} from "@/services/github-assistant-service";
import { JiraIssue } from "@/services/jira-service";

interface PRAnalytics {
  total_prs: number;
  open_prs: number;
  merged_prs: number;
  closed_prs: number;
  avg_merge_time: number;
  avg_review_time: number;
  most_active_repos: string[];
  recent_activity_score: number;
  code_quality_metrics: {
    avg_files_changed: number;
    avg_lines_added: number;
    avg_lines_removed: number;
  };
  collaboration_score: number;
  languages_used: { [key: string]: number };
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language?: string;
  html_url: string;
}

// Use service's EnhancedPR type with additional AI insights
interface EnhancedPR extends ServiceEnhancedPR {
  ai_insights?: {
    complexity_score: number;
    review_priority: "high" | "medium" | "low";
    estimated_review_time: number;
    key_changes: string[];
    potential_risks: string[];
  };
}

interface AnalyticsInsight {
  title: string;
  content: string | string[];
  color: string;
  textColor: string;
  type: "text" | "list";
}

interface PerformanceTrend {
  metric: string;
  value: string;
  trend: "up" | "down" | "stable";
}

interface Recommendation {
  title: string;
  description: string;
}

interface GitHubSearchItem {
  id: number;
  number: number;
  title: string;
  body: string;
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  state: "open" | "closed";
  html_url: string;
  draft?: boolean;
  repository_url?: string;
  repository?: {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
  };
  pull_request?: {
    merged_at?: string | null;
    head?: { ref: string };
    base?: { ref: string };
  };
}

// AI-powered analytics insights using WatsonX
const generateAnalyticsInsights = async (
  analytics: PRAnalytics,
  filteredPRs: EnhancedPR[],
  userInfo?: { githubLogin?: string }
): Promise<AnalyticsInsight[]> => {
  try {
    console.log("Generating AI-powered analytics insights...");

    // Prepare PR data for AI analysis
    const prDataForAI = filteredPRs.map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body || "",
      state: pr.state,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      closed_at: pr.merged_at || null, // Use merged_at as fallback for closed_at
      merged_at: pr.merged_at,
      user: {
        login: pr.user.login,
      },
      repository: pr.repository
        ? {
            name: pr.repository.name,
            language: pr.repository.language,
          }
        : undefined,
      changed_files: pr.changed_files,
      additions: pr.additions,
      deletions: pr.deletions,
    }));

    const response = await fetch("/api/github/pr-analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prData: prDataForAI,
        userInfo: userInfo,
      }),
    });

    const result = await response.json();

    if (result.status === "success" && result.insights) {
      // If there's a service notice, log it for user awareness
      if (result.serviceNotice) {
        console.log("Service notice:", result.serviceNotice);
      }

      return [
        result.insights.pattern_analysis,
        result.insights.strengths,
        result.insights.improvement_areas,
      ];
    } else {
      // Enhanced error handling for different types of failures
      if (response.status === 503 || result.serviceUnavailable) {
        console.log(
          "AI service temporarily unavailable - using enhanced fallback"
        );
        throw new Error("SERVICE_UNAVAILABLE");
      }
      throw new Error(result.message || "Failed to generate AI insights");
    }
  } catch (error) {
    console.error("Error generating AI analytics insights:", error);

    // Enhanced fallback based on actual analytics data
    const avgPRSize = analytics.code_quality_metrics.avg_files_changed;
    const sampleSize = filteredPRs.length;
    const mergeRate =
      analytics.merged_prs > 0
        ? Math.round((analytics.merged_prs / analytics.total_prs) * 100)
        : 0;
    const recentActivity = analytics.recent_activity_score;

    // Check if it's a service unavailability error
    const isServiceUnavailable =
      error instanceof Error &&
      (error.message.includes("SERVICE_UNAVAILABLE") ||
        error.message.includes("503") ||
        error.message.includes("Service Unavailable"));

    const serviceStatusMessage = isServiceUnavailable
      ? "AI analysis service is temporarily under maintenance. Enhanced insights shown based on your data."
      : "AI analysis temporarily unavailable - showing enhanced metrics based on your data.";

    return [
      {
        title: "Pattern Analysis",
        content: `Analysis of ${sampleSize} PRs shows an average of ${avgPRSize} files changed per PR with a ${mergeRate}% merge success rate. ${serviceStatusMessage}`,
        color: "bg-blue-900/20 border-blue-700/50",
        textColor: "text-blue-300",
        type: "text",
      },
      {
        title: "Strengths (Data-Based)",
        content: [
          mergeRate >= 80
            ? "High PR success rate"
            : "Active contribution pattern",
          avgPRSize <= 8
            ? "Well-sized PR changes"
            : "Comprehensive code contributions",
          recentActivity > 40
            ? "Consistent development activity"
            : "Established contribution history",
          filteredPRs.length > 10
            ? "Substantial contribution volume"
            : "Building development experience",
        ].slice(0, 3),
        color: "bg-green-900/20 border-green-700/50",
        textColor: "text-green-300",
        type: "list",
      },
      {
        title: "Areas to Consider",
        content: [
          avgPRSize > 10
            ? "Consider breaking large PRs into smaller, focused changes"
            : "Maintain current PR sizing approach",
          mergeRate < 70
            ? "Focus on improving PR quality and testing"
            : "Continue current quality practices",
          isServiceUnavailable
            ? "AI insights will return when service is restored"
            : "Enhanced AI analysis available soon",
        ].slice(0, 2),
        color: "bg-orange-900/20 border-orange-700/50",
        textColor: "text-orange-300",
        type: "list",
      },
    ];
  }
};

const generatePerformanceTrends = (
  analytics: PRAnalytics,
  filteredPRs: EnhancedPR[]
): PerformanceTrend[] => {
  const trends: PerformanceTrend[] = [];

  // Analyze recent vs older PRs for trends
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentPRs = filteredPRs.filter(
    (pr) => new Date(pr.created_at) > thirtyDaysAgo
  );
  const olderPRs = filteredPRs.filter(
    (pr) => new Date(pr.created_at) <= thirtyDaysAgo
  );

  // Merge Rate Trend
  const recentMergeRate =
    recentPRs.length > 0
      ? recentPRs.filter((pr) => pr.merged_at).length / recentPRs.length
      : 0;
  const olderMergeRate =
    olderPRs.length > 0
      ? olderPRs.filter((pr) => pr.merged_at).length / olderPRs.length
      : 0;

  trends.push({
    metric: "Merge Rate",
    value: `${Math.round(recentMergeRate * 100)}%`,
    trend:
      recentMergeRate > olderMergeRate
        ? "up"
        : recentMergeRate < olderMergeRate
          ? "down"
          : "stable",
  });

  // PR Size Trend
  const recentAvgSize =
    recentPRs.length > 0
      ? recentPRs.reduce((sum, pr) => sum + (pr.changed_files || 0), 0) /
        recentPRs.length
      : 0;
  const olderAvgSize =
    olderPRs.length > 0
      ? olderPRs.reduce((sum, pr) => sum + (pr.changed_files || 0), 0) /
        olderPRs.length
      : 0;

  trends.push({
    metric: "Avg PR Size",
    value: `${Math.round(recentAvgSize)} files`,
    trend:
      recentAvgSize < olderAvgSize
        ? "up"
        : recentAvgSize > olderAvgSize
          ? "down"
          : "stable",
  });

  // Activity Level
  trends.push({
    metric: "Activity Level",
    value: `${recentPRs.length} PRs`,
    trend:
      recentPRs.length > olderPRs.length
        ? "up"
        : recentPRs.length < olderPRs.length
          ? "down"
          : "stable",
  });

  // Code Changes
  const recentAvgLines =
    recentPRs.length > 0
      ? recentPRs.reduce(
          (sum, pr) => sum + (pr.additions || 0) + (pr.deletions || 0),
          0
        ) / recentPRs.length
      : 0;
  const olderAvgLines =
    olderPRs.length > 0
      ? olderPRs.reduce(
          (sum, pr) => sum + (pr.additions || 0) + (pr.deletions || 0),
          0
        ) / olderPRs.length
      : 0;

  trends.push({
    metric: "Code Changes",
    value: `${Math.round(recentAvgLines)} lines`,
    trend:
      recentAvgLines < olderAvgLines
        ? "up"
        : recentAvgLines > olderAvgLines
          ? "down"
          : "stable",
  });

  return trends;
};

const generateRecommendations = (
  analytics: PRAnalytics,
  filteredPRs: EnhancedPR[]
): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  // PR Size recommendation
  if (analytics.code_quality_metrics.avg_files_changed > 10) {
    recommendations.push({
      title: "Optimize PR Size",
      description:
        "Consider breaking large PRs into smaller, focused changes. Target 3-8 files per PR for optimal review efficiency.",
    });
  }

  // Merge rate recommendation
  if (
    analytics.total_prs > 0 &&
    analytics.merged_prs / analytics.total_prs < 0.8
  ) {
    recommendations.push({
      title: "Improve PR Success Rate",
      description:
        "Focus on PR quality: add comprehensive descriptions, ensure tests pass, and address feedback promptly.",
    });
  }

  // Activity consistency
  if (analytics.recent_activity_score < 40) {
    recommendations.push({
      title: "Maintain Development Rhythm",
      description:
        "Establish a consistent development cadence with regular, smaller contributions rather than sporadic large changes.",
    });
  }

  // Code review engagement
  if (analytics.collaboration_score < 60) {
    recommendations.push({
      title: "Enhance Collaboration",
      description:
        "Add detailed PR descriptions, use comments to explain complex logic, and engage actively in code reviews.",
    });
  }

  // Repository diversity
  const uniqueRepos = new Set(
    filteredPRs.map((pr: EnhancedPR) => pr.repository?.name).filter(Boolean)
  );
  if (uniqueRepos.size < 3 && filteredPRs.length > 10) {
    recommendations.push({
      title: "Expand Contribution Scope",
      description:
        "Consider contributing to more repositories to diversify your experience and impact.",
    });
  }

  // Default recommendation if all metrics are good
  if (recommendations.length === 0) {
    recommendations.push({
      title: "Maintain Excellence",
      description:
        "Your PR patterns show strong development practices. Continue with current approaches and mentor others.",
    });
  }

  return recommendations.slice(0, 4); // Limit to 4 recommendations
};

// Component to display JIRA issues for a PR
interface JiraIssuesDisplayProps {
  jiraIssues?: JiraIssue[];
  maxDisplay?: number;
}

const JiraIssuesDisplay: React.FC<JiraIssuesDisplayProps> = ({
  jiraIssues,
  maxDisplay = 3,
}) => {
  if (!jiraIssues || jiraIssues.length === 0) {
    return null;
  }

  const issuesToShow = jiraIssues.slice(0, maxDisplay);
  const hasMore = jiraIssues.length > maxDisplay;

  // Build JIRA issue URL from environment or use default
  const buildJiraUrl = (issueKey: string) => {
    const jiraBaseUrl =
      process.env.NEXT_PUBLIC_JIRA_BASE_URL || "https://jira.company.com";
    return `${jiraBaseUrl}/browse/${issueKey}`;
  };

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {issuesToShow.map((issue) => (
        <Badge
          key={issue.key}
          variant="outline"
          className="text-xs bg-blue-900/20 text-blue-300 border-blue-700/50 hover:bg-blue-900/40"
          onClick={() => window.open(buildJiraUrl(issue.key), "_blank")}
          style={{ cursor: "pointer" }}
        >
          <Link className="w-3 h-3 mr-1" />
          {issue.key}
        </Badge>
      ))}
      {hasMore && (
        <Badge variant="outline" className="text-xs text-gray-400">
          +{jiraIssues.length - maxDisplay} more
        </Badge>
      )}
    </div>
  );
};

export function MyPRsView({
  onAskQuestion,
}: {
  onAskQuestion?: (question: string) => void;
}) {
  const { data: session, status } = useSession();
  const [prs, setPRs] = useState<EnhancedPR[]>([]);
  const [analytics, setAnalytics] = useState<PRAnalytics | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRepo, setSelectedRepo] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<
    "all" | "open" | "closed" | "merged"
  >("all");
  const [aiInsights, setAiInsights] = useState<AnalyticsInsight[]>([]);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);

  // Use ref to track loaded keys to prevent duplicate AI calls
  const loadedKeysRef = useRef<Set<string>>(new Set());
  const isLoadingRef = useRef<boolean>(false);

  // Use ref to track PR data fetching to prevent duplicate calls
  const fetchedDataKeysRef = useRef<Set<string>>(new Set());
  const isFetchingDataRef = useRef<boolean>(false);

  // Initialize GitHub cache for optimized file fetching
  const { getCachedRepository, setCachedRepository } = useGitHubCache();

  // Helper functions for analytics
  const calculateAverageMergeTime = (prData: EnhancedPR[]): number => {
    const mergedPRs = prData.filter((pr) => pr.merged_at && pr.created_at);
    if (mergedPRs.length === 0) return 0;

    const totalTime = mergedPRs.reduce((sum, pr) => {
      const created = new Date(pr.created_at).getTime();
      const merged = new Date(pr.merged_at!).getTime();
      return sum + (merged - created);
    }, 0);

    const avgTime = totalTime / mergedPRs.length / (1000 * 60 * 60 * 24); // Convert to days
    return isNaN(avgTime) ? 0 : Math.round(avgTime);
  };

  const calculateAverageReviewTime = (): number => {
    // This would need additional API calls to get review data
    // For now, return a placeholder
    return Math.round(Math.random() * 5) + 1;
  };

  const getMostActiveRepos = (prData: EnhancedPR[]): string[] => {
    const repoCount: { [key: string]: number } = {};
    prData.forEach((pr) => {
      if (pr.repository) {
        repoCount[pr.repository.name] =
          (repoCount[pr.repository.name] || 0) + 1;
      }
    });
    return Object.entries(repoCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([repo]) => repo);
  };

  const calculateActivityScore = (prData: EnhancedPR[]): number => {
    const recentPRs = prData.filter((pr) => {
      const created = new Date(pr.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return created > thirtyDaysAgo;
    });
    return Math.min(100, (recentPRs.length / 10) * 100); // Scale to 100
  };

  const calculateCollaborationScore = (prData: EnhancedPR[]): number => {
    if (prData.length === 0) return 0;
    // Calculate based on PR descriptions, comments, etc.
    const hasDescription = prData.filter(
      (pr) => pr.body && pr.body.length > 50
    ).length;
    const score = (hasDescription / prData.length) * 100;
    return isNaN(score) ? 0 : Math.round(score);
  };

  const getLanguageDistribution = (
    prData: EnhancedPR[]
  ): { [key: string]: number } => {
    const languages: { [key: string]: number } = {};
    prData.forEach((pr) => {
      if (pr.repository?.language) {
        languages[pr.repository.language] =
          (languages[pr.repository.language] || 0) + 1;
      }
    });
    return languages;
  };

  const generateAnalytics = useCallback(async (prData: EnhancedPR[]) => {
    try {
      // Note: This would need to be implemented in the FastAPI backend
      // For now, we'll generate basic analytics locally
      const analytics: PRAnalytics = {
        total_prs: prData.length,
        open_prs: prData.filter((pr) => pr.state === "open").length,
        merged_prs: prData.filter((pr) => pr.merged_at).length,
        closed_prs: prData.filter(
          (pr) => pr.state === "closed" && !pr.merged_at
        ).length,
        avg_merge_time: calculateAverageMergeTime(prData),
        avg_review_time: calculateAverageReviewTime(),
        most_active_repos: getMostActiveRepos(prData),
        recent_activity_score: calculateActivityScore(prData),
        code_quality_metrics: {
          avg_files_changed:
            prData.length > 0
              ? Math.round(
                  prData.reduce((sum, pr) => sum + (pr.changed_files || 0), 0) /
                    prData.length
                )
              : 0,
          avg_lines_added:
            prData.length > 0
              ? Math.round(
                  prData.reduce((sum, pr) => sum + (pr.additions || 0), 0) /
                    prData.length
                )
              : 0,
          avg_lines_removed:
            prData.length > 0
              ? Math.round(
                  prData.reduce((sum, pr) => sum + (pr.deletions || 0), 0) /
                    prData.length
                )
              : 0,
        },
        collaboration_score: calculateCollaborationScore(prData),
        languages_used: getLanguageDistribution(prData),
      };

      setAnalytics(analytics);
    } catch (error) {
      console.error("Error generating analytics:", error);
    }
  }, []);

  // Load AI insights asynchronously with deduplication
  const loadAIInsights = useCallback(
    async (analytics: PRAnalytics, filteredPRs: EnhancedPR[]) => {
      if (!analytics || filteredPRs.length === 0) return;

      // Create a unique key based on the analytics data to prevent duplicate calls
      const loadKey = `${analytics.total_prs}-${filteredPRs.length}-${selectedRepo}-${selectedState}`;

      // Skip if we've already loaded insights for this data combination or if currently loading
      if (loadedKeysRef.current.has(loadKey) || isLoadingRef.current) {
        console.log(
          "Skipping AI insights loading - already loaded or loading for key:",
          loadKey
        );
        return;
      }

      try {
        isLoadingRef.current = true;
        setAiInsightsLoading(true);
        loadedKeysRef.current.add(loadKey);

        // Get current user info for personalized analysis (avoid dependency on getCurrentUserLogin)
        const githubLogin = session?.user?.githubLogin || null;
        const userInfo = { githubLogin: githubLogin || undefined };

        console.log("Loading AI insights for analytics with key:", loadKey);
        const insights = await generateAnalyticsInsights(
          analytics,
          filteredPRs,
          userInfo
        );
        setAiInsights(insights);
      } catch (error) {
        console.error("Error loading AI insights:", error);
        // Remove the key from loaded set on error so it can be retried
        loadedKeysRef.current.delete(loadKey);

        // Enhanced error handling for better user experience
        const isServiceUnavailable =
          error instanceof Error &&
          (error.message.includes("SERVICE_UNAVAILABLE") ||
            error.message.includes("503") ||
            error.message.includes("Service Unavailable"));

        // Set enhanced fallback insights on error
        setAiInsights([
          {
            title: isServiceUnavailable ? "Service Notice" : "Pattern Analysis",
            content: isServiceUnavailable
              ? "AI analysis service is temporarily under maintenance. Enhanced insights are shown based on your PR data. Please check back later for full AI-powered analysis."
              : "AI insights temporarily unavailable. Enhanced analytics are shown in other sections based on your data.",
            color: isServiceUnavailable
              ? "bg-yellow-900/20 border-yellow-700/50"
              : "bg-blue-900/20 border-blue-700/50",
            textColor: isServiceUnavailable
              ? "text-yellow-300"
              : "text-blue-300",
            type: "text",
          },
        ]);
      } finally {
        isLoadingRef.current = false;
        setAiInsightsLoading(false);
      }
    },
    [selectedRepo, selectedState, session?.user?.githubLogin]
  );

  // Fetch detailed PR data including file changes, additions and deletions
  const fetchDetailedPRData = useCallback(
    async (prs: EnhancedPR[]) => {
      console.log(`Fetching detailed data for ${prs.length} PRs`);
      const enhancedPRs = [...prs];

      // Create cache keys for PR file data
      const createCacheKey = (repoName: string, prNumber: number) =>
        `pr-files:${repoName}:${prNumber}`;

      // Process PRs in parallel with rate limiting
      const BATCH_SIZE = 5; // Process 5 PRs at a time to avoid overwhelming the API
      const batches: EnhancedPR[][] = [];

      for (let i = 0; i < prs.length; i += BATCH_SIZE) {
        batches.push(prs.slice(i, i + BATCH_SIZE));
      }

      for (const batch of batches) {
        const batchPromises = batch.map(async (pr, originalIndex) => {
          const globalIndex =
            batches.indexOf(batch) * BATCH_SIZE + originalIndex;

          // Skip if repository info is missing
          if (!pr.repository) {
            console.warn(`Skipping PR #${pr.number}: missing repository info`);
            return;
          }

          // Use repository name as fallback if full_name is missing
          const repoFullName =
            (pr.repository as Repository).full_name || pr.repository.name;

          try {
            const cacheKey = createCacheKey(repoFullName, pr.number);

            // Check cache first
            let summary = getCachedRepository(cacheKey) as {
              changed_files: number;
              additions: number;
              deletions: number;
            } | null;

            if (!summary) {
              // Fetch from API if not in cache
              console.log(
                `Fetching files for PR #${pr.number} from API (cache miss)`
              );
              const { summary: fetchedSummary } = await fetchPullRequestFiles(
                repoFullName,
                pr.number
              );
              summary = fetchedSummary;

              // Cache the result for 10 minutes
              setCachedRepository(cacheKey, summary, 10 * 60 * 1000);
            } else {
              console.log(`Using cached data for PR #${pr.number} (cache hit)`);
            }

            // Update PR with the detailed statistics
            enhancedPRs[globalIndex] = {
              ...pr,
              changed_files: summary.changed_files,
              additions: summary.additions,
              deletions: summary.deletions,
            };

            console.log(`Enhanced PR #${pr.number} with file statistics:`, {
              changed_files: summary.changed_files,
              additions: summary.additions,
              deletions: summary.deletions,
              fromCache: getCachedRepository(cacheKey) !== null,
            });
          } catch (error) {
            console.error(`Error fetching files for PR #${pr.number}:`, error);
            // Continue with other PRs even if one fails
          }
        });

        // Wait for the current batch to complete before processing the next one
        await Promise.allSettled(batchPromises);

        // Add a small delay between batches to respect rate limits
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      console.log(
        `Enhanced ${enhancedPRs.length} PRs with detailed file statistics`
      );
      return enhancedPRs;
    },
    [getCachedRepository, setCachedRepository]
  );

  // Fetch user's PRs and analytics
  const fetchPRData = useCallback(async () => {
    // Don't fetch if session is still loading
    if (status === "loading") {
      console.log("Session still loading, skipping API call");
      return;
    }

    // Create a unique key for this fetch operation to prevent duplicates
    const fetchKey = `${selectedRepo}-${selectedState}-${session?.user?.githubLogin || "none"}`;

    // Skip if we're already fetching data for this combination or if already loaded
    if (isFetchingDataRef.current || fetchedDataKeysRef.current.has(fetchKey)) {
      console.log(
        "Skipping PR data fetch - already fetching or loaded for key:",
        fetchKey
      );
      return;
    }

    try {
      isFetchingDataRef.current = true;
      setLoading(true);
      setError(null);
      fetchedDataKeysRef.current.add(fetchKey);

      console.log("Session status:", status);
      console.log("Session:", session ? "available" : "not available");
      console.log(
        "GitHub access token:",
        session?.githubAccessToken ? "present" : "missing"
      );

      // Get current user login directly from session
      const currentUserLogin = session?.user?.githubLogin;
      if (!currentUserLogin) {
        console.error("Cannot fetch PRs: no user login available");
        setError("User authentication required");
        return;
      }

      console.log(`Fetching PRs for user: ${currentUserLogin}`);

      // Fetch repositories for the dropdown
      const repos = await fetchUserRepositories();
      setRepositories(repos);

      // Use GitHub Search API to find all PRs created by the current user
      // This will search across all repositories the user has access to
      let allPRs: EnhancedPR[] = [];

      try {
        // Build search query based on selected state and repository
        let searchQuery = `author:${currentUserLogin} is:pr`;

        // Add state filter if not "all"
        if (selectedState !== "all") {
          searchQuery += ` is:${selectedState}`;
        }

        // Add repository filter if specific repo selected
        if (selectedRepo !== "all") {
          searchQuery += ` repo:${selectedRepo}`;
        }

        console.log(`GitHub Search Query: ${searchQuery}`);

        // Use the GitHub search API to find user's PRs with pagination support
        let page = 1;
        let hasMorePages = true;
        const allSearchResults: GitHubSearchItem[] = [];

        // Fetch multiple pages to get more than 100 results (max 1000 total from GitHub)
        while (hasMorePages && page <= 10) {
          // Limit to 10 pages (1000 results max)
          const searchResponse = await fetch(
            `/api/github/search/issues?q=${encodeURIComponent(searchQuery)}&sort=created&order=desc&per_page=100&page=${page}`
          );

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log(
              `GitHub Search API page ${page} returned ${searchData.items?.length || 0} items`
            );

            if (searchData.items && searchData.items.length > 0) {
              allSearchResults.push(...searchData.items);

              // Check if there are more pages
              hasMorePages = searchData.items.length === 100; // If we got full page, there might be more
              page++;
            } else {
              hasMorePages = false;
            }
          } else {
            console.error(
              "GitHub Search API error:",
              searchResponse.status,
              searchResponse.statusText
            );
            hasMorePages = false;
          }
        }

        console.log(
          `Total search results collected: ${allSearchResults.length}`
        );

        if (allSearchResults.length > 0) {
          // Convert search results to EnhancedPR format
          allPRs = allSearchResults.map((item: GitHubSearchItem) => {
            // Extract repository info from the item
            const repoInfo: Repository | undefined = item.repository_url
              ? {
                  id: item.repository?.id || 0,
                  name: item.repository_url.split("/").pop() || "unknown",
                  full_name:
                    item.repository_url.split("/").slice(-2).join("/") ||
                    "unknown/unknown",
                  html_url: item.repository?.html_url || "#",
                  description: item.repository?.description || null,
                }
              : undefined;

            return {
              ...item,
              // Map GitHub Issues API format to PR format
              id: item.id,
              number: item.number,
              title: item.title,
              body: item.body,
              user: item.user,
              created_at: item.created_at,
              updated_at: item.updated_at,
              closed_at: item.closed_at,
              merged_at: item.pull_request?.merged_at || null,
              state: item.pull_request?.merged_at ? "merged" : item.state,
              html_url: item.html_url,
              repository: repoInfo,
              // Add missing fields with defaults
              head: item.pull_request?.head || {
                ref: "unknown",
                sha: "unknown",
              },
              base: item.pull_request?.base || { ref: "main", sha: "unknown" },
              draft: item.draft || false,
              mergeable: null,
              rebaseable: null,
              mergeable_state: "unknown",
              merged_by: null,
              merge_commit_sha: null,
              review_comments: 0,
              maintainer_can_modify: false,
              commits: 0,
              additions: 0,
              deletions: 0,
              changed_files: 0,
            } as EnhancedPR;
          });

          console.log(
            `Successfully converted ${allPRs.length} search results to PR format`
          );
        } else {
          console.error("GitHub Search API failed or returned no results");

          // Fallback to the old method if search API fails
          console.log("Falling back to repository-based PR fetching...");

          const reposToFetch =
            selectedRepo === "all"
              ? repos.slice(0, 10)
              : repos.filter((r) => r.full_name === selectedRepo);

          for (const repo of reposToFetch) {
            try {
              const response = await fetch(
                `/api/github/pulls?org=${repo.full_name.split("/")[0]}&repo=${repo.name}&state=${selectedState === "all" ? "all" : selectedState}&per_page=100&sort=created&direction=desc`
              );
              if (response.ok) {
                const data = await response.json();
                const reposPRs = data.pullRequests.map(
                  (pr: GitHubPullRequest) => ({
                    ...pr,
                    repository: repo,
                  })
                );
                console.log(`Found ${reposPRs.length} PRs in ${repo.name}`);
                allPRs.push(...reposPRs);
              }
            } catch (error) {
              console.error(`Error fetching PRs for ${repo.name}:`, error);
            }
          }

          // Filter to only show current user's PRs for fallback method
          allPRs = allPRs.filter((pr) => pr.user.login === currentUserLogin);
        }
      } catch (error) {
        console.error("Error in GitHub Search API:", error);
        setError("Failed to fetch pull requests");
        return;
      }

      console.log(
        `Final PR count for user ${currentUserLogin}: ${allPRs.length}`
      );

      // Log some sample data for debugging
      if (allPRs.length > 0) {
        console.log(
          "Sample PR data:",
          allPRs.slice(0, 3).map((pr) => ({
            title: pr.title,
            author: pr.user.login,
            created: pr.created_at,
            repo: pr.repository?.name || "unknown",
            state: pr.state,
          }))
        );
      } else {
        console.log("No PRs found for user:", currentUserLogin);
      }

      // Fetch detailed PR information for a subset of PRs (most recent ones) to get metrics
      const prsToFetch = allPRs.slice(0, 20); // Limit to 20 most recent PRs for performance
      const enhancedPRs = await fetchDetailedPRData(prsToFetch);

      // Update the allPRs array with the enhanced PR data
      const updatedAllPRs = allPRs.map((pr) => {
        const enhancedPR = enhancedPRs.find((e) => e.id === pr.id);
        return enhancedPR || pr;
      });

      // Enhance PRs with JIRA data
      console.log("Enhancing PRs with JIRA data...");
      try {
        // Process PRs in batches to avoid overwhelming the API
        const batchSize = 5;
        const jiraEnhancedPRs = [...updatedAllPRs]; // Create a copy to work with

        for (let i = 0; i < jiraEnhancedPRs.length; i += batchSize) {
          const batch = jiraEnhancedPRs.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (pr, index) => {
              // Extract repository name from html_url
              const repoPath = pr.html_url.split("/").slice(3, 5).join("/");
              // Fetch JIRA data for this PR
              const jiraData = await fetchJiraDataForPR(repoPath, pr);
              // Update the PR with JIRA data
              jiraEnhancedPRs[i + index] = {
                ...pr,
                jiraIssues: jiraData.jiraIssues,
                jiraReferences: jiraData.jiraReferences,
              };
            })
          );

          // Update state progressively to show results as they come in
          setPRs([...jiraEnhancedPRs]);
        }

        console.log("Successfully enhanced PRs with JIRA data");
      } catch (jiraError) {
        console.warn("Failed to enhance PRs with JIRA data:", jiraError);
        setPRs(updatedAllPRs); // Use PRs without JIRA data if enhancement fails
      }

      // Generate analytics with the enhanced data
      await generateAnalytics(updatedAllPRs);
    } catch (error) {
      console.error("Error fetching PR data:", error);
      setError("Failed to fetch PR data");
      // Remove the key from loaded set on error so it can be retried
      fetchedDataKeysRef.current.delete(fetchKey);
    } finally {
      isFetchingDataRef.current = false;
      setLoading(false);
    }
  }, [
    selectedRepo,
    selectedState,
    generateAnalytics,
    fetchDetailedPRData,
    session,
    status,
  ]);

  useEffect(() => {
    fetchPRData();
  }, [fetchPRData]);

  // Filtered PRs based on current selections
  const filteredPRs = useMemo(() => {
    return prs.filter((pr) => {
      if (selectedRepo !== "all" && pr.repository?.name !== selectedRepo)
        return false;
      if (selectedState !== "all") {
        if (selectedState === "merged" && !pr.merged_at) return false;
        if (selectedState === "closed" && pr.state !== "closed") return false;
        if (selectedState === "open" && pr.state !== "open") return false;
      }
      return true;
    });
  }, [prs, selectedRepo, selectedState]);

  // Load AI insights when analytics and filtered PRs are available
  useEffect(() => {
    if (analytics && filteredPRs.length > 0) {
      loadAIInsights(analytics, filteredPRs);
    }
  }, [analytics, filteredPRs, loadAIInsights]);

  const getStateColor = (state: string, merged: boolean) => {
    if (merged) return "bg-purple-900/30 text-purple-300 border-purple-700/50";
    if (state === "open")
      return "bg-green-900/30 text-green-300 border-green-700/50";
    return "bg-red-900/30 text-red-300 border-red-700/50";
  };

  const getStateIcon = (state: string, merged: boolean) => {
    if (merged) return <GitMerge className="h-3 w-3" />;
    if (state === "open") return <GitPullRequest className="h-3 w-3" />;
    return <AlertCircle className="h-3 w-3" />;
  };

  if (status === "unauthenticated") {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Authentication Required
        </h3>
        <p className="text-gray-400 mb-4">
          Please log in to view your pull requests.
        </p>
      </div>
    );
  }

  if (status === "authenticated" && !session?.user?.githubLogin) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          GitHub Login Required
        </h3>
        <p className="text-gray-400 mb-4">
          You need to log in with GitHub to view your pull requests. Please log
          out and log back in using your GitHub account.
        </p>
      </div>
    );
  }

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
        <Button onClick={fetchPRData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  // Check if user hasn't logged in with GitHub
  if (status === "authenticated" && !session?.user?.githubLogin) {
    return (
      <div className="p-6 text-center">
        <GitPullRequest className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          GitHub Login Required
        </h3>
        <p className="text-gray-400 mb-4">
          Please log in with your GitHub account to view your pull requests.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh Page
        </Button>
      </div>
    );
  }

  // Check if no PRs found for user
  if (!loading && prs.length === 0 && session?.user?.githubLogin) {
    return (
      <div className="p-6 text-center">
        <GitPullRequest className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          No Pull Requests Found
        </h3>
        <p className="text-gray-400 mb-4">
          No pull requests found for user{" "}
          <strong>{session.user.githubLogin}</strong> in the selected
          repositories.
          <br />
          Try adjusting your filters or check if you have access to the
          repositories.
        </p>
        <Button onClick={fetchPRData} variant="outline">
          Refresh
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
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <GitPullRequest className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">My Pull Requests</h2>
              <p className="text-sm text-gray-400">
                AI-powered insights into your PR patterns
              </p>
            </div>
          </div>
          <Button
            onClick={() =>
              onAskQuestion?.(
                "Analyze my pull request patterns and suggest improvements"
              )
            }
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
              setSelectedState(
                e.target.value as "all" | "open" | "closed" | "merged"
              )
            }
            className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white text-sm"
          >
            <option value="all">All States</option>
            <option value="open">Open</option>
            <option value="merged">Merged</option>
            <option value="closed">Closed</option>
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
            <TabsTrigger value="list">PR List</TabsTrigger>
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
                            <p className="text-sm text-gray-400">Total PRs</p>
                            <p className="text-2xl font-bold text-white">
                              {analytics.total_prs}
                            </p>
                          </div>
                          <GitPullRequest className="h-8 w-8 text-blue-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">Merge Rate</p>
                            <p className="text-2xl font-bold text-green-400">
                              {analytics.total_prs > 0
                                ? Math.round(
                                    (analytics.merged_prs /
                                      analytics.total_prs) *
                                      100
                                  )
                                : 0}
                              %
                            </p>
                          </div>
                          <GitMerge className="h-8 w-8 text-green-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">
                              Avg Merge Time
                            </p>
                            <p className="text-2xl font-bold text-purple-400">
                              {analytics.avg_merge_time}d
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
                              Activity Score
                            </p>
                            <p className="text-2xl font-bold text-orange-400">
                              {Math.round(analytics.recent_activity_score)}
                            </p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-orange-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts and Insights */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <BarChart3 className="h-5 w-5" />
                          Most Active Repositories
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analytics.most_active_repos.map((repo, index) => (
                            <div
                              key={repo}
                              className="flex items-center justify-between"
                            >
                              <span className="text-gray-300">{repo}</span>
                              <Badge
                                variant="secondary"
                                className="bg-blue-900/30 text-blue-300"
                              >
                                #{index + 1}
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
                          Code Quality Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">
                                Avg Files Changed
                              </span>
                              <span className="text-white">
                                {Math.round(
                                  analytics.code_quality_metrics
                                    .avg_files_changed
                                )}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">
                                Avg Lines Added
                              </span>
                              <span className="text-green-400">
                                +
                                {Math.round(
                                  analytics.code_quality_metrics.avg_lines_added
                                )}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">
                                Avg Lines Removed
                              </span>
                              <span className="text-red-400">
                                -
                                {Math.round(
                                  analytics.code_quality_metrics
                                    .avg_lines_removed
                                )}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">
                                Collaboration Score
                              </span>
                              <span className="text-purple-400">
                                {analytics.collaboration_score}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {analytics && (
                <>
                  <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Sparkles className="h-5 w-5" />
                        AI-Powered Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {aiInsightsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-3 text-gray-400">
                              Generating AI insights...
                            </span>
                          </div>
                        ) : aiInsights.length > 0 ? (
                          aiInsights.map((insight, index) => (
                            <div
                              key={index}
                              className={`p-4 border rounded-lg ${insight.color}`}
                            >
                              <h4
                                className={`font-semibold mb-2 ${insight.textColor}`}
                              >
                                {insight.title}
                              </h4>
                              {insight.type === "list" ? (
                                <ul className="text-gray-300 text-sm space-y-1">
                                  {Array.isArray(insight.content) &&
                                    insight.content.map(
                                      (item: string, idx: number) => (
                                        <li key={idx}>• {item}</li>
                                      )
                                    )}
                                </ul>
                              ) : (
                                <p className="text-gray-300 text-sm">
                                  {typeof insight.content === "string"
                                    ? insight.content
                                    : ""}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>
                              AI insights will appear when data is available
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detailed Analytics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <TrendingUp className="h-5 w-5" />
                          Performance Trends
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {generatePerformanceTrends(
                            analytics,
                            filteredPRs
                          ).map((trend, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between"
                            >
                              <span className="text-gray-400">
                                {trend.metric}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-white">
                                  {trend.value}
                                </span>
                                <div
                                  className={`flex items-center ${trend.trend === "up" ? "text-green-400" : trend.trend === "down" ? "text-red-400" : "text-gray-400"}`}
                                >
                                  {trend.trend === "up" && (
                                    <ArrowUp className="h-3 w-3" />
                                  )}
                                  {trend.trend === "down" && (
                                    <ArrowDown className="h-3 w-3" />
                                  )}
                                  {trend.trend === "stable" && (
                                    <Minus className="h-3 w-3" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <Target className="h-5 w-5" />
                          Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {generateRecommendations(analytics, filteredPRs).map(
                            (rec, index) => (
                              <div
                                key={index}
                                className="p-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700/30 rounded-lg"
                              >
                                <div className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                                  <div>
                                    <h5 className="font-medium text-purple-300 text-sm">
                                      {rec.title}
                                    </h5>
                                    <p className="text-gray-400 text-xs mt-1">
                                      {rec.description}
                                    </p>
                                  </div>
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

            <TabsContent value="list" className="space-y-4">
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredPRs.slice(0, 20).map((pr, index) => (
                    <motion.div
                      key={pr.id}
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
                                <Badge
                                  className={getStateColor(
                                    pr.state,
                                    !!pr.merged_at
                                  )}
                                >
                                  {getStateIcon(pr.state, !!pr.merged_at)}
                                  <span className="ml-1">
                                    {pr.merged_at ? "Merged" : pr.state}
                                  </span>
                                </Badge>
                                {pr.repository && (
                                  <Badge variant="outline" className="text-xs">
                                    {pr.repository.name}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-semibold text-white mb-1 truncate">
                                #{pr.number} {pr.title}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(pr.created_at).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <GitBranch className="h-3 w-3" />
                                  {pr.head?.ref || "unknown"} →{" "}
                                  {pr.base?.ref || "unknown"}
                                </span>
                                {pr.changed_files && (
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {pr.changed_files} files
                                  </span>
                                )}
                              </div>
                              <JiraIssuesDisplay jiraIssues={pr.jiraIssues} />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(pr.html_url, "_blank")}
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

export default MyPRsView;
