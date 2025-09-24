"use server";

import connectDB from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

const collections = {
  users: "users",
  chats: "chats",
  messages: "messages",
  feedbacks: "feedbacks",
};

// Helper function to safely format date
function safeFormatDate(
  date: string | Date | { $date: string } | null | undefined
): string {
  if (!date) return new Date().toISOString();

  try {
    if (typeof date === "string") {
      return new Date(date).toISOString();
    }
    if (typeof date === "object" && date !== null && "$date" in date) {
      return new Date(date.$date).toISOString();
    }
    if (date instanceof Date) {
      return date.toISOString();
    }
    return new Date().toISOString();
  } catch {
    console.error("Invalid date format:", date);
    return new Date().toISOString();
  }
}

// Helper function to normalize rating to 0-100 scale
function normalizeRating(rating: number | string | null | undefined): number {
  if (rating === undefined || rating === null) return 0;
  const numRating = typeof rating === "string" ? parseFloat(rating) : rating;
  if (isNaN(numRating)) return 0;
  // Ensure rating is between 0-100
  return Math.min(Math.max(Math.round(numRating), 0), 100);
}

// Get dashboard chat data with messages and feedback
export async function getDashboardChatData() {
  try {
    const db = await connectDB();
    const chatsCollection = db.collection(collections.chats);
    const messagesCollection = db.collection(collections.messages);
    const feedbacksCollection = db.collection(collections.feedbacks);
    const usersCollection = db.collection(collections.users);

    // Get all chats
    const chats = await chatsCollection
      .find({})
      .sort({ lastModifiedAt: -1 })
      .toArray();

    // For each chat, get the last message and message count
    const chatData = await Promise.all(
      chats.map(async (chat) => {
        // Get messages for this chat
        const messages = await messagesCollection
          .find({ chatId: chat.id })
          .sort({ createdAt: 1 })
          .toArray();

        // Get feedback for this chat
        const feedbacks = await feedbacksCollection
          .find({ chatId: chat.id })
          .toArray();

        // Create a feedback map by messageId
        const feedbackMap = new Map();
        feedbacks.forEach((feedback) => {
          feedbackMap.set(feedback.messageId, {
            rating: feedback.rating || 0,
            category: feedback.category || "general",
            isUpvoted: feedback.isUpvoted,
            comments: feedback.comments || "",
            hasJiraIssue: feedback.hasJiraIssue || false,
          });
        });

        // Get user info
        let userName = "Unknown";
        try {
          if (
            chat.userId &&
            typeof chat.userId === "object" &&
            chat.userId.$oid
          ) {
            // If userId is in $oid format
            const userId = new ObjectId(chat.userId.$oid);
            const user = await usersCollection.findOne({ _id: userId });
            userName = user?.name || user?.email || "Unknown";
          } else if (chat.userId && typeof chat.userId === "object") {
            // If userId is an ObjectId directly
            const user = await usersCollection.findOne({ _id: chat.userId });
            userName = user?.name || user?.email || "Unknown";
          }
        } catch (error) {
          console.error("Error getting user info:", error);
        }

        // Calculate average rating from feedbacks that have ratings
        let rating = 0;
        let feedback = "";
        let feedbackCount = 0;

        if (feedbacks.length > 0) {
          // Count only feedbacks with actual ratings (not 0)
          const ratedFeedbacks = feedbacks.filter(
            (f) => f.rating && f.rating > 0
          );

          if (ratedFeedbacks.length > 0) {
            const totalRating = ratedFeedbacks.reduce((sum, feedback) => {
              return sum + normalizeRating(feedback.rating);
            }, 0);
            rating = Math.round(totalRating / ratedFeedbacks.length);
            feedbackCount = ratedFeedbacks.length;
          }

          // Get the most recent feedback comment
          const latestFeedback = feedbacks.sort((a, b) => {
            const dateA = a.lastModifiedAt || a.createdAt || new Date();
            const dateB = b.lastModifiedAt || b.createdAt || new Date();

            // Handle MongoDB date format
            const timeA = dateA.$date
              ? new Date(dateA.$date).getTime()
              : new Date(dateA).getTime();
            const timeB = dateB.$date
              ? new Date(dateB.$date).getTime()
              : new Date(dateB).getTime();

            return timeB - timeA;
          })[0];
          feedback = latestFeedback?.comments || "";
        }

        // Format messages for display with feedback information
        const formattedMessages = messages.map((message) => {
          const messageFeedback = feedbackMap.get(message.id);
          return {
            id: message.id,
            type: message.role === "user" ? "query" : "response",
            role: message.role,
            content: message.content,
            timestamp: safeFormatDate(message.createdAt),
            feedback: messageFeedback || null,
            model: message.model || null,
          };
        });

        // Get the last message content
        const lastMessage =
          messages.length > 0
            ? messages[messages.length - 1].content
            : chat.title || "";

        return {
          id: chat.id,
          userId: userName,
          threadId: chat.id,
          lastMessage:
            lastMessage.substring(0, 100) +
            (lastMessage.length > 100 ? "..." : ""),
          messagesCount: messages.length,
          rating: rating,
          feedbackCount: feedbackCount,
          feedback: feedback,
          timestamp: safeFormatDate(chat.lastModifiedAt || chat.createdAt),
          messages: formattedMessages,
        };
      })
    );

    return chatData;
  } catch (error) {
    console.error("Error fetching dashboard chat data:", error);
    return [];
  }
}

