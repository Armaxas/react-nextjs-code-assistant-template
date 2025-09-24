"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
  Search,
  ExternalLink,
  Plus,
  Check,
  AlertCircle,
  User,
  Calendar,
  Flag,
  FileText,
} from "lucide-react";
import { JiraIssue } from "@/services/jira-service";
import { toast } from "sonner";

// Client-side function to fetch JIRA issue via API
async function fetchJiraIssueViaAPI(
  issueKey: string
): Promise<JiraIssue | null> {
  try {
    const response = await fetch("/api/jira", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        issueKey: issueKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "success" && data.issue) {
      return data.issue;
    } else {
      console.log(`Issue ${issueKey} not found or no access`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching JIRA issue via API:", error);
    throw error;
  }
}

interface JiraIssueBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueSelect: (issue: JiraIssue) => void;
  selectedIssues?: JiraIssue[];
  maxSelection?: number;
}

export function JiraIssueBrowser({
  isOpen,
  onClose,
  onIssueSelect,
  selectedIssues = [],
  maxSelection = 5,
}: JiraIssueBrowserProps) {
  const [searchKey, setSearchKey] = useState("");
  const [searchResults, setSearchResults] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const jiraBaseUrl =
    process.env.NEXT_PUBLIC_JIRA_BASE_URL || "https://jsw.ibm.com";

  // Check if an issue is already selected
  const isIssueSelected = (issueKey: string) => {
    return selectedIssues.some((issue) => issue.key === issueKey);
  };

  // Extract JIRA issue key from URL or return the key directly
  const extractIssueKey = (input: string): string => {
    const trimmedInput = input.trim();

    // Check if it's a URL
    if (trimmedInput.includes("/browse/")) {
      const match = trimmedInput.match(/\/browse\/([A-Z]+-\d+)/i);
      if (match) {
        return match[1].toUpperCase();
      }
    }

    // Check if it's already a JIRA key format (PROJ-123)
    const keyMatch = trimmedInput.match(/^([A-Z]+-\d+)$/i);
    if (keyMatch) {
      return keyMatch[1].toUpperCase();
    }

    // Return as-is if no pattern matches (will likely fail validation)
    return trimmedInput.toUpperCase();
  };

  // Search for JIRA issue by key
  const searchIssue = async () => {
    if (!searchKey.trim()) {
      setError(
        "Please enter a JIRA issue key (e.g., PROJ-123) or full URL (e.g., https://jira.company.com/browse/PROJ-123)"
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Extract issue key from URL or use as-is
      const issueKey = extractIssueKey(searchKey);
      console.log(
        `Searching for JIRA issue: ${issueKey} (from input: ${searchKey})`
      );

      const issue = await fetchJiraIssueViaAPI(issueKey);

      if (issue) {
        setSearchResults([issue]);
      } else {
        setError(`Issue ${issueKey} not found or you don't have access to it.`);
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Error fetching JIRA issue:", err);
      const issueKey = extractIssueKey(searchKey);
      setError(
        `Failed to fetch issue ${issueKey}. Please check the issue key/URL and try again.`
      );
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle issue selection
  const handleIssueSelect = (issue: JiraIssue) => {
    if (isIssueSelected(issue.key)) {
      toast.info("This issue is already selected");
      return;
    }

    if (selectedIssues.length >= maxSelection) {
      toast.error(`Maximum ${maxSelection} issues can be selected`);
      return;
    }

    onIssueSelect(issue);
    toast.success(`Added ${issue.key} to requirements`);
  };

  // Handle Enter key for search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchIssue();
    }
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchKey("");
      setSearchResults([]);
      setError("");
    }
  }, [isOpen]);

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "highest":
      case "critical":
        return "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300 dark:from-red-900/40 dark:to-red-800/40 dark:text-red-200 dark:border-red-700";
      case "high":
        return "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300 dark:from-orange-900/40 dark:to-orange-800/40 dark:text-orange-200 dark:border-orange-700";
      case "medium":
        return "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300 dark:from-yellow-900/40 dark:to-yellow-800/40 dark:text-yellow-200 dark:border-yellow-700";
      case "low":
        return "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 dark:from-green-900/40 dark:to-green-800/40 dark:text-green-200 dark:border-green-700";
      case "lowest":
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300 dark:from-gray-800/40 dark:to-gray-700/40 dark:text-gray-200 dark:border-gray-600";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300 dark:from-gray-800/40 dark:to-gray-700/40 dark:text-gray-200 dark:border-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (
      statusLower.includes("done") ||
      statusLower.includes("resolved") ||
      statusLower.includes("closed")
    ) {
      return "bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border-green-300 dark:from-green-900/40 dark:to-emerald-800/40 dark:text-green-200 dark:border-green-700";
    } else if (
      statusLower.includes("progress") ||
      statusLower.includes("review")
    ) {
      return "bg-gradient-to-r from-blue-100 to-indigo-200 text-blue-800 border-blue-300 dark:from-blue-900/40 dark:to-indigo-800/40 dark:text-blue-200 dark:border-blue-700";
    } else if (
      statusLower.includes("open") ||
      statusLower.includes("new") ||
      statusLower.includes("todo")
    ) {
      return "bg-gradient-to-r from-gray-100 to-slate-200 text-gray-800 border-gray-300 dark:from-gray-800/40 dark:to-slate-700/40 dark:text-gray-200 dark:border-gray-600";
    }
    return "bg-gradient-to-r from-gray-100 to-slate-200 text-gray-800 border-gray-300 dark:from-gray-800/40 dark:to-slate-700/40 dark:text-gray-200 dark:border-gray-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col bg-gradient-to-br from-background to-muted/20">
        <DialogHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 -m-6 mb-6 p-6 rounded-t-lg border-b">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg shadow-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
            Select JIRA Issues
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Search and attach JIRA issues to enhance your requirement analysis
            with structured context
          </p>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-6 min-h-0">
          {/* Search Section */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter JIRA issue key (e.g., CSP-13487) or full URL (e.g., https://jsw.ibm.com/browse/CSP-13487)"
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
              <Button
                onClick={searchIssue}
                disabled={loading || !searchKey.trim()}
                className="h-11 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                {loading ? (
                  <Spinner size="sm" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-red-50/80 border border-red-200 rounded-lg text-red-700 dark:from-red-950/20 dark:to-red-950/10 dark:border-red-800 dark:text-red-300 shadow-sm">
                <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {selectedIssues.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {selectedIssues.length}/{maxSelection} issues selected
                </span>
              </div>
            )}
          </div>

          {/* Search Results */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-4">
              {searchResults.map((issue) => (
                <Card
                  key={issue.key}
                  className="border-0 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader className="pb-4 relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="font-mono bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold"
                          >
                            {issue.key}
                          </Badge>
                          <Badge
                            className={`${getStatusColor(issue.status.name)} font-medium shadow-sm`}
                          >
                            {issue.status.name}
                          </Badge>
                          {issue.priority && (
                            <Badge
                              className={`${getPriorityColor(issue.priority.name)} font-medium shadow-sm`}
                            >
                              <Flag className="h-3 w-3 mr-1" />
                              {issue.priority.name}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg leading-tight text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
                          {issue.summary}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `${jiraBaseUrl}/browse/${issue.key}`,
                              "_blank"
                            )
                          }
                          className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:border-blue-700 dark:hover:text-blue-300 transition-all duration-200"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleIssueSelect(issue)}
                          disabled={
                            isIssueSelected(issue.key) ||
                            selectedIssues.length >= maxSelection
                          }
                          size="sm"
                          className={
                            isIssueSelected(issue.key)
                              ? "bg-green-500 hover:bg-green-600 text-white shadow-md"
                              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                          }
                        >
                          {isIssueSelected(issue.key) ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Selected
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Add to Requirements
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 relative">
                    <div className="space-y-4">
                      {/* Issue Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/30 dark:to-gray-900/30 rounded-lg border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Assignee
                            </span>
                            <p className="text-sm font-medium truncate">
                              {issue.assignee?.displayName || "Unassigned"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <Calendar className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Created
                            </span>
                            <p className="text-sm font-medium">
                              {new Date(issue.created).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                            <FileText className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Type
                            </span>
                            <p className="text-sm font-medium">
                              {issue.issuetype.name}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Description Preview */}
                      {issue.description && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent flex-1" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                              Description
                            </span>
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent flex-1" />
                          </div>
                          <div className="relative p-4 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-blue-950/20 dark:via-gray-900/50 dark:to-purple-950/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <div className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60" />
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {issue.description.length > 250
                                ? `${issue.description.substring(0, 250)}...`
                                : issue.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {searchResults.length === 0 && !loading && !error && (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-950/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Ready to Search
                  </h3>
                  <p className="text-muted-foreground mb-1">
                    Enter a JIRA issue key to find and attach issues
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      PROJ-123
                    </Badge>
                    <span className="text-xs text-muted-foreground">or</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      CN-45935
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent bg-gradient-to-r from-gray-50/30 to-white/30 dark:from-gray-900/30 dark:to-gray-950/30 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground font-medium">
                Search for issues by their key to add them to your requirement
                analysis
              </span>
            </div>
            <Button
              variant="outline"
              onClick={onClose}
              className="hover:bg-gray-100 hover:border-gray-300 dark:hover:bg-gray-800 dark:hover:border-gray-700 transition-all duration-200"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
