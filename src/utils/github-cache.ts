/**
 * GitHub API Response Cache
 * Simple session-based caching for PR and commit details
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class GitHubCache {
  private cache = new Map<string, CacheItem<unknown>>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes cache TTL

  private generateKey(type: 'pr' | 'commit', repo: string, identifier: string | number): string {
    return `${type}:${repo}:${identifier}`;
  }

  private isExpired(item: CacheItem<unknown>): boolean {
    return Date.now() > item.expiresAt;
  }

  set<T>(type: 'pr' | 'commit', repo: string, identifier: string | number, data: T): void {
    const key = this.generateKey(type, repo, identifier);
    const now = Date.now();
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.TTL
    });
  }

  get<T>(type: 'pr' | 'commit', repo: string, identifier: string | number): T | null {
    const key = this.generateKey(type, repo, identifier);
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (this.isExpired(item)) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(type: 'pr' | 'commit', repo: string, identifier: string | number): boolean {
    const key = this.generateKey(type, repo, identifier);
    const item = this.cache.get(key);
    
    // Debug logging
    console.log(`🔍 Cache check: ${key} -> ${item ? 'EXISTS' : 'MISSING'}`);
    
    if (!item) {
      return false;
    }

    if (this.isExpired(item)) {
      console.log(`⏰ Cache expired: ${key}`);
      this.cache.delete(key);
      return false;
    }

    console.log(`✅ Cache hit: ${key}`);
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats for debugging
  getStats() {
    const valid = Array.from(this.cache.values()).filter(item => !this.isExpired(item));
    const expired = this.cache.size - valid.length;

    return {
      total: this.cache.size,
      valid: valid.length,
      expired,
      hitRate: valid.length / Math.max(this.cache.size, 1)
    };
  }
}

// Singleton instance
export const githubCache = new GitHubCache();

// Cleanup expired entries every 2 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    githubCache.cleanup();
  }, 2 * 60 * 1000);
}
