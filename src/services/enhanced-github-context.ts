/**
 * Enhanced GitHub Context Service with Semantic Search
 * Combines GitHub API search with smart in-memory caching and semantic similarity
 */

import { getGitHubAccessToken } from "@/actions/github-actions";

// GitHub API response interfaces
interface GitHubCommitResponse {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
  files?: GitHubFile[];
  stats?: {
    additions: number;
    deletions: number;
  };
}

interface GitHubPullRequestResponse {
  number: number;
  title: string;
  body: string | null;
  user: {
    login: string;
  };
  state: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  labels?: GitHubLabel[];
}

interface GitHubLabel {
  name: string;
}

interface GitHubFile {
  filename: string;
}

interface GitHubSearchResponse {
  items: unknown[];
}

// Enhanced interfaces for better search results
interface SearchableCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  files?: string[];
  additions?: number;
  deletions?: number;
  searchableText: string; // Combined text for searching
}

interface SearchablePullRequest {
  number: number;
  title: string;
  description: string;
  author: string;
  state: string;
  created: string;
  updated: string;
  url: string;
  labels?: string[];
  files?: string[];
  searchableText: string; // Combined text for searching
}

interface RepositoryContext {
  commits: SearchableCommit[];
  pullRequests: SearchablePullRequest[];
  lastUpdated: Date;
  repository: string;
}

// Simple in-memory cache with TTL
class MemoryCache {
  private cache = new Map<string, { data: unknown; expiry: number }>();
  private readonly TTL = 10 * 60 * 1000; // 10 minutes

