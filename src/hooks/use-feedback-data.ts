import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { Vote } from "@/types/types";
import { useMemo } from "react";

/**
 * Hook to fetch all feedback data in a batch
 * This replaces individual calls with a single batched request
 */
export function useBatchFeedbackData() {
  const {
    data: allVotes,
    error,
    mutate,
  } = useSWR<Array<Vote>>(`/api/vote`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // Cache for 30 seconds
    // Enhanced caching for subtask data
    shouldRetryOnError: true,
    errorRetryCount: 2,
  });

  // Group votes by chatId for efficient lookups
  const votesByChat = useMemo(() => {
    if (!allVotes) return {};

    return allVotes.reduce(
      (acc, vote) => {
        if (!acc[vote.chatId]) {
          acc[vote.chatId] = [];
        }
        acc[vote.chatId].push(vote);
        return acc;
      },
      {} as Record<string, Vote[]>
    );
  }, [allVotes]);

  // Enhanced metrics for subtask support
  const enhancedMetrics = useMemo(() => {
    if (!allVotes) return null;

    const totalFeedbacks = allVotes.length;
    const totalJiraIssues = allVotes.filter((vote) => vote.hasJiraIssue).length;
    const totalSubtasks = allVotes.filter(
      (vote) => vote.jiraIssue?.issueType === "subtask"
    ).length;
    const totalRegularIssues = allVotes.filter(
      (vote) => vote.jiraIssue?.issueType !== "subtask" && vote.hasJiraIssue
    ).length;

    // Usability metrics for subtasks
    const subtasksWithRatings = allVotes.filter(
      (vote) =>
        vote.jiraIssue?.issueType === "subtask" &&
        vote.jiraIssue?.usabilityPercentage !== undefined
    );

    const averageUsabilityRating =
      subtasksWithRatings.length > 0
        ? subtasksWithRatings.reduce(
            (sum, vote) => sum + (vote.jiraIssue?.usabilityPercentage || 0),
            0
          ) / subtasksWithRatings.length
        : 0;

    return {
      totalFeedbacks,
      totalJiraIssues,
      totalSubtasks,
      totalRegularIssues,
      averageUsabilityRating,
      subtasksWithRatings: subtasksWithRatings.length,
    };
  }, [allVotes]);

  return {
    allVotes,
    votesByChat,
    enhancedMetrics,
    isLoading: !error && !allVotes,
    error,
    mutate,
  };
}

/**
 * Hook to get feedback data for a specific chat using batched data
 * This should be used with useBatchFeedbackData to avoid multiple API calls
 */
export function useChatFeedbackData(
  chatId: string,
  votesByChat?: Record<string, Vote[]>
) {
  const votes = votesByChat?.[chatId] || [];

  const hasFeedback = votes.length > 0;
  const hasJiraIssues = votes.some((vote) => vote.hasJiraIssue);
  const upvotes = votes.filter((vote) => vote.isUpvoted === true).length;
  const downvotes = votes.filter((vote) => vote.isUpvoted === false).length;

  // Enhanced metrics for subtasks
  const subtasks = votes.filter(
    (vote) => vote.jiraIssue?.issueType === "subtask"
  );
  const regularIssues = votes.filter(
    (vote) => vote.jiraIssue?.issueType !== "subtask" && vote.hasJiraIssue
  );
  const hasSubtasks = subtasks.length > 0;

  // Parent task grouping for subtasks
  const subtasksByParent = subtasks.reduce(
    (acc, vote) => {
      const parentKey = vote.jiraIssue?.parentIssue;
      if (parentKey) {
        if (!acc[parentKey]) acc[parentKey] = [];
        acc[parentKey].push(vote);
      }
      return acc;
    },
    {} as Record<string, Vote[]>
  );

  return {
    votes,
    hasFeedback,
    hasJiraIssues,
    upvotes,
    downvotes,
    // Enhanced subtask metrics
    subtasks,
    regularIssues,
    hasSubtasks,
    subtasksByParent,
    subtaskCount: subtasks.length,
    regularIssueCount: regularIssues.length,
  };
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useBatchFeedbackData and useChatFeedbackData instead
 */
export function useFeedbackData(chatId: string) {
  const {
    data: votes,
    error,
    mutate,
  } = useSWR<Array<Vote>>(
    chatId ? `/api/vote?chatId=${chatId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // Cache for 10 seconds to reduce calls
    }
  );

  const hasFeedback = votes && votes.length > 0;
  const hasJiraIssues = votes ? votes.some((vote) => vote.hasJiraIssue) : false;
  const upvotes = votes
    ? votes.filter((vote) => vote.isUpvoted === true).length
    : 0;
  const downvotes = votes
    ? votes.filter((vote) => vote.isUpvoted === false).length
    : 0;

  return {
    votes,
    hasFeedback,
    hasJiraIssues,
    upvotes,
    downvotes,
    isLoading: !error && !votes,
    error,
    mutate,
  };
}

/**
 * Hook to get feedback data for a specific message
 * This can be used to check if a specific message has feedback
 */
export function useMessageFeedback(messageId: string, votes?: Array<Vote>) {
  const messageFeedback = votes?.find((vote) => vote.messageId === messageId);

  return {
    feedback: messageFeedback,
    hasFeedback: !!messageFeedback,
    hasJiraIssue: messageFeedback?.hasJiraIssue || false,
    isUpvoted: messageFeedback?.isUpvoted === true,
    isDownvoted: messageFeedback?.isUpvoted === false,
    jiraIssue: messageFeedback?.jiraIssue,
    // Enhanced for subtask support
    isSubtask: messageFeedback?.jiraIssue?.issueType === "subtask",
    usabilityPercentage: messageFeedback?.jiraIssue?.usabilityPercentage,
    parentIssue: messageFeedback?.jiraIssue?.parentIssue,
  };
}
