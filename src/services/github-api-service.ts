/**
 * Optimized GitHub API Service with Caching and Preloading
 */

import { githubCache } from '@/utils/github-cache';

export interface PRDetailsExtended {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  merged: boolean;
  merged_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  additions: number;
  deletions: number;
  changed_files: number;
  commits: number;
  comments: number;
  review_comments: number;
  html_url: string;
  mergeable: boolean | null;
  files?: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
  }>;
}

export interface CommitDetailsExtended {
  sha: string;
  message: string;
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
  stats: {
    total: number;
    additions: number;
    deletions: number;
  };
  files: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
  }>;
  html_url: string;
}

class GitHubAPIService {
  private pendingRequests = new Map<string, Promise<unknown>>();

  private generateRequestKey(endpoint: string, params: Record<string, unknown>): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  /**
   * Fetch PR details with caching and deduplication
   */
  async fetchPRDetails(repo: string, prNumber: number): Promise<PRDetailsExtended | null> {
    // Check cache first
    const cached = githubCache.get<PRDetailsExtended>('pr', repo, prNumber);
    if (cached) {
      console.log(`📋 Cache hit for PR ${repo}#${prNumber}`);
      return cached;
    }

    // Check if request is already in flight
    const requestKey = this.generateRequestKey('pr-summary', { repo, prNumber });
    if (this.pendingRequests.has(requestKey)) {
      console.log(`⏳ Deduplicating PR request for ${repo}#${prNumber}`);
      return this.pendingRequests.get(requestKey) as Promise<PRDetailsExtended | null>;
    }

    // Make the API request
    const promise = this.executePRRequest(repo, prNumber);
    this.pendingRequests.set(requestKey, promise);

    try {
      const result = await promise;
      
      // Cache the result
      if (result) {
        githubCache.set('pr', repo, prNumber, result);
        console.log(`💾 Cached PR ${repo}#${prNumber} - Key: pr:${repo}:${prNumber}`);
      }
      
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Fetch commit details with caching and deduplication
   */
  async fetchCommitDetails(repo: string, commitSha: string): Promise<CommitDetailsExtended | null> {
    // Check cache first
    const cached = githubCache.get<CommitDetailsExtended>('commit', repo, commitSha);
    if (cached) {
      console.log(`📋 Cache hit for commit ${repo}@${commitSha.substring(0, 8)}`);
      return cached;
    }

    // Check if request is already in flight
    const requestKey = this.generateRequestKey('commit-details', { repo, commitSha });
    if (this.pendingRequests.has(requestKey)) {
      console.log(`⏳ Deduplicating commit request for ${repo}@${commitSha.substring(0, 8)}`);
      return this.pendingRequests.get(requestKey) as Promise<CommitDetailsExtended | null>;
    }

    // Make the API request
    const promise = this.executeCommitRequest(repo, commitSha);
    this.pendingRequests.set(requestKey, promise);

    try {
      const result = await promise;
      
      // Cache the result
      if (result) {
        githubCache.set('commit', repo, commitSha, result);
        console.log(`💾 Cached commit ${repo}@${commitSha.substring(0, 8)} - Key: commit:${repo}:${commitSha}`);
      }
      
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Preload PR and commit details in the background
   */
  async preloadTimelineData(repo: string, commits: Array<{ sha: string, prs?: number[] }>) {
    console.log(`🚀 Preloading timeline data for ${repo} - ${commits.length} items...`);
    
    const preloadPromises: Promise<unknown>[] = [];
    let commitCount = 0;
    let prCount = 0;
    let skippedCommits = 0;
    let skippedPRs = 0;
    
    // Preload commits
    for (const commit of commits) {
      if (!githubCache.has('commit', repo, commit.sha)) {
        console.log(`📥 Queuing commit ${commit.sha.substring(0, 8)} for preload`);
        commitCount++;
        preloadPromises.push(
          this.fetchCommitDetails(repo, commit.sha).catch(err => {
            console.warn(`⚠️ Failed to preload commit ${commit.sha.substring(0, 8)}:`, err);
            return null;
          })
        );
      } else {
        console.log(`⏭️ Skipping already cached commit ${commit.sha.substring(0, 8)}`);
        skippedCommits++;
      }
      
      // Preload associated PRs
      if (commit.prs && commit.prs.length > 0) {
        for (const prNumber of commit.prs) {
          if (!githubCache.has('pr', repo, prNumber)) {
            console.log(`📥 Queuing PR #${prNumber} for preload`);
            prCount++;
            preloadPromises.push(
              this.fetchPRDetails(repo, prNumber).catch(err => {
                console.warn(`⚠️ Failed to preload PR ${prNumber}:`, err);
                return null;
              })
            );
          } else {
            console.log(`⏭️ Skipping already cached PR #${prNumber}`);
            skippedPRs++;
          }
        }
      }
    }

    console.log(`📊 Preload summary: ${commitCount} commits + ${prCount} PRs to fetch, ${skippedCommits} commits + ${skippedPRs} PRs already cached`);

    if (preloadPromises.length === 0) {
      console.log(`✅ All data already cached for ${repo}`);
      return;
    }

    // Execute preloads with rate limiting (3 concurrent requests)
    const batchSize = 3;
    for (let i = 0; i < preloadPromises.length; i += batchSize) {
      const batch = preloadPromises.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(preloadPromises.length/batchSize)} (${batch.length} requests)`);
      await Promise.allSettled(batch);
      
      // Small delay to prevent overwhelming the API
      if (i + batchSize < preloadPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Preloading completed for ${repo} - ${preloadPromises.length} requests processed`);
  }

  /**
   * Check if data is available in cache (for instant loading)
   */
  isDataCached(type: 'pr' | 'commit', repo: string, identifier: string | number): boolean {
    return githubCache.has(type, repo, identifier);
  }

  /**
   * Get cached data directly without any API calls
   */
  getCachedData<T>(type: 'pr' | 'commit', repo: string, identifier: string | number): T | null {
    return githubCache.get<T>(type, repo, identifier);
  }

  private async executePRRequest(repo: string, prNumber: number): Promise<PRDetailsExtended | null> {
    try {
      console.log(`🌐 Fetching PR ${repo}#${prNumber} from API...`);
      const response = await fetch(`/api/github/pr-summary?repo=${encodeURIComponent(repo)}&pr=${prNumber}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      return responseData.pr || responseData;
    } catch (error) {
      console.error(`❌ Failed to fetch PR ${repo}#${prNumber}:`, error);
      return null;
    }
  }

  private async executeCommitRequest(repo: string, commitSha: string): Promise<CommitDetailsExtended | null> {
    try {
      console.log(`🌐 Fetching commit ${repo}@${commitSha.substring(0, 8)} from API...`);
      const response = await fetch(`/api/github/commit-details?repo=${encodeURIComponent(repo)}&sha=${commitSha}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      return responseData.commit || responseData;
    } catch (error) {
      console.error(`❌ Failed to fetch commit ${repo}@${commitSha.substring(0, 8)}:`, error);
      return null;
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return githubCache.getStats();
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    githubCache.clear();
  }
}

// Singleton instance
export const githubAPIService = new GitHubAPIService();
