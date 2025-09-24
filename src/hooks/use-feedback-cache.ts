import { mutate } from "swr";
import { Vote } from "@/types/types";

/**
 * Feedback cache management utilities
 * Provides functions to invalidate and update cached feedback data
 */

export interface FeedbackCacheManager {
  /**
   * Invalidate all feedback cache
   */
  invalidateAll(): Promise<void>;

  /**
   * Invalidate cache for a specific chat
   */
  invalidateChat(chatId: string): Promise<void>;

  /**
   * Update specific feedback in cache after JIRA creation/update
   */
  updateFeedbackWithJira(
    messageId: string,
    jiraData: {
      issueKey: string;
      issueUrl: string;
      type: "issue" | "subtask";
      parentKey?: string;
      usabilityPercentage?: number;
    }
  ): Promise<void>;

  /**
   * Optimistically update cache with new feedback
   */
  optimisticUpdate(chatId: string, newVote: Vote): Promise<void>;
}

export function useFeedbackCache(): FeedbackCacheManager {
  const invalidateAll = async () => {
    try {
      await mutate("/api/vote");
      console.log("[FeedbackCache] Invalidated all feedback cache");
    } catch (error) {
      console.error("[FeedbackCache] Error invalidating all cache:", error);
    }
  };

  const invalidateChat = async (chatId: string) => {
    try {
      await mutate(`/api/vote?chatId=${chatId}`);
      await mutate("/api/vote"); // Also invalidate batch cache
      console.log(`[FeedbackCache] Invalidated cache for chat: ${chatId}`);
    } catch (error) {
      console.error(
        `[FeedbackCache] Error invalidating chat cache for ${chatId}:`,
        error
      );
    }
  };

  const updateFeedbackWithJira = async (
    messageId: string,
    jiraData: {
      issueKey: string;
      issueUrl: string;
      type: "issue" | "subtask";
      parentKey?: string;
      usabilityPercentage?: number;
    }
  ) => {
    try {
      // Update batch cache
      await mutate(
        "/api/vote",
        async (currentData: Vote[] | undefined) => {
          if (!currentData) return currentData;

          return currentData.map((vote) => {
            if (vote.messageId === messageId) {
              return {
                ...vote,
                hasJiraIssue: true,
                jiraIssue: {
                  issueKey: jiraData.issueKey,
                  issueId: jiraData.issueKey, // Using key as ID for simplicity
                  issueUrl: jiraData.issueUrl,
                  summary: `Feedback for message ${messageId}`,
                  description: vote.comments || "",
                  status: "Open",
                  priority: "Medium",
                  labels: ["feedback"],
                  createdDate: new Date(),
                  issueType: jiraData.type,
                  ...(jiraData.parentKey && {
                    parentIssue: jiraData.parentKey,
                  }),
                  ...(jiraData.usabilityPercentage !== undefined && {
                    usabilityPercentage: jiraData.usabilityPercentage,
                  }),
                },
                jiraCreationType: jiraData.type,
                ...(jiraData.usabilityPercentage !== undefined && {
                  usabilityPercentage: jiraData.usabilityPercentage,
                }),
              };
            }
            return vote;
          });
        },
        { revalidate: false }
      );

      console.log(
        `[FeedbackCache] Updated feedback with JIRA data for message: ${messageId}`
      );
    } catch (error) {
      console.error(
        `[FeedbackCache] Error updating feedback with JIRA data for ${messageId}:`,
        error
      );
      // Fall back to invalidating cache
      await invalidateAll();
    }
  };

  const optimisticUpdate = async (chatId: string, newVote: Vote) => {
    try {
      // Update batch cache
      await mutate(
        "/api/vote",
        async (currentData: Vote[] | undefined) => {
          if (!currentData) return [newVote];

          // Check if vote already exists and update, otherwise add
          const existingIndex = currentData.findIndex(
            (vote) => vote.messageId === newVote.messageId
          );
          if (existingIndex >= 0) {
            const updated = [...currentData];
            updated[existingIndex] = newVote;
            return updated;
          }

          return [...currentData, newVote];
        },
        { revalidate: false }
      );

      // Update individual chat cache
      await mutate(
        `/api/vote?chatId=${chatId}`,
        async (currentData: Vote[] | undefined) => {
          if (!currentData) return [newVote];

          const existingIndex = currentData.findIndex(
            (vote) => vote.messageId === newVote.messageId
          );
          if (existingIndex >= 0) {
            const updated = [...currentData];
            updated[existingIndex] = newVote;
            return updated;
          }

          return [...currentData, newVote];
        },
        { revalidate: false }
      );

      console.log(
        `[FeedbackCache] Optimistically updated vote for message: ${newVote.messageId}`
      );
    } catch (error) {
      console.error(
        `[FeedbackCache] Error in optimistic update for ${newVote.messageId}:`,
        error
      );
      // Fall back to invalidating cache
      await invalidateChat(chatId);
    }
  };

  return {
    invalidateAll,
    invalidateChat,
    updateFeedbackWithJira,
    optimisticUpdate,
  };
}

/**
 * Utility to create cache key for feedback data
 */
export function createFeedbackCacheKey(chatId?: string): string {
  return chatId ? `/api/vote?chatId=${chatId}` : "/api/vote";
}

/**
 * Utility to check if feedback data is stale
 */
export function isFeedbackDataStale(
  lastUpdated: Date,
  maxAgeMs: number = 30000
): boolean {
  return Date.now() - lastUpdated.getTime() > maxAgeMs;
}

/**
 * Enhanced error boundary for feedback operations
 */
export function withFeedbackErrorHandling<T extends unknown[], R>(
  operation: (...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await operation(...args);
    } catch (error) {
      console.error(`[FeedbackCache] Error in ${operationName}:`, error);

      // Log additional context for debugging
      if (error instanceof Error) {
        console.error(`[FeedbackCache] Error details: ${error.message}`);
        console.error(`[FeedbackCache] Stack trace: ${error.stack}`);
      }

      // Return null to indicate failure, let the UI handle gracefully
      return null;
    }
  };
}
