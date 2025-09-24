/**
 * GitHub Assistant service for fetching repository data and generating summaries
 */
// Import necessary modules (removed unused import)
import {
  type JiraIssue,
  type JiraIssueReference,
  extractJiraIssueReferences,
  formatJiraIssuesForAI,
} from "./jira-service";
import { getJiraDataFromCache, setJiraDataInCache } from "./jira-cache-service";

// Constants
// Removed AI_SUMMARY_TIMEOUT_MS as we now allow unlimited time for backend processing

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  html_url: string;
  visibility: string;
  updated_at: string;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  size: number;
  archived: boolean;
  disabled: boolean;
  fork: boolean;
  created_at: string;
  pushed_at: string;
  topics?: string[];
  license?: {
    key: string;
    name: string;
    spdx_id: string;
    url: string;
  } | null;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  body: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  ai_summary?: string;
  // GitHub PR branch information
  base?: {
    ref: string;
  };
  head?: {
    ref: string;
  };
  // JIRA integration fields
  jiraIssues?: JiraIssue[];
  jiraReferences?: JiraIssueReference[];
}

// Enhanced PR interface for components that need JIRA data
export interface EnhancedPR extends PullRequest {
  // Additional fields for enhanced display
  repository?: {
    name: string;
    language?: string;
  };
  merged_at?: string | null;
  draft?: boolean;
}

export interface PullRequestFile {
  sha: string;
  filename: string;
  status:
    | "added"
    | "removed"
    | "modified"
    | "renamed"
    | "copied"
    | "changed"
    | "unchanged";
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
  previous_filename?: string;
}

export interface CommitFile {
  sha: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
  previous_filename?: string;
}

export interface CommitStats {
  additions: number;
  deletions: number;
  total: number;
}

export interface Commit {
  sha: string;
  html_url: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    tree: {
      sha: string;
      url: string;
    };
    url: string;
    comment_count: number;
  };
  author: {
    login: string;
    id: number;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    type: string;
    site_admin: boolean;
  } | null;
  committer: {
    login: string;
    id: number;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    type: string;
    site_admin: boolean;
  } | null;
  parents: Array<{
    sha: string;
    url: string;
    html_url: string;
  }>;
  stats?: CommitStats;
  files?: CommitFile[];
  ai_summary?: string;
}

// Fetch repositories from the IBMSC organization that match the DEFAULT_REPOS list
export async function fetchFilteredRepositories(): Promise<Repository[]> {
  try {
    const response = await fetch(`/api/github/repos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch repositories: ${response.status}`);
    }

    const data = await response.json();
    return data.repositories || [];
  } catch (error) {
    console.error("Error fetching repositories:", error);
    throw error;
  }
}

// Fetch pull requests for a specific repository
export async function fetchPullRequests(
  repo: string,
  state: string = "all",
  direction: string = "desc",
  per_page: number = 100,
  sort: string = "updated"
): Promise<PullRequest[]> {
  try {
    // Split the repository full name into org and repo parts
    const [org, repoName] = repo.split("/");

    const params = new URLSearchParams({
      org,
      repo: repoName,
      state,
      direction,
      per_page: per_page.toString(),
      sort,
    });

    const response = await fetch(`/api/github/pulls?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pull requests: ${response.status}`);
    }

    const data = await response.json();
    return data.pullRequests || [];
  } catch (error) {
    console.error(`Error fetching pull requests for ${repo}:`, error);
    throw error;
  }
}

// Fetch commits for a specific repository
export async function fetchCommits(
  repo: string,
  branch?: string
): Promise<Commit[]> {
  try {
    // Split the repository full name into org and repo parts
    const [org, repoName] = repo.split("/");

    const params = new URLSearchParams({
      org,
      repo: repoName,
    });

    if (branch) {
      params.append("branch", branch);
    }

    const response = await fetch(`/api/github/commits?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch commits: ${response.status}`);
    }

    const data = await response.json();
    return data.commits || [];
  } catch (error) {
    console.error(`Error fetching commits for ${repo}:`, error);
    throw error;
  }
}

