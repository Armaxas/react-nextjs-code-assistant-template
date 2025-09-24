"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Trash2, BarChart3, Clock } from "lucide-react";
import { useCachedGitHubDependencyService } from "@/services/cached-github-dependency-service";

interface CacheStats {
  localStorage: {
    repositories: { total: number; expired: number; active: number };
    files: { total: number; expired: number; active: number };
    contents: { total: number; expired: number; active: number };
  };
  analyzer: {
    contents: { total: number; expired: number };
    fileContent: { total: number; expired: number };
    classes: number;
    analyzedFiles: number;
  };
  combined: {
    totalEntries: number;
    totalExpired: number;
  };
}

export function GitHubCacheManager() {
  const { getCacheStats, clearAllCaches, cleanExpiredEntries } =
    useCachedGitHubDependencyService();

  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshStats = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use setTimeout to defer the stats collection to avoid render-time state updates
      const newStats = await new Promise<CacheStats>((resolve) => {
        setTimeout(() => {
          resolve(getCacheStats());
        }, 0);
      });
      setStats(newStats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching cache stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getCacheStats]);

  const handleClearAllCaches = async () => {
    setIsLoading(true);
    try {
      clearAllCaches();
      await refreshStats();
    } catch (error) {
      console.error("Error clearing caches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanExpired = async () => {
    setIsLoading(true);
    try {
      cleanExpiredEntries();
      await refreshStats();
    } catch (error) {
      console.error("Error cleaning expired entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Defer initial stats loading to avoid render-time state updates
    const timer = setTimeout(() => {
      refreshStats();
    }, 100);

    return () => clearTimeout(timer);
  }, [refreshStats]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const calculateCacheEfficiency = () => {
    if (!stats) return 0;
    const { totalEntries, totalExpired } = stats.combined;
    if (totalEntries === 0) return 100;
    return Math.round(((totalEntries - totalExpired) / totalEntries) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            GitHub Cache Manager
          </h2>
          <p className="text-muted-foreground">
            Monitor and manage GitHub API caching for improved performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStats}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
          {lastUpdated && (
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Updated {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>

      {stats && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Cache Entries
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.combined.totalEntries}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.combined.totalExpired} expired entries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Cache Efficiency
                </CardTitle>
                <Badge
                  variant={
                    calculateCacheEfficiency() > 80 ? "default" : "secondary"
                  }
                >
                  {calculateCacheEfficiency()}%
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.combined.totalEntries - stats.combined.totalExpired}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active cache entries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Memory Usage
                </CardTitle>
                <Badge variant="outline">Estimated</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(stats.combined.totalEntries * 1024 * 2)}{" "}
                  {/* Rough estimate */}
                </div>
                <p className="text-xs text-muted-foreground">
                  Approximate cache size
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Cache Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Local Storage Cache */}
            <Card>
              <CardHeader>
                <CardTitle>Local Storage Cache</CardTitle>
                <CardDescription>
                  Persistent cache stored in browser local storage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Repository Lists</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {stats.localStorage.repositories.active}/
                        {stats.localStorage.repositories.total}
                      </Badge>
                      {stats.localStorage.repositories.expired > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {stats.localStorage.repositories.expired} expired
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">File Contents</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {stats.localStorage.files.active}/
                        {stats.localStorage.files.total}
                      </Badge>
                      {stats.localStorage.files.expired > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {stats.localStorage.files.expired} expired
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Directory Contents</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {stats.localStorage.contents.active}/
                        {stats.localStorage.contents.total}
                      </Badge>
                      {stats.localStorage.contents.expired > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {stats.localStorage.contents.expired} expired
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analyzer Cache */}
            <Card>
              <CardHeader>
                <CardTitle>Analyzer Cache</CardTitle>
                <CardDescription>
                  In-memory cache for dependency analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Contents Cache</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {stats.analyzer.contents.total -
                          stats.analyzer.contents.expired}
                        /{stats.analyzer.contents.total}
                      </Badge>
                      {stats.analyzer.contents.expired > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {stats.analyzer.contents.expired} expired
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">File Content Cache</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {stats.analyzer.fileContent.total -
                          stats.analyzer.fileContent.expired}
                        /{stats.analyzer.fileContent.total}
                      </Badge>
                      {stats.analyzer.fileContent.expired > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {stats.analyzer.fileContent.expired} expired
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Class Cache</span>
                    <Badge variant="outline">{stats.analyzer.classes}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Analyzed Files</span>
                    <Badge variant="outline">
                      {stats.analyzer.analyzedFiles}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cache Management Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Cache Management</CardTitle>
              <CardDescription>
                Actions to manage and optimize cache performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button
                  variant="outline"
                  onClick={handleCleanExpired}
                  disabled={isLoading || stats.combined.totalExpired === 0}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Clean Expired ({stats.combined.totalExpired})</span>
                </Button>

                <Button
                  variant="destructive"
                  onClick={handleClearAllCaches}
                  disabled={isLoading || stats.combined.totalEntries === 0}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear All Caches</span>
                </Button>
              </div>

              <Separator className="my-4" />

              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Clean Expired:</strong> Removes only expired cache
                  entries to free up space while preserving valid data.
                </p>
                <p>
                  <strong>Clear All Caches:</strong> Removes all cached data.
                  Next API calls will be slower but will fetch fresh data.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
