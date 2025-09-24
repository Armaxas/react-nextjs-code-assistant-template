/**
 * Cached GitHub Dependency Service
 * Wrapper for GitHubDependencyAnalyzer with local storage caching
 */

import { useGitHubCache } from "@/hooks/use-github-cache";
import {
  githubDependencyAnalyzer,
  DependencyOptions,
  DependencyGraph,
  FileListResponse,
} from "./github-dependency-service";

/**
 * Hook for using cached GitHub dependency operations
 */
export function useCachedGitHubDependencyService() {
  const cache = useGitHubCache();
  const analyzer = githubDependencyAnalyzer;

  /**
   * List repository files with caching
   */
  const listRepositoryFiles = async (
    repository: string,
    organization: string = "IBMSC",
    forceRefresh: boolean = false
  ): Promise<FileListResponse> => {
    const cacheKey = `repo-files:${organization}:${repository}`;

    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      const cached = cache.getCachedRepository(cacheKey);
      if (cached) {
        console.log(`Cache hit for repository files: ${repository}`);
        return cached as FileListResponse;
      }
    }

    console.log(`Fetching repository files from API: ${repository}`);

    try {
      // Fetch from API
      const result = await analyzer.listRepositoryFiles(
        repository,
        organization
      );

      // Cache the result
      cache.setCachedRepository(
        cacheKey,
        result,
        cache.DEFAULT_TTL.REPOSITORY_LIST
      );

      return result;
    } catch (error) {
      console.error(
        `Error fetching repository files for ${repository}:`,
        error
      );
      throw error;
    }
  };

  /**
   * Analyze dependencies with caching
   */
  const analyzeDependencies = async (
    options: DependencyOptions,
    forceRefresh: boolean = false
  ): Promise<DependencyGraph> => {
    const cacheKey = `dependency-analysis:${options.targetRepo}:${options.targetFile}:${options.maxDepth || 2}:${options.includeMethodLevel ? "method" : "class"}`;

    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      const cached = cache.getCachedRepository(cacheKey);
      if (cached) {
        console.log(`Cache hit for dependency analysis: ${options.targetFile}`);
        return cached as DependencyGraph;
      }
    }

    console.log(
      `Performing dependency analysis from API: ${options.targetFile}`
    );

    try {
      // Perform analysis
      const result = await analyzer.analyzeDependencies(options);

      // Cache the result with longer TTL for dependency analysis
      cache.setCachedRepository(
        cacheKey,
        result,
        cache.DEFAULT_TTL.DEPENDENCY_ANALYSIS
      );

      return result;
    } catch (error) {
      console.error(
        `Error analyzing dependencies for ${options.targetFile}:`,
        error
      );
      throw error;
    }
  };

  /**
   * Invalidate cache for specific repository
   */
  const invalidateRepositoryCache = (repository: string) => {
    cache.invalidateRepositoryCache(repository);
    cache.invalidateContentsCache(repository);
    cache.invalidateFileCache(repository);
    // Also invalidate analyzer's internal cache
    analyzer.invalidateRepositoryCache(repository);
  };

  /**
   * Get cache statistics including analyzer's internal cache
   */
  const getCacheStats = () => {
    const localStorageStats = cache.getCacheStats();
    const analyzerStats = analyzer.getCacheStats();

    return {
      localStorage: localStorageStats,
      analyzer: analyzerStats,
      combined: {
        totalEntries:
          localStorageStats.repositories.total +
          localStorageStats.files.total +
          localStorageStats.contents.total +
          analyzerStats.contents.total +
          analyzerStats.fileContent.total +
          analyzerStats.classes +
          analyzerStats.analyzedFiles,
        totalExpired:
          localStorageStats.repositories.expired +
          localStorageStats.files.expired +
          localStorageStats.contents.expired +
          analyzerStats.contents.expired +
          analyzerStats.fileContent.expired,
      },
    };
  };

  /**
   * Clear all caches including analyzer's internal cache
   */
  const clearAllCaches = () => {
    cache.clearAllCaches();
    analyzer.clearAllCaches();
  };

  /**
   * Clean expired cache entries from both systems
   */
  const cleanExpiredEntries = () => {
    cache.cleanExpiredEntries();
    analyzer.cleanExpiredCaches();
  };

  return {
    listRepositoryFiles,
    analyzeDependencies,
    invalidateRepositoryCache,
    getCacheStats,
    clearAllCaches,
    cleanExpiredEntries,
    cache, // Expose cache object for advanced operations
  };
}

export default useCachedGitHubDependencyService;
