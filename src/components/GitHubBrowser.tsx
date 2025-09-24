/**
 * GitHub Repository Browser Component
 * Used for browsing and selecting files from GitHub repositories
 */
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  FileIcon,
  FolderIcon,
  ChevronRight,
  Github,
  Search,
  X,
  Check,
} from "lucide-react";
import { FileAttachment } from "@/types/files"; // Corrected import path
import { generateUUID } from "@/lib/utils";

import {
  fetchRepositoryContents,
  fetchFileContent,
  fetchRepositoryBranches,
} from "@/actions/github-actions"; // Corrected to import the server actions

import { useSignIn } from "@/hooks/use-signin";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useGitHub } from "@/contexts/github-context";

interface GitHubBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (files: FileAttachment[]) => void;
  selectedFiles: FileAttachment[];
  maxFiles: number;
}

interface GitHubContentItem {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: string;
  download_url: string | null;
  html_url: string;
}

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
}

interface Breadcrumb {
  name: string;
  path: string;
}

export const GitHubBrowser = ({
  isOpen,
  onClose,
  onFileSelect,
  selectedFiles,
  maxFiles = 3,
}: GitHubBrowserProps) => {
  // Use the pre-fetched GitHub context
  const {
    isAuthenticated,
    repositories,
    isLoading: contextLoading,
    refreshRepositories,
  } = useGitHub();

  const [currentRepo, setCurrentRepo] = useState<string>("");
  const [currentRepoOwner, setCurrentRepoOwner] = useState<string>("");
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>("");
  const [, setCurrentPath] = useState<string>(""); // currentPath unused but setCurrentPath is used
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [contents, setContents] = useState<GitHubContentItem[]>([]);
  const [selectedRepoFiles, setSelectedRepoFiles] = useState<FileAttachment[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Search functionality
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const { signInGitHub } = useSignIn();

  // Initialize repositories when opened
  useEffect(() => {
    if (isOpen && repositories.length > 0 && !currentRepo) {
      // Default to first repo
      const firstRepo = repositories[0];
      setCurrentRepo(firstRepo.name);
      setCurrentRepoOwner(firstRepo.full_name.split("/")[0]);
      loadContents(firstRepo.full_name.split("/")[0], firstRepo.name);
    } else if (isOpen && repositories.length === 0 && isAuthenticated) {
      // Refresh repositories if none are loaded
      refreshRepositories();
    }
  }, [isOpen, repositories, currentRepo, isAuthenticated, refreshRepositories]);

  // Filter content based on search query
  const filteredContents = useMemo(() => {
    if (!searchQuery) return contents;

    return contents.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contents, searchQuery]);

  // Load contents of current repository path
  const loadContents = async (
    owner: string,
    repo: string,
    path: string = "",
    branch: string = ""
  ) => {
    setIsLoading(true);
    try {
      // Construct the full repository name for the server action
      const repoFullName = `${owner}/${repo}`;
      const repoContents = await fetchRepositoryContents(
        repoFullName,
        path,
        branch
      );
      setContents(repoContents);
      setSearchQuery("");

      // Update breadcrumbs
      if (path === "") {
        setBreadcrumbs([{ name: repo, path: "" }]);
      } else {
        const pathParts = path.split("/");
        const breadcrumbsArray = [{ name: repo, path: "" }];

        let currentBreadcrumbPath = "";
        pathParts.forEach((part) => {
          currentBreadcrumbPath = currentBreadcrumbPath
            ? `${currentBreadcrumbPath}/${part}`
            : part;
          breadcrumbsArray.push({
            name: part,
            path: currentBreadcrumbPath,
          });
        });

        setBreadcrumbs(breadcrumbsArray);
      }

      setCurrentPath(path);
    } catch (err) {
      console.error(
        `Error loading contents for ${owner}/${repo}/${path}:`,
        err
      );
      setError(`Failed to load contents for ${path || "repository root"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle folder click
  const handleFolderClick = (item: GitHubContentItem) => {
    loadContents(currentRepoOwner, currentRepo, item.path);
  };

  // Handle file click (select/deselect file)
  const handleFileClick = async (item: GitHubContentItem) => {
    // Check if the file is already selected
    const isAlreadySelected = selectedRepoFiles.some(
      (file) => file.name === item.name && file.path === item.path
    );

    if (isAlreadySelected) {
      // Remove the file if already selected
      const updatedFiles = selectedRepoFiles.filter(
        (file) => !(file.name === item.name && file.path === item.path)
      );
      setSelectedRepoFiles(updatedFiles);
      return;
    }

    // Don't allow adding more than max files
    if (selectedRepoFiles.length + selectedFiles.length >= maxFiles) {
      setError(`You can only attach up to ${maxFiles} files at a time`);
      return;
    }

    // Add the file if not already selected
    setIsLoading(true);
    try {
      // Construct the full repository name for the server action
      const repoFullName = `${currentRepoOwner}/${currentRepo}`;
      const fileContent = await fetchFileContent(repoFullName, item.path);

      if (fileContent) {
        const newFile: FileAttachment = {
          id: generateUUID(),
          name: fileContent.name,
          content: fileContent.content,
          type: fileContent.type,
          language: fileContent.language,
          extension: fileContent.extension,
          path: fileContent.path,
          repo: `${currentRepoOwner}/${currentRepo}`,
        };

        setSelectedRepoFiles([...selectedRepoFiles, newFile]);
        setError("");
      }
    } catch (err) {
      console.error(`Error loading file content:`, err);
      setError(`Failed to load file content for ${item.name}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle breadcrumb click
  const handleBreadcrumbClick = (path: string) => {
    loadContents(currentRepoOwner, currentRepo, path);
  };

  // Handle repository change
  const handleRepoChange = async (repo: string) => {
    const repoInfo = repositories.find((r) => r.name === repo);
    if (repoInfo) {
      const repoFullName = repoInfo.full_name;
      const owner = repoFullName.split("/")[0];

      setCurrentRepo(repo);
      setCurrentRepoOwner(owner);
      setIsLoading(true);

      try {
        const fetchedBranches = await fetchRepositoryBranches(repoFullName);
        setBranches(fetchedBranches);

        const defaultBranch =
          repoInfo.default_branch ||
          (fetchedBranches.length > 0 ? fetchedBranches[0].name : "");
        setCurrentBranch(defaultBranch);

        loadContents(owner, repo, "", defaultBranch);
      } catch (err) {
        console.error(`Error loading branches for ${repoFullName}:`, err);
        setError(`Failed to load branches for ${repo}`);
        setBranches([]);
        setCurrentBranch("");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBranchChange = (branch: string) => {
    setCurrentBranch(branch);
    loadContents(currentRepoOwner, currentRepo, "", branch);
  };

  // Handle file selection confirmation
  const handleConfirmSelection = () => {
    onFileSelect([...selectedFiles, ...selectedRepoFiles]);
    onClose();
  };

  // Handle GitHub login
  const handleGitHubLogin = () => {
    signInGitHub();
  };

  // Removal of selected file
  const handleRemoveFile = (fileId: string) => {
    const updatedFiles = selectedRepoFiles.filter((file) => file.id !== fileId);
    setSelectedRepoFiles(updatedFiles);
  };

  // Clear search query
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Repository Browser
          </DialogTitle>
        </DialogHeader>

        {(isLoading || contextLoading) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && !contextLoading && !isAuthenticated && (
          <div className="py-8 flex flex-col items-center justify-center gap-4">
            <Alert>
              <AlertTitle>GitHub authentication required</AlertTitle>
              <AlertDescription>
                You need to authenticate with GitHub to browse repository files.
              </AlertDescription>
            </Alert>
            <Button onClick={handleGitHubLogin} className="mt-4">
              <Github className="mr-2 h-4 w-4" />
              Sign in with GitHub
            </Button>
          </div>
        )}

        {!isLoading &&
          !contextLoading &&
          isAuthenticated &&
          repositories.length === 0 && (
            <div className="py-8">
              <Alert>
                <AlertTitle>No repositories found</AlertTitle>
                <AlertDescription>
                  No Salesforce repositories were found or you don&apos;t have
                  access to the required repositories.
                </AlertDescription>
              </Alert>
            </div>
          )}

        {!isLoading &&
          !contextLoading &&
          isAuthenticated &&
          repositories.length > 0 && (
            <>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Repo and Branch selection dropdowns */}
              <div className="flex items-end gap-4 mb-4">
                <div>
                  <label
                    htmlFor="repo-select"
                    className="block text-sm font-medium mb-1"
                  >
                    Select Repository
                  </label>
                  <select
                    id="repo-select"
                    className="border rounded px-3 py-2 w-full max-w-xs"
                    value={currentRepo}
                    onChange={(e) => handleRepoChange(e.target.value)}
                  >
                    {repositories.map((repo) => (
                      <option key={repo.id} value={repo.name}>
                        {repo.name}
                      </option>
                    ))}
                  </select>
                </div>

                {currentRepo && branches.length > 0 && (
                  <div>
                    <label
                      htmlFor="branch-select"
                      className="block text-sm font-medium mb-1"
                    >
                      Select Branch
                    </label>
                    <select
                      id="branch-select"
                      className="border rounded px-3 py-2 w-full max-w-xs"
                      value={currentBranch}
                      onChange={(e) => handleBranchChange(e.target.value)}
                      disabled={branches.length === 0}
                    >
                      {branches.map((branch) => (
                        <option key={branch.name} value={branch.name}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Search and breadcrumbs row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-2">
                <div className="flex-grow min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 text-sm overflow-x-auto scrollbar-hide pb-1">
                    {breadcrumbs.map((crumb, idx) => (
                      <div
                        key={idx}
                        className="flex items-center flex-shrink-0"
                      >
                        {idx > 0 && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 flex-shrink-0" />
                        )}
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-primary whitespace-nowrap"
                          onClick={() => handleBreadcrumbClick(crumb.path)}
                        >
                          {crumb.name}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative mt-1 sm:mt-0 w-full sm:w-auto flex-shrink-0">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearching(!!e.target.value);
                    }}
                    className="pl-8 pr-8 h-9 w-full sm:w-[200px]"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-9 w-9"
                      onClick={clearSearch}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Clear search</span>
                    </Button>
                  )}
                </div>
              </div>

              <ScrollArea className="h-[300px] border rounded-md p-2">
                {filteredContents.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {isSearching
                      ? "No matching files found"
                      : "No files found in this location"}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredContents
                      .sort((a, b) => {
                        // Sort directories first, then files
                        if (a.type === "dir" && b.type !== "dir") return -1;
                        if (a.type !== "dir" && b.type === "dir") return 1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((item) => {
                        // Check if file is already selected
                        const isSelected = selectedRepoFiles.some(
                          (f) => f.name === item.name && f.path === item.path
                        );

                        return (
                          <Button
                            key={item.path}
                            variant={
                              item.type === "dir"
                                ? "ghost"
                                : isSelected
                                  ? "secondary"
                                  : "ghost"
                            }
                            size="sm"
                            className="w-full justify-start text-left"
                            onClick={() =>
                              item.type === "dir"
                                ? handleFolderClick(item)
                                : handleFileClick(item)
                            }
                          >
                            {item.type === "dir" ? (
                              <FolderIcon className="h-4 w-4 mr-2 text-blue-400" />
                            ) : (
                              <FileIcon className="h-4 w-4 mr-2 text-green-400" />
                            )}
                            <span className="flex-1 truncate">{item.name}</span>
                            {item.type !== "dir" && isSelected && (
                              <Check className="h-4 w-4 ml-2 text-primary" />
                            )}
                          </Button>
                        );
                      })}
                  </div>
                )}
              </ScrollArea>
            </>
          )}

        {/* Selected files section */}
        <div className="mt-4 border-t pt-4">
          <div className="flex flex-row justify-between items-center mb-2">
            <p className="text-sm">
              Selected files: {selectedRepoFiles.length}/{maxFiles}
            </p>
            {selectedRepoFiles.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRepoFiles([])}
              >
                Clear all
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedRepoFiles.map((file) => (
              <Badge
                key={file.id}
                variant="secondary"
                className="px-2 py-1 gap-1"
              >
                <FileIcon className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                  onClick={() => handleRemoveFile(file.id)}
                >
                  <span className="sr-only">Remove</span>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {selectedRepoFiles.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No files selected. Click on files to select (max {maxFiles}).
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSelection}
            disabled={!isAuthenticated || selectedRepoFiles.length === 0}
          >
            Add Selected Files
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
