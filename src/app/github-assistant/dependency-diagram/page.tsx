"use client";

import React, { useState } from "react";
import { PageContentLayout } from "@/components/layout/page-content-layout";
import { DependencyAnalysisInterface } from "@/components/github/dependency-analysis-interface";
import { RepositorySelectorForDiagram } from "@/components/github/repository-selector-for-diagram";
import { Repository } from "@/services/github-assistant-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Github, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelSelector } from "@/components/ui/model-selector";
import { useModelSelection } from "@/hooks/use-model-selection";
import { useModels } from "@/hooks/use-models";

export default function DependencyDiagramPage() {
  const [selectedRepos, setSelectedRepos] = useState<Repository[]>([]);
  const [selectorCollapsed, setSelectorCollapsed] = useState(false);

  // Get available models for selection
  const { isLoading: isLoadingModels } = useModels();

  // Model selection state
  const { selectedModel, setSelectedModel } = useModelSelection({
    storageKey: "github-dependency",
  });

  return (
    <PageContentLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center">
            <Network className="mr-3 h-6 w-6" />
            Code Dependency Analysis
          </h1>
          <p className="text-gray-400 mt-1 ml-9">
            Analyze dependencies between files across Salesforce repositories
          </p>
        </div>
        {/* Model Selection - Right side of header */}
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">AI Model:</div>
          <div className="w-64">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              size="sm"
              placeholder="Select AI model"
              disabled={isLoadingModels}
            />
          </div>
        </div>
      </div>

      {/* Model Selection Section - Prominent */}
      <div className="mb-6 p-4 bg-gradient-to-r from-gray-900/60 to-gray-800/60 border border-gray-700/50 rounded-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium text-white">
              AI Model Selection
            </h3>
            <div className="w-80">
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                size="md"
                label="Choose AI Model"
                placeholder="Select model for dependency analysis"
                disabled={isLoadingModels}
              />
            </div>
          </div>
          <div className="text-sm text-gray-400">
            This model will be used for AI-powered dependency insights and
            analysis
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Repository selector section - collapsible */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            selectorCollapsed ? "max-h-12" : "max-h-[600px]"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Github className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-medium">Repository Selection</h2>
              {selectedRepos.length > 0 && (
                <Badge variant="outline" className="ml-3">
                  {selectedRepos.length} selected
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectorCollapsed(!selectorCollapsed)}
              className="text-gray-400 hover:text-white"
            >
              {selectorCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div
            className={cn(
              "transition-opacity",
              selectorCollapsed ? "opacity-0" : "opacity-100"
            )}
          >
            <RepositorySelectorForDiagram
              onSelectFile={(file, repo) => {
                // Handle file selection for dependency diagram
                console.log("File selected:", file, repo);
                if (!selectedRepos.find((r) => r.id === repo.id)) {
                  setSelectedRepos((prev) => [...prev, repo]);
                }
              }}
              initialSearchRepos={selectedRepos}
            />
          </div>
        </div>

        {/* Main diagram area */}
        {selectedRepos.length === 0 ? (
          <Card className="bg-gray-900/30 border-dashed border-gray-800">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Network className="h-16 w-16 text-gray-700 mb-4" />
              <h3 className="text-xl font-medium">
                Select repositories to visualize
              </h3>
              <p className="text-gray-400 mt-2 max-w-md">
                Select one or more Salesforce repositories to analyze their
                dependencies. The visualization works best with Apex classes,
                Lightning Web Components, and test files.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="h-[calc(100vh-280px)] min-h-[600px]">
            <DependencyAnalysisInterface
              initialRepositories={selectedRepos}
              selectedModel={selectedModel}
            />
          </div>
        )}
      </div>
    </PageContentLayout>
  );
}