// Generate an AI summary using WatsonX for PR/commit content
export async function generateAISummary(
  content: string,
  type: "pull_request" | "commit" | "repository",
  selectedModel?: string
): Promise<string> {
  try {
    console.log(
      `Generating AI summary for ${type} using model ${selectedModel || "default"}...`
    );

    if (!content || typeof content !== "string") {
      throw new Error("Invalid content provided for summarization");
    }

    // Create AbortController for request cancellation (no timeout - let backend complete)
    const controller = new AbortController();

    const response = await fetch(`/api/github/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        type,
        selectedModel,
      }),
      signal: controller.signal,
    });

    // Check response
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      if (response.status === 408 || response.status === 504) {
        throw new Error("Summary generation timed out");
      }
      throw new Error(`Failed to generate summary: ${response.status}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error("Failed to parse API response:", e);
      throw new Error("Invalid response from summarization service");
    }

    console.log("API response:", data);

    // Verify response format
    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format from API");
    }

    // Handle error response
    if (data.status === "error") {
      throw new Error(data.message || "API returned error status");
    }

    // Verify and normalize success response
    if (data.status === "success" && data.summary) {
      // Ensure summary is a string and normalize it
      const normalizedSummary = String(data.summary).trim();
      if (!normalizedSummary) {
        throw new Error("Received empty summary from API");
      }
      return normalizedSummary;
    }

    // Handle edge case where status is success but no summary
    console.warn(
      "API returned success but no valid summary found in the response:",
      data
    );
    throw new Error("Invalid or missing summary in API response");
  } catch (error) {
    // Handle AbortError specifically (including different ways it can manifest)
    if (
      error instanceof Error &&
      (error.name === "AbortError" ||
        error.message.includes("aborted") ||
        error.message.includes("signal is aborted"))
    ) {
      console.log("Request was aborted by user or component cleanup");
      throw error; // Re-throw AbortError so calling code can handle it
    }

    // Convert all other errors to strings for consistency
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error generating summary";
    console.error("Error generating AI summary:", errorMessage);

    // Re-throw with consistent error format
    throw new Error(errorMessage);
  }
}

// Fetch files for a specific pull request
export async function fetchPullRequestFiles(
  repo: string,
  pullNumber: number
): Promise<{
  files: PullRequestFile[];
  summary: { additions: number; deletions: number; changed_files: number };
}> {
  try {
    // Split the repository full name into org and repo parts
    const [org, repoName] = repo.split("/");

    const params = new URLSearchParams({
      org,
      repo: repoName,
      pull_number: pullNumber.toString(),
    });

    const response = await fetch(`/api/github/pulls/files?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pull request files: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "success" || !data.files) {
      throw new Error("Invalid response format from API");
    }

    return {
      files: data.files,
      summary: data.summary,
    };
  } catch (error) {
    console.error(
      `Error fetching files for pull request #${pullNumber} in ${repo}:`,
      error
    );
    throw error;
  }
}

/**
 * Fetch the diff content for a specific file in a pull request
 */
export async function fetchPullRequestFileDiff(
  repoName: string,
  prNumber: number,
  filename: string
): Promise<string> {
  try {
    const [org, repo] = repoName.split("/");

    const params = new URLSearchParams({
      org,
      repo,
      pull_number: prNumber.toString(),
      filename: filename,
    });

    // Use the same pattern as fetchPullRequestFiles
    const response = await fetch(`/api/github/pulls/files/diff?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(
        `Failed to fetch file diff: ${response.status} - ${response.statusText}`
      );
    }

    const text = await response.text();
    return text;
  } catch (error) {
    console.error("Error fetching pull request file diff:", error);
    throw error;
  }
}
/**
 * Fetch the diff content for a specific file in a commit
 */
/**
 * Fetch the diff content for a specific file in a commit
 * Updated to use query parameters pattern
 */
export async function fetchCommitFileDiff(
  repoName: string,
  commitSha: string,
  filename: string
): Promise<string> {
  try {
    const [org, repo] = repoName.split("/");

    const params = new URLSearchParams({
      org,
      repo,
      commit_sha: commitSha,
      filename: filename,
    });

    // const params = new URLSearchParams({
    //   repo: repoName,
    //   commit_sha: commitSha,
    //   filename: filename,
    // });

    // Use the same pattern as other working endpoints
    const response = await fetch(`/api/github/commits/files/diff?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(
        `Failed to fetch commit file diff: ${response.status} - ${response.statusText}`
      );
    }

    const text = await response.text();
    return text;
  } catch (error) {
    console.error("Error fetching commit file diff:", error);
    throw error;
  }
}

