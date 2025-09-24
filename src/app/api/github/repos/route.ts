export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { getGitHubAccessToken } from "@/actions/github-actions";

// Simple in-memory cache for GitHub repositories with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class RepositoryCache {
  private cache = new Map<string, CacheEntry<GitHubRepoWithMetadata[]>>();

  // Cache TTL in milliseconds (5 minutes for repositories)
  private readonly DEFAULT_TTL = 5 * 60 * 1000;

  set(
    key: string,
    data: GitHubRepoWithMetadata[],
    ttl: number = this.DEFAULT_TTL
  ): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): GitHubRepoWithMetadata[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
const repoCache = new RepositoryCache();

// GitHub Tree API interfaces
interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

// GitHub repository interface for enhanced metadata
interface GitHubRepoWithMetadata {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  archived: boolean;
  disabled: boolean;
  visibility: string;
  permissions?: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
  // Additional metadata from Trees API (optional)
  file_count?: number;
  total_size?: number;
  latest_commit?: {
    sha: string;
    message: string;
    author: string;
    date: string;
  };
}

interface PaginationInfo {
  page: number;
  per_page: number;
  total_count?: number;
  has_next: boolean;
  has_prev: boolean;
}

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        {
          status: "error",
          message: "Unauthorized access",
        },
        { status: 401 }
      );
    }

    // Get GitHub access token
    const githubToken = await getGitHubAccessToken();

    if (!githubToken) {
      return Response.json(
        {
          status: "error",
          message: "GitHub authentication required",
        },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const org = url.searchParams.get("org") || "IBMSC";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const perPage = parseInt(url.searchParams.get("per_page") || "100", 10);
    const includeArchived = url.searchParams.get("include_archived") === "true";
    const sort = url.searchParams.get("sort") || "updated"; // updated, created, pushed, full_name
    const direction = url.searchParams.get("direction") || "desc"; // asc, desc
    const type = url.searchParams.get("type") || "all"; // all, public, private, forks, sources, member
    const forceRefresh = url.searchParams.get("force_refresh") === "true";

    // Validate pagination parameters
    const validatedPage = Math.max(1, page);
    const validatedPerPage = Math.min(Math.max(1, perPage), 100);

    // Generate cache key based on request parameters
    const cacheKey = `repos:${org}:${validatedPage}:${validatedPerPage}:${includeArchived}:${sort}:${direction}:${type}`;

    // Check cache first (unless force refresh is requested)
    if (!forceRefresh) {
      const cachedData = repoCache.get(cacheKey);
      if (cachedData) {
        console.log(`Cache hit for repositories: ${cacheKey}`);

        // Parse pagination info for cached data
        const hasNext = cachedData.length === validatedPerPage;
        const hasPrev = validatedPage > 1;

        const pagination: PaginationInfo = {
          page: validatedPage,
          per_page: validatedPerPage,
          has_next: hasNext,
          has_prev: hasPrev,
        };

        return Response.json({
          status: "success",
          repositories: cachedData,
          pagination,
          total_returned: cachedData.length,
          cached: true,
          filters: {
            organization: org,
            include_archived: includeArchived,
            sort,
            direction,
            type,
          },
        });
      }
    }

    console.log(`Fetching repositories from GitHub API: ${cacheKey}`);

    // Clean up expired entries periodically
    repoCache.cleanup();

    // Use the same API URL pattern as in github-actions.ts
    const apiUrl = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    // Build query parameters for GitHub API
    const queryParams = new URLSearchParams({
      page: validatedPage.toString(),
      per_page: validatedPerPage.toString(),
      type,
      sort,
      direction,
    });

    // Fetch repositories from GitHub API with pagination
    const response = await fetch(`${apiUrl}/orgs/${org}/repos?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      return Response.json(
        {
          status: "error",
          message: `GitHub API error: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const allRepos: GitHubRepoWithMetadata[] = await response.json();

    // Filter out archived repositories if requested
    const filteredRepos = includeArchived
      ? allRepos
      : allRepos.filter((repo) => !repo.archived);

    // Enhanced repository metadata with Trees API information (optional)
    const enhancedRepos = await Promise.allSettled(
      filteredRepos.map(async (repo) => {
        try {
          // Optionally fetch additional metadata using Trees API for better performance
          const enhancedRepo = { ...repo };

          // Only fetch additional metadata for active repositories
          if (!repo.archived && repo.size > 0) {
            // Get the latest commit info for additional context
            const commitsResponse = await fetch(
              `${apiUrl}/repos/${repo.full_name}/commits?per_page=1`,
              {
                headers: {
                  Authorization: `Bearer ${githubToken}`,
                  Accept: "application/vnd.github.v3+json",
                },
              }
            );

            if (commitsResponse.ok) {
              const commits = await commitsResponse.json();
              if (commits.length > 0) {
                const latestCommit = commits[0];
                enhancedRepo.latest_commit = {
                  sha: latestCommit.sha,
                  message: latestCommit.commit.message,
                  author: latestCommit.commit.author.name,
                  date: latestCommit.commit.author.date,
                };
              }
            }

            // Optional: Use Trees API to get file count and total size
            // This provides better performance than recursive directory traversal
            try {
              const treeResponse = await fetch(
                `${apiUrl}/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`,
                {
                  headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: "application/vnd.github.v3+json",
                  },
                }
              );

              if (treeResponse.ok) {
                const treeData: GitHubTreeResponse = await treeResponse.json();
                if (treeData.tree) {
                  enhancedRepo.file_count = treeData.tree.filter(
                    (item: GitHubTreeItem) => item.type === "blob"
                  ).length;
                  enhancedRepo.total_size = treeData.tree.reduce(
                    (total: number, item: GitHubTreeItem) => {
                      return item.type === "blob" && item.size
                        ? total + item.size
                        : total;
                    },
                    0
                  );
                }
              }
            } catch (treeError) {
              // Trees API failed, continue without enhanced metadata
              console.log(`Trees API failed for ${repo.full_name}:`, treeError);
            }
          }

          return enhancedRepo;
        } catch (error) {
          console.log(
            `Failed to enhance metadata for ${repo.full_name}:`,
            error
          );
          return repo; // Return original repo if enhancement fails
        }
      })
    );

    // Extract successful results
    const repositories = enhancedRepos
      .filter(
        (result): result is PromiseFulfilledResult<GitHubRepoWithMetadata> =>
          result.status === "fulfilled"
      )
      .map((result) => result.value);

    // Cache the results for future requests
    repoCache.set(cacheKey, repositories);

    // Parse pagination info from GitHub response headers
    const linkHeader = response.headers.get("link");
    const hasNext = linkHeader?.includes('rel="next"') || false;
    const hasPrev = validatedPage > 1;

    const pagination: PaginationInfo = {
      page: validatedPage,
      per_page: validatedPerPage,
      has_next: hasNext,
      has_prev: hasPrev,
    };

    return Response.json({
      status: "success",
      repositories,
      pagination,
      total_returned: repositories.length,
      cached: false,
      filters: {
        organization: org,
        include_archived: includeArchived,
        sort,
        direction,
        type,
      },
    });
  } catch (error) {
    console.error("GitHub repos API error:", error);
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
