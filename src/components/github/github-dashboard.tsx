"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RepositorySelector } from "./repository-selector";
import { PullRequestsView } from "./enhanced-pull-requests-view";
import { CommitsView } from "./enhanced-commits-view";
import MyPRsView from "./my-prs-view";
import MyIssuesView from "./my-issues-view";
import MyActivityView from "./my-activity-view";
import { Repository } from "@/services/github-assistant-service";
import {
  Github,
  GitPullRequest,
  GitCommit,
  ArrowLeft,
  ExternalLink,
  Bug,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModelSelector } from "@/components/ui/model-selector";
import { useModelSelection } from "@/hooks/use-model-selection";

interface GitHubDashboardProps {
  onAskQuestion?: (question: string) => void;
  onOpenDependencyDiagram?: () => void;
}

export function GitHubDashboard({ onAskQuestion }: GitHubDashboardProps) {
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [activeTab, setActiveTab] = useState<string>("repos");
  const [globalView, setGlobalView] = useState<string | null>(null);

  // Model selection for AI summaries
  const {
    selectedModel,
    setSelectedModel,
    isLoading: isLoadingModels,
  } = useModelSelection({
    storageKey: "github-explorer-model",
  });

  // Handle repository selection
  const handleRepoSelect = (repo: Repository) => {
    setSelectedRepo(repo);
    setActiveTab("pulls");
  };

  // Reset selection and go back to repositories
  const handleBackToRepos = () => {
    setSelectedRepo(null);
    setActiveTab("repos");
    setGlobalView(null);
  };

  // Handle global view selection
  const handleGlobalView = (view: string) => {
    setGlobalView(view);
    setSelectedRepo(null);
    setActiveTab("repos");
  };

  return (
    <div className="flex flex-col h-full w-full min-w-0">
      {/* Compact header section with back button when repo is selected or global view is active */}
      {(selectedRepo || globalView) && (
        <div className="mb-4 border-b border-gray-800/50 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToRepos}
                className="flex items-center gap-2 text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              {selectedRepo ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                    <Github className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">
                        {selectedRepo.name}
                      </h2>
                      <a
                        href={selectedRepo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-400 transition-colors"
                        title="Open repository in GitHub"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    {selectedRepo.description && (
                      <p className="text-sm text-gray-400 max-w-md truncate">
                        {selectedRepo.description}
                      </p>
                    )}
                  </div>
                </div>
              ) : globalView ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-md flex items-center justify-center">
                    {globalView === "prs" && (
                      <GitPullRequest className="w-4 h-4 text-white" />
                    )}
                    {globalView === "issues" && (
                      <Bug className="w-4 h-4 text-white" />
                    )}
                    {globalView === "activity" && (
                      <Activity className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {globalView === "prs" && "My Pull Requests"}
                      {globalView === "issues" && "My Issues"}
                      {globalView === "activity" && "My Activity"}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {globalView === "prs" &&
                        "Enhanced PR analytics and management"}
                      {globalView === "issues" &&
                        "Advanced issue tracking and insights"}
                      {globalView === "activity" &&
                        "Comprehensive activity overview"}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            {selectedRepo && (
              <div className="flex items-center gap-2">
                {selectedRepo.language && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-900/30 text-blue-300 border-blue-700/50 text-xs"
                  >
                    {selectedRepo.language}
                  </Badge>
                )}
                {selectedRepo.private ? (
                  <Badge
                    variant="secondary"
                    className="bg-gray-900/30 text-gray-300 border-gray-700/50 text-xs"
                  >
                    Private
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-green-900/30 text-green-300 border-green-700/50 text-xs"
                  >
                    Public
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      {globalView ? (
        <div className="flex-1">
          {globalView === "prs" && <MyPRsView onAskQuestion={onAskQuestion} />}
          {globalView === "issues" && (
            <MyIssuesView onAskQuestion={onAskQuestion} />
          )}
          {globalView === "activity" && <MyActivityView repositories={[]} />}
        </div>
      ) : !selectedRepo ? (
        <div className="flex-1">
          {/* Model Selection Section */}
          <div className="mb-4 p-3 bg-gradient-to-r from-gray-900/60 to-gray-800/60 border border-gray-700/50 rounded-lg backdrop-blur-sm">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              size="sm"
              label="AI Model"
              placeholder="Select model for summaries"
              disabled={isLoadingModels}
              layout="horizontal"
            />
          </div>

          {/* Quick Actions Toolbar */}
          <div className="mb-4 p-3 bg-gradient-to-r from-gray-900/60 to-gray-800/60 border border-gray-700/50 rounded-lg backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
              <div>
                <h3 className="text-sm font-medium text-white mb-1">
                  Quick Actions
                </h3>
                <p className="text-xs text-gray-400">
                  Common repository operations
                </p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {/* <a
                  href="https://github.com/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
              h-8 px-3 text-xs bg-blue-900/30 border border-blue-700/50 text-blue-300 hover:bg-blue-800/40 hover:text-blue-200"
                >
                  <span className="flex items-center">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    New Repo
                  </span>
                </a> */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs bg-purple-900/30 border border-purple-700/50 text-purple-300 hover:bg-purple-800/40 hover:text-purple-200"
                  onClick={() => handleGlobalView("prs")}
                >
                  <span className="flex items-center">
                    <GitPullRequest className="mr-1.5 h-3.5 w-3.5" />
                    My PRs
                  </span>
                </Button>
                {/* <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs bg-orange-900/30 border border-orange-700/50 text-orange-300 hover:bg-orange-800/40 hover:text-orange-200"
                  onClick={() => handleGlobalView("issues")}
                >
                  <span className="flex items-center">
                    <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                    My Issues
                  </span>
                </Button> */}
                {/* <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs bg-green-900/30 border border-green-700/50 text-green-300 hover:bg-green-800/40 hover:text-green-200"
                  onClick={() => handleGlobalView("activity")}
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  My Activity
                </Button> */}
                {/* <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs bg-indigo-900/30 border border-indigo-700/50 text-indigo-300 hover:bg-indigo-800/40 hover:text-indigo-200"
                  onClick={onOpenDependencyDiagram}
                >
                  <span className="flex items-center">
                    <svg
                      className="mr-1.5 h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                    Dependency Diagram
                  </span>
                </Button> */}
              </div>
            </div>
          </div>
          <div className="grow overflow-auto">
            <RepositorySelector onSelectRepo={handleRepoSelect} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Tab navigation */}
          <Tabs
            defaultValue={activeTab}
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 border-gray-700 mb-4">
              <TabsTrigger
                value="pulls"
                className="flex items-center gap-2 data-[state=active]:bg-blue-900/50 data-[state=active]:text-blue-300"
              >
                <GitPullRequest className="h-4 w-4" />
                <span className="hidden sm:inline">Pull Requests</span>
                <span className="sm:hidden">PRs</span>
              </TabsTrigger>
              <TabsTrigger
                value="commits"
                className="flex items-center gap-2 data-[state=active]:bg-purple-900/50 data-[state=active]:text-purple-300"
              >
                <GitCommit className="h-4 w-4" />
                <span className="hidden sm:inline">Commits</span>
                <span className="sm:hidden">Commits</span>
              </TabsTrigger>
            </TabsList>

            {/* Responsive content area */}
            <div className="flex-1 min-h-0">
              <TabsContent value="pulls" className="h-full">
                <div className="h-full bg-black/20 border border-gray-800/50 rounded-lg backdrop-blur-sm overflow-hidden">
                  <PullRequestsView
                    repoName={selectedRepo.full_name}
                    selectedModel={selectedModel}
                  />
                </div>
              </TabsContent>
              <TabsContent value="commits" className="h-full">
                <div className="h-full bg-black/20 border border-gray-800/50 rounded-lg backdrop-blur-sm overflow-hidden">
                  <CommitsView
                    repoName={selectedRepo.full_name}
                    selectedModel={selectedModel}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}