/**
 * Fetch files changed in a specific commit
 * Updated to use query parameters pattern
 */
export async function fetchCommitFiles(
  repoName: string,
  commitSha: string
): Promise<{ files: CommitFile[]; stats: CommitStats }> {
  try {
    // Split the repository full name into org and repo parts
    const [org, repo] = repoName.split("/");

    const params = new URLSearchParams({
      org,
      repo,
      commit_sha: commitSha,
    });

    const response = await fetch(`/api/github/repos/commits?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(
        `Failed to fetch commit files: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();

    return {
      files: data.files || [],
      stats: data.stats || { additions: 0, deletions: 0, total: 0 },
    };
  } catch (error) {
    console.error("Error fetching commit files:", error);
    throw error;
  }
}

// JIRA Integration Functions

/**
 * Fetch JIRA issues for a pull request based on title and description
 */
export async function fetchJiraIssuesForPR(
  pr: PullRequest
): Promise<JiraIssue[]> {
  try {
    const response = await fetch("/api/jira", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        extractFrom: {
          title: pr.title,
          description: pr.body || undefined,
          branchName: pr.head?.ref || undefined,
        },
      }),
    });

    if (!response.ok) {
      console.warn("Failed to fetch JIRA issues for PR:", pr.number);
      return [];
    }

    const result = await response.json();
    return result.issues || [];
  } catch (error) {
    console.error("Error fetching JIRA issues for PR:", error);
    return [];
  }
}

/**
 * Fetch JIRA data for a single PR with caching support
 * This replaces the bulk JIRA fetching approach for better performance
 */
export async function fetchJiraDataForPR(
  repoName: string,
  pr: PullRequest
): Promise<{ jiraIssues: JiraIssue[]; jiraReferences: JiraIssueReference[] }> {
  try {
    // Check cache first
    const cachedData = getJiraDataFromCache(repoName, pr.number);
    if (cachedData) {
      console.log(`[JIRA] Using cached data for PR #${pr.number}`);
      return cachedData;
    }

    console.log(
      `[JIRA] Fetching fresh JIRA data for PR #${pr.number}: "${pr.title}"`
    );

    // Extract JIRA references
    const references = extractJiraIssueReferences(
      pr.title,
      pr.body || undefined,
      pr.head?.ref || undefined
    );

    console.log(
      `[JIRA] Found ${references.length} JIRA references:`,
      references
    );

    if (references.length === 0) {
      console.log(`[JIRA] No JIRA references found for PR #${pr.number}`);
      const emptyResult = { jiraIssues: [], jiraReferences: [] };
      // Cache empty result to avoid unnecessary future checks
      setJiraDataInCache(repoName, pr.number, [], []);
      return emptyResult;
    }

    // Fetch JIRA issues via API route
    console.log(`[JIRA] Fetching JIRA issues via API for PR #${pr.number}`);
    const jiraIssues = await fetchJiraIssuesForPR(pr);

    console.log(
      `[JIRA] Successfully fetched ${jiraIssues.length} JIRA issues for PR #${pr.number}`
    );

    const result = { jiraIssues, jiraReferences: references };

    // Cache the result
    setJiraDataInCache(repoName, pr.number, jiraIssues, references);

    return result;
  } catch (error) {
    console.error(
      `[JIRA] Error fetching JIRA data for PR #${pr.number}:`,
      error
    );
    // Return empty result on error but don't cache failures
    return { jiraIssues: [], jiraReferences: [] };
  }
}

/**
 * Generate enhanced context for AI that includes JIRA data
 */
export function generateEnhancedPRContext(pr: PullRequest): string {
  let context = `PR #${pr.number}: ${pr.title}\n`;
  context += `State: ${pr.state}\n`;
  context += `Author: ${pr.user.login}\n`;
  context += `Created: ${new Date(pr.created_at).toLocaleDateString()}\n`;

  if (pr.body) {
    context += `Description: ${pr.body.substring(0, 500)}${pr.body.length > 500 ? "..." : ""}\n`;
  }

  // Add JIRA context if available
  if (pr.jiraIssues && pr.jiraIssues.length > 0) {
    context += formatJiraIssuesForAI(pr.jiraIssues);
  }

  return context;
}
