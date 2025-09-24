"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Database, Zap } from "lucide-react";

interface DemoResult {
  enhancedContext: string;
  sources: string[];
  searchResults: {
    commits: Array<Record<string, unknown>>;
    pullRequests: Array<Record<string, unknown>>;
    relevanceScores: Map<string, number>;
  };
  contextMetadata: {
    searchType: "enhanced" | "standard" | "hybrid";
    resultsCount: number;
    processingTime: number;
  };
}

export function EnhancedGitHubDemo() {
  const [query, setQuery] = useState("");
  const [repository, setRepository] = useState("PRM");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);

  const handleDemo = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // Simulate enhanced search (you can replace this with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock result for demo
      const mockResult: DemoResult = {
        enhancedContext: `## Enhanced Search Results for: "${query}"\n\n### Recent Relevant Commits (3 found)\n\n**1. feat: Add enhanced GitHub search capabilities**\n- **SHA:** abc12345\n- **Author:** john.doe\n- **Date:** ${new Date().toLocaleDateString()}\n- **Relevance Score:** 9.2\n- **Files Changed:** src/services/enhanced-github-context.ts, src/services/enhanced-github-chat.ts\n- **Changes:** +450 -12\n\n**2. refactor: Improve caching mechanism**\n- **SHA:** def67890\n- **Author:** jane.smith\n- **Date:** ${new Date().toLocaleDateString()}\n- **Relevance Score:** 8.7\n- **Files Changed:** src/utils/cache.ts\n- **Changes:** +120 -45`,
        sources: [
          "https://github.com/IBMSC/PRM/commits/abc12345",
          "https://github.com/IBMSC/PRM/commits/def67890",
        ],
        searchResults: {
          commits: [
            {
              sha: "abc12345",
              message: "feat: Add enhanced GitHub search capabilities",
            },
            { sha: "def67890", message: "refactor: Improve caching mechanism" },
          ],
          pullRequests: [],
          relevanceScores: new Map([
            ["commit-abc12345", 9.2],
            ["commit-def67890", 8.7],
          ]),
        },
        contextMetadata: {
          searchType: "enhanced",
          resultsCount: 2,
          processingTime: 1250,
        },
      };

      setResult(mockResult);
    } catch (error) {
      console.error("Demo error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Enhanced GitHub Search Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Repository</label>
              <Input
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
                placeholder="Enter repository name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Search Query</label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., 'recent commits about authentication'"
                onKeyDown={(e) => e.key === "Enter" && handleDemo()}
              />
            </div>
          </div>

          <Button
            onClick={handleDemo}
            disabled={isLoading || !query.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching with Enhanced Context...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Run Enhanced Search
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Search Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <Badge variant="outline" className="mb-2">
                    {result.contextMetadata.searchType.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-muted-foreground">Search Type</p>
                </div>
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">
                    {result.contextMetadata.resultsCount}
                  </Badge>
                  <p className="text-sm text-muted-foreground">Results Found</p>
                </div>
                <div className="text-center">
                  <Badge variant="default" className="mb-2">
                    {result.contextMetadata.processingTime}ms
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Processing Time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enhanced Context Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto">
                  {result.enhancedContext}
                </pre>
              </div>
            </CardContent>
          </Card>

          {result.sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sources ({result.sources.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.sources.map((source, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {index + 1}
                      </Badge>
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {source}
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How Enhanced Search Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Database className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h4 className="font-semibold">In-Memory Cache</h4>
                <p className="text-sm text-muted-foreground">
                  10-minute TTL for fast retrieval without persistent storage
                  overhead
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Search className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h4 className="font-semibold">Semantic Search</h4>
                <p className="text-sm text-muted-foreground">
                  Smart relevance scoring using Levenshtein distance algorithms
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <h4 className="font-semibold">Hybrid Approach</h4>
                <p className="text-sm text-muted-foreground">
                  Combines GitHub API + Search API with intelligent context
                  building
                </p>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Benefits:</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <strong>No persistent vector database</strong> - Avoids
                  server maintenance overhead
                </li>
                <li>
                  • <strong>Real-time data</strong> - Always current GitHub
                  information
                </li>
                <li>
                  • <strong>Smart caching</strong> - Reduces API calls while
                  maintaining freshness
                </li>
                <li>
                  • <strong>Relevance scoring</strong> - Better search results
                  with semantic similarity
                </li>
                <li>
                  • <strong>WatsonX.ai integration</strong> - Enhanced AI
                  responses with context
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
