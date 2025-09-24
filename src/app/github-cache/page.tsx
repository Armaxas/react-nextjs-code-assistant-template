import { Metadata } from "next";
import { GitHubCacheDemo } from "@/components/github-cache-demo";
import { GitHubCacheManager } from "@/components/github-cache-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "GitHub Cache Optimization",
  description:
    "Performance improvements through intelligent caching of GitHub API calls",
};

export default function GitHubCachePage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          GitHub Cache Optimization
        </h1>
        <p className="text-muted-foreground text-lg">
          Demonstration of performance improvements through intelligent caching
          of GitHub API calls. This optimization reduces redundant API requests
          and significantly improves loading times.
        </p>
      </div>

      <Tabs defaultValue="demo" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="demo">Performance Demo</TabsTrigger>
          <TabsTrigger value="management">Cache Management</TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">
              Performance Improvements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <h3 className="font-medium text-green-600">✅ With Caching</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• First load: ~500-2000ms (API call)</li>
                  <li>• Subsequent loads: ~10-50ms (cache hit)</li>
                  <li>• Persistent across browser sessions</li>
                  <li>• Automatic expiration and cleanup</li>
                  <li>• Reduced API rate limit usage</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-red-600">❌ Without Caching</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Every load: ~500-2000ms (API call)</li>
                  <li>• No performance improvement</li>
                  <li>• Heavy API usage</li>
                  <li>• Slower user experience</li>
                  <li>• Higher rate limit consumption</li>
                </ul>
              </div>
            </div>
          </div>

          <GitHubCacheDemo />
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <GitHubCacheManager />
        </TabsContent>
      </Tabs>

      <div className="rounded-lg border bg-muted/50 p-6">
        <h2 className="text-lg font-semibold mb-3">Implementation Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-medium mb-2">Caching Layers</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                • <strong>Local Storage Cache:</strong> Persistent browser cache
                with TTL
              </li>
              <li>
                • <strong>In-Memory Cache:</strong> Fast session-based caching
              </li>
              <li>
                • <strong>API Response Cache:</strong> Caches GitHub API
                responses
              </li>
              <li>
                • <strong>File Content Cache:</strong> Caches downloaded file
                contents
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Cache Strategies</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                • <strong>TTL-based expiration:</strong> Automatic cleanup of
                stale data
              </li>
              <li>
                • <strong>Repository-level invalidation:</strong> Clear cache
                per repo
              </li>
              <li>
                • <strong>Intelligent cache keys:</strong> Unique keys for
                different contexts
              </li>
              <li>
                • <strong>Memory management:</strong> Prevents excessive memory
                usage
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
