/**
 * JIRA Data Caching Service
 * Provides efficient caching for JIRA issue data to avoid redundant API calls
 */

import { JiraIssue, JiraIssueReference } from "./jira-service";

// Cache structure for JIRA data
interface JiraCacheEntry {
  jiraIssues: JiraIssue[];
  jiraReferences: JiraIssueReference[];
  timestamp: number;
  prNumber: number;
  repoName: string;
}

// In-memory cache
const jiraCache = new Map<string, JiraCacheEntry>();

// Cache duration in milliseconds (15 minutes)
const CACHE_DURATION = 15 * 60 * 1000;

/**
 * Generate cache key for a PR
 */
function generateCacheKey(repoName: string, prNumber: number): string {
  return `${repoName}#${prNumber}`;
}

/**
 * Check if cache entry is still valid
 */
function isCacheEntryValid(entry: JiraCacheEntry): boolean {
  const now = Date.now();
  return now - entry.timestamp < CACHE_DURATION;
}

/**
 * Get JIRA data from cache if available and valid
 */
export function getJiraDataFromCache(
  repoName: string,
  prNumber: number
): { jiraIssues: JiraIssue[]; jiraReferences: JiraIssueReference[] } | null {
  const cacheKey = generateCacheKey(repoName, prNumber);
  const entry = jiraCache.get(cacheKey);

  if (!entry) {
    console.log(`[JIRA Cache] No cache entry found for ${cacheKey}`);
    return null;
  }

  if (!isCacheEntryValid(entry)) {
    console.log(`[JIRA Cache] Cache entry expired for ${cacheKey}, removing`);
    jiraCache.delete(cacheKey);
    return null;
  }

  console.log(`[JIRA Cache] Cache hit for ${cacheKey}, returning cached data`);
  return {
    jiraIssues: entry.jiraIssues,
    jiraReferences: entry.jiraReferences,
  };
}

/**
 * Store JIRA data in cache
 */
export function setJiraDataInCache(
  repoName: string,
  prNumber: number,
  jiraIssues: JiraIssue[],
  jiraReferences: JiraIssueReference[]
): void {
  const cacheKey = generateCacheKey(repoName, prNumber);
  const entry: JiraCacheEntry = {
    jiraIssues,
    jiraReferences,
    timestamp: Date.now(),
    prNumber,
    repoName,
  };

  jiraCache.set(cacheKey, entry);
  console.log(
    `[JIRA Cache] Stored data for ${cacheKey} (${jiraIssues.length} issues)`
  );
}

/**
 * Clear all cached JIRA data
 */
export function clearJiraCache(): void {
  jiraCache.clear();
  console.log("[JIRA Cache] Cache cleared");
}

/**
 * Clear expired entries from cache
 */
export function cleanupJiraCache(): void {
  let cleanedCount = 0;

  for (const [key, entry] of jiraCache.entries()) {
    if (!isCacheEntryValid(entry)) {
      jiraCache.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`[JIRA Cache] Cleaned up ${cleanedCount} expired entries`);
  }
}

/**
 * Get cache statistics
 */
export function getJiraCacheStats(): {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
} {
  let validEntries = 0;
  let expiredEntries = 0;

  for (const entry of jiraCache.values()) {
    if (isCacheEntryValid(entry)) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }

  return {
    totalEntries: jiraCache.size,
    validEntries,
    expiredEntries,
  };
}

// Auto cleanup every 5 minutes
setInterval(cleanupJiraCache, 5 * 60 * 1000);
