"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Zap } from "lucide-react";
import { useCachedGitHubDependencyService } from "@/services/cached-github-dependency-service";
import type { FileListResponse } from "@/services/github-dependency-service";

export function GitHubCacheDemo() {
  const { listRepositoryFiles, getCacheStats } =
    useCachedGitHubDependencyService();

  const [repository, setRepository] = useState("salesforce-samples");
  const [organization, setOrganization] = useState("IBMSC");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<FileListResponse | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [cacheHit, setCacheHit] = useState<boolean | null>(null);

  const testRepositoryFetch = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setCacheHit(null);

    const startTime = performance.now();

    // Capture console logs to detect cache hits
    const originalConsoleLog = console.log;
    let hitDetected = false;

    console.log = (...args) => {
      const message = args.join(" ");
      if (message.includes("Cache hit for repository files")) {
        hitDetected = true;
      }
      originalConsoleLog(...args);
    };

    try {
      const result = await listRepositoryFiles(
        repository,
        organization,
        forceRefresh
      );
      const endTime = performance.now();

      setResults(result);
      setLoadTime(endTime - startTime);
      setCacheHit(hitDetected && !forceRefresh);
    } catch (error) {
      console.error("Error fetching repository files:", error);
    } finally {
      console.log = originalConsoleLog; // Restore original console.log
      setIsLoading(false);
    }
  };

  const stats = getCacheStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>GitHub Cache Performance Demo</span>
          </CardTitle>
          <CardDescription>
            Test the caching improvements for GitHub API calls. First call will
            fetch from API, subsequent calls will use cached data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="IBMSC"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repository">Repository</Label>
              <Input
                id="repository"
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
                placeholder="salesforce-samples"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => testRepositoryFetch(false)}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>Fetch Files (Use Cache)</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => testRepositoryFetch(true)}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>Fetch Files (Force Refresh)</span>
            </Button>
          </div>

          {/* Performance Results */}
          {loadTime !== null && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Load Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadTime.toFixed(0)}ms
                  </div>
                  <Badge
                    variant={
                      loadTime < 100
                        ? "default"
                        : loadTime < 500
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {loadTime < 100
                      ? "Fast"
                      : loadTime < 500
                        ? "Medium"
                        : "Slow"}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Cache Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {cacheHit ? "HIT" : "MISS"}
                  </div>
                  <Badge variant={cacheHit ? "default" : "secondary"}>
                    {cacheHit ? "From Cache" : "From API"}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {results?.totalCount || 0}
                  </div>
                  <Badge variant="outline">Files Found</Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {/* File Type Breakdown */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">File Type Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {results.files.apex.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Apex Files
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {results.files.lwc.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      LWC Files
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">
                      {results.files.test.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Test Files
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-600">
                      {results.files.other.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Other Files
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Cache Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Current Cache Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">
                    {stats.localStorage.repositories.active}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Cached Repos
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold">
                    {stats.analyzer.contents.total}
                  </div>
                  <div className="text-sm text-muted-foreground">API Cache</div>
                </div>
                <div>
                  <div className="text-lg font-bold">
                    {stats.analyzer.fileContent.total}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    File Cache
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold">
                    {stats.combined.totalEntries}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Entries
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
