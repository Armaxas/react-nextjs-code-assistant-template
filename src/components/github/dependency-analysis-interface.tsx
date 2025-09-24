"use client";

import React, { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileCode,
  Loader2,
  Play,
  RotateCcw,
  Search,
  Zap,
  Activity,
  Database,
  ArrowLeft,
  ArrowRight,
  TestTube,
  Package,
  Network,
  Brain,
  AlertTriangle,
  GitBranch,
} from "lucide-react";
import { Repository } from "@/services/github-assistant-service";
import { toast } from "sonner";
import DependencyGraph from "./dependency-graph";

// Import the file selector component
import { RepositorySelectorForDiagram as RepositoryFileSelector } from "./repository-selector-for-diagram";
// Enhanced interfaces for the new analysis approach
interface DependencyNode {
  id: string;
  name: string;
  path: string;
  type: "apex" | "lwc" | "test" | "other";
  size?: number;
  repo: string;
  url?: string;
  methods?: string[];
  properties?: string[];
  isInterface?: boolean;
  isAbstract?: boolean;
  namespace?: string;
}

interface DependencyLink {
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
  strength: number;
  sourceMethod?: string;
  targetMethod?: string;
  details?: string;
  lineNumber?: number;
  // Enhanced fields for better UX
  codeSnippet?: string;
  contextLines?: string[];
  fileName?: string;
  targetFileName?: string;
}

interface AnalysisResult {
  nodes: DependencyNode[];
  links: DependencyLink[];
  metadata: {
    repositories: string[];
    timestamp: string;
    nodeCount: number;
    linkCount: number;
    crossRepoLinkCount?: number;
    analyzedFile: string;
    analysisDepth: number;
    performance?: {
      totalTime: number;
      filesAnalyzed: number;
      cacheEfficiency: number;
      apiCalls: number;
    };
    insights?: {
      complexityScore: number;
      riskFactors: string[];
      recommendations: string[];
      patterns: string[];
      aiInsights?: string;
    };
  };
}

interface FileItem {
  name: string;
  path: string;
  size: number;
  type?: "apex" | "lwc" | "test" | "other";
}

interface DependencyAnalysisInterfaceProps {
  initialRepositories?: Repository[];
  selectedModel?: string;
}

