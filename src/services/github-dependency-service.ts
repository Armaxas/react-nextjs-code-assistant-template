/**
 * GitHub Dependency Service - Optimized Salesforce-Focused Analysis
 * Provides intelligent dependency analysis using GitHub Search API and Salesforce patterns
 */

import { getGitHubAccessToken } from "@/actions/github-actions";
import { GitHubContent } from "@/actions/github-actions";
import { WatsonxLLM } from "@langchain/community/llms/ibm";
import { PromptTemplate } from "@langchain/core/prompts";
import { getServerDefaultModel } from "@/lib/models-config";

// Salesforce-specific dependency patterns for intelligent analysis
interface SalesforceDependencyPattern {
  type: string;
  priority: "critical" | "high" | "medium" | "low";
  patterns: string[];
  searchQuery: string;
  description: string;
}

const SALESFORCE_DEPENDENCY_PATTERNS: SalesforceDependencyPattern[] = [
  {
    type: "Apex Class",
    priority: "critical",
    patterns: [
      "extends\\s+([A-Za-z_][A-Za-z0-9_]*)",
      "implements\\s+([A-Za-z_][A-Za-z0-9_,\\s]*)",
      "new\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\(",
    ],
    searchQuery: "extension:cls",
    description: "Critical Apex class dependencies and inheritance",
  },
  {
    type: "Lightning Component",
    priority: "critical",
    patterns: [
      "<c:([A-Za-z_][A-Za-z0-9_]*)",
      "<lightning:([A-Za-z_][A-Za-z0-9_]*)",
      'implements="([^"]*)"',
    ],
    searchQuery: "extension:cmp OR extension:js",
    description: "Lightning Web Components and Aura components",
  },
  {
    type: "Custom Objects/Fields",
    priority: "high",
    patterns: ["[A-Za-z_][A-Za-z0-9_]*__c", "[A-Za-z_][A-Za-z0-9_]*__r"],
    searchQuery: "extension:object OR extension:field",
    description: "Custom objects, fields, and relationships",
  },
  {
    type: "Flows/Process Builder",
    priority: "high",
    patterns: [
      "Flow\\.Interview\\.[A-Za-z_][A-Za-z0-9_]*",
      "Process\\.[A-Za-z_][A-Za-z0-9_]*",
    ],
    searchQuery: "extension:flow",
    description: "Salesforce Flow and Process Builder dependencies",
  },
  {
    type: "Triggers",
    priority: "critical",
    patterns: [
      "trigger\\s+([A-Za-z_][A-Za-z0-9_]*)\\s+on\\s+([A-Za-z_][A-Za-z0-9_]*)",
    ],
    searchQuery: "extension:trigger",
    description: "Apex triggers and their target objects",
  },
  {
    type: "Test Classes",
    priority: "medium",
    patterns: ["@IsTest", "Test\\.startTest\\(\\)", "System\\.runAs\\("],
    searchQuery: "extension:cls @IsTest",
    description: "Test classes and test coverage",
  },
  {
    type: "Batch/Scheduled Jobs",
    priority: "high",
    patterns: [
      "implements\\s+Database\\.Batchable",
      "implements\\s+Schedulable",
      "System\\.schedule\\(",
    ],
    searchQuery: "Batchable OR Schedulable",
    description: "Batch jobs and scheduled processes",
  },
  {
    type: "REST/SOAP APIs",
    priority: "high",
    patterns: [
      "@RestResource",
      "@HttpGet",
      "@HttpPost",
      "webservice\\s+static",
    ],
    searchQuery: "@RestResource OR webservice",
    description: "REST and SOAP API endpoints",
  },
];

// Performance optimization: Enhanced caching with expiration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // in milliseconds
}

class PerformanceCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.expiresIn) {
        this.cache.delete(key);
      }
    }
  }
}

// Global performance cache instance
const performanceCache = new PerformanceCache();

// GitHub Search API result interface
interface GitHubSearchResult {
  items?: Array<{
    path: string;
    html_url: string;
    repository?: {
      full_name: string;
    };
    text_matches?: Array<{
      object_url: string;
      object_type: string;
      property: string;
      fragment: string;
      matches: Array<{
        text: string;
        indices: [number, number];
      }>;
    }>;
  }>;
  total_count?: number;
}

// GitHub Search API Integration for optimized dependency discovery
class GitHubSearchService {
  private accessToken: string | null = null;
  private searchCache = new Map<string, GitHubSearchResult>();
  private apiBase: string;

  constructor() {
    this.apiBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    console.log(
      `🔍 GitHubSearchService constructor - API base: ${this.apiBase}`
    );
    console.log(`🔍 GITHUB_URL env var: ${process.env.GITHUB_URL}`);
  }

  async initialize(): Promise<void> {
    this.accessToken = await getGitHubAccessToken();
    console.log(
      `🔍 GitHubSearchService initialized with API base: ${this.apiBase}`
    );
    console.log(`🔍 Token preview: ${this.accessToken?.substring(0, 20)}...`);

    // Test if search API is accessible
    await this.testSearchAPI();
  }