  set(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.TTL,
    });
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export class EnhancedGitHubContext {
  private cache = new MemoryCache();
  private apiBase: string;

  constructor() {
    this.apiBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";
  }

  /**
   * Detects if the query contains temporal keywords that suggest the user wants recently created items
   */
  private isTemporalQuery(query: string): boolean {
    const temporalKeywords = [
      "latest",
      "newest",
      "recent",
      "new",
      "last",
      "current",
      "today",
      "yesterday",
      "this week",
      "this month",
      "just created",
      "just added",
      "just opened",
    ];

    const lowerQuery = query.toLowerCase();
    return temporalKeywords.some((keyword) => lowerQuery.includes(keyword));
  }

  /**
   * Main entry point for enhanced GitHub context search
   */
  async searchGitHubContent(options: {
    repository: string;
    query: string;
    organization?: string;
    maxResults?: number;
    includeCode?: boolean;
  }): Promise<{
    commits: SearchableCommit[];
    pullRequests: SearchablePullRequest[];
    relevanceScores: Map<string, number>;
    sources: string[];
  }> {
    const {
      repository,
      query,
      organization = "IBMSC",
      maxResults = 20,
      includeCode = false,
    } = options;

    const repoKey = `${organization}/${repository}`;

    // Try to get from cache first
    let repoContext = this.cache.get(repoKey) as RepositoryContext | null;

    if (!repoContext) {
      // Fetch fresh data from GitHub
      repoContext = await this.fetchRepositoryContext(organization, repository);
      this.cache.set(repoKey, repoContext);
    }

    // Perform intelligent search across the data
    const searchResults = this.performSemanticSearch(
      query,
      repoContext,
      maxResults
    );

    // If we need code context, fetch additional details
    if (includeCode) {
      await this.enrichWithCodeContext(searchResults, organization, repository);
    }

    return searchResults;
  }

  /**
   * Fetch comprehensive repository context
   */
  private async fetchRepositoryContext(
    organization: string,
    repository: string
  ): Promise<RepositoryContext> {
    const token = await getGitHubAccessToken();
    if (!token) {
      throw new Error("GitHub token not available");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    };

    // Fetch commits and PRs in parallel for better performance
    const [commits, pullRequests] = await Promise.all([
      this.fetchRecentCommits(organization, repository, headers),
      this.fetchRecentPullRequests(
        organization,
        repository,
        headers,
        "general"
      ), // Default to general query for caching
    ]);

    return {
      commits,
      pullRequests,
      lastUpdated: new Date(),
      repository: `${organization}/${repository}`,
    };
  }

  /**
   * Fetch recent commits with enhanced searchable text
   */
  private async fetchRecentCommits(
    organization: string,
    repository: string,
    headers: Record<string, string>
  ): Promise<SearchableCommit[]> {
    const url = `${this.apiBase}/repos/${organization}/${repository}/commits?per_page=50`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch commits: ${response.status}`);
    }

    const commits = (await response.json()) as GitHubCommitResponse[];

    return commits.map((commit: GitHubCommitResponse) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url,
      searchableText:
        `${commit.commit.message} ${commit.commit.author.name} ${commit.sha}`.toLowerCase(),
    }));
  }

  /**
   * Fetch recent pull requests with enhanced searchable text
   */
  private async fetchRecentPullRequests(
    organization: string,
    repository: string,
    headers: Record<string, string>,
    query: string = ""
  ): Promise<SearchablePullRequest[]> {
    // Determine the appropriate sorting based on query intent
    const sortParam =
      query && this.isTemporalQuery(query) ? "created" : "updated";
    const url = `${this.apiBase}/repos/${organization}/${repository}/pulls?state=all&per_page=50&sort=${sortParam}`;

    if (query) {
      console.log(
        `Enhanced GitHub Context: Using sort=${sortParam} for query: "${query}"`
      );
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch pull requests: ${response.status}`);
    }

    const prs = (await response.json()) as GitHubPullRequestResponse[];

    return prs.map((pr: GitHubPullRequestResponse) => ({
      number: pr.number,
      title: pr.title,
      description: pr.body || "",
      author: pr.user.login,
      state: pr.state,
      created: pr.created_at,
      updated: pr.updated_at,
      url: pr.html_url,
      labels: pr.labels?.map((l: GitHubLabel) => l.name) || [],
      searchableText:
        `${pr.title} ${pr.body || ""} ${pr.user.login} ${pr.labels?.map((l: GitHubLabel) => l.name).join(" ") || ""}`.toLowerCase(),
    }));
  }

  /**
   * Perform semantic search using multiple techniques
   */
  private performSemanticSearch(
    query: string,
    context: RepositoryContext,
    maxResults: number
  ): {
    commits: SearchableCommit[];
    pullRequests: SearchablePullRequest[];
    relevanceScores: Map<string, number>;
    sources: string[];
  } {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower
      .split(/\s+/)
      .filter((word) => word.length > 2);

    const relevanceScores = new Map<string, number>();
    const sources: string[] = [];

    // Score commits
    const scoredCommits = context.commits
      .map((commit) => {
        const score = this.calculateRelevanceScore(
          queryWords,
          commit.searchableText
        );
        if (score > 0) {
          relevanceScores.set(`commit-${commit.sha}`, score);
          sources.push(commit.url);
        }
        return { ...commit, score };
      })
      .filter((commit) => commit.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.floor(maxResults / 2));

    // Score pull requests
    const scoredPRs = context.pullRequests
      .map((pr) => {
        const score = this.calculateRelevanceScore(
          queryWords,
          pr.searchableText
        );
        if (score > 0) {
          relevanceScores.set(`pr-${pr.number}`, score);
          sources.push(pr.url);
        }
        return { ...pr, score };
      })
      .filter((pr) => pr.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.floor(maxResults / 2));

    return {
      commits: scoredCommits.map((commit) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { score: _, ...rest } = commit;
        return rest;
      }),
      pullRequests: scoredPRs.map((pr) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { score: _, ...rest } = pr;
        return rest;
      }),
      relevanceScores,
      sources,
    };
  }

  /**
   * Calculate relevance score using multiple factors
   */
  private calculateRelevanceScore(queryWords: string[], text: string): number {
    let score = 0;
    const textLower = text.toLowerCase();

    queryWords.forEach((word) => {
      // Exact word match
      if (textLower.includes(word)) {
        score += 10;
      }

      // Partial word match
      const partialMatches = textLower
        .split(/\s+/)
        .filter(
          (textWord) => textWord.includes(word) || word.includes(textWord)
        );
      score += partialMatches.length * 5;

      // Fuzzy matching for typos (simple Levenshtein-like)
      const fuzzyMatches = textLower
        .split(/\s+/)
        .filter((textWord) => this.calculateSimilarity(word, textWord) > 0.7);
      score += fuzzyMatches.length * 3;
    });

    // Boost score for recent items (within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (text.includes(thirtyDaysAgo.toISOString().split("T")[0])) {
      score *= 1.2;
    }

    return score;
  }

  /**
   * Simple string similarity calculation
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Levenshtein distance calculation
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Enrich search results with code context when needed
   */
  private async enrichWithCodeContext(
    results: {
      commits: SearchableCommit[];
      pullRequests: SearchablePullRequest[];
    },
    organization: string,
    repository: string
  ): Promise<void> {
    const token = await getGitHubAccessToken();
    if (!token) return;

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    };

    // Enrich commits with file information
    const commitPromises = results.commits.slice(0, 5).map(async (commit) => {
      try {
        const response = await fetch(
          `${this.apiBase}/repos/${organization}/${repository}/commits/${commit.sha}`,
          { headers }
        );
        if (response.ok) {
          const details = (await response.json()) as GitHubCommitResponse;
          commit.files =
            details.files?.map((f: GitHubFile) => f.filename) || [];
          commit.additions = details.stats?.additions || 0;
          commit.deletions = details.stats?.deletions || 0;
        }
      } catch (error) {
        console.warn(
          `Failed to fetch commit details for ${commit.sha}:`,
          error
        );
      }
    });

    // Enrich PRs with file information
    const prPromises = results.pullRequests.slice(0, 5).map(async (pr) => {
      try {
        const response = await fetch(
          `${this.apiBase}/repos/${organization}/${repository}/pulls/${pr.number}/files`,
          { headers }
        );
        if (response.ok) {
          const files = (await response.json()) as GitHubFile[];
          pr.files = files.map((f: GitHubFile) => f.filename);
        }
      } catch (error) {
        console.warn(`Failed to fetch PR files for #${pr.number}:`, error);
      }
    });

    await Promise.all([...commitPromises, ...prPromises]);
  }

  /**
   * Use GitHub Search API for advanced queries
   */
  async useGitHubSearchAPI(options: {
    repository: string;
    query: string;
    organization?: string;
    type: "commits" | "issues" | "code";
  }): Promise<unknown[]> {
    const { repository, query, organization = "IBMSC", type } = options;
    const token = await getGitHubAccessToken();

    if (!token) {
      throw new Error("GitHub token not available");
    }

    const searchQuery = `${query} repo:${organization}/${repository}`;
    const url = `${this.apiBase}/search/${type}?q=${encodeURIComponent(searchQuery)}&per_page=20`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub Search API error: ${response.status}`);
    }

    const results = (await response.json()) as GitHubSearchResponse;
    return results.items || [];
  }

  /**
   * Clear the cache (useful for testing or when data needs refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const enhancedGitHubContext = new EnhancedGitHubContext();
