// Cache service for JIRA AI summaries to prevent regeneration when switching between PRs
export interface JiraSummaryCacheEntry {
  summary: string;
  timestamp: number;
  issueKeys: string[];
  prNumber?: number;
  repoName?: string;
}

class JiraSummaryCache {
  private cache = new Map<string, JiraSummaryCacheEntry>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 100; // Limit cache size

  // Generate cache key for JIRA summary
  private generateCacheKey(
    issueKeys: string[],
    prNumber?: number,
    repoName?: string
  ): string {
    const sortedKeys = [...issueKeys].sort().join(",");
    const prContext = prNumber && repoName ? `${repoName}:${prNumber}` : "";
    return `jira_summary:${sortedKeys}:${prContext}`;
  }

  // Get cached summary
  getCachedSummary(
    issueKeys: string[],
    prNumber?: number,
    repoName?: string
  ): string | null {
    const key = this.generateCacheKey(issueKeys, prNumber, repoName);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache entry is still valid
    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    console.log(
      `[JiraSummaryCache] Cache hit for issues: ${issueKeys.join(", ")}`
    );
    return entry.summary;
  }

  // Cache summary
  cacheSummary(
    summary: string,
    issueKeys: string[],
    prNumber?: number,
    repoName?: string
  ): void {
    // Ensure cache doesn't grow too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      );

      const toRemove = Math.floor(this.MAX_CACHE_SIZE * 0.2); // Remove 20% of oldest entries
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }

    const key = this.generateCacheKey(issueKeys, prNumber, repoName);
    const entry: JiraSummaryCacheEntry = {
      summary,
      timestamp: Date.now(),
      issueKeys: [...issueKeys],
      prNumber,
      repoName,
    };

    this.cache.set(key, entry);
    console.log(
      `[JiraSummaryCache] Cached summary for issues: ${issueKeys.join(", ")}`
    );
  }

  // Clear cache for specific issues
  clearCacheForIssues(issueKeys: string[]): void {
    const keysToDelete: string[] = [];

    for (const [cacheKey, entry] of this.cache.entries()) {
      // Check if any of the issue keys match
      const hasMatchingIssue = issueKeys.some((key) =>
        entry.issueKeys.includes(key)
      );
      if (hasMatchingIssue) {
        keysToDelete.push(cacheKey);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
    console.log(
      `[JiraSummaryCache] Cleared cache for ${keysToDelete.length} entries`
    );
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear();
    console.log("[JiraSummaryCache] Cleared all cache entries");
  }

  // Get cache stats
  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const jiraSummaryCache = new JiraSummaryCache();