  /**
   * Test if the search API is accessible with current token
   */
  private async testSearchAPI(): Promise<void> {
    try {
      // Use a valid search query with actual text content
      const testUrl = `${this.apiBase}/search/code?q=class+extension:cls&per_page=1`;
      console.log(`🔍 Testing search API endpoint: ${testUrl}`);

      const response = await fetch(testUrl, {
        headers: {
          Authorization: `token ${this.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (response.ok) {
        console.log(`✅ Search API test successful`);
      } else {
        console.warn(
          `⚠️ Search API test failed: ${response.status} ${response.statusText}`
        );
        const errorText = await response.text();
        console.warn(`⚠️ Error details: ${errorText}`);
      }
    } catch (error) {
      console.error(`❌ Search API test error:`, error);
    }
  }

  /**
   * Smart search using GitHub Search API for Salesforce dependencies
   * This replaces the brute-force file scanning approach
   */
  async searchSalesforceDependencies(
    searchRepository: string,
    targetFile: string,
    targetFileRepository: string,
    patterns: SalesforceDependencyPattern[]
  ): Promise<{ nodes: DependencyNode[]; links: DependencyLink[] }> {
    if (!this.accessToken) await this.initialize();

    const nodes: DependencyNode[] = [];
    const links: DependencyLink[] = [];
    const seenFiles = new Set<string>();

    // Extract the class/component name from target file
    const targetName = this.extractSalesforceIdentifier(targetFile);

    for (const pattern of patterns) {
      if (pattern.priority === "low") continue; // Skip low priority for performance

      try {
        // Smart search query construction - search in searchRepository
        const searchQuery = `repo:${searchRepository} ${pattern.searchQuery} ${targetName}`;
        const cacheKey = `search:${searchQuery}`;

        console.log(
          `🔍 Searching with query: "${searchQuery}" for pattern: ${pattern.type}`
        );

        let searchResults = this.searchCache.get(cacheKey);
        if (!searchResults) {
          searchResults = await this.executeGitHubSearch(searchQuery);
          if (searchResults) {
            this.searchCache.set(cacheKey, searchResults);
          }
        }

        // Process search results efficiently
        if (searchResults && searchResults.items) {
          for (const item of searchResults.items) {
            const nodeId = `${searchRepository}:${item.path}`;
            if (seenFiles.has(nodeId)) continue;
            seenFiles.add(nodeId);

            // Check if node already exists in nodes array
            const existingNode = nodes.find((n) => n.id === nodeId);
            if (!existingNode) {
              const node: DependencyNode = {
                id: nodeId,
                name: this.extractFileBaseName(item.path),
                path: item.path,
                type: this.inferSalesforceType(item.path, pattern.type),
                repo: searchRepository,
                url: item.html_url,
              };

              nodes.push(node);
            }

            // Extract code snippet from search results
            let codeSnippet: string | undefined;
            if (item.text_matches && item.text_matches.length > 0) {
              // Get the first meaningful text match
              const match = item.text_matches[0];
              if (match.fragment) {
                codeSnippet = match.fragment.trim();
              }
            }

            // Create intelligent links based on content analysis
            const linkType = this.inferLinkType(pattern.type, item.path);
            if (linkType) {
              // Check if this exact link already exists
              const existingLink = links.find(
                (l) =>
                  l.source === `${targetFileRepository}:${targetFile}` &&
                  l.target === nodeId &&
                  l.type === linkType
              );

              if (!existingLink) {
                links.push({
                  source: `${targetFileRepository}:${targetFile}`,
                  target: nodeId,
                  type: linkType,
                  strength: this.calculateLinkStrength(pattern.priority),
                  codeSnippet,
                });
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Search failed for pattern ${pattern.type}:`, error);
      }
    }

    return { nodes, links };
  }

  /**
   * Execute GitHub Search API call with proper error handling
   */
  private async executeGitHubSearch(
    query: string
  ): Promise<GitHubSearchResult | undefined> {
    const searchUrl = `${this.apiBase}/search/code?q=${encodeURIComponent(query)}&per_page=50`;

    console.log(`🔍 GitHub Search API URL: ${searchUrl}`);
    console.log(`🔍 Token preview: ${this.accessToken?.substring(0, 10)}...`);

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `token ${this.accessToken}`,
        Accept: "application/vnd.github.v3.text-match+json",
      },
    });

    if (!response.ok) {
      console.error(`❌ GitHub Search API failed:`, {
        status: response.status,
        statusText: response.statusText,
        url: searchUrl,
        headers: response.headers,
      });

      // Try to get more details from the response
      try {
        const errorBody = await response.text();
        console.error(`❌ Error response body:`, errorBody);
      } catch {
        console.error(`❌ Could not read error response body`);
      }

      throw new Error(
        `GitHub Search API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Extract Salesforce identifier (class name, component name, etc.)
   */
  private extractSalesforceIdentifier(filePath: string): string {
    const baseName = filePath.split("/").pop() || "";
    return baseName.replace(/\.(cls|trigger|cmp|js|css|xml)$/i, "");
  }

  /**
   * Infer Salesforce-specific type from file path and pattern
   */
  private inferSalesforceType(
    filePath: string,
    patternType: string
  ): "apex" | "lwc" | "test" | "other" {
    const extension = filePath.split(".").pop()?.toLowerCase();
    const fileName = filePath.toLowerCase();

    if (extension === "cls") {
      if (fileName.includes("test") || patternType === "Test Classes")
        return "test";
      return "apex";
    }
    if (extension === "js" || extension === "cmp") return "lwc";
    return "other";
  }

  /**
   * Infer link type based on Salesforce patterns
   */
  private inferLinkType(
    patternType: string,
    sourcePath: string
  ): DependencyLink["type"] | null {
    switch (patternType) {
      case "Apex Class":
        return sourcePath.includes("test") ? "tests" : "references";
      case "Lightning Component":
        return "wire";
      case "Triggers":
        return "trigger-context";
      case "Custom Objects/Fields":
        return "schema-reference";
      default:
        return "references";
    }
  }

  /**
   * Calculate link strength based on dependency priority
   */
  private calculateLinkStrength(priority: string): number {
    switch (priority) {
      case "critical":
        return 1.0;
      case "high":
        return 0.8;
      case "medium":
        return 0.6;
      case "low":
        return 0.4;
      default:
        return 0.5;
    }
  }

  /**
   * Extract base name from file path
   */
  private extractFileBaseName(filePath: string): string {
    return filePath.split("/").pop() || filePath;
  }
}

// Global search service instance
const gitHubSearchService = new GitHubSearchService();

// Performance metrics tracking
interface PerformanceMetrics {
  analysisStartTime: number;
  filesFetched: number;
  filesAnalyzed?: number; // Add this for display purposes
  cacheHits: number;
  cacheMisses: number;
  apiCalls: number;
  totalFiles: number;
  dependenciesFound: number;
  dependentsFound: number;
}

// Define interfaces for dependency analysis
export interface DependencyNode {
  id: string;
  name: string;
  path: string;
  type: "apex" | "lwc" | "test" | "other";
  size?: number;
  repo: string;
  url?: string;
  // New fields for enhanced analysis
  methods?: string[]; // List of methods in the class
  properties?: string[]; // List of properties/fields
  isInterface?: boolean;
  isAbstract?: boolean;
  namespace?: string;
  content?: string; // Store content for AI analysis
}

export interface DependencyLink {
  source: string;
  target: string;
  type:
    | "import"
    | "extends"
    | "implements"
    | "references"
    | "tests"
    | "method-call"
    | "wire"
    | "imperative-apex"
    | "soql-query"
    | "database-operation"
    | "schema-reference"
    | "field-reference"
    | "trigger-context"
    | "system-method"
    | "custom-settings"
    | "wire-service";
  strength: number; // 1-10 scale indicating strength of relationship
  // New fields for method-level tracking
  sourceMethod?: string;
  targetMethod?: string;
  details?: string; // Additional context about the dependency
  lineNumber?: number; // Line number where dependency occurs
  // Enhanced fields for better UX
  codeSnippet?: string; // The actual code line where dependency occurs
  contextLines?: string[]; // Surrounding lines for better context
  fileName?: string; // Source file name for display
  targetFileName?: string; // Target file name for display
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  links: DependencyLink[];
  metadata: {
    repositories: string[];
    timestamp: string;
    nodeCount: number;
    linkCount: number;
    crossRepoLinkCount?: number;
    analyzedFile: string; // The file that was analyzed
    analysisDepth: number; // How many levels deep the analysis went
  };
}

export interface DependencyOptions {
  repositories: string[]; // Repositories to search for dependencies
  targetFile: string; // The specific file to analyze
  targetRepo: string; // The repository containing the target file
  fileTypes?: ("apex" | "lwc" | "test" | "other")[];
  maxDepth?: number; // How many levels of dependencies to analyze
  includeMethodLevel?: boolean; // Include method-level analysis
  includeContent?: boolean; // Include file content for AI analysis
  selectedModel?: string; // Selected AI model for insights generation
}

// Interface for file listing
export interface FileListItem {
  name: string;
  path: string;
  type: "apex" | "lwc" | "test" | "other";
  size: number;
  url: string;
  repo: string;
}

export interface FileListResponse {
  files: {
    apex: FileListItem[];
    lwc: FileListItem[];
    test: FileListItem[];
    other: FileListItem[];
  };
  totalCount: number;
}

// GitHub Tree API interfaces
export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url?: string;
}

class GitHubDependencyAnalyzer {
  private apiBase: string;
  private token: string | null = null;
  private classCache: Map<string, DependencyNode> = new Map();
  private analyzedFiles: Set<string> = new Set();

  // Enhanced caching for API calls
  private contentsCache: Map<
    string,
    { data: unknown[]; timestamp: number; ttl: number }
  > = new Map();
  private fileContentCache: Map<
    string,
    { data: string; timestamp: number; ttl: number }
  > = new Map();

  // Rate limiting and request management
  private requestQueue: Array<() => Promise<unknown>> = [];
  private activeRequests: number = 0;
  private maxConcurrentRequests: number = 2; // Reduced to be gentler on GitHub Enterprise
  private requestDelay: number = 500; // Increased delay to 500ms between requests
  private lastRequestTime: number = 0;

  // Performance metrics tracking
  private metrics: PerformanceMetrics = {
    analysisStartTime: 0,
    filesFetched: 0,
    cacheHits: 0,
    cacheMisses: 0,
    apiCalls: 0,
    totalFiles: 0,
    dependenciesFound: 0,
    dependentsFound: 0,
  };

  // Cache TTL constants (in milliseconds)
  private readonly CACHE_TTL = {
    CONTENTS: 10 * 60 * 1000, // 10 minutes for directory contents
    FILE_CONTENT: 30 * 60 * 1000, // 30 minutes for file content
    METADATA: 5 * 60 * 1000, // 5 minutes for file metadata
  };

  // Performance optimization: Batch processing config
  private readonly BATCH_SIZE = 10; // Process files in batches
  private readonly MAX_CONCURRENT_REQUESTS = 5; // Limit concurrent API calls

  constructor() {
    this.apiBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";
  }

  /**
   * Rate limiting: Add request to queue and process with delay
   */

  /**
   * Enhanced GitHub request with retry logic and better error handling
   */
  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const queuedRequest = async () => {
        try {
          // Enforce minimum delay between requests
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          if (timeSinceLastRequest < this.requestDelay) {
            await new Promise((resolve) =>
              setTimeout(resolve, this.requestDelay - timeSinceLastRequest)
            );
          }

          this.lastRequestTime = Date.now();
          this.activeRequests++;

          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      };

      if (this.activeRequests < this.maxConcurrentRequests) {
        queuedRequest();
      } else {
        this.requestQueue.push(queuedRequest);
      }
    });
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    if (
      this.requestQueue.length > 0 &&
      this.activeRequests < this.maxConcurrentRequests
    ) {
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isCacheExpired(entry: { timestamp: number; ttl: number }): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Get cached contents if available and not expired
   */
  private getCachedContents(key: string): unknown[] | null {
    const entry = this.contentsCache.get(key);
    if (entry && !this.isCacheExpired(entry)) {
      return entry.data;
    }
    return null;
  }

  /**
   * Cache contents with TTL
   */
  private setCachedContents(
    key: string,
    data: unknown[],
    ttl: number = this.CACHE_TTL.CONTENTS
  ): void {
    this.contentsCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get cached file content if available and not expired
   */
  private getCachedFileContent(key: string): string | null {
    const entry = this.fileContentCache.get(key);
    if (entry && !this.isCacheExpired(entry)) {
      return entry.data;
    }
    return null;
  }

  /**
   * Cache file content with TTL
   */
  private setCachedFileContent(
    key: string,
    content: string,
    ttl: number = this.CACHE_TTL.FILE_CONTENT
  ): void {
    this.fileContentCache.set(key, {
      data: content,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear expired cache entries
   */
  private clearExpiredCaches(): void {
    // Clear expired contents cache
    for (const [key, entry] of this.contentsCache.entries()) {
      if (this.isCacheExpired(entry)) {
        this.contentsCache.delete(key);
      }
    }

    // Clear expired file content cache
    for (const [key, entry] of this.fileContentCache.entries()) {
      if (this.isCacheExpired(entry)) {
        this.fileContentCache.delete(key);
      }
    }
  }

  /**
   * Parse repository name to handle both "repo" and "org/repo" formats
   */
  private parseRepositoryName(
    repoInput: string,
    defaultOrg: string
  ): { organization: string; repository: string } {
    if (repoInput.includes("/")) {
      const [org, repo] = repoInput.split("/");
      return { organization: org, repository: repo };
    } else {
      return { organization: defaultOrg, repository: repoInput };
    }
  }

  private async ensureAuthentication(): Promise<boolean> {
    if (!this.token) {
      this.token = await getGitHubAccessToken();
    }
    return !!this.token;
  }

  private async makeGitHubRequest(
    url: string,
    retryCount: number = 0
  ): Promise<unknown> {
    if (!(await this.ensureAuthentication())) {
      throw new Error("GitHub authentication required");
    }

    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s

    // Use rate limiting for all GitHub requests
    return this.queueRequest(async () => {
      console.log(
        `Making GitHub API request (attempt ${retryCount + 1}): ${url}`
      );
      this.metrics.apiCalls++;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // Increased to 20 second timeout

      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/vnd.github.v3+json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 403) {
            console.warn(
              `Rate limit hit for URL: ${url}, retrying after delay...`
            );
            await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay for rate limit
            // Retry once after rate limit
            const retryResponse = await fetch(url, {
              headers: {
                Authorization: `Bearer ${this.token}`,
                Accept: "application/vnd.github.v3+json",
              },
            });
            if (!retryResponse.ok) {
              throw new Error(
                `GitHub API error after retry: ${retryResponse.status}`
              );
            }
            return retryResponse.json();
          }
          throw new Error(
            `GitHub API error: ${response.status} - ${response.statusText}`
          );
        }

        return response.json();
      } catch (error) {
        clearTimeout(timeoutId);

        // Check if we should retry for specific errors
        const shouldRetry =
          retryCount < maxRetries &&
          error instanceof Error &&
          (error.name === "AbortError" || // Timeout
            error.message.includes("ECONNRESET") || // Connection reset
            error.message.includes("ECONNREFUSED") || // Connection refused
            error.message.includes("Connect Timeout") || // Timeout
            error.message.includes("fetch failed")); // General fetch failure

        if (shouldRetry) {
          console.warn(
            `Request failed (attempt ${retryCount + 1}/${maxRetries + 1}), retrying in ${retryDelay}ms:`,
            error instanceof Error ? error.message : error
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return this.makeGitHubRequest(url, retryCount + 1);
        }

        // Final failure
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            throw new Error(
              `Request timeout for URL: ${url} after ${maxRetries + 1} attempts`
            );
          }
          throw new Error(
            `Network error for URL ${url} after ${maxRetries + 1} attempts: ${error.message}`
          );
        }
        throw error;
      }
    });
  }

  /**
   * List all Salesforce files in a repository using Git Tree API
   */
  async listRepositoryFiles(
    repository: string,
    organization: string = "IBMSC"
  ): Promise<FileListResponse> {
    // Periodically clean expired cache entries
    this.clearExpiredCaches();

    const { organization: repoOrg, repository: repoName } =
      this.parseRepositoryName(repository, organization);

    const cacheKey = `tree:${repoOrg}:${repoName}`;

    // Check cache first for tree structure
    const cachedTree = this.getCachedContents(cacheKey);
    if (cachedTree) {
      console.log(`Cache hit for repository tree: ${repoOrg}/${repoName}`);
      return this.processTreeToFileList(
        cachedTree as GitHubTreeItem[],
        repoOrg,
        repoName
      );
    }

    try {
      console.log(`Fetching repository tree from API: ${repoOrg}/${repoName}`);

      // Get default branch first
      const repoInfo = (await this.makeGitHubRequest(
        `${this.apiBase}/repos/${repoOrg}/${repoName}`
      )) as { default_branch: string };

      // Fetch the complete tree using Git Tree API with recursive=1
      const treeUrl = `${this.apiBase}/repos/${repoOrg}/${repoName}/git/trees/${repoInfo.default_branch}?recursive=1`;
      const treeResponse = (await this.makeGitHubRequest(treeUrl)) as {
        tree: GitHubTreeItem[];
        truncated: boolean;
      };

      if (treeResponse.truncated) {
        console.warn(
          `Repository ${repoOrg}/${repoName} tree was truncated. Some files may not be visible.`
        );
      }

      // Cache the tree structure
      this.setCachedContents(cacheKey, treeResponse.tree);

      return this.processTreeToFileList(treeResponse.tree, repoOrg, repoName);
    } catch (error) {
      console.error(`Error fetching repository tree for ${repoName}:`, error);

      // Fallback to the old method if tree API fails
      return this.listRepositoryFilesLegacy(repository, organization);
    }
  }

  /**
   * Process GitHub tree items into our file list format
   */
  private processTreeToFileList(
    treeItems: GitHubTreeItem[],
    repoOrg: string,
    repoName: string
  ): FileListResponse {
    const files: FileListResponse = {
      files: {
        apex: [],
        lwc: [],
        test: [],
        other: [],
      },
      totalCount: 0,
    };

    // Filter for Salesforce files in relevant paths
    const salesforceFiles = treeItems.filter(
      (item) => item.type === "blob" && this.isSalesforceFile(item.path)
    );

    const baseUrl = this.apiBase.replace("/api/v3", "");

    salesforceFiles.forEach((item) => {
      const fileType = this.detectFileType(
        item.path.split("/").pop() || "",
        item.path
      );
      const fileInfo: FileListItem = {
        name: item.path.split("/").pop() || "",
        path: item.path,
        type: fileType,
        size: item.size || 0,
        url: `${baseUrl}/${repoOrg}/${repoName}/blob/main/${item.path}`,
        repo: `${repoOrg}/${repoName}`,
      };

      files.files[fileType].push(fileInfo);
      files.totalCount++;
    });

    // Sort files by name within each category
    Object.keys(files.files).forEach((key) => {
      files.files[key as keyof typeof files.files].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });

    console.log(
      `Processed ${files.totalCount} Salesforce files from tree structure`
    );
    return files;
  }

  /**
   * Check if a file path is a Salesforce-related file
   */
  private isSalesforceFile(path: string): boolean {
    const salesforcePaths = [
      "force-app/main/default/classes/",
      "force-app/main/default/lwc/",
      "force-app/main/default/triggers/",
      "force-app/main/default/aura/",
      "force-app/main/default/components/",
      "src/classes/",
      "src/lwc/",
      "src/triggers/",
      "src/aura/",
      "src/components/",
      // Test paths
      "force-app/test/",
      "src/test/",
    ];

    return (
      salesforcePaths.some((sfPath) => path.includes(sfPath)) &&
      (path.endsWith(".cls") ||
        path.endsWith(".trigger") ||
        path.endsWith(".js") ||
        path.endsWith(".html") ||
        path.endsWith(".css") ||
        path.endsWith(".xml") ||
        path.endsWith(".cmp") ||
        path.endsWith(".evt") ||
        path.endsWith(".app") ||
        path.endsWith(".intf"))
    );
  }

  /**
   * Legacy method for listing repository files (fallback)
   */
  private async listRepositoryFilesLegacy(
    repository: string,
    organization: string = "IBMSC"
  ): Promise<FileListResponse> {
    const { organization: repoOrg, repository: repoName } =
      this.parseRepositoryName(repository, organization);

    const files: FileListResponse = {
      files: {
        apex: [],
        lwc: [],
        test: [],
        other: [],
      },
      totalCount: 0,
    };

    // Salesforce paths to check
    const pathsToCheck = [
      "force-app/main/default/classes",
      "force-app/main/default/lwc",
      "force-app/main/default/triggers",
      "force-app/main/default/aura",
      "src/classes",
      "src/lwc",
      "src/triggers",
      "src/aura",
    ];

    for (const path of pathsToCheck) {
      try {
        const contents = await this.fetchRepositoryContents(
          repoOrg,
          repoName,
          path
        );

        for (const item of contents) {
          if (item.type === "file" && !item.name.endsWith("-meta.xml")) {
            const fileType = this.detectFileType(item.name, item.path);
            const fileItem: FileListItem = {
              name: item.name,
              path: item.path,
              type: fileType,
              size: item.size,
              url: item.html_url,
              repo: repository,
            };

            files.files[fileType].push(fileItem);
            files.totalCount++;
          } else if (item.type === "dir" && path.includes("/lwc")) {
            // For LWC, we need to go one level deeper - with enhanced error handling
            try {
              console.log(`Fetching LWC component directory: ${item.path}`);
              const componentContents = await this.fetchRepositoryContents(
                repoOrg,
                repoName,
                item.path
              );

              let processedComponents = 0;
              for (const componentFile of componentContents) {
                if (
                  componentFile.type === "file" &&
                  !componentFile.name.endsWith("-meta.xml")
                ) {
                  const fileType = this.detectFileType(
                    componentFile.name,
                    componentFile.path
                  );
                  const fileItem: FileListItem = {
                    name: `${item.name}/${componentFile.name}`,
                    path: componentFile.path,
                    type: fileType,
                    size: componentFile.size,
                    url: componentFile.html_url,
                    repo: repository,
                  };

                  files.files[fileType].push(fileItem);
                  files.totalCount++;
                  processedComponents++;
                }
              }
              console.log(
                `Successfully processed ${processedComponents} files from LWC component: ${item.path}`
              );
            } catch (error) {
              console.warn(
                `Failed to fetch LWC component ${item.path}:`,
                error
              );
              // Continue processing other components even if one fails
            }
          }
        }
      } catch {
        // Path doesn't exist, continue to next
        continue;
      }
    }

    // Sort files by name
    Object.keys(files.files).forEach((key) => {
      files.files[key as keyof typeof files.files].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });

    return files;
  }

  /**
   * Analyze dependencies for a specific file
   */
  async analyzeDependencies(
    options: DependencyOptions
  ): Promise<DependencyGraph> {
    const {
      repositories,
      targetFile,
      targetRepo,
      maxDepth = 2,
      includeMethodLevel = true,
      includeContent = false,
    } = options;

    // Log cache stats before analysis
    const cacheStatsBefore = this.getCacheStats();
    console.log(`File content cache before analysis:`, {
      total: cacheStatsBefore.fileContent.total,
      expired: cacheStatsBefore.fileContent.expired,
    });

    // Clear caches for new analysis (but preserve file content cache)
    this.classCache.clear();
    this.analyzedFiles.clear();
    // Note: fileContentCache is intentionally NOT cleared to preserve downloaded file content

    const nodes: DependencyNode[] = [];
    const links: DependencyLink[] = [];
    const nodeMap = new Map<string, DependencyNode>();

    // Parse target repository
    const { organization: targetOrg, repository: targetRepoName } =
      this.parseRepositoryName(targetRepo, "IBMSC");

    // First, get the metadata for the target file
    const targetFileMetadata = await this.fetchFileMetadata(
      targetOrg,
      targetRepoName,
      targetFile
    );
    if (!targetFileMetadata || !targetFileMetadata.download_url) {
      throw new Error(`Could not fetch metadata for file: ${targetFile}`);
    }

    // Fetch the content of the target file
    const targetFileContent = await this.fetchFileContent(
      targetFileMetadata.download_url
    );
    if (!targetFileContent) {
      throw new Error(`Could not fetch content for file: ${targetFile}`);
    }

    // Create node for target file
    const targetNode: DependencyNode = {
      id: `${targetRepo}:${targetFile}`,
      name: targetFile.split("/").pop() || targetFile,
      path: targetFile,
      type: this.detectFileType(targetFile, targetFile),
      repo: targetRepo,
      url: targetFileMetadata.html_url,
      content: includeContent ? targetFileContent : undefined,
    };

    // Extract metadata for target file
    if (targetNode.type === "apex" || targetNode.type === "test") {
      targetNode.methods = this.extractMethods(targetFileContent);
      targetNode.properties = this.extractProperties(targetFileContent);
      targetNode.isInterface = /\binterface\s+\w+/.test(targetFileContent);
      targetNode.isAbstract = /\babstract\s+class/.test(targetFileContent);
    }

    nodes.push(targetNode);
    nodeMap.set(targetNode.id, targetNode);
    this.analyzedFiles.add(targetNode.id);

    // Analyze dependencies for the target file
    await this.analyzeFileDependencies(
      targetFileContent,
      targetNode,
      repositories,
      nodes,
      links,
      nodeMap,
      includeMethodLevel,
      includeContent,
      0,
      maxDepth
    );

    // ENHANCEMENT: Find dependents - files that depend on the target file
    console.log(
      `🔍 Searching for dependents of ${targetFile} across repositories...`
    );
    await this.findDependents(
      targetNode,
      repositories,
      nodes,
      links,
      nodeMap,
      includeMethodLevel,
      includeContent
    );

    // Enhanced cross-repo analysis with relationship mapping
    const crossRepoAnalysis = await this.analyzecrossRepositoryRelationships(
      links,
      nodeMap,
      repositories
    );

    // Count cross-repo links with enhanced detection
    const crossRepoLinkCount = crossRepoAnalysis.crossRepoLinks.length;

    // Log detailed cross-repo analysis
    if (crossRepoLinkCount > 0) {
      console.log(
        `📊 Cross-repository analysis found ${crossRepoLinkCount} cross-repo dependencies:`,
        {
          relationships: crossRepoAnalysis.relationships,
          sharedComponents: crossRepoAnalysis.sharedComponents,
        }
      );
    }

    // Log cache stats after analysis
    const cacheStatsAfter = this.getCacheStats();
    console.log(`File content cache after analysis:`, {
      total: cacheStatsAfter.fileContent.total,
      expired: cacheStatsAfter.fileContent.expired,
    });

    return {
      nodes,
      links,
      metadata: {
        repositories,
        timestamp: new Date().toISOString(),
        nodeCount: nodes.length,
        linkCount: links.length,
        crossRepoLinkCount,
        analyzedFile: targetFile,
        analysisDepth: maxDepth,
      },
    };
  }

  /**
   * Enhanced cross-repository relationship analysis
   */
  private async analyzecrossRepositoryRelationships(
    links: DependencyLink[],
    nodeMap: Map<string, DependencyNode>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _repositories: string[]
  ): Promise<{
    crossRepoLinks: DependencyLink[];
    relationships: Map<string, Set<string>>;
    sharedComponents: string[];
  }> {
    const crossRepoLinks = links.filter((link) => {
      const sourceNode = nodeMap.get(link.source);
      const targetNode = nodeMap.get(link.target);
      return sourceNode && targetNode && sourceNode.repo !== targetNode.repo;
    });

    // Build repository relationship map
    const relationships = new Map<string, Set<string>>();
    crossRepoLinks.forEach((link) => {
      const sourceNode = nodeMap.get(link.source);
      const targetNode = nodeMap.get(link.target);
      if (sourceNode && targetNode) {
        if (!relationships.has(sourceNode.repo)) {
          relationships.set(sourceNode.repo, new Set());
        }
        relationships.get(sourceNode.repo)!.add(targetNode.repo);
      }
    });

    // Find shared components (files with same name across repos)
    const componentsByName = new Map<string, Set<string>>();
    Array.from(nodeMap.values()).forEach((node) => {
      if (!componentsByName.has(node.name)) {
        componentsByName.set(node.name, new Set());
      }
      componentsByName.get(node.name)!.add(node.repo);
    });

    const sharedComponents = Array.from(componentsByName.entries())
      .filter(([, repos]) => repos.size > 1)
      .map(([name]) => name);

    return {
      crossRepoLinks,
      relationships,
      sharedComponents,
    };
  }

  /**
   * Analyze dependencies for a file recursively
   */
  private async analyzeFileDependencies(
    content: string,
    currentNode: DependencyNode,
    repositories: string[],
    nodes: DependencyNode[],
    links: DependencyLink[],
    nodeMap: Map<string, DependencyNode>,
    includeMethodLevel: boolean,
    includeContent: boolean,
    currentDepth: number,
    maxDepth: number
  ): Promise<void> {
    if (currentDepth >= maxDepth) return;

    const dependencies = await this.extractDependencies(
      content,
      currentNode,
      repositories,
      includeMethodLevel
    );

    // Process each dependency
    for (const dep of dependencies) {
      // Check if we've already processed this dependency
      if (this.analyzedFiles.has(dep.targetId)) {
        // Just add the link
        links.push(dep.link);
        continue;
      }

      // Try to find the dependency file
      const depFile = await this.findDependencyFile(
        dep.targetClass,
        repositories
      );

      if (depFile) {
        // Create node for dependency
        const depNode: DependencyNode = {
          id: dep.targetId,
          name: depFile.name,
          path: depFile.path,
          type: depFile.type,
          repo: depFile.repo,
          url: depFile.url,
          content: includeContent ? depFile.content : undefined,
        };

        // Extract metadata
        if (
          depFile.content &&
          (depNode.type === "apex" || depNode.type === "test")
        ) {
          depNode.methods = this.extractMethods(depFile.content);
          depNode.properties = this.extractProperties(depFile.content);
          depNode.isInterface = /\binterface\s+\w+/.test(depFile.content);
          depNode.isAbstract = /\babstract\s+class/.test(depFile.content);
        }

        nodes.push(depNode);
        nodeMap.set(depNode.id, depNode);
        this.analyzedFiles.add(depNode.id);

        // Update link with actual target
        dep.link.target = depNode.id;
        links.push(dep.link);

        // Recursively analyze this dependency
        if (depFile.content) {
          await this.analyzeFileDependencies(
            depFile.content,
            depNode,
            repositories,
            nodes,
            links,
            nodeMap,
            includeMethodLevel,
            includeContent,
            currentDepth + 1,
            maxDepth
          );
        }
      } else {
        // Create placeholder node
        const placeholderNode: DependencyNode = {
          id: dep.targetId,
          name: dep.targetClass,
          path: dep.targetClass,
          type: "apex",
          repo: currentNode.repo,
        };

        if (!nodeMap.has(placeholderNode.id)) {
          nodes.push(placeholderNode);
          nodeMap.set(placeholderNode.id, placeholderNode);
        }

        links.push(dep.link);
      }
    }
  }

  /**
   * Extract all dependencies from file content
   */
  private async extractDependencies(
    content: string,
    currentNode: DependencyNode,
    repositories: string[],
    includeMethodLevel: boolean
  ): Promise<
    Array<{ targetClass: string; targetId: string; link: DependencyLink }>
  > {
    const dependencies: Array<{
      targetClass: string;
      targetId: string;
      link: DependencyLink;
    }> = [];
    const sourceId = currentNode.id;

    console.log(
      `🔍 Extracting dependencies from ${currentNode.name} (${currentNode.type})`
    );
    console.log(`📄 Content preview:`, content.substring(0, 200) + "...");

    if (currentNode.type === "apex" || currentNode.type === "test") {
      // Extract extends relationships
      const extendsMatch = content.match(
        /\b(?:class|interface)\s+\w+\s+extends\s+([A-Za-z0-9_.<>]+)/
      );
      if (extendsMatch) {
        const parentClass = extendsMatch[1].split("<")[0].trim();
        console.log(`🔗 Found extends relationship: ${parentClass}`);
        dependencies.push({
          targetClass: parentClass,
          targetId: `${currentNode.repo}:${parentClass}`,
          link: {
            source: sourceId,
            target: `${currentNode.repo}:${parentClass}`,
            type: "extends",
            strength: 9,
          },
        });
      }

      // Extract implements relationships
      const implementsMatch = content.match(
        /\bimplements\s+([\w\s,.<>]+?)(?:\s*\{|$)/m
      );
      if (implementsMatch) {
        const interfaces = implementsMatch[1]
          .split(",")
          .map((i) => i.trim().split("<")[0]);
        console.log(`🔗 Found implements relationships:`, interfaces);
        interfaces.forEach((interfaceName) => {
          dependencies.push({
            targetClass: interfaceName,
            targetId: `${currentNode.repo}:${interfaceName}`,
            link: {
              source: sourceId,
              target: `${currentNode.repo}:${interfaceName}`,
              type: "implements",
              strength: 8,
            },
          });
        });
      }

      if (includeMethodLevel) {
        // Extract method calls
        const methodCalls = this.extractMethodCalls(content);
        console.log(
          `🔗 Found ${methodCalls.length} method calls:`,
          methodCalls.slice(0, 5)
        );
        methodCalls.forEach(
          ({
            className,
            methodName,
            sourceMethod,
            lineNumber,
            codeSnippet,
            contextLines,
          }) => {
            if (!this.isSystemClass(className)) {
              dependencies.push({
                targetClass: className,
                targetId: `${currentNode.repo}:${className}`,
                link: {
                  source: sourceId,
                  target: `${currentNode.repo}:${className}`,
                  type: "method-call",
                  strength: 6,
                  sourceMethod,
                  targetMethod: methodName,
                  details: `${sourceMethod || "unknown"} calls ${className}.${methodName}`,
                  lineNumber,
                  codeSnippet,
                  contextLines,
                  fileName: currentNode.name,
                  targetFileName: `${className}.cls`,
                },
              });
            }
          }
        );
      }

      // Extract static references
      const staticRefs = content.matchAll(
        /\b([A-Z][A-Za-z0-9_]*)\s*\.\s*([a-zA-Z][A-Za-z0-9_]*)\s*(?:\(|;|,|\s)/g
      );
      const staticRefArray = Array.from(staticRefs);
      console.log(
        `🔗 Found ${staticRefArray.length} static references:`,
        staticRefArray.slice(0, 5).map((m) => `${m[1]}.${m[2]}`)
      );

      for (const match of staticRefArray) {
        const targetClass = match[1];
        if (
          !this.isSystemClass(targetClass) &&
          targetClass !== currentNode.name.replace(".cls", "")
        ) {
          dependencies.push({
            targetClass,
            targetId: `${currentNode.repo}:${targetClass}`,
            link: {
              source: sourceId,
              target: `${currentNode.repo}:${targetClass}`,
              type: "references",
              strength: 5,
              details: `References ${targetClass}.${match[2]}`,
            },
          });
        }
      }

      // Extract type references
      const typeRefs = this.extractTypeReferences(content);
      console.log(
        `🔗 Found ${typeRefs.length} type references:`,
        typeRefs.slice(0, 5)
      );
      typeRefs.forEach((targetClass) => {
        if (targetClass !== currentNode.name.replace(".cls", "")) {
          dependencies.push({
            targetClass,
            targetId: `${currentNode.repo}:${targetClass}`,
            link: {
              source: sourceId,
              target: `${currentNode.repo}:${targetClass}`,
              type: "references",
              strength: 4,
            },
          });
        }
      });
    } else if (currentNode.type === "lwc") {
      // Extract LWC dependencies
      const lwcDeps = await this.extractLWCDependencies(content, currentNode);
      console.log(
        `🔗 Found ${lwcDeps.length} LWC dependencies:`,
        lwcDeps.slice(0, 5).map((d) => d.targetClass)
      );
      dependencies.push(...lwcDeps);
    }

    // Remove duplicates
    const uniqueDeps = new Map<string, (typeof dependencies)[0]>();
    dependencies.forEach((dep) => {
      const key = `${dep.targetClass}-${dep.link.type}`;
      if (
        !uniqueDeps.has(key) ||
        dep.link.strength > uniqueDeps.get(key)!.link.strength
      ) {
        uniqueDeps.set(key, dep);
      }
    });

    const finalDeps = Array.from(uniqueDeps.values());
    console.log(
      `📊 Final dependencies extracted: ${finalDeps.length}`,
      finalDeps.map((d) => `${d.targetClass} (${d.link.type})`)
    );

    return finalDeps;
  }

  /**
   * Extract LWC dependencies
   */
  private async extractLWCDependencies(
    content: string,
    currentNode: DependencyNode
  ): Promise<
    Array<{ targetClass: string; targetId: string; link: DependencyLink }>
  > {
    const dependencies: Array<{
      targetClass: string;
      targetId: string;
      link: DependencyLink;
    }> = [];
    const sourceId = currentNode.id;

    if (currentNode.path.endsWith(".js")) {
      // Extract ES6 imports
      const importMatches = content.matchAll(
        /import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/g
      );

      for (const match of importMatches) {
        const importPath = match[1];

        if (importPath.startsWith("@salesforce/apex/")) {
          // Apex class import
          const apexClass = importPath.split("/").pop();
          if (apexClass) {
            const [className, methodName] = apexClass.split(".");
            dependencies.push({
              targetClass: className,
              targetId: `${currentNode.repo}:${className}`,
              link: {
                source: sourceId,
                target: `${currentNode.repo}:${className}`,
                type: "imperative-apex",
                strength: 10,
                targetMethod: methodName,
                details: methodName
                  ? `Imports ${className}.${methodName}`
                  : `Imports ${className}`,
              },
            });
          }
        } else if (importPath.startsWith("c/")) {
          // LWC component import
          const componentName = importPath.replace("c/", "");
          dependencies.push({
            targetClass: componentName,
            targetId: `${currentNode.repo}:lwc/${componentName}`,
            link: {
              source: sourceId,
              target: `${currentNode.repo}:lwc/${componentName}`,
              type: "import",
              strength: 9,
              details: `Imports LWC component ${componentName}`,
            },
          });
        }
      }

      // Extract @wire decorators
      const wireMatches = content.matchAll(
        /@wire\s*\(\s*(\w+)(?:\s*,\s*{[^}]+})?\s*\)/g
      );
      for (const match of wireMatches) {
        const wireName = match[1];

        // Check if it's an Apex method
        const apexWireMatch = content.match(
          new RegExp(
            `import\\s+${wireName}\\s+from\\s+['"]@salesforce/apex/([^'"]+)['"]/`
          )
        );
        if (apexWireMatch) {
          const [apexClass, apexMethod] = apexWireMatch[1].split(".");
          dependencies.push({
            targetClass: apexClass,
            targetId: `${currentNode.repo}:${apexClass}`,
            link: {
              source: sourceId,
              target: `${currentNode.repo}:${apexClass}`,
              type: "wire",
              strength: 10,
              targetMethod: apexMethod,
              details: `@wire to ${apexClass}.${apexMethod}`,
            },
          });
        }
      }
    }

    return dependencies;
  }

  /**
   * Process files in batches for better performance
   */
  private async processBatchedFileAnalysis(
    filesToCheck: FileListItem[],
    targetClassName: string,
    targetNode: DependencyNode,
    repository: string,
    nodes: DependencyNode[],
    links: DependencyLink[],
    nodeMap: Map<string, DependencyNode>,
    includeMethodLevel: boolean,
    includeContent: boolean
  ): Promise<void> {
    // Filter out files that don't need processing
    const filesToProcess = filesToCheck.filter((file) => {
      if (file.path === targetNode.path && file.repo === targetNode.repo) {
        return false; // Skip target file itself
      }

      const fileId = `${repository}:${file.path}`;
      return !this.analyzedFiles.has(fileId); // Skip already analyzed files
    });

    console.log(
      `   📦 Processing ${filesToProcess.length} files in batches of ${this.BATCH_SIZE}`
    );

    // Process files in batches
    for (let i = 0; i < filesToProcess.length; i += this.BATCH_SIZE) {
      const batch = filesToProcess.slice(i, i + this.BATCH_SIZE);
      const batchPromises = batch.map((file, index) =>
        this.analyzeFileForDependencies(
          file,
          targetClassName,
          targetNode,
          repository,
          includeMethodLevel,
          includeContent,
          index + i + 1, // Progress counter
          filesToProcess.length
        )
      );

      // Limit concurrent requests to avoid rate limiting
      const results = await this.limitConcurrency(
        batchPromises,
        this.MAX_CONCURRENT_REQUESTS
      );

      // Process successful results
      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          const { dependentNode, dependencies } = result.value;

          // Add node if not already present
          if (!nodeMap.has(dependentNode.id)) {
            nodes.push(dependentNode);
            nodeMap.set(dependentNode.id, dependentNode);
            this.analyzedFiles.add(dependentNode.id);
            this.metrics.dependentsFound++;

            console.log(
              `   ✅ Found dependent: ${dependentNode.name} -> ${targetClassName}`
            );
          }

          // Add all dependency links
          dependencies.forEach((dep) => {
            links.push(dep.link);
          });
        }
      });

      // Update metrics
      this.metrics.filesFetched += batch.length;

      // Small delay between batches to be respectful to API
      if (i + this.BATCH_SIZE < filesToProcess.length) {
        await this.delay(100); // 100ms delay
      }
    }
  }

  /**
   * Analyze a single file for dependencies with performance tracking
   */
  private async analyzeFileForDependencies(
    file: FileListItem,
    targetClassName: string,
    targetNode: DependencyNode,
    repository: string,
    includeMethodLevel: boolean,
    includeContent: boolean,
    progress: number,
    total: number
  ): Promise<{
    dependentNode: DependencyNode;
    dependencies: Array<{ link: DependencyLink }>;
  } | null> {
    const fileId = `${repository}:${file.path}`;

    try {
      // Performance tracking
      const startTime = Date.now();

      // Check cache first
      const cachedResult = performanceCache.get<string>(
        `file-content:${fileId}`
      );
      let content: string;

      if (cachedResult) {
        content = cachedResult;
        this.metrics.cacheHits++;
      } else {
        // Get file content from API
        const { organization, repository: repoName } = this.parseRepositoryName(
          repository,
          "IBMSC"
        );

        // Get file metadata from GitHub API
        const fileDataArray = await this.fetchRepositoryContents(
          organization,
          repoName,
          file.path
        );
        if (!fileDataArray || fileDataArray.length === 0) return null;

        const fileData = fileDataArray[0];
        if (!fileData || fileData.type !== "file") return null;

        // Get file content
        const fetchedContent = await this.fetchFileContent(
          fileData.download_url
        );
        if (!fetchedContent) return null;
        content = fetchedContent;

        // Cache the content
        performanceCache.set(
          `file-content:${fileId}`,
          content,
          this.CACHE_TTL.FILE_CONTENT
        );
        this.metrics.cacheMisses++;
        this.metrics.apiCalls++;
      }

      // Check if this file depends on the target
      const dependencies = await this.checkFileDependsOnTarget(
        content,
        targetClassName,
        targetNode,
        file,
        repository,
        includeMethodLevel
      );

      if (dependencies.length === 0) {
        return null; // No dependencies found
      }

      // Create node for this dependent file
      const dependentNode: DependencyNode = {
        id: fileId,
        name: file.name,
        path: file.path,
        type: file.type,
        repo: repository,
        content: includeContent ? content : undefined,
      };

      // Extract metadata if it's an Apex file
      if (
        (dependentNode.type === "apex" || dependentNode.type === "test") &&
        content
      ) {
        dependentNode.methods = this.extractMethods(content);
        dependentNode.properties = this.extractProperties(content);
        dependentNode.isInterface = /\binterface\s+\w+/.test(content);
        dependentNode.isAbstract = /\babstract\s+class/.test(content);
      }

      // Performance logging
      const duration = Date.now() - startTime;
      if (progress % 10 === 0) {
        // Log progress every 10 files
        console.log(
          `   📊 Progress: ${progress}/${total} files analyzed (${duration}ms)`
        );
      }

      return { dependentNode, dependencies };
    } catch (error) {
      console.warn(`   ⚠️ Error checking file ${file.path}:`, error);
      return null;
    }
  }

  /**
   * Limit concurrent promise execution
   */
  private async limitConcurrency<T>(
    promises: Promise<T>[],
    limit: number
  ): Promise<PromiseSettledResult<T>[]> {
    const results: PromiseSettledResult<T>[] = [];

    for (let i = 0; i < promises.length; i += limit) {
      const batch = promises.slice(i, i + limit);
      const batchResults = await Promise.allSettled(batch);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate AI-enhanced analysis insights using WatsonX
   */
  private async generateAnalysisInsights(
    nodes: DependencyNode[],
    links: DependencyLink[],
    crossRepoAnalysis: {
      crossRepoLinks: DependencyLink[];
      relationships: Map<string, Set<string>>;
      sharedComponents: string[];
    },
    targetFile: string,
    targetFileRepository: string,
    selectedModel?: string
  ): Promise<{
    complexityScore: number;
    riskFactors: string[];
    recommendations: string[];
    patterns: string[];
    aiInsights?: string;
  }> {
    const insights = {
      complexityScore: 0,
      riskFactors: [] as string[],
      recommendations: [] as string[],
      patterns: [] as string[],
      aiInsights: undefined as string | undefined,
    };

    // Calculate complexity score based on various factors
    const nodeCount = nodes.length;
    const linkCount = links.length;
    const crossRepoCount = crossRepoAnalysis.crossRepoLinks.length;

    // Complexity scoring algorithm
    insights.complexityScore = Math.min(
      100,
      nodeCount * 2 +
        linkCount * 1.5 +
        crossRepoCount * 5 +
        crossRepoAnalysis.sharedComponents.length * 3
    );

    // Identify risk factors
    if (crossRepoCount > 0) {
      insights.riskFactors.push(
        `${crossRepoCount} cross-repository dependencies detected`
      );
    }

    if (linkCount > nodeCount * 3) {
      insights.riskFactors.push(
        "High coupling detected - many dependencies per component"
      );
    }

    if (crossRepoAnalysis.sharedComponents.length > 0) {
      insights.riskFactors.push(
        `${crossRepoAnalysis.sharedComponents.length} components with duplicate names across repositories`
      );
    }

    // Analyze dependency patterns
    const methodCallLinks = links.filter((l) => l.type === "method-call");
    const soqlLinks = links.filter((l) => l.type === "soql-query");
    const testLinks = links.filter((l) => l.type === "tests");
    const databaseLinks = links.filter((l) => l.type === "database-operation");
    const schemaLinks = links.filter((l) => l.type === "schema-reference");
    const triggerLinks = links.filter((l) => l.type === "trigger-context");

    if (methodCallLinks.length > 0) {
      insights.patterns.push(
        `${methodCallLinks.length} direct method calls identified`
      );
    }

    if (soqlLinks.length > 0) {
      insights.patterns.push(
        `${soqlLinks.length} SOQL queries found - database dependencies`
      );
    }

    if (testLinks.length > 0) {
      insights.patterns.push(`${testLinks.length} test coverage dependencies`);
    }

    if (databaseLinks.length > 0) {
      insights.patterns.push(
        `${databaseLinks.length} database operations detected`
      );
    }

    if (schemaLinks.length > 0) {
      insights.patterns.push(`${schemaLinks.length} schema references found`);
    }

    if (triggerLinks.length > 0) {
      insights.patterns.push(
        `${triggerLinks.length} trigger context usages identified`
      );
    }

    // Generate AI insights using WatsonX directly with enhanced context
    try {
      // Build detailed dependency context
      const dependencyDetails = {
        targetFile: targetFile,
        targetRepository: targetFileRepository,
        incomingDependencies: links
          .filter((link) => link.target.includes(targetFile))
          .map((link) => ({
            source: link.source,
            type: link.type,
            details: link.details || "Direct dependency",
          })),
        outgoingDependencies: links
          .filter((link) => link.source.includes(targetFile))
          .map((link) => ({
            target: link.target,
            type: link.type,
            details: link.details || "Uses component",
          })),
        crossRepoConnections: crossRepoAnalysis.crossRepoLinks.map((link) => ({
          source: link.source,
          target: link.target,
          relationship: link.type,
        })),
      };

      const analysisData = {
        statistics: {
          totalFiles: nodeCount,
          totalDependencies: linkCount,
          crossRepositoryLinks: crossRepoCount,
          sharedComponents: crossRepoAnalysis.sharedComponents.length,
          complexityScore: insights.complexityScore,
        },
        patterns: {
          methodCalls: methodCallLinks.length,
          soqlQueries: soqlLinks.length,
          databaseOperations: databaseLinks.length,
          schemaReferences: schemaLinks.length,
          triggerContexts: triggerLinks.length,
          testCoverage: testLinks.length,
        },
        riskFactors: insights.riskFactors,
        repositoryRelationships: Array.from(
          crossRepoAnalysis.relationships.entries()
        ).map(([repo, deps]) => ({
          repository: repo,
          dependencies: Array.from(deps),
        })),
        dependencyDetails,
      };

      const promptTemplate = `You are a senior Salesforce architect analyzing dependencies for a specific file. Provide contextual insights based on the actual dependency relationships discovered.

Target File Analysis: ${dependencyDetails.targetFile}
Repository: ${dependencyDetails.targetRepository}

Dependency Context:
- Files that depend on this file: ${dependencyDetails.incomingDependencies.length}
- Files this file depends on: ${dependencyDetails.outgoingDependencies.length}
- Cross-repository connections: ${dependencyDetails.crossRepoConnections.length}

Specific Dependencies Found:
${
  dependencyDetails.incomingDependencies.length > 0
    ? `INCOMING (files that use ${targetFile}):\n` +
      dependencyDetails.incomingDependencies
        .slice(0, 5)
        .map((dep) => `- ${dep.source} (${dep.type}): ${dep.details}`)
        .join("\n")
    : "No incoming dependencies found"
}

${
  dependencyDetails.outgoingDependencies.length > 0
    ? `\nOUTGOING (files used by ${targetFile}):\n` +
      dependencyDetails.outgoingDependencies
        .slice(0, 5)
        .map((dep) => `- ${dep.target} (${dep.type}): ${dep.details}`)
        .join("\n")
    : "No outgoing dependencies found"
}

Overall Statistics:
- Total Files in Analysis: ${analysisData.statistics.totalFiles}
- Total Dependencies: ${analysisData.statistics.totalDependencies}
- Cross-Repository Links: ${analysisData.statistics.crossRepositoryLinks}
- Complexity Score: ${analysisData.statistics.complexityScore}/100

Dependency Patterns:
- Method Calls: ${analysisData.patterns.methodCalls}
- SOQL Queries: ${analysisData.patterns.soqlQueries}
- Database Operations: ${analysisData.patterns.databaseOperations}
- Schema References: ${analysisData.patterns.schemaReferences}
- Test Coverage: ${analysisData.patterns.testCoverage}

Risk Factors:
${analysisData.riskFactors.map((risk: string) => `- ${risk}`).join("\n")}

Please provide a targeted analysis specifically for ${targetFile}:

**🎯 File-Specific Insights:**
- Analyze the role of ${targetFile} in the codebase architecture
- Identify if this file is a critical dependency or highly coupled component
- Comment on the specific dependency patterns found for this file

**⚠️ Impact Assessment:**
- Evaluate potential impact of changes to ${targetFile}
- Identify cascade effects based on incoming dependencies
- Assess architectural risks specific to this file's dependencies

**🔧 Targeted Recommendations:**
- Provide specific recommendations for ${targetFile}
- Focus on dependency optimization and maintainability
- Suggest refactoring opportunities if high coupling is detected

**📊 Dependency Management:**
- Recommend strategies for managing this file's dependencies
- Suggest monitoring approaches for dependency changes
- Identify opportunities to reduce coupling or improve modularity

Focus on actionable insights that help developers understand and manage the dependencies of ${targetFile} specifically.`;

      const prompt = PromptTemplate.fromTemplate(promptTemplate);
      const formattedPrompt = await prompt.format({});

      const model = new WatsonxLLM({
        model: selectedModel || getServerDefaultModel(),
        watsonxAIAuthType: "iam",
        watsonxAIApikey: process.env.WATSONX_API_KEY || "", // pragma: allowlist secret
        serviceUrl: "https://us-south.ml.cloud.ibm.com",
        projectId: process.env.WATSONX_PROJECT_ID || "",
        version: "2023-05-29",
        maxNewTokens: 1500,
        minNewTokens: 300,
        temperature: 0.3,
        topP: 0.9,
      });

      const aiResult = await model.invoke(formattedPrompt);

      if (aiResult && aiResult.trim()) {
        insights.aiInsights = aiResult.trim();
        console.log("✨ AI insights generated successfully using WatsonX");
      } else {
        console.warn("❌ WatsonX returned empty insights, using fallback");
      }
    } catch (error) {
      console.warn("Failed to generate AI insights:", error);
      // Continue with manual insights as fallback
    }

    // Generate recommendations (fallback logic)
    if (insights.complexityScore > 70) {
      insights.recommendations.push(
        "Consider refactoring to reduce complexity"
      );
    }

    if (crossRepoCount > 5) {
      insights.recommendations.push(
        "Review cross-repository dependencies for consolidation opportunities"
      );
    }

    if (testLinks.length === 0) {
      insights.recommendations.push(
        "Add test coverage for better dependency validation"
      );
    }

    if (soqlLinks.length > 10) {
      insights.recommendations.push(
        "Consider implementing data access layers to centralize SOQL queries"
      );
    }

    if (databaseLinks.length > 5) {
      insights.recommendations.push(
        "Consider implementing a centralized data service layer"
      );
    }

    if (schemaLinks.length > 15) {
      insights.recommendations.push(
        "Review schema dependencies for potential consolidation"
      );
    }

    return insights;
  }

  /**
   * Enhanced dependency analysis result with metadata
   */
  public async analyzeDependenciesWithInsights(
    targetFile: string,
    targetFileRepository: string,
    repositories: string[],
    maxDepth: number = 3,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _includeMethodLevel: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _includeContent: boolean = false,
    selectedModel?: string
  ): Promise<{
    nodes: DependencyNode[];
    links: DependencyLink[];
    metadata: {
      repositories: string[];
      timestamp: string;
      nodeCount: number;
      linkCount: number;
      crossRepoLinkCount: number;
      analyzedFile: string;
      analysisDepth: number;
      performance: PerformanceMetrics;
      insights: {
        complexityScore: number;
        riskFactors: string[];
        recommendations: string[];
        patterns: string[];
      };
    };
  }> {
    // Reset metrics for this analysis
    this.metrics = {
      analysisStartTime: Date.now(),
      filesFetched: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      totalFiles: 0,
      dependenciesFound: 0,
      dependentsFound: 0,
    };

    // 🚀 OPTIMIZED APPROACH: Use GitHub Search API for intelligent dependency discovery
    console.log(
      `🔍 Starting optimized Salesforce dependency analysis for: ${targetFile}`
    );

    // Initialize search service
    await gitHubSearchService.initialize();

    // Step 1: Use GitHub Search API for critical and high-priority dependencies
    const criticalPatterns = SALESFORCE_DEPENDENCY_PATTERNS.filter(
      (p) => p.priority === "critical" || p.priority === "high"
    );

    // Search across all specified repositories, not just the target file repository
    const allRepositories = [
      targetFileRepository,
      ...repositories.filter((r) => r !== targetFileRepository),
    ];
    const allSearchResults: {
      nodes: DependencyNode[];
      links: DependencyLink[];
    } = { nodes: [], links: [] };

    console.log(
      `🔍 Searching across ${allRepositories.length} repositories:`,
      allRepositories
    );

    for (const repo of allRepositories) {
      console.log(`🔍 Searching in repository: ${repo}`);
      const repoSearchResults =
        await gitHubSearchService.searchSalesforceDependencies(
          repo,
          targetFile,
          targetFileRepository,
          criticalPatterns
        );
      console.log(
        `🔍 Found in ${repo}: ${repoSearchResults.nodes.length} nodes, ${repoSearchResults.links.length} links`
      );
      allSearchResults.nodes.push(...repoSearchResults.nodes);
      allSearchResults.links.push(...repoSearchResults.links);
    }

    // Step 2: Analyze the target file directly for immediate dependencies
    const targetNode = await this.analyzeTargetFile(
      targetFile,
      targetFileRepository
    );
    if (targetNode) {
      allSearchResults.nodes.unshift(targetNode);
    }

    // Step 3: Perform focused analysis on search results (much smaller dataset)
    const focusedAnalysis = await this.performFocusedAnalysis(
      allSearchResults.nodes,
      allSearchResults.links,
      repositories,
      maxDepth
    );

    // Step 4: Generate AI insights based on focused results
    const insights = await this.generateAnalysisInsights(
      focusedAnalysis.nodes,
      focusedAnalysis.links,
      {
        crossRepoLinks: [],
        relationships: new Map(),
        sharedComponents: [],
      },
      targetFile,
      targetFileRepository,
      selectedModel
    );

    // Calculate final performance metrics
    const totalTime = Date.now() - this.metrics.analysisStartTime;
    const performanceMetrics = {
      ...this.metrics,
      totalTime,
      avgTimePerFile:
        this.metrics.filesFetched > 0
          ? totalTime / this.metrics.filesFetched
          : 0,
      cacheEfficiency:
        this.metrics.cacheHits + this.metrics.cacheMisses > 0
          ? (this.metrics.cacheHits /
              (this.metrics.cacheHits + this.metrics.cacheMisses)) *
            100
          : 0,
    };

    console.log(`📊 Optimized analysis completed:`, {
      complexityScore: insights.complexityScore,
      totalTime: `${totalTime}ms`,
      performance: {
        filesAnalyzed: allSearchResults.nodes.length, // Use actual nodes found instead of filesFetched
        cacheEfficiency: `${(performanceMetrics.cacheEfficiency || 0).toFixed(1)}%`,
        apiCalls: this.metrics.apiCalls,
        optimization: "GitHub Search API + Salesforce patterns",
      },
    });

    return {
      nodes: focusedAnalysis.nodes,
      links: focusedAnalysis.links,
      metadata: {
        repositories,
        timestamp: new Date().toISOString(),
        nodeCount: focusedAnalysis.nodes.length,
        linkCount: focusedAnalysis.links.length,
        crossRepoLinkCount: focusedAnalysis.links.filter((link) => {
          const sourceRepo = this.extractRepository(link.source);
          const targetRepo = this.extractRepository(link.target);
          const isCrossRepo = sourceRepo !== targetRepo;

          // Debug cross-repo detection
          if (
            focusedAnalysis.links.length > 0 &&
            focusedAnalysis.links.indexOf(link) === 0
          ) {
            console.log(`🔍 Cross-repo link detection debug:`);
            console.log(`🔍 Sample link: ${link.source} -> ${link.target}`);
            console.log(`🔍 Source repo: "${sourceRepo}"`);
            console.log(`🔍 Target repo: "${targetRepo}"`);
            console.log(`🔍 Is cross-repo: ${isCrossRepo}`);
          }

          return isCrossRepo;
        }).length,
        analyzedFile: targetFile,
        analysisDepth: maxDepth,
        performance: {
          ...performanceMetrics,
          filesAnalyzed: allSearchResults.nodes.length, // Use actual nodes found
        },
        insights,
      },
    };
  }

  /**
   * Analyze the target file directly for immediate understanding
   */
  private async analyzeTargetFile(
    targetFile: string,
    repository: string
  ): Promise<DependencyNode | null> {
    try {
      const [owner, repo] = repository.split("/");
      const metadata = await this.fetchFileMetadata(owner, repo, targetFile);
      if (!metadata || !metadata.download_url) return null;

      const content = await this.fetchFileContent(metadata.download_url);
      if (!content) return null;

      return {
        id: `${repository}:${targetFile}`,
        name: this.extractFileBaseName(targetFile),
        path: targetFile,
        type: this.inferSalesforceType(targetFile),
        repo: repository,
        content: content,
      };
    } catch (error) {
      console.warn(`Failed to analyze target file ${targetFile}:`, error);
      return null;
    }
  }

  /**
   * Perform focused analysis on the smaller dataset from search results
   */
  private async performFocusedAnalysis(
    nodes: DependencyNode[],
    links: DependencyLink[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _repositories: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _maxDepth: number
  ): Promise<{ nodes: DependencyNode[]; links: DependencyLink[] }> {
    // This is much more efficient as we're only analyzing the focused set from search
    const enhancedNodes: DependencyNode[] = [...nodes];
    const enhancedLinks: DependencyLink[] = [...links];

    // Only analyze content for critical files (much smaller set)
    for (const node of nodes.slice(0, 20)) {
      // Limit to top 20 for performance
      try {
        if (!node.content) {
          const [owner, repo] = node.repo.split("/");
          const metadata = await this.fetchFileMetadata(owner, repo, node.path);
          if (metadata && metadata.download_url) {
            const content = await this.fetchFileContent(metadata.download_url);
            if (content) {
              node.content = content;
              this.metrics.filesFetched++;
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch content for ${node.path}:`, error);
      }
    }

    return { nodes: enhancedNodes, links: enhancedLinks };
  }

  /**
   * Extract repository from node ID
   */
  private extractRepository(nodeId: string): string {
    return nodeId.split(":")[0] || "";
  }

  /**
   * Extract base name from file path
   */
  private extractFileBaseName(filePath: string): string {
    return filePath.split("/").pop() || filePath;
  }

  /**
   * Infer Salesforce type from file path
   */
  private inferSalesforceType(
    filePath: string
  ): "apex" | "lwc" | "test" | "other" {
    const extension = filePath.split(".").pop()?.toLowerCase();
    const fileName = filePath.toLowerCase();

    if (extension === "cls") {
      if (fileName.includes("test")) return "test";
      return "apex";
    }
    if (extension === "js" || extension === "cmp") return "lwc";
    return "other";
  }

  /**
   * Find a dependency file across repositories
   */
  private async findDependencyFile(
    className: string,
    repositories: string[]
  ): Promise<{
    name: string;
    path: string;
    type: "apex" | "lwc" | "test" | "other";
    repo: string;
    url: string;
    content?: string;
  } | null> {
    // Clean the class name
    const cleanName = className.replace(/\.(cls|trigger)$/, "");
    console.log(`🔍 Looking for dependency: ${className} -> ${cleanName}`);
    console.log(`🔍 Searching in repositories:`, repositories);

    for (const repo of repositories) {
      const { organization, repository } = this.parseRepositoryName(
        repo,
        "IBMSC"
      );
      console.log(`🔍 Searching in ${organization}/${repository}`);

      // Check common paths for Apex classes
      const pathsToCheck = [
        `force-app/main/default/classes/${cleanName}.cls`,
        `force-app/main/default/triggers/${cleanName}.trigger`,
        `force-app/main/default/lwc/${cleanName}/${cleanName}.js`,
        `src/classes/${cleanName}.cls`,
        `src/triggers/${cleanName}.trigger`,
        `src/lwc/${cleanName}/${cleanName}.js`,
      ];

      console.log(`🔍 Checking paths:`, pathsToCheck);

      for (const path of pathsToCheck) {
        try {
          console.log(
            `🔍 Checking path: ${path} in ${organization}/${repository}`
          );
          const fileData = await this.fetchFileMetadata(
            organization,
            repository,
            path
          );
          if (fileData) {
            console.log(`✅ Found file metadata for: ${path}`);
            const content = await this.fetchFileContent(fileData.download_url);
            if (content) {
              console.log(`✅ Successfully fetched content for: ${path}`);
              const fileType = this.detectFileType(path, path);
              return {
                name: path.split("/").pop() || cleanName,
                path,
                type: fileType,
                repo,
                url: fileData.html_url,
                content,
              };
            } else {
              console.log(`❌ Failed to fetch content for: ${path}`);
            }
          } else {
            console.log(`❌ No metadata found for: ${path}`);
          }
        } catch (error) {
          console.log(`❌ Error checking path ${path}:`, error);
          // File not found, continue
          continue;
        }
      }
    }

    console.log(`❌ No dependency file found for: ${className}`);
    return null;
  }

  /**
   * Fetch file metadata from GitHub
   */
  private async fetchFileMetadata(
    organization: string,
    repository: string,
    path: string
  ): Promise<GitHubContent | null> {
    try {
      const url = `${this.apiBase}/repos/${organization}/${repository}/contents/${path}`;
      const response = (await this.makeGitHubRequest(url)) as GitHubContent;
      return response;
    } catch {
      return null;
    }
  }

  /**
   * Normalize download URL to ensure consistent cache keys
   * Removes query parameters that might vary between requests
   */
  private normalizeDownloadUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Keep only the base URL without query parameters
      // This ensures consistent cache keys for the same file
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch (error) {
      // If URL parsing fails, return the original URL
      console.warn(`Failed to parse URL for normalization: ${url}`, error);
      return url;
    }
  }

  /**
   * Fetch file content from download URL with caching
   */
  private async fetchFileContent(
    downloadUrl: string | null | undefined
  ): Promise<string | null> {
    if (!downloadUrl) return null;

    // Normalize the URL for consistent caching
    const normalizedUrl = this.normalizeDownloadUrl(downloadUrl);

    // Debug: Show what's in cache vs what we're looking for
    const cacheInfo = this.getDetailedCacheInfo();
    console.log(`🔍 Cache Debug - Original URL: ${downloadUrl}`);
    console.log(`🔍 Cache Debug - Normalized URL: ${normalizedUrl}`);
    console.log(
      `🔍 Cache Debug - URLs in cache (${cacheInfo.fileContentUrls.length}):`,
      cacheInfo.fileContentUrls
    );

    // Check cache first using normalized URL
    const cached = this.getCachedFileContent(normalizedUrl);
    if (cached) {
      console.log(
        `✅ Cache hit for file content (normalized): ${normalizedUrl}`
      );
      return cached;
    }

    console.log(`❌ Cache miss - Normalized URL not found in cache`);
    try {
      console.log(`🌐 Fetching file content from URL: ${downloadUrl}`);
      const response = await fetch(downloadUrl);
      if (response.ok) {
        const content = await response.text();

        // Cache the content using normalized URL
        this.setCachedFileContent(normalizedUrl, content);
        console.log(
          `💾 Cached file content with normalized URL: ${normalizedUrl}`
        );

        return content;
      }
    } catch (error) {
      console.error(`Error fetching file content from ${downloadUrl}:`, error);
    }

    return null;
  }

  /**
   * Extract method calls with context and line numbers
   * Enhanced with Salesforce-specific patterns
   */
  private extractMethodCalls(content: string): Array<{
    className: string;
    methodName: string;
    sourceMethod?: string;
    lineNumber: number;
    codeSnippet?: string;
    contextLines?: string[];
    type?: string; // New: categorize the dependency type
  }> {
    const calls: Array<{
      className: string;
      methodName: string;
      sourceMethod?: string;
      lineNumber: number;
      codeSnippet?: string;
      contextLines?: string[];
      type?: string;
    }> = [];
    const lines = content.split("\n");

    // Find method boundaries
    const methodBoundaries = this.findMethodBoundaries(content);

    // Enhanced patterns for Salesforce-specific dependencies
    const patterns = [
      // Standard method calls
      {
        pattern: /\b([A-Z][A-Za-z0-9_]*)\s*\.\s*([a-z][A-Za-z0-9_]*)\s*\(/g,
        type: "method-call",
      },
      // SOQL queries
      {
        pattern: /\[\s*SELECT\s+.*?\s+FROM\s+([A-Z][A-Za-z0-9_]*(?:__c)?)\b/gi,
        type: "soql-query",
        extract: (match: RegExpExecArray) => ({
          className: match[1],
          methodName: "SOQL_Query",
        }),
      },
      // Database operations
      {
        pattern:
          /Database\s*\.\s*(insert|update|delete|upsert|query|queryLocator)\s*\(/g,
        type: "database-operation",
      },
      // Custom Object references (Schema.SObjectType)
      {
        pattern:
          /Schema\s*\.\s*SObjectType\s*\.\s*([A-Z][A-Za-z0-9_]*(?:__c)?)\b/g,
        type: "schema-reference",
      },
      // Field references (Schema.getGlobalDescribe)
      {
        pattern:
          /([A-Z][A-Za-z0-9_]*(?:__c)?)\s*\.\s*([A-Z][A-Za-z0-9_]*(?:__c)?)\b/g,
        type: "field-reference",
      },
      // Trigger context variables
      {
        pattern:
          /Trigger\s*\.\s*(new|old|newMap|oldMap|isInsert|isUpdate|isDelete|isBefore|isAfter)\b/g,
        type: "trigger-context",
      },
      // System classes and methods
      {
        pattern:
          /(System|UserInfo|Schema|Limits|Test|PageReference)\s*\.\s*([a-zA-Z][A-Za-z0-9_]*)\s*\(/g,
        type: "system-method",
      },
      // Custom Settings/Metadata
      {
        pattern:
          /([A-Z][A-Za-z0-9_]*(?:__c|__mdt))\s*\.\s*(getInstance|getValues|getAll)\s*\(/g,
        type: "custom-settings",
      },
      // Wire service calls (LWC)
      {
        pattern: /@wire\s*\(\s*([A-Za-z][A-Za-z0-9_]*)/g,
        type: "wire-service",
      },
      // Imperative Apex calls (LWC)
      {
        pattern:
          /import\s+([A-Za-z][A-Za-z0-9_]*)\s+from\s+['"]@salesforce\/apex\/([A-Z][A-Za-z0-9_]*)/g,
        type: "imperative-apex",
      },
    ];

    lines.forEach((line, index) => {
      // Skip comments and strings to avoid false positives
      if (this.isInCommentOrString(line, 0)) {
        return;
      }

      patterns.forEach(({ pattern, type, extract }) => {
        pattern.lastIndex = 0; // Reset regex
        let match;

        while ((match = pattern.exec(line)) !== null) {
          let className: string;
          let methodName: string;

          if (extract) {
            const extracted = extract(match);
            className = extracted.className;
            methodName = extracted.methodName;
          } else {
            className = match[1];
            methodName = match[2] || match[1];
          }

          // Skip system classes unless it's a specific pattern we want to track
          if (
            this.isSystemClass(className) &&
            type !== "system-method" &&
            type !== "database-operation"
          ) {
            continue;
          }

          // Find which method contains this call
          const lineStart = content.indexOf(line);
          const sourceMethod = methodBoundaries.find(
            (m) => lineStart >= m.start && lineStart <= m.end
          )?.name;

          // Get code snippet and context
          const codeSnippet = line.trim();
          const contextLines = this.getContextLines(lines, index, 2);

          calls.push({
            className,
            methodName,
            sourceMethod,
            lineNumber: index + 1,
            codeSnippet,
            contextLines,
            type,
          });
        }
      });
    });

    // Performance tracking
    this.metrics.dependenciesFound += calls.length;

    return calls;
  }

  /**
   * Find method boundaries in code
   */
  private findMethodBoundaries(
    content: string
  ): Array<{ name: string; start: number; end: number }> {
    const boundaries: Array<{ name: string; start: number; end: number }> = [];

    // Pattern for method declarations
    const methodPattern =
      /\b(?:public|private|protected|global)\s+(?:static\s+)?(?:override\s+)?(?:\w+\s+)?(\w+)\s*\([^)]*\)\s*{/g;

    let match;
    while ((match = methodPattern.exec(content)) !== null) {
      const methodName = match[1];
      const start = match.index;

      // Find the closing brace for this method
      let braceCount = 1;
      let i = match.index + match[0].length;

      while (i < content.length && braceCount > 0) {
        if (content[i] === "{") braceCount++;
        else if (content[i] === "}") braceCount--;
        i++;
      }

      boundaries.push({
        name: methodName,
        start,
        end: i,
      });
    }

    return boundaries;
  }

  /**
   * Get context lines around a specific line
   */
  private getContextLines(
    lines: string[],
    lineIndex: number,
    contextSize: number = 2
  ): string[] {
    const start = Math.max(0, lineIndex - contextSize);
    const end = Math.min(lines.length - 1, lineIndex + contextSize);

    const contextLines: string[] = [];
    for (let i = start; i <= end; i++) {
      const prefix = i === lineIndex ? "> " : "  ";
      contextLines.push(`${prefix}${i + 1}: ${lines[i].trim()}`);
    }

    return contextLines;
  }

  /**
   * Extract methods from Apex class
   */
  private extractMethods(content: string): string[] {
    const methods: string[] = [];
    const methodPattern =
      /\b(?:public|private|protected|global)\s+(?:static\s+)?(?:override\s+)?(?:\w+\s+)?(\w+)\s*\([^)]*\)/g;

    let match;
    while ((match = methodPattern.exec(content)) !== null) {
      const methodName = match[1];
      if (methodName !== "class" && methodName !== "interface") {
        methods.push(methodName);
      }
    }

    return [...new Set(methods)];
  }

  /**
   * Extract properties/fields from Apex class
   */
  private extractProperties(content: string): string[] {
    const properties: string[] = [];

    // Pattern for field declarations
    const fieldPattern =
      /\b(?:public|private|protected|global)\s+(?:static\s+)?(?:final\s+)?(\w+(?:<[^>]+>)?)\s+(\w+)\s*[;={]/g;

    let match;
    while ((match = fieldPattern.exec(content)) !== null) {
      const propertyName = match[2];
      properties.push(propertyName);
    }

    return [...new Set(properties)];
  }

  /**
   * Extract type references from code
   */
  private extractTypeReferences(content: string): string[] {
    const types: Set<string> = new Set();

    // Pattern for type declarations in various contexts
    const patterns = [
      // Method parameters: (Type param)
      /\(\s*([A-Z][A-Za-z0-9_]*)\s+\w+/g,
      // Return types: Type methodName
      /\b([A-Z][A-Za-z0-9_]*)\s+\w+\s*\(/g,
      // Variable declarations: Type varName
      /\b([A-Z][A-Za-z0-9_]*)\s+\w+\s*[;=]/g,
      // Generic types: List<Type>, Map<Type,Type>
      /[<,]\s*([A-Z][A-Za-z0-9_]*)\s*[>,]/g,
      // Cast expressions: (Type)
      /\(\s*([A-Z][A-Za-z0-9_]*)\s*\)/g,
      // New expressions: new Type
      /new\s+([A-Z][A-Za-z0-9_]*)/g,
    ];

    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const typeName = match[1];
        if (!this.isSystemClass(typeName) && !this.isPrimitiveType(typeName)) {
          types.add(typeName);
        }
      }
    });

    return Array.from(types);
  }

  /**
   * Check if a class name is a system class
   */
  private isSystemClass(className: string): boolean {
    const systemClasses = [
      "System",
      "String",
      "Integer",
      "Decimal",
      "Double",
      "Long",
      "Boolean",
      "Date",
      "Datetime",
      "Time",
      "Blob",
      "List",
      "Set",
      "Map",
      "Database",
      "Schema",
      "SObject",
      "ApexPages",
      "Visualforce",
      "UserInfo",
      "Test",
      "JSON",
      "JSONParser",
      "XMLNode",
      "Dom",
      "Http",
      "HttpRequest",
      "HttpResponse",
      "Limits",
      "Math",
      "Pattern",
      "Matcher",
      "Exception",
      "DmlException",
      "QueryException",
      "Id",
      "Url",
      "PageReference",
      "Site",
      "Crypto",
      "EncodingUtil",
      "Messaging",
      "Network",
      "ConnectApi",
      "Process",
      "QuickAction",
      "Reports",
      "Wave",
      "Object",
      "Void",
    ];

    return systemClasses.includes(className);
  }

  /**
   * Check if a type is primitive
   */
  private isPrimitiveType(typeName: string): boolean {
    const primitives = ["void", "int", "long", "double", "boolean", "decimal"];
    return primitives.includes(typeName.toLowerCase());
  }

  /**
   * Get repository contents at a specific path with caching
   */
  private async fetchRepositoryContents(
    organization: string,
    repo: string,
    path: string = ""
  ): Promise<GitHubContent[]> {
    const cacheKey = `contents:${organization}:${repo}:${path}`;

    // Check cache first
    const cached = this.getCachedContents(cacheKey);
    if (cached) {
      console.log(
        `Cache hit for repository contents: ${organization}/${repo}/${path}`
      );
      return cached as GitHubContent[];
    }

    try {
      console.log(
        `Fetching repository contents from API: ${organization}/${repo}/${path}`
      );
      const url = `${this.apiBase}/repos/${organization}/${repo}/contents/${path}`;
      const contents = await this.makeGitHubRequest(url);
      const result = Array.isArray(contents)
        ? contents
        : [contents as GitHubContent];

      // Cache the result
      this.setCachedContents(cacheKey, result);

      return result;
    } catch (error) {
      console.error(
        `Error fetching repository contents for ${repo}/${path}:`,
        error
      );
      return [];
    }
  }

  /**
   * Detect file type based on file name and path
   */
  private detectFileType(
    fileName: string,
    filePath: string
  ): "apex" | "lwc" | "test" | "other" {
    const lowerName = fileName.toLowerCase();
    const lowerPath = filePath.toLowerCase();

    // Check for test files first
    if (
      lowerName.includes("test") ||
      lowerName.includes("_test") ||
      lowerPath.includes("/test/") ||
      lowerPath.includes("/tests/")
    ) {
      return "test";
    }

    // Apex files
    if (lowerName.endsWith(".cls") || lowerName.endsWith(".trigger")) {
      return "apex";
    }

    // LWC files
    if (lowerPath.includes("/lwc/") || lowerPath.includes("/aura/")) {
      if (
        lowerName.endsWith(".js") ||
        lowerName.endsWith(".html") ||
        lowerName.endsWith(".css") ||
        lowerName.endsWith(".xml")
      ) {
        return "lwc";
      }
    }

    // Lightning component files
    if (
      lowerName.endsWith(".cmp") ||
      lowerName.endsWith(".evt") ||
      lowerName.endsWith(".app") ||
      lowerName.endsWith(".intf")
    ) {
      return "lwc";
    }

    return "other";
  }

  /**
   * Clear all caches
   */
  public clearAllCaches(): void {
    this.contentsCache.clear();
    this.fileContentCache.clear();
    this.classCache.clear();
    this.analyzedFiles.clear();
    console.log("All caches cleared");
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    contents: { total: number; expired: number };
    fileContent: { total: number; expired: number };
    classes: number;
    analyzedFiles: number;
  } {
    let expiredContents = 0;
    let expiredFileContent = 0;

    // Count expired contents cache entries
    for (const entry of this.contentsCache.values()) {
      if (this.isCacheExpired(entry)) {
        expiredContents++;
      }
    }

    // Count expired file content cache entries
    for (const entry of this.fileContentCache.values()) {
      if (this.isCacheExpired(entry)) {
        expiredFileContent++;
      }
    }

    return {
      contents: {
        total: this.contentsCache.size,
        expired: expiredContents,
      },
      fileContent: {
        total: this.fileContentCache.size,
        expired: expiredFileContent,
      },
      classes: this.classCache.size,
      analyzedFiles: this.analyzedFiles.size,
    };
  }

  /**
   * Get detailed cache information including URLs
   */
  public getDetailedCacheInfo(): {
    fileContentUrls: string[];
    contentsKeys: string[];
    classKeys: string[];
    analyzedFileIds: string[];
  } {
    const urls = Array.from(this.fileContentCache.keys());
    console.log(`📊 Cache Debug - Total file content entries: ${urls.length}`);
    if (urls.length > 0) {
      console.log(`📊 Cache Debug - Sample cached URLs:`, urls.slice(0, 3));
    }

    return {
      fileContentUrls: urls,
      contentsKeys: Array.from(this.contentsCache.keys()),
      classKeys: Array.from(this.classCache.keys()),
      analyzedFileIds: Array.from(this.analyzedFiles),
    };
  }

  /**
   * Find files that depend on the target file (dependents)
   */
  private async findDependents(
    targetNode: DependencyNode,
    repositories: string[],
    nodes: DependencyNode[],
    links: DependencyLink[],
    nodeMap: Map<string, DependencyNode>,
    includeMethodLevel: boolean,
    includeContent: boolean
  ): Promise<void> {
    const targetClassName = targetNode.name.replace(/\.(cls|trigger)$/, "");

    console.log(`🔍 Looking for files that depend on ${targetClassName}...`);

    // Search across all repositories
    for (const repository of repositories) {
      console.log(`   Searching in repository: ${repository}`);

      try {
        // Get all files in the repository
        const fileList = await this.listRepositoryFiles(repository);

        // Check each file for dependencies on the target
        const filesToCheck = [
          ...fileList.files.apex,
          ...fileList.files.lwc,
          ...fileList.files.test,
          ...fileList.files.other,
        ];

        // Process files in batches for better performance
        await this.processBatchedFileAnalysis(
          filesToCheck,
          targetClassName,
          targetNode,
          repository,
          nodes,
          links,
          nodeMap,
          includeMethodLevel,
          includeContent
        );
      } catch (error) {
        console.warn(`   ⚠️ Error searching repository ${repository}:`, error);
      }
    }
  }

  /**
   * Check if a file depends on the target file
   */
  private async checkFileDependsOnTarget(
    content: string,
    targetClassName: string,
    targetNode: DependencyNode,
    sourceFile: FileListItem,
    sourceRepo: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _includeMethodLevel: boolean
  ): Promise<
    Array<{ targetClass: string; targetId: string; link: DependencyLink }>
  > {
    const dependencies: Array<{
      targetClass: string;
      targetId: string;
      link: DependencyLink;
    }> = [];
    const sourceId = `${sourceRepo}:${sourceFile.path}`;
    const lines = content.split("\n");

    // Check for class name references
    const classRefPattern = new RegExp(`\\b${targetClassName}\\b`, "g");
    let match;

    while ((match = classRefPattern.exec(content)) !== null) {
      // Find the line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
      const line = lines[lineNumber - 1];

      // Skip comments and string literals
      if (
        this.isInCommentOrString(
          line,
          match.index - beforeMatch.lastIndexOf("\n") - 1
        )
      ) {
        continue;
      }

      // Determine dependency type
      let dependencyType: DependencyLink["type"] = "references";
      let details = `References ${targetClassName}`;

      if (line.includes("extends " + targetClassName)) {
        dependencyType = "extends";
        details = `Extends ${targetClassName}`;
      } else if (
        line.includes("implements") &&
        line.includes(targetClassName)
      ) {
        dependencyType = "implements";
        details = `Implements ${targetClassName}`;
      } else if (line.includes(targetClassName + ".")) {
        dependencyType = "method-call";
        const methodMatch = line.match(
          new RegExp(`${targetClassName}\\.(\\w+)\\s*\\(`)
        );
        if (methodMatch) {
          details = `Calls ${targetClassName}.${methodMatch[1]}()`;
        }
      }

      // Get context lines
      const contextLines = this.getContextLines(lines, lineNumber - 1, 2);

      dependencies.push({
        targetClass: targetClassName,
        targetId: targetNode.id,
        link: {
          source: sourceId,
          target: targetNode.id,
          type: dependencyType,
          strength:
            dependencyType === "extends"
              ? 9
              : dependencyType === "implements"
                ? 8
                : 5,
          details,
          lineNumber,
          codeSnippet: line.trim(),
          contextLines,
          fileName: sourceFile.name,
          targetFileName: targetNode.name,
        },
      });
    }

    return dependencies;
  }

  /**
   * Check if a position in a line is within a comment or string literal
   */
  private isInCommentOrString(line: string, position: number): boolean {
    // Simple check for single-line comments
    const commentIndex = line.indexOf("//");
    if (commentIndex !== -1 && position >= commentIndex) {
      return true;
    }

    // Simple check for string literals (basic implementation)
    let inString = false;
    let stringChar = "";

    for (let i = 0; i < position && i < line.length; i++) {
      const char = line[i];

      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && line[i - 1] !== "\\") {
        inString = false;
        stringChar = "";
      }
    }

    return inString;
  }

  /**
   * Force clean expired cache entries
   */
  public cleanExpiredCaches(): void {
    this.clearExpiredCaches();
    console.log("Expired cache entries cleaned");
  }

  /**
   * Invalidate caches for a specific repository
   */
  public invalidateRepositoryCache(repository: string): void {
    // Clear contents cache for the repository
    for (const [key] of this.contentsCache.entries()) {
      if (key.includes(repository)) {
        this.contentsCache.delete(key);
      }
    }

    // Clear class cache for the repository
    for (const [key] of this.classCache.entries()) {
      if (key.includes(repository)) {
        this.classCache.delete(key);
      }
    }

    // Clear analyzed files for the repository
    for (const fileId of this.analyzedFiles) {
      if (fileId.includes(repository)) {
        this.analyzedFiles.delete(fileId);
      }
    }

    console.log(`Cache invalidated for repository: ${repository}`);
  }
}

// Export a singleton instance
export const githubDependencyAnalyzer = new GitHubDependencyAnalyzer();

// Export the main function for easy use
export async function analyzeDependencies(
  options: DependencyOptions
): Promise<DependencyGraph> {
  return githubDependencyAnalyzer.analyzeDependencies(options);
}

// Export function to list repository files
export async function listRepositoryFiles(
  repository: string,
  organization: string = "IBMSC"
): Promise<FileListResponse> {
  return githubDependencyAnalyzer.listRepositoryFiles(repository, organization);
}
