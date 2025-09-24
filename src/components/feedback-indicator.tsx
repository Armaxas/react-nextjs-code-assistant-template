import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ThumbsUpIcon,
  ThumbsDownIcon,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  GitBranch,
} from "lucide-react";
import { Vote } from "@/types/types";

interface FeedbackIndicatorProps {
  feedback?: Vote;
  hasFeedback: boolean;
  hasJiraIssue: boolean;
  onNavigateToFeedback?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function FeedbackIndicator({
  feedback,
  hasFeedback,
  hasJiraIssue,
  onNavigateToFeedback,
  className = "",
  size = "sm",
  showText = false,
}: FeedbackIndicatorProps) {
  if (!hasFeedback) return null;

  const isUpvote = feedback?.isUpvoted === true;
  const isDownvote = feedback?.isUpvoted === false;

  const iconSize =
    size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5";
  const badgeSize =
    size === "sm"
      ? "text-xs px-1.5 py-0.5"
      : size === "md"
        ? "text-sm px-2 py-1"
        : "text-base px-3 py-1.5";

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* Feedback Type Indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={
                isUpvote ? "default" : isDownvote ? "destructive" : "secondary"
              }
              className={`${badgeSize} flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={onNavigateToFeedback}
            >
              {isUpvote ? (
                <ThumbsUpIcon className={iconSize} />
              ) : isDownvote ? (
                <ThumbsDownIcon className={iconSize} />
              ) : (
                <MessageSquare className={iconSize} />
              )}
              {showText && (
                <span className="text-xs">
                  {isUpvote ? "Upvoted" : isDownvote ? "Downvoted" : "Feedback"}
                </span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div className="font-medium">
                {isUpvote
                  ? "Positive feedback"
                  : isDownvote
                    ? "Negative feedback"
                    : "Has feedback"}
              </div>
              {feedback?.comments && (
                <div className="text-muted-foreground mt-1 max-w-xs">
                  {feedback.comments.length > 60
                    ? `${feedback.comments.substring(0, 60)}...`
                    : feedback.comments}
                </div>
              )}
              <div className="mt-1 text-muted-foreground">
                Click to view feedback details
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Jira Issue/Subtask Indicator */}
        {hasJiraIssue && feedback?.jiraIssue && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`${iconSize === "h-3 w-3" ? "h-6 w-6" : iconSize === "h-4 w-4" ? "h-8 w-8" : "h-10 w-10"} p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (feedback.jiraIssue?.issueUrl) {
                    window.open(feedback.jiraIssue.issueUrl, "_blank");
                  }
                }}
              >
                {feedback.jiraIssue.issueType === "subtask" ? (
                  <GitBranch
                    className={`${iconSize} text-purple-600 dark:text-purple-400`}
                  />
                ) : (
                  <ExternalLink
                    className={`${iconSize} text-blue-600 dark:text-blue-400`}
                  />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div className="font-medium">
                  {feedback.jiraIssue.issueType === "subtask"
                    ? "Jira Subtask"
                    : "Jira Issue"}
                  : {feedback.jiraIssue.issueKey}
                </div>
                {feedback.jiraIssue.parentIssue && (
                  <div className="text-muted-foreground mt-1">
                    Parent: {feedback.jiraIssue.parentIssue}
                  </div>
                )}
                <div className="text-muted-foreground mt-1">
                  Status: {feedback.jiraIssue.status}
                </div>
                <div className="text-muted-foreground">
                  Priority: {feedback.jiraIssue.priority}
                </div>
                {feedback.jiraIssue.usabilityPercentage !== undefined && (
                  <div className="text-muted-foreground">
                    Usability: {feedback.jiraIssue.usabilityPercentage}%
                  </div>
                )}
                <div className="mt-1 text-muted-foreground">
                  Click to open in Jira
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Navigation to Feedback Dashboard */}
        {onNavigateToFeedback && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`${iconSize === "h-3 w-3" ? "h-6 w-6" : iconSize === "h-4 w-4" ? "h-8 w-8" : "h-10 w-10"} p-0 hover:bg-gray-100 dark:hover:bg-gray-800`}
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToFeedback();
                }}
              >
                <AlertCircle
                  className={`${iconSize} text-orange-600 dark:text-orange-400`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div className="font-medium">View in Feedback Dashboard</div>
                <div className="text-muted-foreground">
                  See full feedback details and discussion
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

interface ChatFeedbackSummaryProps {
  upvotes: number;
  downvotes: number;
  hasJiraIssues: boolean;
  onNavigateToFeedback?: () => void;
  className?: string;
}

export function ChatFeedbackSummary({
  upvotes,
  downvotes,
  hasJiraIssues,
  onNavigateToFeedback,
  className = "",
}: ChatFeedbackSummaryProps) {
  const totalFeedback = upvotes + downvotes;

  if (totalFeedback === 0) return null;

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 gap-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={onNavigateToFeedback}
            >
              <MessageSquare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium">{totalFeedback}</span>
              {upvotes > 0 && (
                <div className="flex items-center gap-0.5">
                  <ThumbsUpIcon className="h-3 w-3 text-green-600" />
                  <span className="text-xs">{upvotes}</span>
                </div>
              )}
              {downvotes > 0 && (
                <div className="flex items-center gap-0.5">
                  <ThumbsDownIcon className="h-3 w-3 text-red-600" />
                  <span className="text-xs">{downvotes}</span>
                </div>
              )}
              {hasJiraIssues && (
                <ExternalLink className="h-3 w-3 text-orange-600" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div className="font-medium">Chat Feedback Summary</div>
              <div className="mt-1">
                {upvotes > 0 && <div>• {upvotes} positive feedback</div>}
                {downvotes > 0 && <div>• {downvotes} negative feedback</div>}
                {hasJiraIssues && <div>• Contains Jira issues</div>}
              </div>
              <div className="mt-1 text-muted-foreground">
                Click to view feedback dashboard
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