export function DependencyAnalysisInterface({
  initialRepositories = [],
  selectedModel,
}: DependencyAnalysisInterfaceProps) {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [searchRepos, setSearchRepos] = useState<Repository[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("dependencies");
  const [searchTerm, setSearchTerm] = useState("");

  // File preview state
  const [filePreview, setFilePreview] = useState<{
    isOpen: boolean;
    filePath: string;
    fileName: string;
    content: string;
    highlightLineNumber?: number;
    repository: string;
  }>({
    isOpen: false,
    filePath: "",
    fileName: "",
    content: "",
    repository: "",
  });

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: FileItem, repo: Repository, searchRepos: Repository[]) => {
      setSelectedFile(file);
      setSelectedRepo(repo);
      setSearchRepos(searchRepos);
      setAnalysisResult(null);
    },
    []
  );

  // Analyze selected file
  const analyzeFile = useCallback(async () => {
    if (!selectedFile || !selectedRepo) {
      toast.error("Please select a file to analyze");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentAnalysisStep("Initializing dependency analysis...");

    try {
      setAnalysisProgress(20);
      setCurrentAnalysisStep("Fetching file dependencies...");

      const response = await fetch("/api/github/dependencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositories: searchRepos.map((r) => r.full_name || r.name),
          targetFile: selectedFile.path,
          targetRepo: selectedRepo.full_name || selectedRepo.name,
          maxDepth: 2,
          includeMethodLevel: true,
          includeContent: false,
          selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      setCurrentAnalysisStep("Processing dependency graph...");
      setAnalysisProgress(75);

      const result = await response.json();

      setAnalysisResult(result);
      setAnalysisProgress(100);

      toast.success(
        `Analysis complete! Found ${result.nodes.length - 1} dependencies for ${selectedFile.name}`
      );
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
      setCurrentAnalysisStep("");
    }
  }, [selectedFile, selectedRepo, searchRepos, selectedModel]);

  // Analyze a dependency node
  const analyzeDependency = useCallback(
    async (node: DependencyNode) => {
      const file: FileItem = {
        name: node.name,
        path: node.path,
        size: node.size || 0,
        type: node.type,
      };

      const repo =
        searchRepos.find((r) => (r.full_name || r.name) === node.repo) ||
        selectedRepo;

      if (repo) {
        handleFileSelect(file, repo, searchRepos);
      }
    },
    [searchRepos, selectedRepo, handleFileSelect]
  );

  // Toggle node expansion
  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Get target file ID consistently
  const getTargetFileId = useCallback(() => {
    if (!analysisResult || !analysisResult.nodes.length) return null;

    // Try to find using metadata.analyzedFile first
    if (analysisResult.metadata?.analyzedFile) {
      const foundNode = analysisResult.nodes.find(
        (node) =>
          node.path === analysisResult.metadata.analyzedFile ||
          node.id.endsWith(`:${analysisResult.metadata.analyzedFile}`) ||
          node.path.endsWith(analysisResult.metadata.analyzedFile)
      );

      if (foundNode) {
        console.log(
          `🎯 Target file found by metadata: ${foundNode.id} (${foundNode.path})`
        );
        return foundNode.id;
      }
    }

    // Fallback to first node
    const fallbackId = analysisResult.nodes[0]?.id;
    console.log(`🎯 Target file fallback to first node: ${fallbackId}`);
    return fallbackId || null;
  }, [analysisResult]);

  // Helper function to safely count links
  const countLinks = useCallback(
    (predicate: (link: DependencyLink) => boolean) => {
      if (!analysisResult?.links) return 0;
      return analysisResult.links.filter(predicate).length;
    },
    [analysisResult]
  );

  // Filter nodes based on search and tab
  const filteredNodes = useMemo(() => {
    if (!analysisResult) return [];

    let nodes = analysisResult.nodes;
    const targetFileId = getTargetFileId();

    // Debug logging for filtering
    console.log("🔍 Filtering Analysis:");
    console.log(`  - Total nodes: ${nodes.length}`);
    console.log(`  - Total links: ${analysisResult.links.length}`);
    console.log(`  - Active tab: ${activeTab}`);
    console.log(
      `  - Analyzed file from metadata: ${analysisResult.metadata.analyzedFile}`
    );
    console.log(`  - Target file ID (resolved): ${targetFileId}`);
    console.log(`  - First node ID: ${analysisResult.nodes[0]?.id}`);
    console.log(
      `  - Selected repo: ${selectedRepo?.name || selectedRepo?.full_name}`
    );

    // Log all links for debugging
    console.log("📝 All Links:");
    analysisResult.links.forEach((link, i) => {
      console.log(
        `  Link ${i + 1}: ${link.source} -> ${link.target} (${link.type})`
      );
    });

    // Log all nodes for debugging
    console.log("📋 All Nodes:");
    nodes.forEach((node, i) => {
      console.log(
        `  Node ${i + 1}: ${node.id} (${node.name}, repo: ${node.repo})`
      );
    });

    // Check for dependents BEFORE filtering
    const incomingLinks = analysisResult.links.filter(
      (link) => link.target === targetFileId
    );
    const outgoingLinks = analysisResult.links.filter(
      (link) => link.source === targetFileId
    );
    console.log(`🔍 Link analysis for target file "${targetFileId}":`);
    console.log(
      `  - Incoming links (files that depend on this): ${incomingLinks.length}`
    );
    incomingLinks.forEach((link, i) => {
      console.log(
        `    ${i + 1}. ${link.source} -> ${link.target} (${link.type})`
      );
    });
    console.log(
      `  - Outgoing links (files this depends on): ${outgoingLinks.length}`
    );
    outgoingLinks.forEach((link, i) => {
      console.log(
        `    ${i + 1}. ${link.source} -> ${link.target} (${link.type})`
      );
    });

    // Filter by tab
    if (activeTab === "dependencies") {
      // Show only direct dependencies from the target file
      if (!targetFileId) {
        console.warn("⚠️ No target file ID available for dependencies filter");
        nodes = [];
      } else {
        const dependencyIds = new Set(
          analysisResult.links
            .filter((link) => link.source === targetFileId)
            .map((link) => link.target)
        );
        console.log(
          `🔗 Dependencies filter: Found ${dependencyIds.size} dependency IDs:`,
          [...dependencyIds]
        );
        nodes = nodes.filter((node) => dependencyIds.has(node.id));
      }
    } else if (activeTab === "dependents") {
      // Show only dependents (files that depend on the target file)
      if (!targetFileId) {
        console.warn("⚠️ No target file ID available for dependents filter");
        nodes = [];
      } else {
        const dependentIds = new Set(
          analysisResult.links
            .filter((link) => link.target === targetFileId)
            .map((link) => link.source)
        );
        console.log(
          `⬆️ Dependents filter: Found ${dependentIds.size} dependent IDs:`,
          [...dependentIds]
        );
        nodes = nodes.filter((node) => dependentIds.has(node.id));
      }
    } else if (activeTab === "cross-repo") {
      // Show only cross-repo dependencies
      const targetRepo = selectedRepo?.name || selectedRepo?.full_name;
      console.log(`🌐 Cross-repo filter: Target repo is "${targetRepo}"`);
      console.log(
        "   Nodes before filtering:",
        nodes.map((n) => `${n.id} (repo: ${n.repo})`)
      );
      nodes = nodes.filter(
        (node) =>
          node.repo !== selectedRepo?.name &&
          node.repo !== selectedRepo?.full_name
      );
      console.log(
        `   Nodes after filtering: ${nodes.length} cross-repo nodes:`,
        nodes.map((n) => `${n.id} (repo: ${n.repo})`)
      );
    }

    // Apply search filter
    if (searchTerm) {
      const beforeSearchCount = nodes.length;
      nodes = nodes.filter(
        (node) =>
          node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.repo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log(
        `🔍 Search filter: "${searchTerm}" reduced from ${beforeSearchCount} to ${nodes.length} nodes`
      );
    }

    console.log(
      `✅ Final filtered nodes: ${nodes.length} nodes for tab "${activeTab}"`
    );
    return nodes;
  }, [analysisResult, activeTab, searchTerm, selectedRepo, getTargetFileId]);

  // File preview functionality
  const openFilePreview = useCallback(
    async (
      filePath: string,
      fileName: string,
      repository: string,
      highlightLineNumber?: number
    ) => {
      try {
        setFilePreview({
          isOpen: true,
          filePath,
          fileName,
          content: "Loading...",
          highlightLineNumber,
          repository,
        });

        // Fetch file content from GitHub API
        const response = await fetch(`/api/github/file-content`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repository,
            filePath,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch file content: ${response.statusText}`
          );
        }

        const data = await response.json();

        setFilePreview((prev) => ({
          ...prev,
          content: data.content || "Could not load file content",
        }));
      } catch (error) {
        console.error("Error fetching file content:", error);
        setFilePreview((prev) => ({
          ...prev,
          content: `Error loading file: ${error instanceof Error ? error.message : "Unknown error"}`,
        }));
        toast.error("Failed to load file content");
      }
    },
    []
  );

  const closeFilePreview = useCallback(() => {
    setFilePreview({
      isOpen: false,
      filePath: "",
      fileName: "",
      content: "",
      repository: "",
    });
  }, []);

  // Get icon for file type
  const getFileIcon = (type: string) => {
    switch (type) {
      case "apex":
        return <FileCode className="h-4 w-4 text-blue-400" />;
      case "lwc":
        return <Zap className="h-4 w-4 text-yellow-400" />;
      case "test":
        return <TestTube className="h-4 w-4 text-green-400" />;
      default:
        return <Package className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get link details for a node
  const getNodeLinks = (nodeId: string) => {
    if (!analysisResult) return { incoming: [], outgoing: [] };

    return {
      incoming: analysisResult.links.filter((link) => link.target === nodeId),
      outgoing: analysisResult.links.filter((link) => link.source === nodeId),
    };
  };

  // Extract repository from node ID (format: "repository:path")
  const extractRepository = (nodeId: string): string => {
    return nodeId.split(":")[0] || "";
  };

  // Check if a link is cross-repository
  const isCrossRepositoryLink = (link: {
    source: string;
    target: string;
  }): boolean => {
    const sourceRepo = extractRepository(link.source);
    const targetRepo = extractRepository(link.target);
    return (
      sourceRepo !== targetRepo && Boolean(sourceRepo) && Boolean(targetRepo)
    );
  };

  // Calculate cross-repository link count
  const getCrossRepoLinkCount = (): number => {
    if (!analysisResult) return 0;
    const crossRepoLinks = analysisResult.links.filter((link) =>
      isCrossRepositoryLink(link)
    );

    // Debug logging to understand why cross-repo count is 0
    console.log(`🔗 Total links: ${analysisResult.links.length}`);
    console.log(`🔗 Cross-repo links: ${crossRepoLinks.length}`);
    if (analysisResult.links.length > 0) {
      console.log(`🔗 Sample link:`, analysisResult.links[0]);
      console.log(
        `🔗 Source repo: "${extractRepository(analysisResult.links[0].source)}"`
      );
      console.log(
        `🔗 Target repo: "${extractRepository(analysisResult.links[0].target)}"`
      );
      console.log(
        `🔗 Is cross-repo: ${isCrossRepositoryLink(analysisResult.links[0])}`
      );
    }

    return crossRepoLinks.length;
  };

  // Enhanced link type badge color with Salesforce-specific patterns
  const getLinkTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      // Standard dependency types
      extends: "bg-blue-900 text-blue-200",
      implements: "bg-green-900 text-green-200",
      "method-call": "bg-purple-900 text-purple-200",
      wire: "bg-yellow-900 text-yellow-200",
      "imperative-apex": "bg-orange-900 text-orange-200",
      references: "bg-gray-700 text-gray-200",
      tests: "bg-red-900 text-red-200",

      // Enhanced Salesforce-specific patterns
      "soql-query": "bg-cyan-900 text-cyan-200",
      "database-operation": "bg-indigo-900 text-indigo-200",
      "schema-reference": "bg-teal-900 text-teal-200",
      "field-reference": "bg-emerald-900 text-emerald-200",
      "trigger-context": "bg-rose-900 text-rose-200",
      "system-method": "bg-slate-700 text-slate-200",
      "custom-settings": "bg-violet-900 text-violet-200",
      "wire-service": "bg-amber-900 text-amber-200",
    };
    return colors[type] || "bg-gray-700 text-gray-200";
  };

  // Get human-readable dependency type labels
  const getDependencyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "method-call": "Method Call",
      "soql-query": "SOQL Query",
      "database-operation": "Database Op",
      "schema-reference": "Schema Ref",
      "field-reference": "Field Ref",
      "trigger-context": "Trigger Context",
      "system-method": "System Method",
      "custom-settings": "Custom Settings",
      "wire-service": "Wire Service",
      "imperative-apex": "Imperative Apex",
      extends: "Extends",
      implements: "Implements",
      references: "References",
      tests: "Test Coverage",
      wire: "Wire",
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (!selectedFile) {
    return (
      <div className="h-full">
        <RepositoryFileSelector
          onSelectFile={handleFileSelect}
          initialSearchRepos={initialRepositories}
          selectedRepository={selectedRepo}
          searchRepositories={searchRepos}
          selectedModel={selectedModel}
        />
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="p-6 space-y-6">
        <Card className="border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Analyzing Dependencies
            </CardTitle>
            <CardDescription>
              Analyzing {selectedFile.name} for dependencies...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-gray-400">
                  {analysisProgress}%
                </span>
              </div>
              <Progress value={analysisProgress} className="w-full" />
            </div>
            {currentAnalysisStep && (
              <div className="flex items-center text-sm text-gray-400">
                <Activity className="h-4 w-4 mr-2" />
                {currentAnalysisStep}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Compact Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFile(null)}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {getFileIcon(selectedFile.type || "other")}
              <h2 className="font-medium text-white truncate">
                {selectedFile.name}
              </h2>
              <Badge variant="outline" className="text-xs">
                {selectedRepo?.name}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 truncate">
              {selectedFile.path}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {searchRepos.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {searchRepos.length} repos
            </Badge>
          )}
          {!analysisResult ? (
            <Button onClick={analyzeFile} size="sm">
              <Play className="h-4 w-4 mr-1" />
              Analyze
            </Button>
          ) : (
            <Button variant="outline" onClick={analyzeFile} size="sm">
              <RotateCcw className="h-4 w-4 mr-1" />
              Re-analyze
            </Button>
          )}
        </div>
      </div>

      {analysisResult ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Analysis Insights Panel */}
          {analysisResult.metadata.insights && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-300">
                  Analysis Insights
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    Complexity Score:
                  </span>
                  <Badge
                    variant={
                      analysisResult.metadata.insights.complexityScore > 70
                        ? "destructive"
                        : analysisResult.metadata.insights.complexityScore > 40
                          ? "secondary"
                          : "default"
                    }
                    className="text-xs"
                  >
                    {Math.round(
                      analysisResult.metadata.insights.complexityScore
                    )}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Patterns */}
                {analysisResult.metadata.insights.patterns.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-300 mb-2">
                      Patterns Found
                    </h4>
                    <ul className="space-y-1">
                      {analysisResult.metadata.insights.patterns.map(
                        (pattern, idx) => (
                          <li
                            key={idx}
                            className="text-gray-300 flex items-center"
                          >
                            <Activity className="h-3 w-3 mr-1 text-green-400" />
                            {pattern}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* Risk Factors */}
                {analysisResult.metadata.insights.riskFactors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-amber-300 mb-2">
                      Risk Factors
                    </h4>
                    <ul className="space-y-1">
                      {analysisResult.metadata.insights.riskFactors.map(
                        (risk, idx) => (
                          <li
                            key={idx}
                            className="text-gray-300 flex items-center"
                          >
                            <Zap className="h-3 w-3 mr-1 text-amber-400" />
                            {risk}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {analysisResult.metadata.insights.recommendations.length >
                  0 && (
                  <div>
                    <h4 className="font-medium text-blue-300 mb-2">
                      Recommendations
                    </h4>
                    <ul className="space-y-1">
                      {analysisResult.metadata.insights.recommendations.map(
                        (rec, idx) => (
                          <li
                            key={idx}
                            className="text-gray-300 flex items-center"
                          >
                            <Database className="h-3 w-3 mr-1 text-blue-400" />
                            {rec}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Performance Metrics */}
              {analysisResult.metadata.performance && (
                <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-400">
                  <span>
                    Analysis Time:{" "}
                    {analysisResult.metadata.performance.totalTime}ms
                  </span>
                  <span>
                    Files Analyzed:{" "}
                    {analysisResult.metadata.performance.filesAnalyzed}
                  </span>
                  <span>
                    Cache Efficiency:{" "}
                    {(
                      analysisResult.metadata.performance.cacheEfficiency ?? 0
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Compact Tabs with Integrated Summary and Search */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-900/30">
              <div className="flex items-center justify-between w-full">
                <TabsList className="grid grid-cols-6 w-auto">
                  <TabsTrigger value="all" className="text-xs px-3">
                    All ({analysisResult.nodes.length})
                  </TabsTrigger>
                  <TabsTrigger value="dependencies" className="text-xs px-3">
                    Deps ({countLinks((l) => l.source === getTargetFileId())})
                  </TabsTrigger>
                  <TabsTrigger value="dependents" className="text-xs px-3">
                    Uses ({countLinks((l) => l.target === getTargetFileId())})
                  </TabsTrigger>
                  <TabsTrigger value="cross-repo" className="text-xs px-3">
                    Cross ({getCrossRepoLinkCount()})
                  </TabsTrigger>
                  {/* Temporarily hiding Graph tab - keeping backend logic intact */}
                  {false && (
                    <TabsTrigger value="graph" className="text-xs px-3">
                      <Network className="h-3 w-3 mr-1" />
                      Graph
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="ai-insights" className="text-xs px-3">
                    <Brain className="h-3 w-3 mr-1" />
                    AI Insights
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-7 h-8 w-48 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Results Area - Full Height - Only for list-based tabs */}
            <TabsContent value="all" className="flex-1 p-0 m-0">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-2">
                  {filteredNodes.map((node, index) => {
                    const isExpanded = expandedNodes.has(node.id);
                    const { incoming, outgoing } = getNodeLinks(node.id);
                    const isTargetFile = node.id === getTargetFileId();

                    return (
                      <Collapsible
                        key={`all-${node.id}-${index}`}
                        open={isExpanded}
                        onOpenChange={() => toggleNodeExpansion(node.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <div
                            className={cn(
                              "w-full p-3 rounded-lg border transition-colors cursor-pointer",
                              isTargetFile
                                ? "bg-blue-950/20 border-blue-800"
                                : "bg-gray-900/40 border-gray-800 hover:bg-gray-900/60"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                )}
                                {getFileIcon(node.type)}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">
                                      {node.name}
                                    </span>
                                    {isTargetFile && (
                                      <Badge
                                        variant="default"
                                        className="text-xs"
                                      >
                                        Target
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400 truncate">
                                    {node.path} • {node.repo}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {incoming.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    ← {incoming.length}
                                  </Badge>
                                )}
                                {outgoing.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    → {outgoing.length}
                                  </Badge>
                                )}
                                {!isTargetFile && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      analyzeDependency(node);
                                    }}
                                    className="h-6 px-2 text-xs"
                                  >
                                    Analyze
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-8 pr-4 py-2">
                          <div className="space-y-4">
                            {node.methods && node.methods.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">
                                  Methods
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {node.methods.map((method, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {method}()
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {outgoing.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">
                                  Depends On
                                </h4>
                                <div className="space-y-1">
                                  {outgoing.map((link, idx) => {
                                    const targetNode =
                                      analysisResult.nodes.find(
                                        (n) => n.id === link.target
                                      );
                                    if (!targetNode) return null;

                                    return (
                                      <div
                                        key={idx}
                                        className="flex flex-col p-3 rounded border border-gray-800 bg-gray-900/30"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            {getFileIcon(targetNode.type)}
                                            <span className="text-sm font-medium">
                                              {targetNode.name}
                                            </span>
                                            <Badge
                                              className={getLinkTypeBadgeColor(
                                                link.type
                                              )}
                                              variant="secondary"
                                            >
                                              {getDependencyTypeLabel(
                                                link.type
                                              )}
                                            </Badge>
                                            {link.targetMethod && (
                                              <span className="text-xs text-gray-400">
                                                .{link.targetMethod}()
                                              </span>
                                            )}
                                          </div>
                                          {link.lineNumber && (
                                            <span className="text-xs text-gray-500">
                                              Line {link.lineNumber}
                                            </span>
                                          )}
                                        </div>

                                        {link.details && (
                                          <div className="text-xs text-gray-400 mb-2">
                                            {link.details}
                                          </div>
                                        )}

                                        {link.codeSnippet && (
                                          <div className="bg-gray-800/50 rounded p-3 text-xs font-mono border border-gray-700">
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="text-green-400 font-medium">
                                                Code Context:
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {link.lineNumber && (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                  >
                                                    Line {link.lineNumber}
                                                  </Badge>
                                                )}
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="h-6 px-2 text-xs"
                                                  onClick={() => {
                                                    openFilePreview(
                                                      targetNode.path,
                                                      targetNode.name,
                                                      targetNode.repo,
                                                      link.lineNumber
                                                    );
                                                  }}
                                                >
                                                  <FileCode className="h-3 w-3 mr-1" />
                                                  Preview File
                                                </Button>
                                              </div>
                                            </div>
                                            <div className="space-y-1">
                                              {/* Enhanced code snippet with line numbers */}
                                              {link.codeSnippet &&
                                                link.codeSnippet
                                                  .split("\n")
                                                  .map((line, lineIdx) => {
                                                    const actualLineNumber =
                                                      link.lineNumber
                                                        ? link.lineNumber -
                                                          Math.floor(
                                                            link.codeSnippet!.split(
                                                              "\n"
                                                            ).length / 2
                                                          ) +
                                                          lineIdx
                                                        : lineIdx + 1;
                                                    const isTargetLine =
                                                      link.lineNumber &&
                                                      actualLineNumber ===
                                                        link.lineNumber;

                                                    return (
                                                      <div
                                                        key={lineIdx}
                                                        className={`flex ${isTargetLine ? "bg-yellow-900/30 border-l-2 border-yellow-400" : ""}`}
                                                      >
                                                        <span className="text-gray-500 w-8 text-right mr-3 select-none">
                                                          {actualLineNumber}
                                                        </span>
                                                        <span
                                                          className={`flex-1 ${isTargetLine ? "text-yellow-200 font-medium" : "text-gray-300"}`}
                                                        >
                                                          {line || " "}
                                                        </span>
                                                      </div>
                                                    );
                                                  })}
                                            </div>
                                          </div>
                                        )}

                                        {link.contextLines &&
                                          link.contextLines.length > 0 && (
                                            <details className="mt-2">
                                              <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300 flex items-center gap-1">
                                                <ChevronRight className="h-3 w-3" />
                                                Show extended context (
                                                {link.contextLines.length}{" "}
                                                lines)
                                              </summary>
                                              <div className="bg-gray-800/50 rounded p-3 mt-2 text-xs font-mono border border-gray-700">
                                                <div className="space-y-1">
                                                  {link.contextLines &&
                                                    link.contextLines.map(
                                                      (contextLine, i) => {
                                                        const isHighlighted =
                                                          contextLine.startsWith(
                                                            ">"
                                                          );
                                                        const cleanLine =
                                                          isHighlighted
                                                            ? contextLine.substring(
                                                                1
                                                              )
                                                            : contextLine;
                                                        const lineNumber =
                                                          link.lineNumber
                                                            ? link.lineNumber -
                                                              Math.floor(
                                                                link
                                                                  .contextLines!
                                                                  .length / 2
                                                              ) +
                                                              i
                                                            : i + 1;

                                                        return (
                                                          <div
                                                            key={i}
                                                            className={`flex ${isHighlighted ? "bg-yellow-900/30 border-l-2 border-yellow-400" : ""}`}
                                                          >
                                                            <span className="text-gray-500 w-8 text-right mr-3 select-none">
                                                              {lineNumber}
                                                            </span>
                                                            <span
                                                              className={
                                                                isHighlighted
                                                                  ? "text-yellow-200 font-medium"
                                                                  : "text-gray-400"
                                                              }
                                                            >
                                                              {cleanLine || " "}
                                                            </span>
                                                          </div>
                                                        );
                                                      }
                                                    )}
                                                </div>
                                              </div>
                                            </details>
                                          )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {incoming.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">
                                  Referenced By
                                </h4>
                                <div className="space-y-1">
                                  {incoming.map((link, idx) => {
                                    const sourceNode =
                                      analysisResult.nodes.find(
                                        (n) => n.id === link.source
                                      );
                                    if (!sourceNode) return null;

                                    return (
                                      <div
                                        key={idx}
                                        className="flex flex-col p-3 rounded border border-gray-800 bg-gray-900/30"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            {getFileIcon(sourceNode.type)}
                                            <span className="text-sm font-medium">
                                              {sourceNode.name}
                                            </span>
                                            <Badge
                                              className={getLinkTypeBadgeColor(
                                                link.type
                                              )}
                                              variant="secondary"
                                            >
                                              {getDependencyTypeLabel(
                                                link.type
                                              )}
                                            </Badge>
                                            {link.sourceMethod && (
                                              <span className="text-xs text-gray-400">
                                                .{link.sourceMethod}()
                                              </span>
                                            )}
                                          </div>
                                          {link.lineNumber && (
                                            <span className="text-xs text-gray-500">
                                              Line {link.lineNumber}
                                            </span>
                                          )}
                                        </div>

                                        {link.details && (
                                          <div className="text-xs text-gray-400 mb-2">
                                            {link.details}
                                          </div>
                                        )}

                                        {link.codeSnippet && (
                                          <div className="bg-gray-800/50 rounded p-3 text-xs font-mono border border-gray-700">
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="text-green-400 font-medium">
                                                Code Context:
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {link.lineNumber && (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                  >
                                                    Line {link.lineNumber}
                                                  </Badge>
                                                )}
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="h-6 px-2 text-xs"
                                                  onClick={() => {
                                                    openFilePreview(
                                                      sourceNode.path,
                                                      sourceNode.name,
                                                      sourceNode.repo,
                                                      link.lineNumber
                                                    );
                                                  }}
                                                >
                                                  <FileCode className="h-3 w-3 mr-1" />
                                                  Preview File
                                                </Button>
                                              </div>
                                            </div>
                                            <div className="space-y-1">
                                              {/* Enhanced code snippet with line numbers */}
                                              {link.codeSnippet &&
                                                link.codeSnippet
                                                  .split("\n")
                                                  .map((line, lineIdx) => {
                                                    const actualLineNumber =
                                                      link.lineNumber
                                                        ? link.lineNumber -
                                                          Math.floor(
                                                            link.codeSnippet!.split(
                                                              "\n"
                                                            ).length / 2
                                                          ) +
                                                          lineIdx
                                                        : lineIdx + 1;
                                                    const isTargetLine =
                                                      link.lineNumber &&
                                                      actualLineNumber ===
                                                        link.lineNumber;

                                                    return (
                                                      <div
                                                        key={lineIdx}
                                                        className={`flex ${isTargetLine ? "bg-yellow-900/30 border-l-2 border-yellow-400" : ""}`}
                                                      >
                                                        <span className="text-gray-500 w-8 text-right mr-3 select-none">
                                                          {actualLineNumber}
                                                        </span>
                                                        <span
                                                          className={`flex-1 ${isTargetLine ? "text-yellow-200 font-medium" : "text-gray-300"}`}
                                                        >
                                                          {line || " "}
                                                        </span>
                                                      </div>
                                                    );
                                                  })}
                                            </div>
                                          </div>
                                        )}

                                        {link.contextLines &&
                                          link.contextLines.length > 0 && (
                                            <details className="mt-2">
                                              <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300 flex items-center gap-1">
                                                <ChevronRight className="h-3 w-3" />
                                                Show extended context (
                                                {link.contextLines.length}{" "}
                                                lines)
                                              </summary>
                                              <div className="bg-gray-800/50 rounded p-3 mt-2 text-xs font-mono border border-gray-700">
                                                <div className="space-y-1">
                                                  {link.contextLines &&
                                                    link.contextLines.map(
                                                      (contextLine, i) => {
                                                        const isHighlighted =
                                                          contextLine.startsWith(
                                                            ">"
                                                          );
                                                        const cleanLine =
                                                          isHighlighted
                                                            ? contextLine.substring(
                                                                1
                                                              )
                                                            : contextLine;
                                                        const lineNumber =
                                                          link.lineNumber
                                                            ? link.lineNumber -
                                                              Math.floor(
                                                                link
                                                                  .contextLines!
                                                                  .length / 2
                                                              ) +
                                                              i
                                                            : i + 1;

                                                        return (
                                                          <div
                                                            key={i}
                                                            className={`flex ${isHighlighted ? "bg-yellow-900/30 border-l-2 border-yellow-400" : ""}`}
                                                          >
                                                            <span className="text-gray-500 w-8 text-right mr-3 select-none">
                                                              {lineNumber}
                                                            </span>
                                                            <span
                                                              className={
                                                                isHighlighted
                                                                  ? "text-yellow-200 font-medium"
                                                                  : "text-gray-400"
                                                              }
                                                            >
                                                              {cleanLine || " "}
                                                            </span>
                                                          </div>
                                                        );
                                                      }
                                                    )}
                                                </div>
                                              </div>
                                            </details>
                                          )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Dependencies Tab */}
            <TabsContent value="dependencies" className="flex-1 p-0 m-0">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-2">
                  {filteredNodes
                    .filter((node) => {
                      const targetFileId = getTargetFileId();
                      // Show nodes that the target file depends on (targets of outgoing links from target file)
                      return analysisResult.links.some(
                        (link) =>
                          link.source === targetFileId &&
                          link.target === node.id
                      );
                    })
                    .map((node, index) => {
                      const isExpanded = expandedNodes.has(node.id);
                      const { incoming, outgoing } = getNodeLinks(node.id);
                      const isTargetFile = node.id === getTargetFileId();

                      return (
                        <Collapsible
                          key={`dependencies-${node.id}-${index}`}
                          open={isExpanded}
                          onOpenChange={(open) => {
                            setExpandedNodes((prev) => {
                              const newSet = new Set(prev);
                              if (open) {
                                newSet.add(node.id);
                              } else {
                                newSet.delete(node.id);
                              }
                              return newSet;
                            });
                          }}
                        >
                          <CollapsibleTrigger asChild>
                            <Card
                              className={`cursor-pointer transition-all hover:bg-gray-800/50 ${
                                isTargetFile
                                  ? "bg-blue-900/30 border-blue-600/50"
                                  : "bg-gray-900/30 border-gray-700/50"
                              }`}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                                    <div
                                      className={`w-2 h-2 rounded-full ${isTargetFile ? "bg-blue-500" : "bg-gray-500"}`}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span
                                          className={`font-medium text-sm truncate ${
                                            isTargetFile
                                              ? "text-blue-300"
                                              : "text-gray-200"
                                          }`}
                                        >
                                          {node.name}
                                        </span>
                                        {isTargetFile && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs bg-blue-900/50 text-blue-300 border-blue-600/50"
                                          >
                                            Target
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-400 truncate">
                                        {node.id}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs">
                                    <div className="flex items-center text-green-400">
                                      <ArrowRight className="h-3 w-3 mr-1" />
                                      {outgoing.length}
                                    </div>
                                    <div className="flex items-center text-orange-400">
                                      <ArrowLeft className="h-3 w-3 mr-1" />
                                      {incoming.length}
                                    </div>
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-2 ml-5 space-y-1">
                              {outgoing.length > 0 && (
                                <div>
                                  <div className="text-xs font-medium text-green-400 mb-1 flex items-center">
                                    <ArrowRight className="h-3 w-3 mr-1" />
                                    Dependencies ({outgoing.length})
                                  </div>
                                  <div className="space-y-1 pl-4">
                                    {outgoing.map((link, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs text-gray-300 flex items-center justify-between py-1 px-2 bg-gray-800/30 rounded border border-gray-700/30"
                                      >
                                        <span className="truncate flex-1">
                                          {link.target}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs ml-2"
                                        >
                                          {link.type}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Dependents Tab */}
            <TabsContent value="dependents" className="flex-1 p-0 m-0">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-2">
                  {filteredNodes
                    .filter((node) => {
                      const targetFileId = getTargetFileId();
                      // Show nodes that depend on the target file (sources of incoming links to target file)
                      return analysisResult.links.some(
                        (link) =>
                          link.target === targetFileId &&
                          link.source === node.id
                      );
                    })
                    .map((node, index) => {
                      const isExpanded = expandedNodes.has(node.id);
                      const { incoming, outgoing } = getNodeLinks(node.id);
                      const isTargetFile = node.id === getTargetFileId();

                      return (
                        <Collapsible
                          key={`dependents-${node.id}-${index}`}
                          open={isExpanded}
                          onOpenChange={(open) => {
                            setExpandedNodes((prev) => {
                              const newSet = new Set(prev);
                              if (open) {
                                newSet.add(node.id);
                              } else {
                                newSet.delete(node.id);
                              }
                              return newSet;
                            });
                          }}
                        >
                          <CollapsibleTrigger asChild>
                            <Card
                              className={`cursor-pointer transition-all hover:bg-gray-800/50 ${
                                isTargetFile
                                  ? "bg-blue-900/30 border-blue-600/50"
                                  : "bg-gray-900/30 border-gray-700/50"
                              }`}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                                    <div
                                      className={`w-2 h-2 rounded-full ${isTargetFile ? "bg-blue-500" : "bg-gray-500"}`}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span
                                          className={`font-medium text-sm truncate ${
                                            isTargetFile
                                              ? "text-blue-300"
                                              : "text-gray-200"
                                          }`}
                                        >
                                          {node.name}
                                        </span>
                                        {isTargetFile && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs bg-blue-900/50 text-blue-300 border-blue-600/50"
                                          >
                                            Target
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-400 truncate">
                                        {node.id}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs">
                                    <div className="flex items-center text-green-400">
                                      <ArrowRight className="h-3 w-3 mr-1" />
                                      {outgoing.length}
                                    </div>
                                    <div className="flex items-center text-orange-400">
                                      <ArrowLeft className="h-3 w-3 mr-1" />
                                      {incoming.length}
                                    </div>
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-2 ml-5 space-y-1">
                              {incoming.length > 0 && (
                                <div>
                                  <div className="text-xs font-medium text-orange-400 mb-1 flex items-center">
                                    <ArrowLeft className="h-3 w-3 mr-1" />
                                    Used by ({incoming.length})
                                  </div>
                                  <div className="space-y-1 pl-4">
                                    {incoming.map((link, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs text-gray-300 flex items-center justify-between py-1 px-2 bg-gray-800/30 rounded border border-gray-700/30"
                                      >
                                        <span className="truncate flex-1">
                                          {link.source}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs ml-2"
                                        >
                                          {link.type}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Cross-repo Tab */}
            <TabsContent value="cross-repo" className="flex-1 p-0 m-0">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-2">
                  {analysisResult.links.filter((link) =>
                    isCrossRepositoryLink(link)
                  ).length > 0 ? (
                    analysisResult.links
                      .filter((link) => isCrossRepositoryLink(link))
                      .map((link, idx) => (
                        <Card
                          key={idx}
                          className="bg-gray-900/30 border-gray-700/50"
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-purple-300 mb-1">
                                  Cross-Repository Dependency
                                </div>
                                <div className="text-xs text-gray-400">
                                  {link.source} → {link.target}
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className="text-xs text-purple-300 border-purple-500/50"
                              >
                                {link.type}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <GitBranch className="h-16 w-16 text-gray-500 mb-4" />
                      <h3 className="text-lg font-medium text-gray-300 mb-2">
                        No Cross-Repository Dependencies
                      </h3>
                      <p className="text-gray-500 max-w-md">
                        This analysis found no dependencies that span across
                        multiple repositories.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Dependency Graph Tab - Temporarily Hidden */}
            {false && analysisResult && (
              <TabsContent value="graph" className="flex-1 p-0 m-0">
                <div className="p-4 h-full">
                  <DependencyGraph
                    nodes={analysisResult!.nodes}
                    links={analysisResult!.links}
                    className="h-full"
                  />
                </div>
              </TabsContent>
            )}

            {/* AI Insights Tab */}
            <TabsContent value="ai-insights" className="flex-1 p-0 m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {analysisResult.metadata.insights?.aiInsights ? (
                    <div className="prose prose-invert max-w-none">
                      <div className="bg-gradient-to-r from-blue-950/50 to-purple-950/50 rounded-lg p-6 border border-blue-800/30">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Brain className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">
                              AI-Powered Dependency Analysis
                            </h3>
                            <p className="text-blue-200 text-sm">
                              Advanced insights for{" "}
                              {selectedFile?.name || "analyzed file"}{" "}
                              dependencies
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                          <div
                            className="text-gray-100 leading-relaxed whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{
                              __html:
                                analysisResult.metadata.insights.aiInsights
                                  .replace(
                                    /\*\*(.*?)\*\*/g,
                                    '<strong class="text-white font-semibold">$1</strong>'
                                  )
                                  .replace(
                                    /🎯|⚠️|🔧|📊/g,
                                    '<span class="text-lg">$&</span>'
                                  ),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <Brain className="h-16 w-16 text-gray-500 mb-4" />
                      <h3 className="text-lg font-medium text-gray-300 mb-2">
                        AI Insights Unavailable
                      </h3>
                      <p className="text-gray-500 max-w-md">
                        AI-powered insights are currently unavailable. This
                        could be due to service limitations or the analysis not
                        being completed with AI enhancement.
                      </p>
                    </div>
                  )}

                  {/* Enhanced Dependency-Specific Insights */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Enhanced Complexity Score */}
                    <Card className="bg-gray-900/50 border-gray-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-yellow-300 flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Dependency Complexity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white mb-2">
                          {(() => {
                            const nodeCount = analysisResult.nodes.length;
                            const linkCount = analysisResult.links.length;
                            const crossRepoLinks = analysisResult.links.filter(
                              (link) => {
                                const sourceNode = analysisResult.nodes.find(
                                  (n) => n.id === link.source
                                );
                                const targetNode = analysisResult.nodes.find(
                                  (n) => n.id === link.target
                                );
                                return (
                                  sourceNode &&
                                  targetNode &&
                                  sourceNode.repo !== targetNode.repo
                                );
                              }
                            ).length;

                            // Enhanced complexity calculation based on actual dependency patterns
                            const baseComplexity = Math.min(40, nodeCount * 3);
                            const linkComplexity = Math.min(30, linkCount * 2);
                            const crossRepoComplexity = Math.min(
                              30,
                              crossRepoLinks * 8
                            );

                            return Math.round(
                              baseComplexity +
                                linkComplexity +
                                crossRepoComplexity
                            );
                          })()}
                          /100
                        </div>
                        <div className="text-xs text-gray-400">
                          Based on {analysisResult.nodes.length} files,{" "}
                          {analysisResult.links.length} dependencies
                        </div>
                      </CardContent>
                    </Card>

                    {/* Enhanced Patterns Found */}
                    <Card className="bg-gray-900/50 border-gray-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-green-300 flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          Dependency Patterns
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          {(() => {
                            const patterns = [];
                            const methodCalls = analysisResult.links.filter(
                              (l) => l.type === "method-call"
                            ).length;
                            const imports = analysisResult.links.filter(
                              (l) => l.type === "import"
                            ).length;
                            const inheritance = analysisResult.links.filter(
                              (l) =>
                                l.type === "extends" || l.type === "implements"
                            ).length;
                            const tests = analysisResult.links.filter(
                              (l) => l.type === "tests"
                            ).length;

                            if (methodCalls > 0)
                              patterns.push(`${methodCalls} method calls`);
                            if (imports > 0)
                              patterns.push(`${imports} import statements`);
                            if (inheritance > 0)
                              patterns.push(`${inheritance} inheritance links`);
                            if (tests > 0)
                              patterns.push(`${tests} test dependencies`);

                            return patterns.length > 0
                              ? patterns
                              : ["No specific patterns detected"];
                          })().map((pattern, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-gray-300 flex items-center"
                            >
                              <Activity className="h-3 w-3 mr-1 text-green-400" />
                              {pattern}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Enhanced Risk Factors */}
                    <Card className="bg-gray-900/50 border-gray-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-red-300 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Risk Assessment
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          {(() => {
                            const risks = [];
                            const crossRepoLinks = analysisResult.links.filter(
                              (link) => {
                                const sourceNode = analysisResult.nodes.find(
                                  (n) => n.id === link.source
                                );
                                const targetNode = analysisResult.nodes.find(
                                  (n) => n.id === link.target
                                );
                                return (
                                  sourceNode &&
                                  targetNode &&
                                  sourceNode.repo !== targetNode.repo
                                );
                              }
                            ).length;

                            const totalLinks = analysisResult.links.length;
                            const totalNodes = analysisResult.nodes.length;

                            if (crossRepoLinks > 0) {
                              risks.push(
                                `${crossRepoLinks} cross-repository dependencies`
                              );
                            }
                            if (totalLinks > totalNodes * 2) {
                              risks.push("High coupling detected");
                            }
                            if (totalNodes > 20) {
                              risks.push("Large dependency tree");
                            }

                            return risks.length > 0
                              ? risks
                              : ["Low risk dependency structure"];
                          })().map((risk, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-gray-300 flex items-center"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1 text-red-400" />
                              {risk}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Dependency-Specific Recommendations */}
                  <Card className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-blue-300 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Dependency Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(() => {
                          const recommendations = [];
                          const nodeCount = analysisResult.nodes.length;
                          const linkCount = analysisResult.links.length;
                          const crossRepoLinks = analysisResult.links.filter(
                            (link) => {
                              const sourceNode = analysisResult.nodes.find(
                                (n) => n.id === link.source
                              );
                              const targetNode = analysisResult.nodes.find(
                                (n) => n.id === link.target
                              );
                              return (
                                sourceNode &&
                                targetNode &&
                                sourceNode.repo !== targetNode.repo
                              );
                            }
                          ).length;

                          if (crossRepoLinks > 3) {
                            recommendations.push(
                              "Consider consolidating cross-repository dependencies to improve maintainability"
                            );
                          }
                          if (linkCount > nodeCount * 3) {
                            recommendations.push(
                              "High coupling detected - consider refactoring to reduce interdependencies"
                            );
                          }
                          if (nodeCount > 15) {
                            recommendations.push(
                              "Large dependency tree - consider modularization strategies"
                            );
                          }
                          if (
                            selectedFile?.name.toLowerCase().includes("test")
                          ) {
                            recommendations.push(
                              "Review test dependencies to ensure they align with production code structure"
                            );
                          } else {
                            const testLinks = analysisResult.links.filter(
                              (l) => l.type === "tests"
                            ).length;
                            if (testLinks === 0) {
                              recommendations.push(
                                "Consider adding unit tests to validate dependency relationships"
                              );
                            }
                          }

                          recommendations.push(
                            `Monitor dependencies for ${selectedFile?.name || "this file"} during future changes`
                          );

                          return recommendations;
                        })().map((rec, idx) => (
                          <div
                            key={idx}
                            className="text-sm text-gray-300 flex items-start"
                          >
                            <Database className="h-4 w-4 mr-2 mt-0.5 text-blue-400 flex-shrink-0" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
            <p className="text-gray-400 mb-4">
              Click Analyze Dependencies to discover all dependencies for{" "}
              {selectedFile?.name || "the selected file"}
            </p>
            <Button onClick={analyzeFile}>
              <Play className="h-4 w-4 mr-2" />
              Analyze Dependencies
            </Button>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <Dialog
        open={filePreview.isOpen}
        onOpenChange={(open) => !open && closeFilePreview()}
      >
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              {filePreview.fileName}
            </DialogTitle>
            <DialogDescription>
              {filePreview.filePath} • {filePreview.repository}
              {filePreview.highlightLineNumber && (
                <span className="ml-2 text-yellow-400 font-medium">
                  → Line {filePreview.highlightLineNumber}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(85vh-120px)]">
              <div className="p-4 bg-gray-900 rounded-lg font-mono text-sm">
                {filePreview.content === "Loading..." ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading file content...
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filePreview.content.split("\n").map((line, index) => {
                      const lineNumber = index + 1;
                      const isHighlighted =
                        filePreview.highlightLineNumber === lineNumber;

                      return (
                        <div
                          key={index}
                          className={`flex group hover:bg-gray-800/30 transition-colors ${
                            isHighlighted
                              ? "bg-yellow-900/40 border-l-4 border-yellow-400 shadow-lg"
                              : ""
                          }`}
                          id={isHighlighted ? "highlighted-line" : undefined}
                          ref={
                            isHighlighted
                              ? (el) => {
                                  // Auto-scroll to highlighted line when modal opens
                                  if (
                                    el &&
                                    filePreview.content !== "Loading..."
                                  ) {
                                    setTimeout(() => {
                                      el.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center",
                                      });
                                    }, 100);
                                  }
                                }
                              : undefined
                          }
                        >
                          <span
                            className={`text-gray-500 w-12 text-right mr-4 select-none shrink-0 py-1 ${
                              isHighlighted
                                ? "text-yellow-300 font-medium"
                                : "group-hover:text-gray-400"
                            }`}
                          >
                            {lineNumber}
                          </span>
                          <span
                            className={`flex-1 py-1 whitespace-pre-wrap break-words ${
                              isHighlighted
                                ? "text-yellow-100 font-medium bg-yellow-900/20 px-2 rounded"
                                : "text-gray-300"
                            }`}
                          >
                            {line || " "}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
