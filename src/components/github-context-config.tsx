import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch,
  Folder,
  Settings,
  Zap,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { FastAPIHealthIndicator } from "./github/fastapi-health-indicator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ModelSelector } from "@/components/ui/model-selector";

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  html_url: string;
}

interface GitHubContextConfigProps {
  onConfigChange: (config: {
    repository: string | null;
    contextTypes: string[];
  }) => void;
  selectedRepository: string | null;
  selectedContextTypes: string[];
  useFastAPI?: boolean;
  onFastAPIChange?: (value: boolean) => void;
  onNewChat?: () => void;
  isResettingChat?: boolean;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  isLoadingModels?: boolean;
}

const CONTEXT_TYPE_OPTIONS = [
  {
    value: "commits",
    label: "Commit Analysis",
    icon: "📝",
    description: "Recent commits, change patterns, and commit insights",
  },
  {
    value: "prs",
    label: "Pull Request Insights",
    icon: "🔀",
    description: "PR analysis, file changes, and review patterns",
  },
  {
    value: "pr_detailed",
    label: "PR File Changes",
    icon: "🔍",
    description: "Detailed file diffs and change analysis for PRs",
  },
  {
    value: "commit_compare",
    label: "Commit Comparison",
    icon: "⚖️",
    description: "Compare commits and analyze differences",
  },
  {
    value: "contributors",
    label: "Contributor Insights",
    icon: "👥",
    description: "Developer activity and contribution patterns",
  },
  {
    value: "repository_stats",
    label: "Repository Metrics",
    icon: "📊",
    description: "Repository statistics and health insights",
  },
  {
    value: "issues",
    label: "Issue Tracking",
    icon: "🐛",
    description: "Bug reports, feature requests, and issue patterns",
  },
  {
    value: "files",
    label: "Code Structure",
    icon: "📁",
    description: "Repository structure and code organization",
  },
  {
    value: "releases",
    label: "Release History",
    icon: "🚀",
    description: "Version releases and deployment patterns",
  },
  {
    value: "cross_pr_impact",
    label: "Cross-PR Impact Analysis",
    icon: "🔄",
    description: "Analyze conflicts and interactions between open PRs",
  },
  {
    value: "historical_context",
    label: "Historical Context Engine",
    icon: "📚",
    description: "Trace code evolution and design decision history",
  },
  {
    value: "code_quality_trends",
    label: "Code Quality Trends",
    icon: "📈",
    description: "Track testing patterns, bug fixes, and refactoring trends",
  },
  {
    value: "deployment_risk",
    label: "Deployment Risk Assessment",
    icon: "⚠️",
    description: "Evaluate deployment readiness and risk factors",
  },
];

