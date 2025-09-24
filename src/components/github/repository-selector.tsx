"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  Github,
  RefreshCw,
  Search,
  Star,
  GitFork,
  Circle,
  Clock,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fetchFilteredRepositories,
  Repository,
} from "@/services/github-assistant-service";
import { cn } from "@/lib/utils";

interface RepoSelectorProps {
  onSelectRepo: (repo: Repository) => void;
  className?: string;
}

export function RepositorySelector({
  onSelectRepo,
  className = "",
}: RepoSelectorProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<
    "all" | "public" | "private" | "forked" | "archived"
  >("all");
  const [sortBy, setSortBy] = useState<"updated" | "stars" | "forks" | "name">(
    "updated"
  );

  // Fetch repositories on component mount
  const loadRepositories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const repos = await fetchFilteredRepositories();
      setRepositories(repos);
    } catch (err) {
      setError("Failed to load repositories. Please try again.");
      console.error("Error loading repositories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRepositories();
  }, []);

  // Filter and sort repositories
  const filteredAndSortedRepos = repositories
    .filter((repo) => {
      // Text search filter
      const matchesSearch =
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.description &&
          repo.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Type filter
      let matchesType = true;
      switch (filterType) {
        case "public":
          matchesType = !repo.private;
          break;
        case "private":
          matchesType = repo.private;
          break;
        case "forked":
          matchesType = repo.fork;
          break;
        case "archived":
          matchesType = repo.archived;
          break;
        case "all":
        default:
          matchesType = true;
      }

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "stars":
          return (b.stargazers_count || 0) - (a.stargazers_count || 0);
        case "forks":
          return (b.forks_count || 0) - (a.forks_count || 0);
        case "name":
          return a.name.localeCompare(b.name);
        case "updated":
        default:
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
      }
    });

  // Handle repository selection
  const handleRepoClick = (repo: Repository) => {
    onSelectRepo(repo);
  };

  // Get language color
  const getLanguageColor = (language: string | null) => {
    const colors: Record<string, string> = {
      JavaScript: "bg-yellow-400",
      TypeScript: "bg-blue-500",
      Python: "bg-green-500",
      Java: "bg-orange-500",
      Go: "bg-cyan-400",
      "C#": "bg-violet-500",
      Ruby: "bg-red-500",
      PHP: "bg-indigo-400",
      Swift: "bg-orange-600",
      Kotlin: "bg-purple-500",
    };

    return language && colors[language] ? colors[language] : "bg-gray-400";
  };

  // Format date to show relative time
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1.5 rounded-md">
            <Github className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            IBMSC Repositories
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={loadRepositories}
                  disabled={isLoading}
                  className="bg-gray-900/30 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh repositories</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-gray-900/30 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter & Sort</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenuContent className="w-56 bg-gray-900 border-gray-700 text-gray-200">
              <DropdownMenuLabel>Repository Type</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer",
                    filterType === "all" && "bg-blue-900/40 text-blue-200"
                  )}
                  onClick={() => setFilterType("all")}
                >
                  All Repositories
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer",
                    filterType === "public" && "bg-blue-900/40 text-blue-200"
                  )}
                  onClick={() => setFilterType("public")}
                >
                  Public Repositories
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer",
                    filterType === "private" && "bg-blue-900/40 text-blue-200"
                  )}
                  onClick={() => setFilterType("private")}
                >
                  Private Repositories
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer",
                    filterType === "forked" && "bg-blue-900/40 text-blue-200"
                  )}
                  onClick={() => setFilterType("forked")}
                >
                  Forked Repositories
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer",
                    filterType === "archived" && "bg-blue-900/40 text-blue-200"
                  )}
                  onClick={() => setFilterType("archived")}
                >
                  Archived Repositories
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer",
                    sortBy === "updated" && "bg-blue-900/40 text-blue-200"
                  )}
                  onClick={() => setSortBy("updated")}
                >
                  Last Updated
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer",
                    sortBy === "stars" && "bg-blue-900/40 text-blue-200"
                  )}
                  onClick={() => setSortBy("stars")}
                >
                  Stars
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer",
                    sortBy === "forks" && "bg-blue-900/40 text-blue-200"
                  )}
                  onClick={() => setSortBy("forks")}
                >
                  Forks
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer",
                    sortBy === "name" && "bg-blue-900/40 text-blue-200"
                  )}
                  onClick={() => setSortBy("name")}
                >
                  Name (A-Z)
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search repositories..."
          className="pl-10 py-4 bg-gray-900/30 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-blue-600"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-900/30 border border-red-700/50 p-4 text-sm text-red-300">
          <div className="flex items-start gap-3">
            <span className="bg-red-500/20 p-1.5 rounded-full mt-0.5">
              <Circle className="h-3 w-3 fill-red-500 text-red-500" />
            </span>
            <div>
              <p className="font-medium mb-1">{error}</p>
              <p className="text-xs text-red-400/80">
                Please check your network connection or GitHub access
                permissions.
              </p>
              <Button
                onClick={loadRepositories}
                variant="outline"
                size="sm"
                className="mt-2 bg-red-900/20 border-red-700/50 text-red-300 hover:bg-red-900/40 hover:text-red-200"
              >
                <RefreshCw className="w-3 h-3 mr-1" /> Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-400 flex justify-between items-center px-1 mb-1">
        <span>
          {filterType !== "all"
            ? `Showing ${filteredAndSortedRepos.length} ${filterType} repositories`
            : filteredAndSortedRepos.length === repositories.length
              ? `Showing all ${repositories.length} repositories`
              : `Found ${filteredAndSortedRepos.length} repositories`}
        </span>
        <span>Sorted by {sortBy}</span>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-12 px-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 rounded-full border-t-2 border-blue-400 animate-spin"></div>
            <div className="absolute inset-0 rounded-full border-blue-400 border-2 opacity-20"></div>
            <Github className="h-6 w-6 text-blue-400" />
          </div>
          <p className="text-gray-400 font-medium mb-1">
            Loading repositories...
          </p>
          <p className="text-gray-500 text-xs text-center max-w-xs">
            Fetching your GitHub repositories and preparing the data
          </p>
        </div>
      ) : filteredAndSortedRepos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-700 to-gray-600 flex items-center justify-center mb-4">
            <Github className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            No repositories found
          </h3>
          <p className="text-gray-400 max-w-xs mx-auto">
            {searchQuery
              ? "Try a different search term or reset the filters"
              : "No repositories match the current filter settings"}
          </p>
          {(searchQuery || filterType !== "all") && (
            <Button
              variant="outline"
              className="mt-4 border-gray-700 text-gray-300"
              onClick={() => {
                setSearchQuery("");
                setFilterType("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <ScrollArea className="h-[55vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-2">
            {filteredAndSortedRepos.map((repo) => (
              <Card
                key={repo.id}
                className="cursor-pointer overflow-hidden transition-all bg-gradient-to-br from-gray-900/80 to-gray-800/80 hover:from-blue-900/30 hover:to-purple-900/30 border-gray-700/50 backdrop-blur-sm"
                onClick={() => handleRepoClick(repo)}
              >
                <div className="flex flex-col">
                  <CardHeader className="py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <CardTitle className="text-md flex items-center gap-2 text-white">
                          {repo.name}
                          {repo.private && (
                            <Badge
                              variant="outline"
                              className="bg-gray-800 text-xs border-gray-600"
                            >
                              private
                            </Badge>
                          )}
                          {repo.fork && (
                            <Badge
                              variant="outline"
                              className="bg-blue-900/30 text-xs border-blue-700/50 text-blue-300"
                            >
                              fork
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-sm mt-1 text-gray-400">
                          {repo.description || "No description available"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="py-1">
                    <div className="flex flex-wrap gap-2">
                      {repo.language && (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${getLanguageColor(repo.language)}`}
                          ></span>
                          <span className="text-xs text-gray-300">
                            {repo.language}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-xs text-gray-300">
                          {repo.stargazers_count || 0}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <GitFork className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs text-gray-300">
                          {repo.forks_count || 0}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs text-gray-300">
                          {formatRelativeDate(repo.updated_at)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
