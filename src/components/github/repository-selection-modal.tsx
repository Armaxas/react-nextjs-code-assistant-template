import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Github, Folder, Loader2, AlertCircle, Search, X } from "lucide-react";

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  html_url: string;
}

interface RepositorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepositorySelect: (repository: string) => void;
  currentRepository?: string | null;
  title?: string;
  description?: string;
}

export function RepositorySelectionModal({
  isOpen,
  onClose,
  onRepositorySelect,
  currentRepository,
  title = "Select Repository",
  description = "Please select a repository to continue with your chat or analysis.",
}: RepositorySelectionModalProps) {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>(() => {
    // If currentRepository includes a slash, extract just the repo name
    if (currentRepository && currentRepository.includes("/")) {
      return currentRepository.split("/").pop() || "";
    }
    return currentRepository || "";
  });
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter repositories based on search term
  const filteredRepositories = useMemo(() => {
    if (!searchTerm.trim()) {
      return repositories;
    }

    const term = searchTerm.toLowerCase();
    return repositories.filter(
      (repo) =>
        repo.name.toLowerCase().includes(term) ||
        repo.full_name.toLowerCase().includes(term) ||
        (repo.description && repo.description.toLowerCase().includes(term))
    );
  }, [repositories, searchTerm]);

  useEffect(() => {
    if (isOpen && !hasAttemptedFetch) {
      fetchRepositories();
      setHasAttemptedFetch(true);
    }
  }, [isOpen, hasAttemptedFetch]);

  // Reset the fetch flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasAttemptedFetch(false);
      setSearchTerm(""); // Clear search when modal closes
    }
  }, [isOpen]);

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/github/repos");
      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);
      } else {
        console.error("Failed to fetch repositories:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch repositories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedRepo && selectedRepo !== "none") {
      onRepositorySelect(selectedRepo);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedRepo(currentRepository || "");
    setSearchTerm("");
    onClose();
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-400">
            <Github className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!currentRepository && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <p className="text-sm text-amber-300">
                You need to select a repository to start chatting or analyzing
                code.
              </p>
            </div>
          )}

          {/* Search Input */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-200">
              Search Repositories
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, organization, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-700"
                >
                  <X className="h-3 w-3 text-gray-400" />
                </Button>
              )}
            </div>
            {searchTerm && (
              <p className="text-xs text-gray-400 mt-1">
                {filteredRepositories.length} of {repositories.length}{" "}
                repositories found
              </p>
            )}
          </div>

          {/* Repository Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-200">
              Repository
            </label>
            <Select
              value={selectedRepo}
              onValueChange={setSelectedRepo}
              disabled={loading}
            >
              <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                <SelectValue
                  placeholder={
                    loading
                      ? "Loading repositories..."
                      : filteredRepositories.length === 0 && searchTerm
                        ? "No repositories match your search..."
                        : "Select a repository..."
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600 max-h-[300px]">
                <SelectItem value="none" className="text-gray-400">
                  No repository selected
                </SelectItem>
                {filteredRepositories.map((repo) => (
                  <SelectItem
                    key={repo.id}
                    value={repo.name}
                    className="text-white hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Folder className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {repo.name}
                          </span>
                          {repo.full_name !== repo.name && (
                            <Badge
                              variant="outline"
                              className="text-xs flex-shrink-0"
                            >
                              {repo.full_name.split("/")[0]}
                            </Badge>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {repo.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {loading && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading repositories...
              </div>
            )}

            {filteredRepositories.length === 0 && !loading && !searchTerm && (
              <p className="text-sm text-gray-400 mt-2">
                No repositories found. Make sure you have access to GitHub
                repositories.
              </p>
            )}

            {filteredRepositories.length === 0 && !loading && searchTerm && (
              <p className="text-sm text-gray-400 mt-2">
                No repositories match your search criteria. Try a different
                search term.
              </p>
            )}
          </div>

          {selectedRepo && selectedRepo !== "none" && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-md">
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">
                  Selected: {selectedRepo}
                </span>
              </div>
              {repositories.find((r) => r.name === selectedRepo)
                ?.description && (
                <p className="text-xs text-gray-400 mt-1">
                  {
                    repositories.find((r) => r.name === selectedRepo)
                      ?.description
                  }
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedRepo || selectedRepo === "none" || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
