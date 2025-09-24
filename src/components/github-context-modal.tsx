"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitBranch, Folder, Zap } from "lucide-react";
import { FastAPIHealthIndicator } from "./github/fastapi-health-indicator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  html_url: string;
}

interface GitHubContextModalProps {
  onConfigChange: (config: {
    repository: string | null;
    contextTypes: string[];
  }) => void;
  selectedRepository: string | null;
  selectedContextTypes: string[];
  repositories: GitHubRepository[];
  loading: boolean;
  useFastAPI?: boolean;
  onFastAPIChange?: (value: boolean) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CONTEXT_TYPE_OPTIONS = [
  {
    value: "commits",
    label: "Recent Commits",
    icon: "📝",
    description: "Latest code changes and commit history",
  },
  {
    value: "prs",
    label: "Pull Requests",
    icon: "🔀",
    description: "Open and recent pull requests",
  },
  {
    value: "issues",
    label: "Issues",
    icon: "🐛",
    description: "Bug reports and feature requests",
  },
  {
    value: "files",
    label: "Files & Code",
    icon: "📁",
    description: "Repository structure and code search",
  },
  {
    value: "releases",
    label: "Releases",
    icon: "🚀",
    description: "Version releases and changelogs",
  },
];

export function GitHubContextModal({
  onConfigChange,
  selectedRepository,
  selectedContextTypes,
  repositories,
  loading,
  useFastAPI = false,
  onFastAPIChange = () => {},
  open,
  setOpen,
}: GitHubContextModalProps) {
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-blue-400" />
            GitHub Context Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Repository Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Repository</label>
            <Select
              value={selectedRepository || "none"}
              onValueChange={handleRepositoryChange}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a repository..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No repository selected</SelectItem>
                {repositories.map((repo) => (
                  <SelectItem key={repo.id} value={repo.name}>
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-3 w-3" />
                      <span>{repo.name}</span>
                    </div>
                  </SelectItem>
                ))}
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
                    key={option.value}
                    className={`
                      flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors
                      ${
                        selectedContextTypes.includes(option.value)
                          ? "bg-primary/10 border-primary"
                          : "bg-background border-border hover:bg-muted"
                      }
                    `}
                    onClick={() => handleContextTypeToggle(option.value)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{option.icon}</span>
                      <div>
                        <div className="text-sm font-medium">
                          {option.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedContextTypes.includes(option.value)}
                      onChange={() => handleContextTypeToggle(option.value)}
                      className="rounded"
                    />
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
          <Button type="submit" onClick={() => setOpen(false)}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GitHubContextModal;