export function GitHubContextConfig({
  onConfigChange,
  selectedRepository,
  selectedContextTypes,
  useFastAPI = false,
  onFastAPIChange = () => {},
  onNewChat,
  isResettingChat = false,
  selectedModel,
  onModelChange,
  isLoadingModels = false,
}: GitHubContextConfigProps) {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/github/repos");
      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);
      }
    } catch (error) {
      console.error("Failed to fetch repositories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepositoryChange = (repoName: string) => {
    onConfigChange({
      repository: repoName === "none" ? null : repoName,
      contextTypes: selectedContextTypes,
    });
  };

  const handleContextTypeToggle = (contextType: string) => {
    const newContextTypes = selectedContextTypes.includes(contextType)
      ? selectedContextTypes.filter((type) => type !== contextType)
      : [...selectedContextTypes, contextType];

    onConfigChange({
      repository: selectedRepository,
      contextTypes: newContextTypes,
    });
  };

  return (
    <div className="border rounded-lg p-1.5 bg-card bg-gray-900/30 border-gray-700/50 transition-all hover:border-gray-600/70">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Folder className="h-4 w-4 text-blue-400 flex-shrink-0" />
          <span className="font-medium text-sm flex-shrink-0">
            GitHub Context
          </span>
          {selectedRepository ? (
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-md px-2 py-1">
              <GitBranch className="h-3 w-3 text-blue-400" />
              <Badge
                variant="outline"
                className="text-xs py-0 h-5 flex-shrink-0 bg-blue-900/30 border-blue-500/30 text-blue-300"
              >
                {selectedRepository}
              </Badge>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="text-xs py-0 h-5 flex-shrink-0 bg-amber-900/30 border-amber-500/30 text-amber-300"
            >
              No repository selected
            </Badge>
          )}
          {selectedContextTypes.length > 0 && (
            <div className="flex items-center gap-1">
              <Badge
                variant="secondary"
                className="text-xs py-0 h-5 flex-shrink-0"
              >
                {selectedContextTypes.length} filters
              </Badge>
              {/* Show selected context types inline */}
              {selectedContextTypes.slice(0, 3).map((type) => {
                const option = CONTEXT_TYPE_OPTIONS.find(
                  (opt) => opt.value === type
                );
                return (
                  <Badge
                    key={type}
                    variant="outline"
                    className="text-xs py-0 h-5 flex-shrink-0 bg-gray-800/50"
                  >
                    {option?.icon}
                  </Badge>
                );
              })}
              {selectedContextTypes.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs py-0 h-5 flex-shrink-0 bg-gray-800/50"
                >
                  +{selectedContextTypes.length - 3}
                </Badge>
              )}
              {useFastAPI && (
                <Badge
                  variant="outline"
                  className="text-xs py-0 h-5 flex-shrink-0 bg-blue-900/30 border-blue-500/30"
                >
                  ⚡
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Model Selector - Only show if model selection props are provided */}
          {selectedModel !== undefined && onModelChange && (
            <div className="flex-shrink-0">
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={onModelChange}
                size="sm"
                label="AI Model"
                placeholder="Select model for chat"
                disabled={isLoadingModels}
                layout="horizontal"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* New Chat Button - Only show if onNewChat is provided */}
            {onNewChat && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNewChat}
                disabled={isResettingChat}
                className="h-8 w-8 p-0 hover:bg-gray-700/50 focus:ring-2 focus:ring-blue-400 transition-all"
                title="Start New Chat"
                aria-label="Start New Chat"
              >
                {isResettingChat ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="h-8 w-8 p-0 hover:bg-gray-700/50 focus:ring-2 focus:ring-blue-400 transition-all"
              title="Configure GitHub context settings"
              aria-label="Configure GitHub context settings"
            >
              <Settings className="h-4 w-4 transition-transform hover:rotate-45 duration-300" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Dialog for GitHub Context Settings */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto bg-gray-900 border border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-400">
              <Folder className="h-5 w-5 text-blue-400" />
              GitHub Context Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Repository Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Repository
              </label>
              <Select
                value={selectedRepository || "none"}
                onValueChange={handleRepositoryChange}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loading
                        ? "Loading repositories..."
                        : "Select a repository..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No repository selected</SelectItem>
                  {loading ? (
                    <div className="flex items-center justify-center p-2">
                      <svg
                        className="animate-spin h-4 w-4 text-blue-500 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Loading repositories...</span>
                    </div>
                  ) : repositories.length === 0 ? (
                    <div className="p-2 text-center text-sm text-gray-400">
                      No repositories found
                    </div>
                  ) : (
                    repositories.map((repo) => (
                      <SelectItem key={repo.id} value={repo.name}>
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-3 w-3" />
                          <span>{repo.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedRepository && (
                <p className="text-xs text-muted-foreground mt-1">
                  Repository: IBMSC/{selectedRepository}
                </p>
              )}
            </div>

            {/* Context Types Configuration */}
            {selectedRepository && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Context Types
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {CONTEXT_TYPE_OPTIONS.map((option) => (
                    <div
                      className={`
                          flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors
                          ${
                            selectedContextTypes.includes(option.value)
                              ? "bg-blue-900/20 border-blue-500/50 shadow-sm"
                              : "bg-gray-800/30 border-gray-700/50 hover:bg-gray-700/30"
                          }
                        `}
                      onClick={() => handleContextTypeToggle(option.value)}
                      key={option.value}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base flex-shrink-0">
                          {option.icon}
                        </span>
                        <div>
                          <div className="text-sm font-medium">
                            {option.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`h-5 w-5 rounded flex items-center justify-center border transition-colors ${
                          selectedContextTypes.includes(option.value)
                            ? "bg-blue-500 border-blue-400"
                            : "border-gray-600"
                        }`}
                      >
                        {selectedContextTypes.includes(option.value) && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced AI Analysis */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                AI Enhancement
              </label>
              <div className="p-3 border border-gray-700/50 rounded-md bg-gray-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <Label
                      htmlFor="fastapi-modal-toggle"
                      className="text-sm font-medium"
                    >
                      Enhanced AI Analysis
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FastAPIHealthIndicator enabled={useFastAPI} />
                    <Switch
                      id="fastapi-modal-toggle"
                      checked={useFastAPI}
                      onCheckedChange={onFastAPIChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setModalOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No need for separate summary section as we've integrated this into the header */}
    </div>
  );
}

export default GitHubContextConfig;
