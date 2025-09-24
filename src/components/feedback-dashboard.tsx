import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ThumbsUpIcon,
  ThumbsDownIcon,
  ExternalLink,
  Calendar,
  MessageSquare,
  Filter,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Send,
  GitBranch,
} from "lucide-react";
import { useUserSession } from "@/hooks/use-user-session";
import useSWR from "swr";
import { Vote, JiraComment } from "@/types/types";
import { toast } from "sonner";

interface FeedbackWithDetails extends Vote {
  id: string;
  userId: string;
  createdAt: Date;
  lastModifiedAt?: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface FeedbackHistoryResponse {
  feedbacks: FeedbackWithDetails[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function FeedbackDashboard() {
  const { userSession } = useUserSession();
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [expandedFeedbacks, setExpandedFeedbacks] = useState<
    Record<string, boolean>
  >({});

  // Jira comments state
  const [jiraComments, setJiraComments] = useState<
    Record<string, JiraComment[]>
  >({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [addingComment, setAddingComment] = useState<Record<string, boolean>>(
    {}
  );
  const [loadingComments, setLoadingComments] = useState<
    Record<string, boolean>
  >({});

  const pageSize = 10;

  // Fetch feedback history
  const {
    data: feedbackData,
    error,
    mutate,
    isLoading,
  } = useSWR<FeedbackHistoryResponse>(
    userSession?._id
      ? `/api/feedback/history?page=${currentPage}&pageSize=${pageSize}&filter=${filterType}&category=${categoryFilter}&search=${searchQuery}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch feedback history");
      }
      return response.json();
    }
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    mutate();
    toast.success("Feedback history refreshed");
  };

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getJiraStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "open":
      case "to do":
        return "bg-blue-100 text-blue-800";
      case "in progress":
        return "bg-yellow-100 text-yellow-800";
      case "done":
      case "closed":
        return "bg-green-100 text-green-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "critical":
      case "highest":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "low":
      case "lowest":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Fetch Jira comments for an issue
  const fetchJiraComments = async (issueKey: string) => {
    if (loadingComments[issueKey]) return; // Prevent duplicate requests

    setLoadingComments((prev) => ({ ...prev, [issueKey]: true }));
    try {
      const response = await fetch(`/api/jira/comments?issueKey=${issueKey}`);
      if (!response.ok) {
        throw new Error("Failed to fetch Jira comments");
      }
      const data = await response.json();
      setJiraComments((prev) => ({ ...prev, [issueKey]: data.comments }));
    } catch (error) {
      console.error("Error fetching Jira comments:", error);
      toast.error("Failed to fetch Jira comments");
    } finally {
      setLoadingComments((prev) => ({ ...prev, [issueKey]: false }));
    }
  };

  // Add comment to Jira issue
  const addJiraComment = async (issueKey: string) => {
    const commentText = newComments[issueKey]?.trim();
    if (!commentText) {
      toast.error("Please enter a comment");
      return;
    }

    setAddingComment((prev) => ({ ...prev, [issueKey]: true }));
    try {
      const response = await fetch("/api/jira/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          issueKey,
          comment: commentText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const data = await response.json();

      // Update local comments
      setJiraComments((prev) => ({
        ...prev,
        [issueKey]: [...(prev[issueKey] || []), data.comment],
      }));

      // Clear the input
      setNewComments((prev) => ({ ...prev, [issueKey]: "" }));

      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding Jira comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setAddingComment((prev) => ({ ...prev, [issueKey]: false }));
    }
  };

  // Handle feedback expansion and fetch comments if needed
  const toggleFeedbackExpansion = (feedbackId: string) => {
    const isExpanding = !expandedFeedbacks[feedbackId];
    setExpandedFeedbacks((prev) => ({
      ...prev,
      [feedbackId]: isExpanding,
    }));

    // If expanding and has Jira issue, fetch comments
    if (isExpanding) {
      const feedback = feedbackData?.feedbacks.find((f) => f.id === feedbackId);
      if (feedback?.hasJiraIssue && feedback.jiraIssue?.issueKey) {
        fetchJiraComments(feedback.jiraIssue.issueKey);
      }
    }
  };

  // Format comment date
  const formatCommentDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!userSession?._id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          Please sign in to view your feedback history.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">
          Error loading feedback history: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feedback Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your feedback history and Jira integrations
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search comments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Feedback</SelectItem>
                  <SelectItem value="upvote">Upvotes</SelectItem>
                  <SelectItem value="downvote">Downvotes</SelectItem>
                  <SelectItem value="jira">With Jira Issues</SelectItem>
                  <SelectItem value="no-jira">Without Jira Issues</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="apex-query">Apex Query/Code</SelectItem>
                  <SelectItem value="apex-test">Apex Test</SelectItem>
                  <SelectItem value="lwc">LWC</SelectItem>
                  <SelectItem value="jest">JEST Testing</SelectItem>
                  <SelectItem value="general">General Query</SelectItem>
                  <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort by</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="updatedAt">Last Updated</SelectItem>
                  <SelectItem value="comments">Comments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Order</label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback History</CardTitle>
          <CardDescription>
            {feedbackData?.totalCount
              ? `${feedbackData.totalCount} total feedback entries`
              : "Loading..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : feedbackData?.feedbacks?.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No feedback found matching your criteria.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {feedbackData?.feedbacks?.map((feedback) => (
                  <Card
                    key={feedback.id}
                    className="border-l-4 border-l-primary/20"
                  >
                    <CardContent className="p-6">
                      <div
                        className="flex items-start justify-between mb-4 cursor-pointer"
                        onClick={() => toggleFeedbackExpansion(feedback.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              feedback.isUpvoted
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-rose-100 text-rose-600"
                            }`}
                          >
                            {feedback.isUpvoted ? (
                              <ThumbsUpIcon className="w-4 h-4" />
                            ) : (
                              <ThumbsDownIcon className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {feedback.isUpvoted ? "Upvote" : "Downvote"}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {feedback.lastModifiedAt
                                ? `Updated: ${formatDate(feedback.lastModifiedAt)}`
                                : `Created: ${formatDate(feedback.createdAt)}`}
                            </div>
                            {/* Show rating and category */}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  (feedback.usabilityPercentage || 0) >= 70
                                    ? "default"
                                    : (feedback.usabilityPercentage || 0) >= 40
                                      ? "secondary"
                                      : "destructive"
                                }
                                className="text-xs"
                              >
                                {(feedback.usabilityPercentage || 0) === 0
                                  ? "Not Rated"
                                  : `${feedback.usabilityPercentage}%`}
                              </Badge>
                              {feedback.category && (
                                <Badge variant="outline" className="text-xs">
                                  {feedback.category
                                    .replace("-", " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </Badge>
                              )}
                            </div>
                            {/* Show chat context in collapsed view */}
                            {!expandedFeedbacks[feedback.id] && (
                              <div className="flex items-center gap-1 mt-1">
                                <MessageSquare className="w-3 h-3" />
                                <span className="text-xs text-muted-foreground">
                                  Chat: {feedback.chatId.slice(0, 8)}...
                                </span>
                                {feedback.comments && (
                                  <>
                                    <span className="text-xs text-muted-foreground">
                                      •
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                      {feedback.comments.length > 50
                                        ? feedback.comments.slice(0, 50) + "..."
                                        : feedback.comments}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {feedback.hasJiraIssue && (
                            <Badge variant="secondary">Jira Issue</Badge>
                          )}

                          {/* Quick Chat Access Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent expanding/collapsing
                              window.open(`/chat/${feedback.chatId}`, "_blank");
                            }}
                            title="Open chat in new tab"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Chat
                          </Button>

                          {expandedFeedbacks[feedback.id] ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {expandedFeedbacks[feedback.id] && (
                        <>
                          {/* Original Feedback Details Section */}
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <MessageSquare className="w-4 h-4 text-muted-foreground" />
                              <p className="text-sm font-medium">
                                Feedback Details
                              </p>
                            </div>
                            <div className="bg-muted/20 border rounded-lg p-4 space-y-3">
                              <div className="flex gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Rating:
                                  </span>
                                  <Badge
                                    variant={
                                      (feedback.usabilityPercentage || 0) >= 70
                                        ? "default"
                                        : (feedback.usabilityPercentage || 0) >=
                                            40
                                          ? "secondary"
                                          : "destructive"
                                    }
                                    className="text-xs"
                                  >
                                    {(feedback.usabilityPercentage || 0) === 0
                                      ? "Not Rated"
                                      : `${feedback.usabilityPercentage}%`}
                                  </Badge>
                                </div>
                                {feedback.category && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      Category:
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {feedback.category
                                        .replace("-", " ")
                                        .replace(/\b\w/g, (l) =>
                                          l.toUpperCase()
                                        )}
                                    </Badge>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Message ID:
                                  </span>
                                  <code className="text-xs bg-muted px-1 rounded">
                                    {feedback.messageId}
                                  </code>
                                </div>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">
                                  Comments:
                                </span>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {feedback.comments ||
                                    "No additional comments provided with this feedback"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Jira Issue Details Section */}
                          {feedback.hasJiraIssue && feedback.jiraIssue && (
                            <div className="mb-6">
                              <div className="flex items-center gap-2 mb-3">
                                <div
                                  className={`p-1.5 rounded-md ${
                                    feedback.jiraIssue.issueType === "subtask"
                                      ? "bg-purple-100 text-purple-600"
                                      : "bg-blue-100 text-blue-600"
                                  }`}
                                >
                                  {feedback.jiraIssue.issueType ===
                                  "subtask" ? (
                                    <GitBranch className="w-4 h-4" />
                                  ) : (
                                    <ExternalLink className="w-4 h-4" />
                                  )}
                                </div>
                                <h4 className="font-medium">
                                  {feedback.jiraIssue.issueType === "subtask"
                                    ? "Jira Subtask"
                                    : "Jira Issue"}{" "}
                                  Details
                                </h4>
                                {feedback.jiraIssue?.issueUrl && (
                                  <a
                                    href={feedback.jiraIssue?.issueUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-auto inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md"
                                  >
                                    View in Jira{" "}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>

                              <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
                                <div className="bg-muted/30 px-4 py-3 border-b">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="font-mono text-xs bg-card"
                                    >
                                      {feedback.jiraIssue?.issueKey}
                                    </Badge>
                                    <span className="font-medium text-sm">
                                      {feedback.jiraIssue?.summary}
                                    </span>
                                  </div>

                                  {/* Parent Issue Link for Subtasks */}
                                  {feedback.jiraIssue.issueType === "subtask" &&
                                    feedback.jiraIssue.parentIssue && (
                                      <div className="mt-2 flex items-center gap-2">
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          Parent Issue
                                        </Badge>
                                        <a
                                          href={`${feedback.jiraIssue.issueUrl?.split("/browse/")[0]}/browse/${feedback.jiraIssue.parentIssue}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                          {feedback.jiraIssue.parentIssue}
                                        </a>
                                      </div>
                                    )}
                                </div>

                                <div className="p-4 bg-card">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Status
                                      </p>
                                      <Badge
                                        className={getJiraStatusColor(
                                          feedback.jiraIssue?.status
                                        )}
                                      >
                                        {feedback.jiraIssue?.status ||
                                          "Unknown"}
                                      </Badge>
                                    </div>

                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Priority
                                      </p>
                                      <Badge
                                        className={getPriorityColor(
                                          feedback.jiraIssue?.priority
                                        )}
                                      >
                                        {feedback.jiraIssue?.priority ||
                                          "Unknown"}
                                      </Badge>
                                    </div>

                                    {feedback.jiraIssue?.assignee && (
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">
                                          Assignee
                                        </p>
                                        <div className="flex items-center gap-2">
                                          <span className="bg-muted/50 text-muted-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                            {feedback.jiraIssue.assignee
                                              ?.charAt(0)
                                              .toUpperCase()}
                                          </span>
                                          <span className="text-sm">
                                            {feedback.jiraIssue.assignee}
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Usability Percentage for Subtasks */}
                                    {feedback.jiraIssue.issueType ===
                                      "subtask" &&
                                      feedback.jiraIssue.usabilityPercentage !==
                                        undefined && (
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">
                                            Usability Rating
                                          </p>
                                          <Badge
                                            className={
                                              feedback.jiraIssue
                                                .usabilityPercentage >= 70
                                                ? "bg-green-100 text-green-800"
                                                : feedback.jiraIssue
                                                      .usabilityPercentage >= 40
                                                  ? "bg-yellow-100 text-yellow-800"
                                                  : "bg-red-100 text-red-800"
                                            }
                                          >
                                            {
                                              feedback.jiraIssue
                                                .usabilityPercentage
                                            }
                                            %
                                          </Badge>
                                        </div>
                                      )}

                                    {feedback.jiraIssue?.labels &&
                                      feedback.jiraIssue.labels.length > 0 && (
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">
                                            Labels
                                          </p>
                                          <div className="flex flex-wrap gap-1">
                                            {feedback.jiraIssue?.labels?.map(
                                              (label, index) => (
                                                <Badge
                                                  key={index}
                                                  variant="outline"
                                                  className="text-xs text-blue-700 bg-blue-100 border-blue-300 hover:bg-blue-200"
                                                >
                                                  {label}
                                                </Badge>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}
                                  </div>

                                  {feedback.jiraIssue?.description && (
                                    <div className="border-t pt-3">
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Description
                                      </p>
                                      <div className="bg-muted/20 p-3 rounded-md text-sm text-muted-foreground prose-sm max-w-none">
                                        {feedback.jiraIssue?.description}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Comments Section - Always at the bottom */}
                          <div className="border-t pt-4">
                            <div className="flex items-center gap-2 mb-4">
                              <MessageSquare className="w-4 h-4 text-muted-foreground" />
                              <p className="text-sm font-medium">
                                {feedback.hasJiraIssue && feedback.jiraIssue
                                  ? "Discussion & Comments"
                                  : "Feedback Comments"}
                              </p>
                              {feedback.hasJiraIssue && feedback.jiraIssue && (
                                <Badge variant="outline" className="text-xs">
                                  Synced with Jira
                                </Badge>
                              )}
                            </div>

                            {feedback.hasJiraIssue && feedback.jiraIssue ? (
                              <div>
                                {/* Jira Comments Display */}
                                <div className="space-y-3 mb-4">
                                  {loadingComments[
                                    feedback.jiraIssue?.issueKey || ""
                                  ] ? (
                                    <div className="flex items-center justify-center py-6">
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                      <span className="ml-3 text-sm text-muted-foreground">
                                        Loading comments...
                                      </span>
                                    </div>
                                  ) : jiraComments[
                                      feedback.jiraIssue?.issueKey || ""
                                    ]?.length > 0 ? (
                                    jiraComments[
                                      feedback.jiraIssue?.issueKey || ""
                                    ].map((comment) => (
                                      <div
                                        key={comment.id}
                                        className="bg-muted/20 border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                                      >
                                        <div className="flex items-start gap-3">
                                          <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                                            {comment.author.displayName
                                              .charAt(0)
                                              .toUpperCase()}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="text-sm font-medium">
                                                {comment.author.displayName}
                                              </span>
                                              <span className="text-xs text-muted-foreground">
                                                {formatCommentDate(
                                                  comment.created
                                                )}
                                              </span>
                                              {comment.updated &&
                                                comment.updated !==
                                                  comment.created && (
                                                  <span className="text-xs text-muted-foreground">
                                                    (edited)
                                                  </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-foreground whitespace-pre-wrap">
                                              {comment.body}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-6 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                      <p className="text-sm">
                                        No comments in Jira issue yet
                                      </p>
                                      <p className="text-xs">
                                        Be the first to add a comment below
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Add Comment Section */}
                                <div className="bg-muted/10 border rounded-lg p-4">
                                  <p className="text-xs text-muted-foreground mb-3">
                                    Add a comment to the Jira issue
                                  </p>
                                  <div className="flex gap-3">
                                    <Textarea
                                      placeholder="Write your comment here..."
                                      value={
                                        newComments[
                                          feedback.jiraIssue?.issueKey || ""
                                        ] || ""
                                      }
                                      onChange={(e) =>
                                        setNewComments((prev) => ({
                                          ...prev,
                                          [feedback.jiraIssue?.issueKey || ""]:
                                            e.target.value,
                                        }))
                                      }
                                      className="min-h-[80px] resize-none"
                                    />
                                    <Button
                                      onClick={() =>
                                        feedback.jiraIssue?.issueKey &&
                                        addJiraComment(
                                          feedback.jiraIssue.issueKey
                                        )
                                      }
                                      disabled={
                                        !newComments[
                                          feedback.jiraIssue?.issueKey || ""
                                        ]?.trim() ||
                                        addingComment[
                                          feedback.jiraIssue?.issueKey || ""
                                        ]
                                      }
                                      size="sm"
                                      className="self-end px-4"
                                    >
                                      {addingComment[
                                        feedback.jiraIssue?.issueKey || ""
                                      ] ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      ) : (
                                        <>
                                          <Send className="w-4 h-4 mr-1" />
                                          Post
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-muted/10 border rounded-lg p-4">
                                <p className="text-sm text-muted-foreground">
                                  {feedback.comments ||
                                    "No additional comments provided with this feedback"}
                                </p>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      <Separator className="my-4" />

                      {/* Navigation & Context Section */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Chat Navigation */}
                          <div className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg px-3 py-2 border border-blue-200">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <div className="flex flex-col">
                              <span className="text-xs text-blue-600 font-medium">
                                View Chat
                              </span>
                              <a
                                href={`/chat/${feedback.chatId}`}
                                className="text-xs text-blue-700 hover:text-blue-900 hover:underline font-mono"
                                title="Open chat conversation"
                              >
                                Chat {feedback.chatId.slice(0, 8)}...
                              </a>
                            </div>
                          </div>

                          {/* Message Context */}
                          <div className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg px-3 py-2 border border-gray-200">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-600 font-medium">
                                Message
                              </span>
                              <a
                                href={`/chat/${feedback.chatId}#message-${feedback.messageId}`}
                                className="text-xs text-gray-700 hover:text-gray-900 hover:underline font-mono"
                                title="Jump to specific message in chat"
                              >
                                ID: {feedback.messageId.slice(0, 8)}...
                              </a>
                            </div>
                          </div>

                          {/* Feedback Type Indicator */}
                          <div
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
                              feedback.isUpvoted
                                ? "bg-emerald-50 border-emerald-200"
                                : "bg-rose-50 border-rose-200"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                feedback.isUpvoted
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                              }`}
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-gray-600">
                                Feedback
                              </span>
                              <span
                                className={`text-xs font-medium ${
                                  feedback.isUpvoted
                                    ? "text-emerald-700"
                                    : "text-rose-700"
                                }`}
                              >
                                {feedback.isUpvoted ? "Positive" : "Negative"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Timestamp Info */}
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            Created: {formatDate(feedback.createdAt)}
                          </div>
                          {feedback.lastModifiedAt &&
                            feedback.lastModifiedAt !== feedback.createdAt && (
                              <div className="text-xs text-muted-foreground">
                                Updated: {formatDate(feedback.lastModifiedAt)}
                              </div>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Pagination */}
          {feedbackData && feedbackData.totalCount > pageSize && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of{" "}
                {Math.ceil(feedbackData.totalCount / pageSize)}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!feedbackData.hasPreviousPage}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!feedbackData.hasNextPage}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
