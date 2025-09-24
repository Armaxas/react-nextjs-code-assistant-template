// import type { Message } from 'ai';
import { toast } from "sonner";

// import type { Vote } from '@/lib/db/schema';
// import { getMessageIdFromAnnotations } from '@/lib/utils';

import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { memo } from "react";
import equal from "fast-deep-equal";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Message, Vote } from "@/types/types";
import { useEnhancedDialog } from "@/hooks/use-comment-dialog-enhanced";
import { FeedbackIndicator } from "@/components/feedback-indicator";
import { useMessageFeedback } from "@/hooks/use-feedback-data";
import { useFeedbackCache } from "@/hooks/use-feedback-cache";
import { useRouter } from "next/navigation";

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, copyToClipboard] = useCopyToClipboard();
  const { openDialog } = useEnhancedDialog();
  const router = useRouter();
  const feedbackCache = useFeedbackCache();

  // Use the feedback hook to get feedback data for this message - must be called before early returns
  const { feedback, hasFeedback, hasJiraIssue } = useMessageFeedback(
    message.id || "",
    vote ? [vote] : []
  );

  const navigateToFeedback = () => {
    router.push(`/feedback?chatId=${chatId}&messageId=${message.id}`);
  };

  if (isLoading) return null;
  if (message.role === "user") return null;
  /* if (message.toolInvocations && message.toolInvocations.length > 0)
    return null; */

  const upVote = async (
    comments: string,
    rating: number,
    jiraData?: {
      key: string;
      url: string;
      type: "issue" | "subtask";
      parentKey?: string;
    },
    category?: string
  ) => {
    const messageId = message.id;

    // If we have Jira data, we need to construct the full Jira object
    let jiraIssue = undefined;
    if (jiraData) {
      jiraIssue = {
        issueKey: jiraData.key,
        issueId: jiraData.key.split("-")[1] || jiraData.key,
        issueUrl: jiraData.url,
        summary: `Enhancement: ${comments.substring(0, 50)}...`,
        description: comments,
        status: "Open",
        priority: "Medium",
        labels: ["feedback", "upvote", "enhancement"],
        createdDate: new Date(),
        issueType: jiraData.type,
        parentIssue: jiraData.parentKey,
        usabilityPercentage: rating,
      };
    }

    const upvote = fetch("/api/vote", {
      method: "PATCH",
      body: JSON.stringify({
        chatId,
        messageId,
        comments,
        rating,
        type: "up",
        jiraIssue,
        feedbackType: "upvote",
        jiraCreationType: jiraData?.type || "feedback",
        usabilityPercentage: rating,
        category: category || "general",
      }),
    });

    toast.promise(upvote, {
      loading: "Upvoting Response...",
      success: () => {
        // Use enhanced cache management
        const newVote: Vote = {
          messageId: messageId as string,
          chatId,
          comments,
          isUpvoted: true,
          hasJiraIssue: !!jiraIssue,
          jiraIssue,
          feedbackType: "upvote",
          jiraCreationType: jiraData?.type || "feedback",
          usabilityPercentage: rating,
          category: category || "general",
        };

        // Optimistically update cache
        feedbackCache.optimisticUpdate(chatId, newVote);

        // If JIRA data was created, also update with JIRA details
        if (jiraData) {
          feedbackCache.updateFeedbackWithJira(messageId as string, {
            issueKey: jiraData.key,
            issueUrl: jiraData.url,
            type: jiraData.type,
            parentKey: jiraData.parentKey,
            usabilityPercentage: rating,
          });
        }

        return "Successfully upvoted response!";
      },
      error: "Failed to upvote response. Please try again.",
    });
  };

  const downVote = async (
    comments: string,
    rating: number,
    jiraData?: {
      key: string;
      url: string;
      type: "issue" | "subtask";
      parentKey?: string;
    },
    category?: string
  ) => {
    const messageId = message.id;

    // If we have Jira data, we need to construct the full Jira object
    let jiraIssue = undefined;
    if (jiraData) {
      jiraIssue = {
        issueKey: jiraData.key,
        issueId: jiraData.key.split("-")[1] || jiraData.key,
        issueUrl: jiraData.url,
        summary: `Issue: ${comments.substring(0, 50)}...`,
        description: comments,
        status: "Open",
        priority: "Medium",
        labels: ["feedback", "downvote", "issue"],
        createdDate: new Date(),
        issueType: jiraData.type,
        parentIssue: jiraData.parentKey,
        usabilityPercentage: rating,
      };
    }

    const downvote = fetch("/api/vote", {
      method: "PATCH",
      body: JSON.stringify({
        chatId,
        messageId,
        comments,
        rating,
        type: "down",
        jiraIssue,
        feedbackType: "downvote",
        jiraCreationType: jiraData?.type || "feedback",
        usabilityPercentage: rating,
        category: category || "general",
      }),
    });

    toast.promise(downvote, {
      loading: "Downvoting Response...",
      success: () => {
        // Use enhanced cache management
        const newVote: Vote = {
          messageId: messageId as string,
          chatId,
          comments,
          isUpvoted: false,
          hasJiraIssue: !!jiraIssue,
          jiraIssue,
          feedbackType: "downvote",
          jiraCreationType: jiraData?.type || "feedback",
          usabilityPercentage: rating,
          category: category || "general",
        };

        // Optimistically update cache
        feedbackCache.optimisticUpdate(chatId, newVote);

        // If JIRA data was created, also update with JIRA details
        if (jiraData) {
          feedbackCache.updateFeedbackWithJira(messageId as string, {
            issueKey: jiraData.key,
            issueUrl: jiraData.url,
            type: jiraData.type,
            parentKey: jiraData.parentKey,
            usabilityPercentage: rating,
          });
        }

        return "Successfully downvoted response";
      },
      error: "Failed to downvote response. Please try again.",
    });
  };

  return (
    <div className="flex items-center gap-1.5 self-end mt-1">
      {/* Model Tag - show for assistant messages */}
      {message.model && (
        <div className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-md border border-primary/20">
          {message.model === "ibm-granite-3.3"
            ? "Granite 3.3"
            : message.model === "ibm-granite-3.2"
              ? "Granite 3.2"
              : message.model}
        </div>
      )}

      {/* Feedback Indicator - show if there's existing feedback */}
      {hasFeedback && (
        <FeedbackIndicator
          feedback={feedback}
          hasFeedback={hasFeedback}
          hasJiraIssue={hasJiraIssue}
          onNavigateToFeedback={navigateToFeedback}
          size="sm"
          className="mr-1"
        />
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-md text-zinc-400 hover:text-zinc-300 transition-colors"
              onClick={() => {
                const textToCopy = message.content as string; // Format if needed
                copyToClipboard(textToCopy);
                toast.success("Message copied to clipboard");
              }}
            >
              <CopyIcon />
              <span className="sr-only">Copy message</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy message</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() =>
                openDialog({
                  title: "Upvote Response",
                  description:
                    "Please provide additional details about your upvote.",
                  chatId: chatId,
                  messageId: message.id,
                  onSubmit: (comments, rating, jiraData, category) =>
                    upVote(comments, rating, jiraData, category),
                })
              }
              className={`h-7 w-7 rounded-md transition-colors ${
                vote?.isUpvoted === true
                  ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              <ThumbUpIcon />
              <span className="sr-only">Upvote</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upvote</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() =>
                openDialog({
                  title: "Downvote Response",
                  description:
                    "Please help us improve by letting us know what's wrong with the response.",
                  chatId: chatId,
                  messageId: message.id,
                  onSubmit: (comments, rating, jiraData, category) =>
                    downVote(comments, rating, jiraData, category),
                })
              }
              className={`h-7 w-7 rounded-md transition-colors ${
                vote?.isUpvoted === false
                  ? "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              <ThumbDownIcon />
              <span className="sr-only">Downvote</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Downvote</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;

    return true;
  }
);
