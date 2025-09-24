"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  ChevronDown,
  FileCode,
  FileType,
  Filter,
  Folder,
  Github,
  Info,
  Loader2,
  Search,
  Zap,
  Code,
  TestTube,
  Package,
  BarChart3,
  Database,
  Copy,
  Clock,
  GitBranch,
  GitCommit,
} from "lucide-react";
import { Repository } from "@/services/github-assistant-service";
import { fetchUserRepositories } from "@/actions/github-actions";
import { githubAPIService, type PRDetailsExtended, type CommitDetailsExtended } from "@/services/github-api-service";

interface TimelineItem {
  sha: string;
  date: string;
  author: string;
  message: string;
  prNumber?: number;
  prTitle?: string;
  branchName?: string;
}

interface PRDetails {
  number: number;
  title: string;
  state: string;
  author: string;
  branch: string;
  baseBranch: string;
  description: string;
  changedFiles: number;
  additions: number;
  deletions: number;
}

interface FileItem {
  name: string;
  path: string;
  type: "apex" | "lwc" | "test" | "other";
  size: number;
  url: string;
  repo: string;
}

interface FileListResponse {
  files: {
    apex: FileItem[];
    lwc: FileItem[];
    test: FileItem[];
    other: FileItem[];
  };
  totalCount: number;
}

interface CodeAnalysis {
  summary: string;
    codeBreakdown: {
    type: string;
    complexity: "Low" | "Medium" | "High";
    linesOfCode: number;
    methods?: number;
    classes?: number;
    queries?: Array<{
      query: string;
      explanation: string;
      type: string;
    } | string>; // Support both old string format and new object format
    dmlOperations?: Array<{
      operation: string;
      explanation: string;
      objectType?: string;
    } | string>; // Support both old string format and new object format
  };
  keyFindings: string[];
  suggestions: string[];
  cognitiveComplexity?: {
    score: number;
    risk: 'Low' | 'Medium' | 'High';
    details: string;
  };
  methodAnalysis?: {
    name: string;
    parameters: string[];
    returnType: string;
    purpose: string;
    complexity: 'Low' | 'Medium' | 'High';
  }[];
  codeStructure?: {
    imports: string[];
    exports: string[];
    dependencies: string[];
  };
  qualityMetrics?: {
    maintainability: number;
    testability: number;
    readability: number;
    overallQuality?: number;
    metricsExplanation?: string;
  };
  improvementSuggestions?: {
    title: string;
    category: 'Performance' | 'Security' | 'Maintainability' | 'Best Practices' | 'Code Quality';
    priority: 'High' | 'Medium' | 'Low';
    description: string;
    currentCode: string;
    suggestedCode: string;
    explanation: string;
    impact: string;
    estimatedEffort: 'Low' | 'Medium' | 'High';
  }[];
  aiInsights?: {
    codeSmells: {
      type: string;
      description: string;
      location: string;
      suggestion: string;
      currentCode?: string;
      suggestedCode?: string;
    }[];
    performanceOptimizations: {
      issue: string;
      solution: string;
      impact: string;
      currentCode?: string;
      optimizedCode?: string;
    }[];
    securityConcerns: {
      vulnerability: string;
      risk: 'Low' | 'Medium' | 'High';
      mitigation: string;
    }[];
    testingRecommendations: {
      area: string;
      testType: string;
      reasoning: string;
    }[];
  };
  specificAnalysis: Record<string, unknown>; // Will vary based on file type
}

interface RepositoryFileSelectorProps {
  onSelectFile: (
    file: FileItem,
    repo: Repository,
    searchRepos: Repository[]
  ) => void;
  initialSearchRepos?: Repository[];
  selectedRepository?: Repository | null;
  searchRepositories?: Repository[];
  selectedModel?: string;
}