// Get feedback data for the dashboard
export async function getDashboardFeedbackData() {
  try {
    const db = await connectDB();
    const feedbacksCollection = db.collection(collections.feedbacks);
    const messagesCollection = db.collection(collections.messages);
    const chatsCollection = db.collection(collections.chats);
    const usersCollection = db.collection(collections.users);

    // Get all feedbacks
    const feedbacks = await feedbacksCollection.find({}).toArray();

    // Format feedback data
    const feedbackData = await Promise.all(
      feedbacks.map(async (feedback) => {
        // Get the message for this feedback
        let message = null;
        if (feedback.messageId) {
          message = await messagesCollection.findOne({
            id: feedback.messageId,
          });
        }

        // If no message found by messageId, try to find the most recent assistant message in the chat
        if (!message && feedback.chatId) {
          message = await messagesCollection.findOne(
            {
              chatId: feedback.chatId,
              role: "assistant",
            },
            { sort: { createdAt: -1 } }
          );
        }

        // Get the specific AI message that received this feedback
        let aiResponse = null;
        if (feedback.messageId) {
          aiResponse = await messagesCollection.findOne({
            id: feedback.messageId,
          });
        }

        // If no specific message found, this is an error in data
        if (!aiResponse) {
          console.warn(
            `No AI message found for feedback messageId: ${feedback.messageId}`
          );
          // Fallback - but this shouldn't happen in a properly structured system
          aiResponse = await messagesCollection.findOne(
            {
              chatId: feedback.chatId,
              role: "assistant",
            },
            { sort: { createdAt: -1 } }
          );
        }

        // Get the user query that preceded this specific AI response
        let userQuery = null;
        if (aiResponse) {
          userQuery = await messagesCollection.findOne(
            {
              chatId: feedback.chatId,
              role: "user",
              createdAt: { $lt: aiResponse.createdAt }, // User message before this AI response
            },
            { sort: { createdAt: -1 } } // Most recent user message before the AI response
          );
        }

        // Get chat title for context, but use feedback category for categorization
        const chat = await chatsCollection.findOne({ id: feedback.chatId });

        // Use the actual feedback category, with fallback to chat title if needed
        const category = feedback.category || chat?.title || "General";

        // Get user information
        const chatObj = await chatsCollection.findOne({ id: feedback.chatId });
        let userId = "Unknown";

        if (chatObj && chatObj.userId) {
          try {
            const userObjectId =
              typeof chatObj.userId === "object" && chatObj.userId.$oid
                ? new ObjectId(chatObj.userId.$oid)
                : chatObj.userId;

            const user = await usersCollection.findOne({ _id: userObjectId });
            userId = user?.name || user?.email || "Unknown";
          } catch (error) {
            console.error("Error getting user info for feedback:", error);
          }
        }

        return {
          id: feedback._id.toString(),
          userId: userId,
          threadId: feedback.chatId,
          rating: normalizeRating(feedback.rating),
          feedback: feedback.comments || "",
          timestamp: safeFormatDate(feedback.createdAt),
          query: userQuery?.content || "N/A",
          response: aiResponse?.content || "AI response not found",
          model: aiResponse?.model || "Unknown",
          category: category, // Use the actual feedback category
          resolved: feedback.isUpvoted || false,
        };
      })
    );

    return feedbackData;
  } catch (error) {
    console.error("Error fetching dashboard feedback data:", error);
    return [];
  }
}

