"use client";

import { useCallback } from "react";
import useLocalStorage from "./use-local-storage";

// Cache interfaces
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface GitHubRepositoryCache {
  [repoKey: string]: CacheEntry<unknown>;
}

interface GitHubFileCache {
  [fileKey: string]: CacheEntry<string>;
}

interface GitHubContentsCache {
  [contentsKey: string]: CacheEntry<unknown[]>;
}

// Cache configuration
const DEFAULT_TTL = {
  REPOSITORY_LIST: 5 * 60 * 1000, // 5 minutes
  FILE_CONTENTS: 30 * 60 * 1000, // 30 minutes
  DIRECTORY_CONTENTS: 10 * 60 * 1000, // 10 minutes
  DEPENDENCY_ANALYSIS: 60 * 60 * 1000, // 1 hour
};

/**
 * Enhanced GitHub caching hook with TTL support and cache invalidation
 */
export function useGitHubCache() {
  const [repositoryCache, setRepositoryCache] =
    useLocalStorage<GitHubRepositoryCache>("github-dependency-repo-cache", {});
  const [fileCache, setFileCache] = useLocalStorage<GitHubFileCache>(
    "github-dependency-file-cache",
    {}
  );
  const [contentsCache, setContentsCache] =
    useLocalStorage<GitHubContentsCache>(
      "github-dependency-contents-cache",
      {}
    );

  // Helper function to check if cache entry is expired
  const isExpired = useCallback((entry: CacheEntry<unknown>): boolean => {
    return Date.now() - entry.timestamp > entry.ttl;
  }, []);

  // Repository caching methods
  const getCachedRepository = useCallback(
    (repoKey: string) => {
      const entry = repositoryCache[repoKey];
      if (entry && !isExpired(entry)) {
        return entry.data;
      }
      return null;
    },
    [repositoryCache, isExpired]
  );

  const setCachedRepository = useCallback(
    (
      repoKey: string,
      data: unknown,
      ttl: number = DEFAULT_TTL.REPOSITORY_LIST
    ) => {
      setRepositoryCache((prev) => ({
        ...prev,
        [repoKey]: {
          data,
          timestamp: Date.now(),
          ttl,
        },
      }));
    },
    [setRepositoryCache]
  );

  // File content caching methods
  const getCachedFileContent = useCallback(
    (fileKey: string) => {
      const entry = fileCache[fileKey];
      if (entry && !isExpired(entry)) {
        return entry.data;
      }
      return null;
    },
    [fileCache, isExpired]
  );

  const setCachedFileContent = useCallback(
    (
      fileKey: string,
      content: string,
      ttl: number = DEFAULT_TTL.FILE_CONTENTS
    ) => {
      setFileCache((prev) => ({
        ...prev,
        [fileKey]: {
          data: content,
          timestamp: Date.now(),
          ttl,
        },
      }));
    },
    [setFileCache]
  );

  // Directory contents caching methods
  const getCachedContents = useCallback(
    (contentsKey: string) => {
      const entry = contentsCache[contentsKey];
      if (entry && !isExpired(entry)) {
        return entry.data;
      }
      return null;
    },
    [contentsCache, isExpired]
  );

  const setCachedContents = useCallback(
    (
      contentsKey: string,
      contents: unknown[],
      ttl: number = DEFAULT_TTL.DIRECTORY_CONTENTS
    ) => {
      setContentsCache((prev) => ({
        ...prev,
        [contentsKey]: {
          data: contents,
          timestamp: Date.now(),
          ttl,
        },
      }));
    },
    [setContentsCache]
  );

  // Cache invalidation methods
  const invalidateRepositoryCache = useCallback(
    (repoPattern?: string) => {
      if (repoPattern) {
        setRepositoryCache((prev) => {
          const filtered = { ...prev };
          Object.keys(filtered).forEach((key) => {
            if (key.includes(repoPattern)) {
              delete filtered[key];
            }
          });
          return filtered;
        });
      } else {
        setRepositoryCache({});
      }
    },
    [setRepositoryCache]
  );

  const invalidateFileCache = useCallback(
    (filePattern?: string) => {
      if (filePattern) {
        setFileCache((prev) => {
          const filtered = { ...prev };
          Object.keys(filtered).forEach((key) => {
            if (key.includes(filePattern)) {
              delete filtered[key];
            }
          });
          return filtered;
        });
      } else {
        setFileCache({});
      }
    },
    [setFileCache]
  );

  const invalidateContentsCache = useCallback(
    (contentsPattern?: string) => {
      if (contentsPattern) {
        setContentsCache((prev) => {
          const filtered = { ...prev };
          Object.keys(filtered).forEach((key) => {
            if (key.includes(contentsPattern)) {
              delete filtered[key];
            }
          });
          return filtered;
        });
      } else {
        setContentsCache({});
      }
    },
    [setContentsCache]
  );

  // Clear all caches
  const clearAllCaches = useCallback(() => {
    setRepositoryCache({});
    setFileCache({});
    setContentsCache({});
  }, [setRepositoryCache, setFileCache, setContentsCache]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    // Create a snapshot of the current cache state to avoid accessing state during computation
    const repoSnapshot = { ...repositoryCache };
    const fileSnapshot = { ...fileCache };
    const contentsSnapshot = { ...contentsCache };

    const repoEntries = Object.keys(repoSnapshot).length;
    const fileEntries = Object.keys(fileSnapshot).length;
    const contentsEntries = Object.keys(contentsSnapshot).length;

    // Count expired entries
    const expiredRepoEntries =
      Object.values(repoSnapshot).filter(isExpired).length;
    const expiredFileEntries =
      Object.values(fileSnapshot).filter(isExpired).length;
    const expiredContentsEntries =
      Object.values(contentsSnapshot).filter(isExpired).length;

    return {
      repositories: {
        total: repoEntries,
        expired: expiredRepoEntries,
        active: repoEntries - expiredRepoEntries,
      },
      files: {
        total: fileEntries,
        expired: expiredFileEntries,
        active: fileEntries - expiredFileEntries,
      },
      contents: {
        total: contentsEntries,
        expired: expiredContentsEntries,
        active: contentsEntries - expiredContentsEntries,
      },
    };
  }, [repositoryCache, fileCache, contentsCache, isExpired]);

  // Clean expired entries
  const cleanExpiredEntries = useCallback(() => {
    // Clean repository cache
    setRepositoryCache((prev) => {
      const cleaned = { ...prev };
      Object.keys(cleaned).forEach((key) => {
        if (isExpired(cleaned[key])) {
          delete cleaned[key];
        }
      });
      return cleaned;
    });

    // Clean file cache
    setFileCache((prev) => {
      const cleaned = { ...prev };
      Object.keys(cleaned).forEach((key) => {
        if (isExpired(cleaned[key])) {
          delete cleaned[key];
        }
      });
      return cleaned;
    });

    // Clean contents cache
    setContentsCache((prev) => {
      const cleaned = { ...prev };
      Object.keys(cleaned).forEach((key) => {
        if (isExpired(cleaned[key])) {
          delete cleaned[key];
        }
      });
      return cleaned;
    });
  }, [setRepositoryCache, setFileCache, setContentsCache, isExpired]);

  return {
    // Repository cache methods
    getCachedRepository,
    setCachedRepository,

    // File cache methods
    getCachedFileContent,
    setCachedFileContent,

    // Contents cache methods
    getCachedContents,
    setCachedContents,

    // Cache invalidation methods
    invalidateRepositoryCache,
    invalidateFileCache,
    invalidateContentsCache,
    clearAllCaches,

    // Cache management
    getCacheStats,
    cleanExpiredEntries,

    // TTL constants
    DEFAULT_TTL,
  };
}

export default useGitHubCache;