export function RepositorySelectorForDiagram({
  onSelectFile,
  initialSearchRepos = [],
  selectedRepository = null,
  searchRepositories = [],
  selectedModel,
}: RepositoryFileSelectorProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(
    selectedRepository
  );
  const [searchRepos, setSearchRepos] = useState<Repository[]>(
    searchRepositories.length > 0 ? searchRepositories : initialSearchRepos
  );
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileSearchQuery, setFileSearchQuery] = useState("");
  const [files, setFiles] = useState<FileListResponse | null>(null);
  const [activeTab, setActiveTab] = useState("apex");
  
  // Code Analysis states
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [selectedFileForAnalysis, setSelectedFileForAnalysis] = useState<FileItem | null>(null);
  const [codeAnalysis, setCodeAnalysis] = useState<CodeAnalysis | null>(null);
  const [analyzingCode, setAnalyzingCode] = useState(false);
  const [isLoadingImprovements, setIsLoadingImprovements] = useState(false);
  
  // Code Preview Modal States
  const [codePreviewModalOpen, setCodePreviewModalOpen] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<FileItem | null>(null);
  const [previewCode, setPreviewCode] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Timeline Modal States
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedFileForTimeline, setSelectedFileForTimeline] = useState<FileItem | null>(null);
  const [fileTimeline, setFileTimeline] = useState<TimelineItem[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [hoveredPR, setHoveredPR] = useState<number | null>(null);
  const [prDetails, setPRDetails] = useState<PRDetails | null>(null);
  
  // Detail Modal States
  const [prDetailModalOpen, setPRDetailModalOpen] = useState(false);
  const [commitDetailModalOpen, setCommitDetailModalOpen] = useState(false);
  const [selectedPRDetails, setSelectedPRDetails] = useState<PRDetailsExtended | null>(null);
  const [selectedCommitDetails, setSelectedCommitDetails] = useState<CommitDetailsExtended | null>(null);
  const [loadingPRDetails, setLoadingPRDetails] = useState(false);
  const [loadingCommitDetails, setLoadingCommitDetails] = useState(false);
  
  // Track preloading to prevent duplicate preloads
  const preloadingRef = useRef<Set<string>>(new Set());
  
  // Force re-render after cache updates
  const [cacheUpdateTrigger, setCacheUpdateTrigger] = useState(0);
  const forceUpdate = () => setCacheUpdateTrigger(prev => prev + 1);

  // Component lifecycle tracking
  useEffect(() => {
    const componentId = `RSFG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    console.log(`🎬 RepositorySelectorForDiagram MOUNTED - ID: ${componentId}`);
    
    return () => {
      console.log(`🎬 RepositorySelectorForDiagram UNMOUNTED - ID: ${componentId}`);
    };
  }, []);

  // Fast Refresh detection
  useEffect(() => {
    console.log(`🔄 RepositorySelectorForDiagram re-rendered (possible Fast Refresh) - trigger: ${cacheUpdateTrigger}`);
  });

  // Helper function to get consistent repository name
  const getRepoName = (): string => {
    const repo = selectedFileForTimeline?.repo || selectedRepo?.full_name || selectedRepo?.name || '';
    console.log(`🏷️ Using repo name: "${repo}" from:`, {
      fromFile: selectedFileForTimeline?.repo,
      fromRepoFull: selectedRepo?.full_name,
      fromRepoName: selectedRepo?.name
    });
    return repo;
  };

  const handlePRClick = async (prNumber: number) => {
    const repo = getRepoName();
    
    // Check if data is instantly available in cache
    if (githubAPIService.isDataCached('pr', repo, prNumber)) {
      console.log(`⚡ Instant load for PR ${repo}#${prNumber}`);
      const cachedData = githubAPIService.getCachedData<PRDetailsExtended>('pr', repo, prNumber);
      if (cachedData) {
        setSelectedPRDetails(cachedData);
        setPRDetailModalOpen(true);
        return;
      }
    }

    // Show loading state
    setLoadingPRDetails(true);
    setPRDetailModalOpen(true);
    
    try {
      const prDetails = await githubAPIService.fetchPRDetails(repo, prNumber);
      if (prDetails) {
        setSelectedPRDetails(prDetails);
      } else {
        console.error('Failed to fetch PR details');
      }
    } catch (error) {
      console.error('Error fetching PR details:', error);
    } finally {
      setLoadingPRDetails(false);
    }
  };

  const handleCommitClick = async (commitSha: string) => {
    const repo = getRepoName();
    
    // Check if data is instantly available in cache
    if (githubAPIService.isDataCached('commit', repo, commitSha)) {
      console.log(`⚡ Instant load for commit ${repo}@${commitSha.substring(0, 8)}`);
      const cachedData = githubAPIService.getCachedData<CommitDetailsExtended>('commit', repo, commitSha);
      if (cachedData) {
        setSelectedCommitDetails(cachedData);
        setCommitDetailModalOpen(true);
        return;
      }
    }

    // Show loading state
    setLoadingCommitDetails(true);
    setCommitDetailModalOpen(true);
    
    try {
      const commitDetails = await githubAPIService.fetchCommitDetails(repo, commitSha);
      if (commitDetails) {
        setSelectedCommitDetails(commitDetails);
      } else {
        console.error('Failed to fetch commit details');
      }
    } catch (error) {
      console.error('Error fetching commit details:', error);
    } finally {
      setLoadingCommitDetails(false);
    }
  };

  // Fetch repositories on mount
  useEffect(() => {
    const fetchRepos = async () => {
      setLoading(true);
      setError(null);

      try {
        const repos = await fetchUserRepositories();
        setRepositories(repos as Repository[]);
      } catch (err) {
        console.error("Error fetching repositories:", err);
        setError("Failed to load repositories");
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  // Fetch files when repository is selected
  useEffect(() => {
    if (selectedRepo) {
      const fetchFiles = async () => {
        setLoadingFiles(true);
        setError(null);

        try {
          const response = await fetch(
            `/api/github/dependencies?repo=${encodeURIComponent(selectedRepo.full_name || selectedRepo.name)}`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch files");
          }

          const fileData = await response.json();
          setFiles(fileData);
        } catch (err) {
          console.error("Error fetching files:", err);
          setError("Failed to load files");
        } finally {
          setLoadingFiles(false);
        }
      };

      fetchFiles();
    }
  }, [selectedRepo]);

  // Filter repositories based on search query
  const filteredRepos = repositories.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description &&
        repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter files based on search query
  const getFilteredFiles = (fileList: FileItem[]) => {
    if (!fileSearchQuery) return fileList;
    return fileList.filter((file) =>
      file.name.toLowerCase().includes(fileSearchQuery.toLowerCase())
    );
  };

  // Handle repository selection
  const handleRepoSelect = (repo: Repository) => {
    setSelectedRepo(repo);
    setFiles(null);
    setFileSearchQuery("");
    setActiveTab("apex");
  };

  // Handle search repository toggle
  const toggleSearchRepo = (repo: Repository) => {
    if (searchRepos.some((r) => r.id === repo.id)) {
      setSearchRepos(searchRepos.filter((r) => r.id !== repo.id));
    } else {
      setSearchRepos([...searchRepos, repo]);
    }
  };

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
        return <FileType className="h-4 w-4 text-gray-400" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get detailed file type for analysis
  const getDetailedFileType = (file: FileItem) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const path = file.path.toLowerCase();
    
    if (extension === 'cls' && path.includes('test')) return 'apex-test';
    if (extension === 'cls') return 'apex-class';
    if (extension === 'trigger') return 'apex-trigger';
    if (extension === 'js' && path.includes('lwc')) return 'lwc-javascript';
    if (extension === 'html' && path.includes('lwc')) return 'lwc-html';
    if (extension === 'css' && path.includes('lwc')) return 'lwc-css';
    if (extension === 'xml' && path.includes('meta')) return 'meta-xml';
    if (extension === 'cmp' && path.includes('aura')) return 'aura-component';
    if (extension === 'app' && path.includes('aura')) return 'aura-application';
    if (extension === 'evt' && path.includes('aura')) return 'aura-event';
    if (extension === 'soql') return 'soql-query';
    
    return file.type;
  };

  // Handle code analysis
  const handleCodeAnalysis = async (file: FileItem) => {
    setSelectedFileForAnalysis(file);
    setAnalysisModalOpen(true);
    setAnalyzingCode(true);
    setCodeAnalysis(null);

    try {
      // Fetch file content
      const fileResponse = await fetch('/api/github/file-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repository: selectedRepo?.full_name || selectedRepo?.name || '',
          filePath: file.path,
        }),
      });

      if (!fileResponse.ok) {
        throw new Error('Failed to fetch file content');
      }

      const fileData = await fileResponse.json();
      const fileContent = fileData.content;
      const detailedType = getDetailedFileType(file);

      // Perform AI analysis
      const analysisResponse = await fetch('/api/code-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContent,
          fileName: file.name,
          filePath: file.path,
          fileType: detailedType,
          repository: selectedRepo?.name,
          selectedModel: selectedModel,
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze code');
      }

      const analysis = await analysisResponse.json();
      setCodeAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing code:', error);
      // Set error state in analysis
      setCodeAnalysis({
        summary: 'Failed to analyze code',
        codeBreakdown: {
          type: 'unknown',
          complexity: 'Low' as const,
          linesOfCode: 0,
        },
        keyFindings: ['Analysis failed. Please try again.'],
        suggestions: [],
        specificAnalysis: { error: 'Analysis failed' },
      });
    } finally {
      setAnalyzingCode(false);
    }
  };

  // Handle code preview
  const handleCodePreview = async (file: FileItem) => {
    setSelectedFileForPreview(file);
    setCodePreviewModalOpen(true);
    setLoadingPreview(true);
    setPreviewCode('');

    try {
      // Fetch file content
      const fileResponse = await fetch('/api/github/file-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repository: selectedRepo?.full_name || selectedRepo?.name || '',
          filePath: file.path,
        }),
      });

      if (!fileResponse.ok) {
        throw new Error('Failed to fetch file content');
      }

      const fileData = await fileResponse.json();
      setPreviewCode(fileData.content);
    } catch (error) {
      console.error('Error fetching file content:', error);
      setPreviewCode('// Error: Failed to load file content\n// Please try again later.');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Handle timeline view
  const handleTimelineView = async (file: FileItem) => {
    setSelectedFileForTimeline(file);
    setTimelineModalOpen(true);
    setLoadingTimeline(true);
    setFileTimeline([]);

    try {
      // Fetch file commit history
      const response = await fetch('/api/github/file-timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repository: selectedRepo?.full_name || selectedRepo?.name || '',
          filePath: file.path,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch file timeline');
      }

      const timelineData = await response.json();
      const timeline = timelineData.timeline || [];
      setFileTimeline(timeline);

      // Start preloading PR and commit details in the background
      if (timeline.length > 0) {
        const repo = getRepoName();
        const preloadKey = `${repo}:${timeline.map((t: TimelineItem) => t.sha.substring(0, 8)).join(',')}`;
        
        // Check if we're already preloading this exact timeline
        if (!preloadingRef.current.has(preloadKey)) {
          preloadingRef.current.add(preloadKey);
          
          const preloadData = timeline.map((item: TimelineItem) => ({
            sha: item.sha,
            prs: item.prNumber ? [item.prNumber] : []
          }));
          
          console.log(`🚀 Starting preload for ${repo} with ${preloadData.length} items:`, preloadData.slice(0, 3), '...');
          
          // Preload in background without blocking UI
          githubAPIService.preloadTimelineData(repo, preloadData).then(() => {
            console.log(`✅ Preloading completed for ${repo} - ${preloadData.length} items processed`);
            // Remove from preloading set after completion
            preloadingRef.current.delete(preloadKey);
            
            // Force re-render to update cache indicators with slight delay
            setTimeout(() => {
              forceUpdate();
              console.log(`🔄 Forced re-render after cache completion for ${repo}`);
            }, 100);
          }).catch(error => {
            console.warn('❌ Background preloading failed:', error);
            // Remove from preloading set on error
            preloadingRef.current.delete(preloadKey);
          });
        } else {
          console.log(`⏩ Skipping duplicate preload for ${repo}`);
        }
      } else {
        console.log('⚠️ No timeline items to preload');
      }
    } catch (error) {
      console.error('Error fetching file timeline:', error);
      setFileTimeline([{
        sha: 'error',
        date: new Date().toISOString(),
        author: 'System',
        message: 'Failed to load timeline data. Please try again later.',
      }]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  // Handle PR hover
  const handlePRHover = async (prNumber: number) => {
    console.log('PR hover triggered for PR #', prNumber);
    setHoveredPR(prNumber);
    
    // Only fetch PR details if we don't already have them
    if (!prDetails || prDetails.number !== prNumber) {
      try {
        const response = await fetch('/api/github/pr-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repository: selectedRepo?.full_name || selectedRepo?.name || '',
            prNumber,
          }),
        });

        if (response.ok) {
          const prData = await response.json();
          console.log('PR details fetched:', prData);
          setPRDetails(prData);
        } else {
          console.error('Failed to fetch PR details:', response.status);
        }
      } catch (error) {
        console.error('Error fetching PR details:', error);
      }
    }
  };

  const generateImprovements = async () => {
    if (!selectedFileForAnalysis || !codeAnalysis) {
      return;
    }

    setIsLoadingImprovements(true);
    try {
      // Get file content first
      const fileResponse = await fetch('/api/github/file-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repository: selectedRepo?.full_name || selectedRepo?.name || '',
          filePath: selectedFileForAnalysis.path,
        }),
      });

      if (!fileResponse.ok) {
        throw new Error('Failed to fetch file content');
      }

      const fileData = await fileResponse.json();

      // Call improvement suggestions API
      const improvementResponse = await fetch('/api/code-improvement-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileContent: fileData.content,
          fileName: selectedFileForAnalysis.name,
          fileType: selectedFileForAnalysis.type,
          existingAnalysis: codeAnalysis,
        }),
      });

      if (!improvementResponse.ok) {
        throw new Error('Failed to generate improvement suggestions');
      }

      const improvements = await improvementResponse.json();
      
      // Update code analysis with improvements
      setCodeAnalysis(prev => prev ? {
        ...prev,
        improvementSuggestions: improvements.improvementSuggestions,
        aiInsights: improvements.aiInsights,
      } : null);
      
    } catch (error) {
      console.error('Error generating improvements:', error);
      // You could add a toast notification here
    } finally {
      setIsLoadingImprovements(false);
    }
  };

  if (!selectedRepo) {
    return (
      <Card className="border-gray-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Github className="mr-2 h-5 w-5" />
              Select Repository
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Select a repository to browse its Salesforce files and
                    analyze dependencies.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>
            Choose a repository to explore its Apex classes, LWC components, and
            tests
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search repositories..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="border rounded-md border-gray-800 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center p-8 space-y-2">
                <p className="text-sm text-red-400">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Filter className="h-8 w-8 text-gray-500 mb-2" />
                <h3 className="font-medium">No matching repositories</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your search query
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[60vh] min-h-96">
                <div className="divide-y divide-gray-800">
                  {filteredRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-start p-3 hover:bg-gray-900/40 transition-colors cursor-pointer"
                      onClick={() => handleRepoSelect(repo)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <h4 className="font-medium text-sm text-white truncate">
                            {repo.name}
                          </h4>
                          {repo.private && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-xs px-1.5 py-0"
                            >
                              Private
                            </Badge>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                            {repo.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRepoSelect(repo);
                        }}
                      >
                        Browse Files
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 mr-2"
              onClick={() => setSelectedRepo(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg flex items-center">
              <Folder className="mr-2 h-5 w-5" />
              {selectedRepo.name}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs">
                    {searchRepos.length} search{" "}
                    {searchRepos.length === 1 ? "repo" : "repos"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Dependencies will be searched in:{" "}
                    {searchRepos.map((r) => r.name).join(", ") ||
                      "current repository only"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <a
              href={selectedRepo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-200"
              title={`Open ${selectedRepo.name} on GitHub`}
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
        <CardDescription>
          Select a file to analyze its dependencies across repositories
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Compact Search Repositories Section with Collapsible */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-2 border rounded-md border-gray-800 bg-gray-900/20 cursor-pointer hover:bg-gray-900/30 transition-colors">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">Search Dependencies In:</h4>
                <Badge variant="secondary" className="text-xs">
                  {searchRepos.length} selected
                </Badge>
              </div>
              <ChevronDown className="h-4 w-4" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <ScrollArea className="max-h-32 border rounded-md border-gray-800 p-2">
              <div className="flex flex-wrap gap-1.5">
                {repositories.map((repo) => (
                  <Badge
                    key={repo.id}
                    variant={
                      searchRepos.some((r) => r.id === repo.id)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer text-xs"
                    onClick={() => toggleSearchRepo(repo)}
                  >
                    {repo.name}
                    {searchRepos.some((r) => r.id === repo.id) && (
                      <span className="ml-1">✓</span>
                    )}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>

        {/* File Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search files..."
            className="pl-9 h-9"
            value={fileSearchQuery}
            onChange={(e) => setFileSearchQuery(e.target.value)}
          />
        </div>

        {/* File Tabs */}
        {loadingFiles ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : files ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 h-9">
              <TabsTrigger value="apex" className="flex items-center gap-1 text-xs px-2">
                <FileCode className="h-3 w-3" />
                Apex ({files.files.apex.length})
              </TabsTrigger>
              <TabsTrigger value="lwc" className="flex items-center gap-1 text-xs px-2">
                <Zap className="h-3 w-3" />
                LWC ({files.files.lwc.length})
              </TabsTrigger>
              <TabsTrigger value="test" className="flex items-center gap-1 text-xs px-2">
                <TestTube className="h-3 w-3" />
                Tests ({files.files.test.length})
              </TabsTrigger>
              <TabsTrigger value="other" className="flex items-center gap-1 text-xs px-2">
                <Package className="h-3 w-3" />
                Other ({files.files.other.length})
              </TabsTrigger>
            </TabsList>

            {["apex", "lwc", "test", "other"].map((type) => (
              <TabsContent key={type} value={type} className="mt-3">
                <ScrollArea className="h-[calc(100vh-400px)] min-h-96 border rounded-md border-gray-800">
                  {getFilteredFiles(
                    files.files[type as keyof typeof files.files]
                  ).length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Filter className="h-8 w-8 text-gray-500 mb-2" />
                      <h3 className="font-medium">No matching files</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {fileSearchQuery
                          ? "No files match your search"
                          : "No files found"}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-800">
                      {getFilteredFiles(
                        files.files[type as keyof typeof files.files]
                      ).map((file) => (
                        <div
                          key={file.path}
                          className="flex items-center justify-between p-3 hover:bg-gray-900/40 transition-colors"
                        >
                          <div 
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                            onClick={() => {
                              const effectiveSearchRepos =
                                searchRepos.length > 0
                                  ? searchRepos
                                  : [selectedRepo];
                              onSelectFile(
                                file,
                                selectedRepo,
                                effectiveSearchRepos
                              );
                            }}
                          >
                            {getFileIcon(type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {file.path}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{formatFileSize(file.size)}</span>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-green-500/20 text-green-400 hover:text-green-300 transition-all duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCodePreview(file);
                                  }}
                                  title="Preview Code"
                                >
                                  <Code className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition-all duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTimelineView(file);
                                  }}
                                  title="File Timeline"
                                >
                                  <Clock className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-all duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCodeAnalysis(file);
                                  }}
                                  title="AI Code Analysis"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" opacity="0.3"/>
                                    <circle cx="8" cy="9" r="1.5" fill="currentColor"/>
                                    <circle cx="16" cy="9" r="1.5" fill="currentColor"/>
                                    <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
                                    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                                    <circle cx="9" cy="15" r="1.5" fill="currentColor"/>
                                    <circle cx="15" cy="15" r="1.5" fill="currentColor"/>
                                    <path d="M8 9l4-3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                                    <path d="M16 9l-4-3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                                    <path d="M8 9l4 3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                                    <path d="M16 9l-4 3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                                    <path d="M12 12l-3 3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                                    <path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                                  </svg>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-gray-400">
              Select a repository to view its files
            </p>
          </div>
        )}
      </CardContent>

      {/* Code Analysis Modal */}
      <Dialog open={analysisModalOpen} onOpenChange={setAnalysisModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" opacity="0.3"/>
                  <circle cx="8" cy="9" r="1.5" fill="currentColor"/>
                  <circle cx="16" cy="9" r="1.5" fill="currentColor"/>
                  <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
                  <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                  <circle cx="9" cy="15" r="1.5" fill="currentColor"/>
                  <circle cx="15" cy="15" r="1.5" fill="currentColor"/>
                  <path d="M8 9l4-3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                  <path d="M16 9l-4-3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                  <path d="M8 9l4 3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                  <path d="M16 9l-4 3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                  <path d="M12 12l-3 3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                  <path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                </svg>
              </div>
              Code Analysis: {selectedFileForAnalysis?.name}
            </DialogTitle>
            <DialogDescription>
              AI-powered comprehensive analysis of {selectedFileForAnalysis?.path}
            </DialogDescription>
          </DialogHeader>

          {analyzingCode ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center space-y-4">
                <div className="relative w-8 h-8 mx-auto">
                  <div className="absolute inset-0 animate-spin">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" opacity="0.2"/>
                      <circle cx="8" cy="9" r="1.5" fill="currentColor"/>
                      <circle cx="16" cy="9" r="1.5" fill="currentColor"/>
                      <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
                      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                      <circle cx="9" cy="15" r="1.5" fill="currentColor"/>
                      <circle cx="15" cy="15" r="1.5" fill="currentColor"/>
                      <path d="M8 9l4-3" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                      <path d="M16 9l-4-3" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                      <path d="M8 9l4 3" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                      <path d="M16 9l-4 3" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                      <path d="M12 12l-3 3" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                      <path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                    </svg>
                  </div>
                  <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse transform -translate-x-1/2 -translate-y-1/2"></div>
                </div>
                <p className="text-sm text-gray-400">
                  Analyzing code with AI... This may take a moment.
                </p>
              </div>
            </div>
          ) : codeAnalysis ? (
            <ScrollArea className="h-[calc(90vh-120px)]">
              <div className="space-y-6 p-1">
                {/* Summary */}
                <Card className="border-gray-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {codeAnalysis.summary}
                    </p>
                  </CardContent>
                </Card>

                {/* Code Breakdown */}
                <Card className="border-gray-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Code Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-400">
                          {codeAnalysis.codeBreakdown.linesOfCode}
                        </p>
                        <p className="text-xs text-gray-400">Lines of Code</p>
                      </div>
                      <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                        <p className="text-lg font-semibold text-green-400">
                          {codeAnalysis.codeBreakdown.type}
                        </p>
                        <p className="text-xs text-gray-400">File Type</p>
                      </div>
                      <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                        <p className="text-lg font-semibold text-yellow-400">
                          {codeAnalysis.codeBreakdown.complexity}
                        </p>
                        <p className="text-xs text-gray-400">Complexity</p>
                      </div>
                      {codeAnalysis.codeBreakdown.methods !== undefined && (
                        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-400">
                            {codeAnalysis.codeBreakdown.methods}
                          </p>
                          <p className="text-xs text-gray-400">Methods</p>
                        </div>
                      )}
                      {codeAnalysis.codeBreakdown.classes !== undefined && (
                        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                          <p className="text-2xl font-bold text-orange-400">
                            {codeAnalysis.codeBreakdown.classes}
                          </p>
                          <p className="text-xs text-gray-400">Classes</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Cognitive Complexity */}
                {codeAnalysis.cognitiveComplexity && (
                  <Card className="border-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Cognitive Complexity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-orange-400">
                            {codeAnalysis.cognitiveComplexity.score}
                          </p>
                          <p className="text-xs text-gray-400">Score</p>
                        </div>
                        <div className="text-center">
                          <Badge
                            variant={
                              codeAnalysis.cognitiveComplexity.risk === 'Low'
                                ? 'default'
                                : codeAnalysis.cognitiveComplexity.risk === 'Medium'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {codeAnalysis.cognitiveComplexity.risk} Risk
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">
                        {codeAnalysis.cognitiveComplexity.details}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Key Findings and Suggestions */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Key Findings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {codeAnalysis.keyFindings.map((finding, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                            <span className="text-sm text-gray-300">{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {codeAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5 flex-shrink-0" />
                            <span className="text-sm text-gray-300">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Quality Metrics */}
                {codeAnalysis.qualityMetrics && (
                  <Card className="border-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Quality Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {Object.entries(codeAnalysis.qualityMetrics)
                          .filter(([key]) => key !== 'metricsExplanation') // Exclude explanation from metrics display
                          .map(([key, value]) => (
                          <div key={key} className="text-center">
                            <div className="relative w-16 h-16 mx-auto mb-2">
                              <div className="absolute inset-0 rounded-full bg-gray-800"></div>
                              <div className="absolute inset-2 rounded-full bg-gray-950 flex items-center justify-center">
                                <span className="text-xs font-bold">{value}%</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          </div>
                        ))}
                      </div>
                      
                      {/* Metrics Explanation */}
                      {codeAnalysis.qualityMetrics.metricsExplanation && (
                        <div className="mt-4 p-3 bg-gray-900/30 border border-gray-800 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Metrics Analysis</h4>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {codeAnalysis.qualityMetrics.metricsExplanation}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Method Analysis */}
                {codeAnalysis.methodAnalysis && codeAnalysis.methodAnalysis.length > 0 && (
                  <Card className="border-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileCode className="h-5 w-5" />
                        Method Analysis
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-400">
                        Comprehensive analysis of methods and functions in your code
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-800/30 rounded-lg p-3">
                          <div className="text-2xl font-bold text-blue-400">
                            {codeAnalysis.methodAnalysis.length}
                          </div>
                          <div className="text-xs text-gray-400">Total Methods</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-800/30 rounded-lg p-3">
                          <div className="text-2xl font-bold text-green-400">
                            {codeAnalysis.methodAnalysis.filter(m => m.complexity === 'Low').length}
                          </div>
                          <div className="text-xs text-gray-400">Low Complexity</div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border border-yellow-800/30 rounded-lg p-3">
                          <div className="text-2xl font-bold text-yellow-400">
                            {codeAnalysis.methodAnalysis.filter(m => m.complexity === 'Medium').length}
                          </div>
                          <div className="text-xs text-gray-400">Medium Complexity</div>
                        </div>
                        <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-800/30 rounded-lg p-3">
                          <div className="text-2xl font-bold text-red-400">
                            {codeAnalysis.methodAnalysis.filter(m => m.complexity === 'High').length}
                          </div>
                          <div className="text-xs text-gray-400">High Complexity</div>
                        </div>
                      </div>

                      {/* Methods Grid */}
                      <div className="space-y-4">
                        {codeAnalysis.methodAnalysis.map((method, index) => {
                          const complexityConfig = {
                            Low: { color: 'green', icon: '✓', bg: 'from-green-900/20 to-green-800/10', border: 'border-green-800/30' },
                            Medium: { color: 'yellow', icon: '⚠', bg: 'from-yellow-900/20 to-yellow-800/10', border: 'border-yellow-800/30' },
                            High: { color: 'red', icon: '⚡', bg: 'from-red-900/20 to-red-800/10', border: 'border-red-800/30' }
                          };
                          
                          const config = complexityConfig[method.complexity as keyof typeof complexityConfig] || complexityConfig.Low;
                          
                          // Calculate method insights
                          const hasParameters = method.parameters.length > 0;
                          const isVoidReturn = method.returnType.toLowerCase() === 'void' || method.returnType.toLowerCase() === 'none';
                          const isPublic = method.name.includes('public') || (!method.name.includes('private') && !method.name.includes('protected'));
                          
                          return (
                            <div key={index} className={`bg-gradient-to-r ${config.bg} border ${config.border} rounded-lg overflow-hidden`}>
                              {/* Method Header */}
                              <div className="bg-gray-900/40 px-4 py-3 border-b border-gray-700">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 bg-${config.color}-500 rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                                      {index + 1}
                                    </div>
                                    <div>
                                      <h4 className="font-mono text-sm font-bold text-blue-400">
                                        {method.name}
                                      </h4>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Method #{index + 1}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs text-${config.color}-400 border-${config.color}-400 bg-${config.color}-900/20`}
                                    >
                                      {config.icon} {method.complexity}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Method Content */}
                              <div className="p-4">
                                {/* Method Purpose */}
                                <div className="mb-4">
                                  <h5 className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    Purpose & Functionality
                                  </h5>
                                  <p className="text-sm text-gray-300 leading-relaxed bg-gray-900/30 p-3 rounded-lg">
                                    {method.purpose}
                                  </p>
                                </div>

                                {/* Method Signature */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                                  {/* Parameters */}
                                  <div className="bg-gray-800/30 rounded-lg p-3">
                                    <h5 className="font-semibold text-gray-200 mb-2 flex items-center gap-2">
                                      <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                                      Parameters ({method.parameters.length})
                                    </h5>
                                    <div className="space-y-1">
                                      {method.parameters.length > 0 ? (
                                        method.parameters.map((param, paramIndex) => (
                                          <div key={paramIndex} className="bg-gray-900/50 rounded px-2 py-1">
                                            <code className="text-xs text-cyan-300 font-mono">
                                              {param}
                                            </code>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-xs text-gray-500 italic">
                                          No parameters
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Return Type */}
                                  <div className="bg-gray-800/30 rounded-lg p-3">
                                    <h5 className="font-semibold text-gray-200 mb-2 flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                      Return Type
                                    </h5>
                                    <div className="bg-gray-900/50 rounded px-2 py-1">
                                      <code className="text-xs text-green-400 font-mono">
                                        {method.returnType}
                                      </code>
                                    </div>
                                    <div className="flex items-center gap-1 mt-2">
                                      {isVoidReturn ? (
                                        <div className="flex items-center gap-1 text-orange-400">
                                          <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
                                          <span className="text-xs">No return value</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 text-green-400">
                                          <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                                          <span className="text-xs">Returns data</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Method Insights */}
                                  <div className="bg-gray-800/30 rounded-lg p-3">
                                    <h5 className="font-semibold text-gray-200 mb-2 flex items-center gap-2">
                                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                      Insights
                                    </h5>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        <div className={`w-1 h-1 bg-${hasParameters ? 'blue' : 'gray'}-400 rounded-full`}></div>
                                        <span className={`text-xs ${hasParameters ? 'text-blue-400' : 'text-gray-500'}`}>
                                          {hasParameters ? 'Accepts parameters' : 'No parameters'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <div className={`w-1 h-1 bg-${isPublic ? 'green' : 'orange'}-400 rounded-full`}></div>
                                        <span className={`text-xs ${isPublic ? 'text-green-400' : 'text-orange-400'}`}>
                                          {isPublic ? 'Public access' : 'Restricted access'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <div className={`w-1 h-1 bg-${config.color}-400 rounded-full`}></div>
                                        <span className={`text-xs text-${config.color}-400`}>
                                          {method.complexity} complexity
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Complexity Analysis */}
                                <div className="bg-gray-900/30 rounded-lg p-3">
                                  <h5 className="font-semibold text-gray-200 mb-2 flex items-center gap-2">
                                    <div className={`w-2 h-2 bg-${config.color}-400 rounded-full`}></div>
                                    Complexity Analysis
                                  </h5>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-400">Cognitive Complexity:</span>
                                      <Badge variant="outline" className={`text-xs text-${config.color}-400 border-${config.color}-400`}>
                                        {method.complexity}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {method.complexity === 'Low' && 'Easy to understand and maintain'}
                                      {method.complexity === 'Medium' && 'Moderately complex, review recommended'}
                                      {method.complexity === 'High' && 'High complexity, consider refactoring'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* SOQL Queries & DML Operations */}
                {((codeAnalysis.codeBreakdown.queries?.length ?? 0) > 0 || (codeAnalysis.codeBreakdown.dmlOperations?.length ?? 0) > 0) && (
                  <Card className="border-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Database Operations
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-400">
                        SOQL queries and database operations found in the code
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* SOQL Queries Section */}
                        {(codeAnalysis.codeBreakdown.queries?.length ?? 0) > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                SOQL Queries ({codeAnalysis.codeBreakdown.queries?.length})
                              </Badge>
                            </div>
                            
                            <div className="space-y-4">
                              {codeAnalysis.codeBreakdown.queries?.map((queryInfo, index) => {
                                // Handle both old string format and new object format
                                const isQueryObject = typeof queryInfo === 'object' && queryInfo !== null && 'query' in queryInfo;
                                const query = isQueryObject ? queryInfo.query : (typeof queryInfo === 'string' ? queryInfo : '');
                                const explanation = isQueryObject ? queryInfo.explanation : 'Query analysis';
                                const type = isQueryObject ? queryInfo.type : 'SELECT';
                                
                                // Extract SObjects from query
                                const extractSObjects = (sqlQuery: string) => {
                                  const objects = new Set<string>();
                                  
                                  // Match FROM clause
                                  const fromMatch = sqlQuery.match(/FROM\s+(\w+)/gi);
                                  if (fromMatch) {
                                    fromMatch.forEach(match => {
                                      const obj = match.replace(/FROM\s+/i, '');
                                      objects.add(obj);
                                    });
                                  }
                                  
                                  // Match relationship fields (e.g., Account.Name, Contact.Email)
                                  const relationshipMatches = sqlQuery.match(/(\w+)\.(\w+)/g);
                                  if (relationshipMatches) {
                                    relationshipMatches.forEach(match => {
                                      const obj = match.split('.')[0];
                                      if (!['WHERE', 'ORDER', 'GROUP'].includes(obj.toUpperCase())) {
                                        objects.add(obj);
                                      }
                                    });
                                  }
                                  
                                  return Array.from(objects);
                                };
                                
                                const sObjects = extractSObjects(query);
                                
                                return (
                                  <div key={index} className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900/30">
                                    {/* Query Header */}
                                    <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 px-4 py-3 border-b border-gray-700">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                            {index + 1}
                                          </div>
                                          <h4 className="font-medium text-sm text-blue-400">
                                            {type} Query
                                          </h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {query.includes('WITH SECURITY_ENFORCED') && (
                                            <Badge variant="secondary" className="text-xs bg-green-900/30 text-green-400 border-green-400">
                                              Secure
                                            </Badge>
                                          )}
                                          {query.includes('LIMIT') && (
                                            <Badge variant="secondary" className="text-xs bg-yellow-900/30 text-yellow-400 border-yellow-400">
                                              Limited
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                                        <span className="font-medium text-blue-300">Purpose:</span> {explanation}
                                      </p>
                                    </div>
                                    
                                    {/* Query Content */}
                                    <div className="p-4">
                                      {/* SQL Query Display */}
                                      <div className="mb-4">
                                        <div className="bg-gray-950 rounded-lg p-4 border border-gray-800 relative">
                                          <div className="absolute top-2 right-2">
                                            <Badge variant="outline" className="text-xs">
                                              SOQL
                                            </Badge>
                                          </div>
                                          <pre className="text-sm font-mono text-gray-200 whitespace-pre-wrap leading-relaxed pr-16">
                                            {query}
                                          </pre>
                                        </div>
                                      </div>
                                      
                                      {/* Query Analysis Grid */}
                                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                                        {/* Objects Accessed */}
                                        <div className="bg-gray-800/30 rounded-lg p-3">
                                          <h5 className="font-semibold text-gray-200 mb-2 flex items-center gap-1">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                            Objects Accessed
                                          </h5>
                                          <div className="flex flex-wrap gap-1">
                                            {sObjects.length > 0 ? sObjects.map((obj, idx) => (
                                              <Badge key={idx} variant="outline" className="text-xs text-blue-400 border-blue-400">
                                                {obj}
                                              </Badge>
                                            )) : (
                                              <span className="text-gray-500 text-xs">No objects detected</span>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Security Features */}
                                        <div className="bg-gray-800/30 rounded-lg p-3">
                                          <h5 className="font-semibold text-gray-200 mb-2 flex items-center gap-1">
                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                            Security
                                          </h5>
                                          <div className="space-y-1">
                                            {query.includes('WITH SECURITY_ENFORCED') && (
                                              <div className="flex items-center gap-1 text-green-400">
                                                <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                                                <span>CRUD/FLS Enforced</span>
                                              </div>
                                            )}
                                            {query.includes(':') && (
                                              <div className="flex items-center gap-1 text-blue-400">
                                                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                                                <span>Parameterized</span>
                                              </div>
                                            )}
                                            {!query.includes('WITH SECURITY_ENFORCED') && (
                                              <div className="flex items-center gap-1 text-orange-400">
                                                <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
                                                <span>No Security Enforcement</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Performance Indicators */}
                                        <div className="bg-gray-800/30 rounded-lg p-3">
                                          <h5 className="font-semibold text-gray-200 mb-2 flex items-center gap-1">
                                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                            Performance
                                          </h5>
                                          <div className="space-y-1">
                                            {query.includes('LIMIT') && (
                                              <div className="flex items-center gap-1 text-green-400">
                                                <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                                                <span>Result Limited</span>
                                              </div>
                                            )}
                                            {query.includes('WHERE') && (
                                              <div className="flex items-center gap-1 text-blue-400">
                                                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                                                <span>Filtered Query</span>
                                              </div>
                                            )}
                                            {!query.includes('LIMIT') && (
                                              <div className="flex items-center gap-1 text-orange-400">
                                                <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
                                                <span>No Result Limit</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* DML Operations Section */}
                        {(codeAnalysis.codeBreakdown.dmlOperations?.length ?? 0) > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                DML Operations ({codeAnalysis.codeBreakdown.dmlOperations?.length})
                              </Badge>
                            </div>
                            
                            <div className="grid gap-3">
                              {codeAnalysis.codeBreakdown.dmlOperations?.map((dmlInfo, index) => {
                                // Handle both old string format and new object format
                                const isDmlObject = typeof dmlInfo === 'object' && dmlInfo !== null && 'operation' in dmlInfo;
                                const operation = isDmlObject ? dmlInfo.operation : (typeof dmlInfo === 'string' ? dmlInfo : '');
                                const explanation = isDmlObject ? dmlInfo.explanation : 'DML operation';
                                const objectType = isDmlObject ? dmlInfo.objectType : undefined;
                                
                                return (
                                  <div key={index} className="bg-gradient-to-r from-green-900/20 to-green-800/10 border border-green-800/30 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                          {operation.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-semibold text-green-400">{operation.toUpperCase()}</span>
                                      </div>
                                      {objectType && (
                                        <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                                          {objectType}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                      {explanation}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI-Powered Code Improvement Suggestions */}
                <Card className="border-gray-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" opacity="0.3"/>
                          <circle cx="8" cy="9" r="1.5" fill="currentColor"/>
                          <circle cx="16" cy="9" r="1.5" fill="currentColor"/>
                          <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
                          <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                          <circle cx="9" cy="15" r="1.5" fill="currentColor"/>
                          <circle cx="15" cy="15" r="1.5" fill="currentColor"/>
                          <path d="M8 9l4-3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                          <path d="M16 9l-4-3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                          <path d="M8 9l4 3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                          <path d="M16 9l-4 3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                          <path d="M12 12l-3 3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                          <path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                        </svg>
                      </div>
                      AI-Powered Code Improvements
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-400">
                      Intelligent suggestions to enhance your code quality, performance, and maintainability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      
                      {/* Code Improvement Suggestions */}
                      {codeAnalysis.improvementSuggestions && codeAnalysis.improvementSuggestions.length > 0 ? (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Badge variant="outline" className="text-blue-400 border-blue-400">
                              Code Improvements ({codeAnalysis.improvementSuggestions.length})
                            </Badge>
                          </div>
                            
                            <div className="space-y-4">
                              {codeAnalysis.improvementSuggestions.map((suggestion, index) => {
                                const categoryConfig = {
                                  'Performance': { color: 'green', icon: '⚡', bg: 'from-green-900/20 to-green-800/10', border: 'border-green-800/30' },
                                  'Security': { color: 'red', icon: '🛡️', bg: 'from-red-900/20 to-red-800/10', border: 'border-red-800/30' },
                                  'Maintainability': { color: 'blue', icon: '🔧', bg: 'from-blue-900/20 to-blue-800/10', border: 'border-blue-800/30' },
                                  'Best Practices': { color: 'teal', icon: '✨', bg: 'from-teal-900/20 to-teal-800/10', border: 'border-teal-800/30' },
                                  'Code Quality': { color: 'indigo', icon: '💎', bg: 'from-indigo-900/20 to-indigo-800/10', border: 'border-indigo-800/30' }
                                };
                                
                                const config = categoryConfig[suggestion.category] || categoryConfig['Code Quality'];
                                
                                return (
                                  <div key={index} className={`bg-gradient-to-r ${config.bg} border ${config.border} rounded-lg overflow-hidden`}>
                                    {/* Suggestion Header */}
                                    <div className="bg-gray-900/40 px-4 py-3 border-b border-gray-700">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 bg-${config.color}-500 rounded-full flex items-center justify-center text-white text-lg`}>
                                            {config.icon}
                                          </div>
                                          <div>
                                            <h4 className="font-semibold text-sm text-gray-100">
                                              {suggestion.title}
                                            </h4>
                                            <p className="text-xs text-gray-400 mt-1">
                                              {suggestion.category} • Effort: {suggestion.estimatedEffort}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge 
                                            variant="outline" 
                                            className={`text-xs
                                              ${suggestion.priority === 'High' ? 'text-red-400 border-red-400' :
                                                suggestion.priority === 'Medium' ? 'text-yellow-400 border-yellow-400' : 
                                                'text-green-400 border-green-400'}`}
                                          >
                                            {suggestion.priority} Priority
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Suggestion Content */}
                                    <div className="p-4">
                                      {/* Description */}
                                      <div className="mb-4">
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                          {suggestion.description}
                                        </p>
                                      </div>

                                      {/* Side-by-side Code Comparison */}
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                        {/* Current Code */}
                                        <div className="bg-gray-900/70 rounded-lg overflow-hidden border border-gray-700">
                                          <div className="bg-red-900/40 px-3 py-2 border-b border-red-800/40">
                                            <div className="flex items-center gap-2">
                                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                              <span className="text-xs font-medium text-red-300">Current Code</span>
                                            </div>
                                          </div>
                                          <div className="p-4 bg-gray-950/50">
                                            <pre className="text-sm font-mono text-gray-100 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                                              {suggestion.currentCode}
                                            </pre>
                                          </div>
                                        </div>

                                        {/* Suggested Code */}
                                        <div className="bg-gray-900/70 rounded-lg overflow-hidden border border-gray-700">
                                          <div className="bg-green-900/40 px-3 py-2 border-b border-green-800/40">
                                            <div className="flex items-center gap-2">
                                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                              <span className="text-xs font-medium text-green-300">Suggested Improvement</span>
                                            </div>
                                          </div>
                                          <div className="p-4 bg-gray-950/50">
                                            <pre className="text-sm font-mono text-gray-100 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                                              {suggestion.suggestedCode}
                                            </pre>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Explanation and Impact */}
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="bg-gray-800/30 rounded-lg p-3">
                                          <h5 className="font-semibold text-gray-200 mb-2 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                            Why This Helps
                                          </h5>
                                          <p className="text-xs text-gray-300 leading-relaxed">
                                            {suggestion.explanation}
                                          </p>
                                        </div>
                                        
                                        <div className="bg-gray-800/30 rounded-lg p-3">
                                          <h5 className="font-semibold text-gray-200 mb-2 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                            Expected Impact
                                          </h5>
                                          <p className="text-xs text-gray-300 leading-relaxed">
                                            {suggestion.impact}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}

                        {/* AI Insights */}
                        {codeAnalysis.aiInsights ? (
                          <div className="space-y-6">
                            
                            {/* Code Smells */}
                            {codeAnalysis.aiInsights.codeSmells && codeAnalysis.aiInsights.codeSmells.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <Badge variant="outline" className="text-amber-400 border-amber-400">
                                    Code Smells Detected ({codeAnalysis.aiInsights.codeSmells.length})
                                  </Badge>
                                </div>
                                
                                <div className="grid gap-4">
                                  {codeAnalysis.aiInsights.codeSmells.map((smell, index) => (
                                    <div key={index} className="bg-gradient-to-r from-amber-900/20 to-amber-800/10 border border-amber-800/30 rounded-lg overflow-hidden">
                                      {/* Header */}
                                      <div className="bg-gray-900/40 px-4 py-3 border-b border-gray-700">
                                        <div className="flex items-start gap-3">
                                          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                            ⚠
                                          </div>
                                          <div className="flex-1">
                                            <h5 className="font-semibold text-amber-400 mb-1">{smell.type}</h5>
                                            <p className="text-sm text-gray-300">{smell.description}</p>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Content */}
                                      <div className="p-4">
                                        {/* Location and Suggestion Info */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                          <div className="bg-gray-900/30 rounded-lg p-3">
                                            <span className="text-xs text-gray-400 uppercase tracking-wide">Location</span>
                                            <p className="text-sm text-gray-200 font-mono mt-1">{smell.location}</p>
                                          </div>
                                          <div className="bg-gray-900/30 rounded-lg p-3">
                                            <span className="text-xs text-gray-400 uppercase tracking-wide">Suggestion</span>
                                            <p className="text-sm text-gray-200 mt-1">{smell.suggestion}</p>
                                          </div>
                                        </div>

                                        {/* Code Comparison - if available */}
                                        {smell.currentCode && smell.suggestedCode && (
                                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {/* Problem Code */}
                                            <div className="bg-gray-900/70 rounded-lg overflow-hidden border border-gray-700">
                                              <div className="bg-red-900/40 px-3 py-2 border-b border-red-800/40">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                  <span className="text-xs font-medium text-red-300">Problem Code</span>
                                                </div>
                                              </div>
                                              <div className="p-4 bg-gray-950/50">
                                                <pre className="text-sm font-mono text-gray-100 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                                                  {smell.currentCode}
                                                </pre>
                                              </div>
                                            </div>

                                            {/* Fixed Code */}
                                            <div className="bg-gray-900/70 rounded-lg overflow-hidden border border-gray-700">
                                              <div className="bg-green-900/40 px-3 py-2 border-b border-green-800/40">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                  <span className="text-xs font-medium text-green-300">Fixed Code</span>
                                                </div>
                                              </div>
                                              <div className="p-4 bg-gray-950/50">
                                                <pre className="text-sm font-mono text-gray-100 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                                                  {smell.suggestedCode}
                                                </pre>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Performance Optimizations */}
                            {codeAnalysis.aiInsights.performanceOptimizations && codeAnalysis.aiInsights.performanceOptimizations.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <Badge variant="outline" className="text-green-400 border-green-400">
                                    Performance Optimizations ({codeAnalysis.aiInsights.performanceOptimizations.length})
                                  </Badge>
                                </div>
                                
                                <div className="grid gap-4">
                                  {codeAnalysis.aiInsights.performanceOptimizations.map((opt, index) => (
                                    <div key={index} className="bg-gradient-to-r from-green-900/20 to-green-800/10 border border-green-800/30 rounded-lg overflow-hidden">
                                      {/* Header */}
                                      <div className="bg-gray-900/40 px-4 py-3 border-b border-gray-700">
                                        <div className="flex items-start gap-3">
                                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                            ⚡
                                          </div>
                                          <div className="flex-1">
                                            <h5 className="font-semibold text-green-400 mb-1">Performance Optimization</h5>
                                            <p className="text-sm text-gray-300">{opt.issue}</p>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Content */}
                                      <div className="p-4">
                                        {/* Solution and Impact Info */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                          <div className="bg-gray-900/30 rounded-lg p-3">
                                            <span className="text-xs text-gray-400 uppercase tracking-wide">Solution</span>
                                            <p className="text-sm text-gray-200 mt-1">{opt.solution}</p>
                                          </div>
                                          <div className="bg-gray-900/30 rounded-lg p-3">
                                            <span className="text-xs text-gray-400 uppercase tracking-wide">Expected Impact</span>
                                            <p className="text-sm text-gray-200 mt-1">{opt.impact}</p>
                                          </div>
                                        </div>

                                        {/* Code Comparison - if available */}
                                        {opt.currentCode && opt.optimizedCode && (
                                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {/* Current Code */}
                                            <div className="bg-gray-900/70 rounded-lg overflow-hidden border border-gray-700">
                                              <div className="bg-red-900/40 px-3 py-2 border-b border-red-800/40">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                  <span className="text-xs font-medium text-red-300">Current Implementation</span>
                                                </div>
                                              </div>
                                              <div className="p-4 bg-gray-950/50">
                                                <pre className="text-sm font-mono text-gray-100 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                                                  {opt.currentCode}
                                                </pre>
                                              </div>
                                            </div>

                                            {/* Optimized Code */}
                                            <div className="bg-gray-900/70 rounded-lg overflow-hidden border border-gray-700">
                                              <div className="bg-green-900/40 px-3 py-2 border-b border-green-800/40">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                  <span className="text-xs font-medium text-green-300">Optimized Code</span>
                                                </div>
                                              </div>
                                              <div className="p-4 bg-gray-950/50">
                                                <pre className="text-sm font-mono text-gray-100 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                                                  {opt.optimizedCode}
                                                </pre>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Security Concerns */}
                            {codeAnalysis.aiInsights.securityConcerns && codeAnalysis.aiInsights.securityConcerns.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <Badge variant="outline" className="text-red-400 border-red-400">
                                    Security Concerns ({codeAnalysis.aiInsights.securityConcerns.length})
                                  </Badge>
                                </div>
                                
                                <div className="grid gap-3">
                                  {codeAnalysis.aiInsights.securityConcerns.map((concern, index) => (
                                    <div key={index} className="bg-gradient-to-r from-red-900/20 to-red-800/10 border border-red-800/30 rounded-lg p-4">
                                      <div className="flex items-start gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5
                                          ${concern.risk === 'High' ? 'bg-red-500' : concern.risk === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`}>
                                          🛡️
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <h5 className="font-semibold text-red-400">Security Vulnerability</h5>
                                            <Badge 
                                              variant="outline" 
                                              className={`text-xs
                                                ${concern.risk === 'High' ? 'text-red-400 border-red-400' :
                                                  concern.risk === 'Medium' ? 'text-yellow-400 border-yellow-400' : 
                                                  'text-green-400 border-green-400'}`}
                                            >
                                              {concern.risk} Risk
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-gray-300 mb-2">{concern.vulnerability}</p>
                                          <div>
                                            <span className="text-gray-400 text-xs">Mitigation:</span>
                                            <span className="text-gray-200 ml-1 text-xs">{concern.mitigation}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Testing Recommendations */}
                            {codeAnalysis.aiInsights.testingRecommendations && codeAnalysis.aiInsights.testingRecommendations.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                                    Testing Recommendations ({codeAnalysis.aiInsights.testingRecommendations.length})
                                  </Badge>
                                </div>
                                
                                <div className="grid gap-3">
                                  {codeAnalysis.aiInsights.testingRecommendations.map((test, index) => (
                                    <div key={index} className="bg-gradient-to-r from-cyan-900/20 to-cyan-800/10 border border-cyan-800/30 rounded-lg p-4">
                                      <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                                          🧪
                                        </div>
                                        <div className="flex-1">
                                          <h5 className="font-semibold text-cyan-400 mb-1">{test.area}</h5>
                                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                                            <div>
                                              <span className="text-gray-400">Test Type:</span>
                                              <span className="text-gray-200 ml-1 font-medium">{test.testType}</span>
                                            </div>
                                            <div>
                                              <span className="text-gray-400">Reasoning:</span>
                                              <span className="text-gray-200 ml-1">{test.reasoning}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>
                        ) : null}

                        {/* Modern AI Code Analysis Section */}
                        {(!codeAnalysis.improvementSuggestions || codeAnalysis.improvementSuggestions.length === 0) && 
                         (!codeAnalysis.aiInsights || Object.keys(codeAnalysis.aiInsights).length === 0) && (
                          <div className="relative overflow-hidden bg-gradient-to-br from-blue-900/30 via-blue-800/20 to-indigo-900/30 border border-blue-500/30 rounded-xl p-8">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
                            
                            {/* Content */}
                            <div className="relative z-10 text-center max-w-2xl mx-auto">
                              {/* Modern Icon with Animation */}
                              <div className="mb-6 flex justify-center">
                                <div className="relative">
                                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
                                    {/* Brain/Neural Network Icon */}
                                    <div className="relative text-white">
                                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" opacity="0.3"/>
                                        <circle cx="8" cy="9" r="1.5" fill="currentColor"/>
                                        <circle cx="16" cy="9" r="1.5" fill="currentColor"/>
                                        <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
                                        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                                        <circle cx="9" cy="15" r="1.5" fill="currentColor"/>
                                        <circle cx="15" cy="15" r="1.5" fill="currentColor"/>
                                        <path d="M8 9l4-3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                                        <path d="M16 9l-4-3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                                        <path d="M8 9l4 3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                                        <path d="M16 9l-4 3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                                        <path d="M12 12l-3 3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                                        <path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                                      </svg>
                                    </div>
                                  </div>
                                  {/* Floating particles */}
                                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full animate-bounce"></div>
                                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                                  <div className="absolute top-1/2 -right-4 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                                </div>
                              </div>

                              {/* Enhanced Title */}
                              <div className="mb-4">
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-indigo-400 bg-clip-text text-transparent mb-2">
                                  AI-Powered Code Intelligence
                                </h3>
                                <div className="flex items-center justify-center gap-2 mb-3">
                                  <div className="h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent flex-1 max-w-20"></div>
                                  <div className="px-3 py-1 bg-blue-500/20 rounded-full border border-blue-400/30">
                                    <span className="text-xs font-medium text-blue-300">Advanced Analysis</span>
                                  </div>
                                  <div className="h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent flex-1 max-w-20"></div>
                                </div>
                              </div>

                              {/* Rich Description */}
                              <p className="text-gray-300 mb-6 text-base leading-relaxed">
                                Unlock the full potential of your code with AI-driven insights. Get personalized recommendations for 
                                <span className="text-green-400 font-medium"> performance optimization</span>, 
                                <span className="text-red-400 font-medium"> security enhancements</span>, and 
                                <span className="text-blue-400 font-medium"> maintainability improvements</span>.
                              </p>

                              {/* Features Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-gray-900/40 rounded-lg p-4 border border-gray-700/50">
                                  <div className="text-green-400 text-xl mb-2">⚡</div>
                                  <h4 className="text-sm font-semibold text-gray-200 mb-1">Performance</h4>
                                  <p className="text-xs text-gray-400">Optimize speed & efficiency</p>
                                </div>
                                <div className="bg-gray-900/40 rounded-lg p-4 border border-gray-700/50">
                                  <div className="text-red-400 text-xl mb-2">🛡️</div>
                                  <h4 className="text-sm font-semibold text-gray-200 mb-1">Security</h4>
                                  <p className="text-xs text-gray-400">Identify vulnerabilities</p>
                                </div>
                                <div className="bg-gray-900/40 rounded-lg p-4 border border-gray-700/50">
                                  <div className="text-blue-400 text-xl mb-2">🔧</div>
                                  <h4 className="text-sm font-semibold text-gray-200 mb-1">Quality</h4>
                                  <p className="text-xs text-gray-400">Enhance maintainability</p>
                                </div>
                              </div>

                              {/* Enhanced Button */}
                              <div className="flex flex-col items-center gap-4">
                                <button 
                                  onClick={generateImprovements}
                                  disabled={isLoadingImprovements || !selectedFileForAnalysis}
                                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 disabled:transform-none disabled:shadow-none"
                                >
                                  {/* Button Glow Effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                                  
                                  {/* Button Content */}
                                  <div className="relative flex items-center gap-3">
                                    {isLoadingImprovements ? (
                                      <>
                                        <div className="flex items-center gap-3">
                                          {/* Animated Neural Network Spinner */}
                                          <div className="relative w-6 h-6">
                                            <div className="absolute inset-0 animate-spin">
                                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" opacity="0.2"/>
                                                <circle cx="8" cy="9" r="1.5" fill="currentColor"/>
                                                <circle cx="16" cy="9" r="1.5" fill="currentColor"/>
                                                <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
                                                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                                                <circle cx="9" cy="15" r="1.5" fill="currentColor"/>
                                                <circle cx="15" cy="15" r="1.5" fill="currentColor"/>
                                                <path d="M8 9l4-3" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                                                <path d="M16 9l-4-3" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                                                <path d="M8 9l4 3" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                                                <path d="M16 9l-4 3" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                                                <path d="M12 12l-3 3" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                                                <path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                                              </svg>
                                            </div>
                                            {/* Pulsing center dot */}
                                            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white rounded-full animate-pulse transform -translate-x-1/2 -translate-y-1/2"></div>
                                          </div>
                                          {/* Animated dots */}
                                          <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                          </div>
                                        </div>
                                        <span>Analyzing Code...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>Generate AI Insights</span>
                                        <div className="text-sm opacity-75">→</div>
                                      </>
                                    )}
                                  </div>
                                </button>

                                {/* Status Indicator */}
                                {!selectedFileForAnalysis ? (
                                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                                    <span className="text-amber-300 text-sm font-medium">Select a file to begin analysis</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-green-300 text-sm font-medium">Ready to analyze: {selectedFileForAnalysis.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    </CardContent>
                  </Card>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center p-12">
              <p className="text-sm text-gray-400">Failed to load analysis</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Code Preview Modal */}
      <Dialog open={codePreviewModalOpen} onOpenChange={setCodePreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-950 border-gray-800">
          <DialogHeader className="border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-green-400" />
                <DialogTitle className="text-lg font-semibold text-white">
                  Code Preview
                </DialogTitle>
              </div>
            </div>
            {selectedFileForPreview && (
              <DialogDescription className="text-gray-400 mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{selectedFileForPreview.name}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500">{selectedFileForPreview.path}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500">{formatFileSize(selectedFileForPreview.size)}</span>
                </div>
              </DialogDescription>
            )}
          </DialogHeader>
          
          <div className="mt-4 overflow-auto max-h-[60vh]">
            {loadingPreview ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                  <div className="relative w-8 h-8 mx-auto">
                    <div className="absolute inset-0 animate-spin">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-400">
                        {/* Code brackets spinning animation */}
                        <path d="M8 6L2 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
                        <path d="M16 6L22 12L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
                        <path d="M10 4L14 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                      </svg>
                    </div>
                    <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Loading code...
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <span className="text-sm text-gray-400 ml-2">
                        {selectedFileForPreview?.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                      onClick={() => {
                        navigator.clipboard.writeText(previewCode);
                      }}
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="max-h-[50vh] overflow-auto border-t border-gray-700">
                  <pre className="text-sm text-gray-300 p-4 whitespace-pre-wrap break-words min-h-full">
                    <code className="language-text">
                      {previewCode || '// No content available'}
                    </code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Timeline Modal */}
      <Dialog open={timelineModalOpen} onOpenChange={setTimelineModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-950 border-gray-800">
          <DialogHeader className="border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-400" />
                <DialogTitle className="text-lg font-semibold text-white">
                  File Timeline
                </DialogTitle>
              </div>
            </div>
            {selectedFileForTimeline && (
              <DialogDescription className="text-gray-400 mt-2 flex items-center gap-2 text-sm">
                <span className="font-medium">{selectedFileForTimeline.name}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-500">{selectedFileForTimeline.path}</span>
              </DialogDescription>
            )}
          </DialogHeader>
          
          <div className="mt-4 overflow-auto max-h-[60vh]">
            {loadingTimeline ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                  <div className="relative w-8 h-8 mx-auto">
                    <div className="absolute inset-0 animate-spin">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-400">
                        {/* Timeline spinner with clock-like animation */}
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="2" fill="currentColor"/>
                        {/* Timeline dots */}
                        <circle cx="12" cy="4" r="1" fill="currentColor" opacity="0.6"/>
                        <circle cx="12" cy="20" r="1" fill="currentColor" opacity="0.6"/>
                        <circle cx="20" cy="12" r="1" fill="currentColor" opacity="0.6"/>
                        <circle cx="4" cy="12" r="1" fill="currentColor" opacity="0.6"/>
                      </svg>
                    </div>
                    <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Loading timeline...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {fileTimeline.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No timeline data available</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-purple-300 opacity-30"></div>
                    
                    {(() => {
                      const repoName = getRepoName();
                      console.log(`🔍 Timeline render - repo: "${repoName}", items: ${fileTimeline.length}`);
                      
                      return fileTimeline.map((item) => {
                        const commitCached = githubAPIService.isDataCached('commit', repoName, item.sha);
                        const prCached = item.prNumber ? githubAPIService.isDataCached('pr', repoName, item.prNumber.toString()) : false;
                        console.log(`📋 Item ${item.sha.substring(0, 8)}: commit cached=${commitCached}, PR cached=${prCached} (PR#${item.prNumber}) [trigger: ${cacheUpdateTrigger}]`);
                        
                        return (
                      <div key={item.sha} className="relative flex items-start space-x-4 pb-6">
                        {/* Timeline dot */}
                        <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-gray-900 border-2 border-purple-400 rounded-full">
                          {item.prNumber ? (
                            <GitBranch className="w-5 h-5 text-purple-400" />
                          ) : (
                            <GitCommit className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                        
                        {/* Timeline content */}
                        <div className="flex-1 min-w-0">
                          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:bg-gray-900/70 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-white text-sm">{item.author}</span>
                                  <span className="text-xs text-gray-500">•</span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(item.date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  {item.prNumber && (
                                    <>
                                      <span className="text-xs text-gray-500">•</span>
                                      <button
                                        className={`text-xs px-2 py-1 rounded-full hover:bg-purple-900/50 transition-colors flex items-center gap-1 ${
                                          githubAPIService.isDataCached('pr', repoName, item.prNumber!.toString())
                                            ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50' : 'bg-purple-900/30 text-purple-300'
                                        }`}
                                        onMouseEnter={() => handlePRHover(item.prNumber!)}
                                        onMouseLeave={() => setHoveredPR(null)}
                                        onClick={() => handlePRClick(item.prNumber!)}
                                        title={`Click to view PR summary ${
                                          githubAPIService.isDataCached('pr', repoName, item.prNumber!.toString())
                                            ? '(cached - instant load)' : '(will fetch from API)'
                                        }`}
                                      >
                                        {githubAPIService.isDataCached('pr', repoName, item.prNumber!.toString()) && (
                                          <span className="text-green-400">⚡</span>
                                        )}
                                        PR #{item.prNumber}
                                      </button>
                                    </>
                                  )}
                                </div>
                                <p className="text-sm text-gray-300 mb-2">{item.message}</p>
                                {item.branchName && (
                                  <div className="flex items-center gap-2">
                                    <GitBranch className="w-3 h-3 text-gray-500" />
                                    <span className="text-xs text-gray-500">{item.branchName}</span>
                                  </div>
                                )}
                              </div>
                              <button
                                className={`text-xs font-mono hover:text-blue-400 hover:underline transition-colors flex items-center gap-1 ${
                                  githubAPIService.isDataCached('commit', repoName, item.sha)
                                    ? 'text-green-400' : 'text-gray-500'
                                }`}
                                onClick={() => handleCommitClick(item.sha)}
                                title={`Click to view commit details ${
                                  githubAPIService.isDataCached('commit', repoName, item.sha)
                                    ? '(cached - instant load)' : '(will fetch from API)'
                                }`}
                              >
                                {githubAPIService.isDataCached('commit', repoName, item.sha) && (
                                  <span className="text-green-400">⚡</span>
                                )}
                                {item.sha.substring(0, 7)}
                              </button>
                            </div>
                            
                            {/* PR Details Tooltip */}
                            {hoveredPR === item.prNumber && prDetails && (
                              <div className="absolute z-20 mt-2 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-w-xs">
                                <h4 className="font-medium text-white text-sm mb-2">{prDetails.title}</h4>
                                <div className="space-y-1 text-xs text-gray-400">
                                  <div>Author: {prDetails.author}</div>
                                  <div>Branch: {prDetails.branch} → {prDetails.baseBranch}</div>
                                  <div>Files: {prDetails.changedFiles} changed</div>
                                  <div className="flex gap-2">
                                    <span className="text-green-400">+{prDetails.additions}</span>
                                    <span className="text-red-400">-{prDetails.deletions}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PR Detail Modal */}
      <Dialog open={prDetailModalOpen} onOpenChange={setPRDetailModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              {loadingPRDetails ? 'Loading Pull Request Details...' : 
               selectedPRDetails ? `PR #${selectedPRDetails.number}: ${selectedPRDetails.title}` : 
               'Pull Request Details'}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {!loadingPRDetails && selectedPRDetails && (
                <div className="flex items-center gap-4 mt-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedPRDetails.state === 'merged' ? 'bg-purple-100 text-purple-800' :
                    selectedPRDetails.state === 'closed' ? 'bg-red-100 text-red-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedPRDetails.state?.toUpperCase() || 'UNKNOWN'}
                  </div>
                  <span className="text-sm text-gray-300">{selectedPRDetails.user?.login}</span>
                  <span className="text-sm text-gray-300">
                    {selectedPRDetails.head?.ref} → {selectedPRDetails.base?.ref}
                  </span>
                  <span className="text-sm text-gray-300">
                    +{selectedPRDetails.additions || 0} -{selectedPRDetails.deletions || 0}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {loadingPRDetails ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
              <p className="text-gray-400 text-sm">Fetching pull request details...</p>
            </div>
          ) : selectedPRDetails ? (
            <div className="space-y-4">
              {selectedPRDetails.body && (
                <div>
                  <h3 className="font-medium text-gray-200 mb-2">Description</h3>
                  <div className="bg-gray-800 p-3 rounded border border-gray-600 text-sm text-gray-300 whitespace-pre-wrap">
                    {selectedPRDetails.body}
                  </div>
                </div>
              )}
              
              {selectedPRDetails.files && selectedPRDetails.files.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-200 mb-2">
                    Changed Files ({selectedPRDetails.files.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedPRDetails.files.map((file, index) => (
                      <div key={index} className="border border-gray-600 rounded p-3 bg-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm text-blue-400">{file.filename}</span>
                          <div className="flex gap-2 text-xs">
                            <span className={`px-2 py-1 rounded ${
                              file.status === 'added' ? 'bg-green-900 text-green-300' :
                              file.status === 'removed' ? 'bg-red-900 text-red-300' :
                              file.status === 'modified' ? 'bg-blue-900 text-blue-300' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {file.status || 'unknown'}
                            </span>
                            <span className="text-green-400">+{file.additions || 0}</span>
                            <span className="text-red-400">-{file.deletions || 0}</span>
                          </div>
                        </div>
                        {file.patch && (
                          <div className="mt-3">
                            <h4 className="text-xs font-medium text-gray-400 mb-2">Diff:</h4>
                            <pre className="text-xs bg-gray-900 border border-gray-600 p-3 rounded overflow-x-auto max-h-40 overflow-y-auto font-mono">
                              {file.patch.split('\n').map((line, lineIndex) => (
                                <div
                                  key={lineIndex}
                                  className={`${
                                    line.startsWith('+') && !line.startsWith('+++') 
                                      ? 'text-green-400 bg-green-900/20' 
                                      : line.startsWith('-') && !line.startsWith('---')
                                      ? 'text-red-400 bg-red-900/20'
                                      : line.startsWith('@@')
                                      ? 'text-blue-400 bg-blue-900/20'
                                      : 'text-gray-300'
                                  } px-1`}
                                >
                                  {line || ' '}
                                </div>
                              ))}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Commit Detail Modal */}
      <Dialog open={commitDetailModalOpen} onOpenChange={setCommitDetailModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              {loadingCommitDetails ? 'Loading Commit Details...' : 
               selectedCommitDetails ? `Commit: ${selectedCommitDetails.sha?.substring(0, 8) || 'unknown'}` : 
               'Commit Details'}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {!loadingCommitDetails && selectedCommitDetails && (
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-gray-300">{selectedCommitDetails.author?.name || 'Unknown author'}</span>
                  <span className="text-sm text-gray-300">
                    {selectedCommitDetails.author?.date ? new Date(selectedCommitDetails.author.date).toLocaleDateString() : 'Unknown date'}
                  </span>
                  <span className="text-sm text-gray-300">
                    +{selectedCommitDetails.stats?.additions || 0} -{selectedCommitDetails.stats?.deletions || 0}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {loadingCommitDetails ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
              <p className="text-gray-400 text-sm">Fetching commit details...</p>
            </div>
          ) : selectedCommitDetails ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-200 mb-2">Message</h3>
                <div className="bg-gray-800 p-3 rounded border border-gray-600 text-sm text-gray-300 whitespace-pre-wrap">
                  {selectedCommitDetails.message}
                </div>
              </div>
              
              {selectedCommitDetails.files && selectedCommitDetails.files.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-200 mb-2">
                    Changed Files ({selectedCommitDetails.files.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedCommitDetails.files.map((file, index) => (
                      <div key={index} className="border border-gray-600 rounded p-3 bg-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm text-blue-400">{file.filename}</span>
                          <div className="flex gap-2 text-xs">
                            <span className={`px-2 py-1 rounded ${
                              file.status === 'added' ? 'bg-green-900 text-green-300' :
                              file.status === 'removed' ? 'bg-red-900 text-red-300' :
                              file.status === 'modified' ? 'bg-blue-900 text-blue-300' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {file.status || 'unknown'}
                            </span>
                            <span className="text-green-400">+{file.additions || 0}</span>
                            <span className="text-red-400">-{file.deletions || 0}</span>
                          </div>
                        </div>
                        {file.patch && (
                          <div className="mt-3">
                            <h4 className="text-xs font-medium text-gray-400 mb-2">Diff:</h4>
                            <pre className="text-xs bg-gray-900 border border-gray-600 p-3 rounded overflow-x-auto max-h-40 overflow-y-auto font-mono">
                              {file.patch.split('\n').map((line, lineIndex) => (
                                <div
                                  key={lineIndex}
                                  className={`${
                                    line.startsWith('+') && !line.startsWith('+++') 
                                      ? 'text-green-400 bg-green-900/20' 
                                      : line.startsWith('-') && !line.startsWith('---')
                                      ? 'text-red-400 bg-red-900/20'
                                      : line.startsWith('@@')
                                      ? 'text-blue-400 bg-blue-900/20'
                                      : 'text-gray-300'
                                  } px-1`}
                                >
                                  {line || ' '}
                                </div>
                              ))}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