// Get model performance metrics
export async function getModelPerformanceMetrics() {
  try {
    const db = await connectDB();
    const messagesCollection = db.collection(collections.messages);
    const feedbacksCollection = db.collection(collections.feedbacks);

    // Get all assistant messages with models
    const assistantMessages = await messagesCollection
      .find({
        role: "assistant",
        model: { $exists: true, $ne: null },
      })
      .toArray();

    // Get all feedbacks
    const feedbacks = await feedbacksCollection.find({}).toArray();

    // Create a map of messageId to feedback
    const feedbackMap = new Map();
    feedbacks.forEach((feedback) => {
      if (feedback.messageId) {
        feedbackMap.set(feedback.messageId, feedback);
      }
    });

    // Model usage statistics
    const modelStats = new Map<string, number>();
    const modelFeedbacks = new Map<string, unknown[]>();
    const modelRatings = new Map<string, number[]>();
    const modelTimestamps = new Map<string, unknown[]>();

    assistantMessages.forEach((message) => {
      const model = message.model;
      if (!model) return;

      // Initialize model stats
      if (!modelStats.has(model)) {
        modelStats.set(model, 0);
        modelFeedbacks.set(model, []);
        modelRatings.set(model, []);
        modelTimestamps.set(model, []);
      }

      // Count usage
      modelStats.set(model, modelStats.get(model)! + 1);

      // Track timestamps for trends
      modelTimestamps.get(model)!.push({
        date: safeFormatDate(message.createdAt),
        timestamp: message.createdAt,
      });

      // Get feedback for this message
      const feedback = feedbackMap.get(message.id);
      if (feedback && feedback.rating && feedback.rating > 0) {
        modelFeedbacks.get(model)!.push(feedback);
        modelRatings.get(model)!.push(normalizeRating(feedback.rating));
      }
    });

    // Calculate model usage distribution
    const totalMessages = assistantMessages.length;
    const modelUsage = Array.from(modelStats.entries()).map(([model, count]) => ({
      model,
      count,
      percentage: totalMessages > 0 ? ((count / totalMessages) * 100).toFixed(1) : '0',
    }));

    // Calculate average ratings per model
    const modelRatingAvg = Array.from(modelRatings.entries()).map(([model, ratings]) => ({
      model,
      avgRating: ratings.length > 0 ? (ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length).toFixed(1) : '0',
      feedbackCount: ratings.length,
      totalMessages: modelStats.get(model) || 0,
      feedbackRate: modelStats.get(model)! > 0 ? ((ratings.length / modelStats.get(model)!) * 100).toFixed(1) : '0',
    }));

    // Calculate model trends over time (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const modelTrends = new Map<string, Map<string, number>>();
    assistantMessages
      .filter((msg) => {
        const msgDate = new Date(msg.createdAt);
        return msgDate >= thirtyDaysAgo && msg.model;
      })
      .forEach((msg) => {
        const date = safeFormatDate(msg.createdAt);
        const model = msg.model;
        
        if (!modelTrends.has(date)) {
          modelTrends.set(date, new Map());
        }
        if (!modelTrends.get(date)!.has(model)) {
          modelTrends.get(date)!.set(model, 0);
        }
        modelTrends.get(date)!.set(model, modelTrends.get(date)!.get(model)! + 1);
      });

    // Convert trends to array format for charts
    const trendsData: Record<string, unknown>[] = [];
    const dates = Array.from(modelTrends.keys()).sort();
    const allModels = new Set(assistantMessages.filter(m => m.model).map(m => m.model));
    
    dates.forEach(date => {
      const entry: Record<string, unknown> = { date };
      allModels.forEach(model => {
        entry[model] = modelTrends.get(date)?.get(model) || 0;
      });
      trendsData.push(entry);
    });

    // Model satisfaction comparison
    const modelSatisfaction = Array.from(modelRatings.entries()).map(([model, ratings]) => {
      if (ratings.length === 0) return null;
      
      const avgRating = ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length;
      const positiveCount = ratings.filter((r: number) => r > 60).length;
      const negativeCount = ratings.filter((r: number) => r <= 60).length;
      
      return {
        model,
        avgRating: avgRating.toFixed(1),
        positiveCount,
        negativeCount,
        totalFeedback: ratings.length,
        satisfactionRate: ((positiveCount / ratings.length) * 100).toFixed(1),
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      modelUsage: modelUsage.sort((a, b) => b.count - a.count),
      modelRatingAvg: modelRatingAvg.sort((a, b) => parseFloat(b.avgRating) - parseFloat(a.avgRating)),
      modelTrends: trendsData,
      modelSatisfaction: modelSatisfaction.sort((a, b) => parseFloat(b.satisfactionRate) - parseFloat(a.satisfactionRate)),
      allModels: Array.from(allModels).sort(),
    };
  } catch (error) {
    console.error("Error fetching model performance metrics:", error);
    return {
      modelUsage: [],
      modelRatingAvg: [],
      modelTrends: [],
      modelSatisfaction: [],
      allModels: [],
    };
  }
}

// Helper to safely get date string
function safeGetDateString(
  dateInput: string | Date | { $date: string } | null | undefined
): string | null {
  if (!dateInput) return null;

  try {
    let date: Date;
    if (
      typeof dateInput === "object" &&
      dateInput !== null &&
      "$date" in dateInput
    ) {
      // MongoDB date format
      date = new Date(dateInput.$date);
    } else {
      date = new Date(dateInput as string | Date);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) return null;

    return date.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

// Get feedback metrics for the dashboard
export async function getDashboardFeedbackMetrics() {
  try {
    const db = await connectDB();
    const feedbacksCollection = db.collection(collections.feedbacks);
    const chatsCollection = db.collection(collections.chats);

    // Get all feedbacks
    const feedbacks = await feedbacksCollection.find({}).toArray();

    // Get all chats for categories
    const chats = await chatsCollection.find({}).toArray();
    const chatTitles: Record<string, string> = {};
    chats.forEach((chat) => {
      chatTitles[chat.id] = chat.title || "Unknown";
    });

    // Calculate rating distribution
    const ratingCounts: Record<number, number> = {};
    const categories: Record<
      string,
      { count: number; totalRating: number; ratedCount: number }
    > = {};
    const ratingByDay: Record<
      string,
      { count: number; totalRating: number; ratedCount: number }
    > = {};

    feedbacks.forEach((feedback) => {
      // Normalize rating to 0-100 scale
      const rating = normalizeRating(feedback.rating);

      // Group ratings by 5% increments, but treat 0 specially for "Not Rated"
      if (rating === 0) {
        ratingCounts[0] = (ratingCounts[0] || 0) + 1;
      } else {
        const bucketRating = Math.floor(rating / 5) * 5;
        ratingCounts[bucketRating] = (ratingCounts[bucketRating] || 0) + 1;
      }

      // Use actual feedback category, with fallback to chat title
      const category =
        feedback.category || chatTitles[feedback.chatId] || "general";

      // Normalize category display name
      const displayCategory = category
        .replace("-", " ")
        .replace(/\b\w/g, (l: string) => l.toUpperCase());

      if (!categories[displayCategory]) {
        categories[displayCategory] = {
          count: 0,
          totalRating: 0,
          ratedCount: 0,
        };
      }
      categories[displayCategory].count += 1;

      // Only include in average if rating > 0 (exclude "Not Rated")
      if (rating > 0) {
        categories[displayCategory].totalRating += rating;
        categories[displayCategory].ratedCount += 1;
      }

      // Aggregate by date
      const dateString = safeGetDateString(feedback.createdAt);
      if (dateString) {
        if (!ratingByDay[dateString]) {
          ratingByDay[dateString] = { count: 0, totalRating: 0, ratedCount: 0 };
        }
        ratingByDay[dateString].count += 1;
        if (rating > 0) {
          ratingByDay[dateString].totalRating += rating;
          ratingByDay[dateString].ratedCount += 1;
        }
      }
    });

    // Format rating distribution for 0-100% scale in 5% increments
    const ratingDistribution = [];

    // Special handling for "Not Rated" (0%)
    ratingDistribution.push({
      rating: "Not Rated",
      count: ratingCounts[0] || 0,
      color: "#6b7280", // gray color
    });

    // Regular rating buckets (5% to 100%)
    for (let i = 5; i <= 100; i += 5) {
      ratingDistribution.push({
        rating: `${i}%`,
        count: ratingCounts[i] || 0,
        color: getRatingColor(i),
      });
    }

    // Format category breakdown - limit to top 10 categories
    const categoryBreakdown = Object.entries(categories)
      .map(([category, data]) => ({
        category,
        count: data.count,
        avgRating:
          data.ratedCount > 0
            ? (data.totalRating / data.ratedCount).toFixed(1)
            : "Not Rated",
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Take top 10 categories

    // Format rating trends (last 7 days)
    const ratingTrends = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];
      const formatDate = `${date.getMonth() + 1}/${date.getDate()}`;

      const dayData = ratingByDay[dateString] || {
        count: 0,
        totalRating: 0,
        ratedCount: 0,
      };
      ratingTrends.push({
        date: formatDate,
        rating:
          dayData.ratedCount > 0
            ? (dayData.totalRating / dayData.ratedCount).toFixed(1)
            : "Not Rated",
        count: dayData.count,
      });
    }

    // Calculate time-based metrics
    const timeBasedMetrics = calculateTimeBasedMetrics(
      feedbacks as FeedbackData[]
    );

    return {
      ratingDistribution,
      ratingTrends,
      categoryBreakdown,
      timeBasedMetrics,
    };
  } catch (error) {
    console.error("Error fetching dashboard feedback metrics:", error);
    return {
      ratingDistribution: [],
      ratingTrends: [],
      categoryBreakdown: [],
      timeBasedMetrics: {},
    };
  }
}

// Helper functions
function getRatingColor(rating: number): string {
  // Ensure rating is between 0-100
  const normalizedRating = Math.min(Math.max(rating, 0), 100);

  if (normalizedRating >= 90) return "#22c55e"; // Dark green
  if (normalizedRating >= 80) return "#84cc16"; // Light green
  if (normalizedRating >= 70) return "#86efac"; // Very light green
  if (normalizedRating >= 60) return "#fde047"; // Yellow
  if (normalizedRating >= 50) return "#fdba74"; // Light orange
  if (normalizedRating >= 40) return "#f97316"; // Orange
  if (normalizedRating >= 30) return "#ef4444"; // Light red
  if (normalizedRating >= 20) return "#dc2626"; // Red
  return "#7f1d1d"; // Dark red
}

interface FeedbackData {
  createdAt?: string | Date | { $date: string };
  rating?: number | string;
}

function calculateTimeBasedMetrics(feedbacks: FeedbackData[]) {
  const now = new Date();
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;
  const weekMs = 7 * dayMs;
  const monthMs = 30 * dayMs;

  const lastHour = { count: 0, totalRating: 0 };
  const last24Hours = { count: 0, totalRating: 0 };
  const lastWeek = { count: 0, totalRating: 0 };
  const lastMonth = { count: 0, totalRating: 0 };

  feedbacks.forEach((feedback: FeedbackData) => {
    if (!feedback.createdAt) return;

    try {
      let createdAt: Date;

      // Handle MongoDB date format
      if (
        typeof feedback.createdAt === "object" &&
        feedback.createdAt !== null &&
        "$date" in feedback.createdAt
      ) {
        createdAt = new Date(feedback.createdAt.$date);
      } else if (feedback.createdAt instanceof Date) {
        createdAt = feedback.createdAt;
      } else if (typeof feedback.createdAt === "string") {
        createdAt = new Date(feedback.createdAt);
      } else {
        return; // Skip if no valid date
      }

      // Skip if date is invalid
      if (isNaN(createdAt.getTime())) return;

      const timeDiff = now.getTime() - createdAt.getTime();
      const rating = normalizeRating(feedback.rating);

      if (timeDiff <= hourMs) {
        lastHour.count += 1;
        lastHour.totalRating += rating;
      }

      if (timeDiff <= dayMs) {
        last24Hours.count += 1;
        last24Hours.totalRating += rating;
      }

      if (timeDiff <= weekMs) {
        lastWeek.count += 1;
        lastWeek.totalRating += rating;
      }

      if (timeDiff <= monthMs) {
        lastMonth.count += 1;
        lastMonth.totalRating += rating;
      }
    } catch {
      // Skip this feedback if there's an error with the date
    }
  });

  return {
    lastHour: {
      count: lastHour.count,
      avgRating:
        lastHour.count > 0
          ? (lastHour.totalRating / lastHour.count).toFixed(1)
          : 0,
    },
    last24Hours: {
      count: last24Hours.count,
      avgRating:
        last24Hours.count > 0
          ? (last24Hours.totalRating / last24Hours.count).toFixed(1)
          : 0,
    },
    lastWeek: {
      count: lastWeek.count,
      avgRating:
        lastWeek.count > 0
          ? (lastWeek.totalRating / lastWeek.count).toFixed(1)
          : 0,
    },
    lastMonth: {
      count: lastMonth.count,
      avgRating:
        lastMonth.count > 0
          ? (lastMonth.totalRating / lastMonth.count).toFixed(1)
          : 0,
    },
  };
}

// Get total messages count for response rate calculation
export async function getMessagesCount() {
  try {
    const db = await connectDB();
    const messagesCollection = db.collection(collections.messages);

    // Debug: Get total count of all messages
    const totalAllMessages = await messagesCollection.countDocuments({});

    // Debug: Get count of each role type
    const roleStats = await messagesCollection
      .aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // Count total assistant messages
    const totalMessages = await messagesCollection.countDocuments({
      role: "assistant",
    });

    // Sample a few messages to see the data structure
    const sampleMessages = await messagesCollection.find({}).limit(3).toArray();

    return {
      totalMessages,
      totalAllMessages,
      roleStats,
      sampleMessages: sampleMessages.map((msg) => ({
        role: msg.role,
        id: msg.id,
        chatId: msg.chatId,
      })),
      success: true,
    };
  } catch (error) {
    console.error("Error in getMessagesCount:", error);
    return {
      error: "Failed to fetch messages count",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      totalMessages: 0,
      success: false,
    };
  }
}

// Update user role
export async function updateUserRole(userId: string, newRole: string) {
  try {
    const db = await connectDB();
    const usersCollection = db.collection(collections.users);

    // Validate input
    if (!userId || !newRole) {
      return {
        error: "User ID and new role are required",
        success: false,
      };
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(userId)) {
      return {
        error: "Invalid user ID format",
        success: false,
      };
    }

    // Validate role
    const validRoles = ["user", "admin"];
    if (!validRoles.includes(newRole.toLowerCase())) {
      return {
        error: "Invalid role. Must be 'user' or 'admin'",
        success: false,
      };
    }

    const userObjectId = new ObjectId(userId);

    // Update user role
    const result = await usersCollection.updateOne(
      { _id: userObjectId },
      {
        $set: {
          role: newRole.toLowerCase(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return {
        error: "User not found",
        success: false,
      };
    }

    if (result.modifiedCount === 0) {
      return {
        error: "Role update failed",
        success: false,
      };
    }

    // Get updated user data
    const updatedUser = await usersCollection.findOne({ _id: userObjectId });

    return {
      success: true,
      message: `User role updated to ${newRole}`,
      user: {
        _id: updatedUser?._id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        role: updatedUser?.role,
      },
    };
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      error: "Internal server error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      success: false,
    };
  }
}
