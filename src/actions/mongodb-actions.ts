"use server";

import { MongoClient, Db, ObjectId } from "mongodb";

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DATABASE_NAME = "isc-code-connect";

// Collections definition
const collections = {
  users: "users",
  chats: "chats",
  messages: "messages",
  feedbacks: "feedbacks",
};

// Type definitions
interface MongoDate {
  $date: string;
}

interface FeedbackDocument {
  _id?: ObjectId;
  chatId: string;
  messageId: string;
  userId: string;
  rating: number;
  category: string;
  comments: string;
  isUpvoted: boolean;
  hasJiraIssue: boolean;
  timestamp?: MongoDate | string;
  resolved?: boolean;
  jiraIssueKey?: string;
}

interface ChatDocument {
  _id?: ObjectId;
  userId: string;
  title: string;
  createdAt: MongoDate | string;
  updatedAt: MongoDate | string;
  messageCount: number;
}

interface MessageDocument {
  _id?: ObjectId;
  chatId: string;
  id: string;
  role: string;
  content: string;
  timestamp?: string;
  createdAt: MongoDate | string;
  type?: string;
}

// interface ProcessedFeedback {
//   _id: string;
//   chatId: string;
//   messageId: string;
//   userId: string;
//   rating: "positive" | "negative";
//   comment?: string;
//   timestamp: string;
//   resolved?: boolean;
//   jiraIssueKey?: string;
// }

interface ProcessedChat {
  _id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

// Database connection function
async function connectDB(): Promise<Db> {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client.db(DATABASE_NAME);
}

// Dashboard chat data retrieval with message feedback
export async function getDashboardChatData(): Promise<
  (Omit<ChatDocument, "_id"> & {
    _id: string;
    messages: Array<{
      id: string;
      role: string;
      content: string;
      timestamp: string;
      feedback?: {
        isUpvoted: boolean;
        rating: number;
        category: string;
        comments: string;
      };
    }>;
    feedbackCount: number;
  })[]
> {
  try {
    const db = await connectDB();
    const chats = db.collection<ChatDocument>("chats");
    const messages = db.collection<MessageDocument>(collections.messages);
    const feedbacks = db.collection(collections.feedbacks);

    const result = await chats
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // For each chat, load messages and their feedback
    const chatsWithFeedback = await Promise.all(
      result.map(async (chat) => {
        // Get messages from messages collection by chatId
        const chatMessages = await messages
          .find({ chatId: chat._id?.toString() })
          .sort({ createdAt: 1 })
          .toArray();

        // Get feedback for all messages in this chat
        const chatFeedbacks = await feedbacks
          .find({ chatId: chat._id?.toString() })
          .toArray();

        // Create a map of messageId to feedback
        const feedbackMap = new Map();
        chatFeedbacks.forEach((feedback) => {
          feedbackMap.set(feedback.messageId, {
            isUpvoted: feedback.isUpvoted,
            rating: feedback.rating || 0,
            category: feedback.category || "general",
            comments: feedback.comments || "",
            hasJiraIssue: feedback.hasJiraIssue || false,
          });
        });

        // Attach feedback to messages
        const messagesWithFeedback = chatMessages.map(
          (message, index: number) => ({
            id: message.id || `msg_${chat._id}_${index}`,
            role: message.role || "assistant",
            content: message.content || "",
            timestamp:
              typeof message.timestamp === "string"
                ? message.timestamp
                : typeof message.createdAt === "string"
                  ? message.createdAt
                  : new Date().toISOString(),
            feedback: feedbackMap.get(message.id) || null,
          })
        );

        return {
          ...chat,
          _id: chat._id?.toString(),
          messages: messagesWithFeedback,
          feedbackCount: chatFeedbacks.length,
          rating: 0, // Remove rating calculation since it doesn't make sense for chats
          createdAt:
            typeof chat.createdAt === "object"
              ? chat.createdAt.$date
              : chat.createdAt,
          updatedAt:
            typeof chat.updatedAt === "object"
              ? chat.updatedAt.$date
              : chat.updatedAt,
        };
      })
    );

    return chatsWithFeedback;
  } catch (error) {
    console.error("Error fetching dashboard chat data:", error);
    return [];
  }
}

// Dashboard feedback data retrieval
export async function getDashboardFeedbackData(): Promise<
  (Omit<FeedbackDocument, "_id"> & { _id: string })[]
> {
  try {
    const db = await connectDB();
    const feedback = db.collection<FeedbackDocument>("feedbacks");

    const result = await feedback
      .find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    return result.map((item) => ({
      ...item,
      _id: item._id?.toString(),
      timestamp:
        typeof item.timestamp === "object"
          ? item.timestamp.$date
          : item.timestamp,
    }));
  } catch (error) {
    console.error("Error fetching dashboard feedback data:", error);
    return [];
  }
}

// Dashboard metrics calculation
export async function getDashboardFeedbackMetrics(): Promise<{
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  averageRating: number;
}> {
  try {
    const db = await connectDB();
    const feedback = db.collection<FeedbackDocument>("feedbacks");

    const totalFeedback = await feedback.countDocuments();
    const positiveFeedback = await feedback.countDocuments({
      isUpvoted: true,
    });
    const negativeFeedback = await feedback.countDocuments({
      isUpvoted: false,
    });

    // Calculate average rating based on numeric ratings
    const allRatings = await feedback
      .find({}, { projection: { rating: 1 } })
      .toArray();
    const averageRating =
      allRatings.length > 0
        ? allRatings.reduce((sum, item) => sum + (item.rating || 0), 0) /
          allRatings.length
        : 0;

    return {
      totalFeedback,
      positiveFeedback,
      negativeFeedback,
      averageRating: Math.round(averageRating * 100) / 100,
    };
  } catch (error) {
    console.error("Error calculating dashboard metrics:", error);
    return {
      totalFeedback: 0,
      positiveFeedback: 0,
      negativeFeedback: 0,
      averageRating: 0,
    };
  }
}

// Chat data retrieval with pagination
export async function getChatData(
  page: number = 1,
  limit: number = 20
): Promise<{
  chats: ProcessedChat[];
  total: number;
  hasMore: boolean;
}> {
  try {
    const db = await connectDB();
    const chats = db.collection<ChatDocument>("chats");

    const skip = (page - 1) * limit;
    const total = await chats.countDocuments();

    const result = await chats
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const processedChats = result.map((chat) => ({
      ...chat,
      _id: chat._id?.toString(),
      createdAt:
        typeof chat.createdAt === "object"
          ? chat.createdAt.$date
          : chat.createdAt,
      updatedAt:
        typeof chat.updatedAt === "object"
          ? chat.updatedAt.$date
          : chat.updatedAt,
    }));

    return {
      chats: processedChats,
      total,
      hasMore: skip + limit < total,
    };
  } catch (error) {
    console.error("Error fetching chat data:", error);
    return {
      chats: [],
      total: 0,
      hasMore: false,
    };
  }
}

// Feedback data retrieval with pagination and filtering
export async function getFeedbackData(
  page: number = 1,
  limit: number = 20,
  isUpvoted?: boolean
): Promise<{
  feedback: (Omit<FeedbackDocument, "_id"> & { _id: string })[];
  total: number;
  hasMore: boolean;
}> {
  try {
    const db = await connectDB();
    const feedback = db.collection<FeedbackDocument>("feedbacks");

    const filter = isUpvoted !== undefined ? { isUpvoted } : {};
    const skip = (page - 1) * limit;
    const total = await feedback.countDocuments(filter);

    const result = await feedback
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const processedFeedback = result.map((item) => ({
      ...item,
      _id: item._id?.toString(),
      timestamp:
        typeof item.timestamp === "object"
          ? item.timestamp.$date
          : item.timestamp,
    }));

    return {
      feedback: processedFeedback,
      total,
      hasMore: skip + limit < total,
    };
  } catch (error) {
    console.error("Error fetching feedback data:", error);
    return {
      feedback: [],
      total: 0,
      hasMore: false,
    };
  }
}

// User activity metrics
export async function getUserMetrics(userId: string): Promise<{
  totalChats: number;
  totalFeedback: number;
  lastActivity: string | null;
}> {
  try {
    const db = await connectDB();
    const chats = db.collection<ChatDocument>("chats");
    const feedback = db.collection<FeedbackDocument>("feedbacks");

    const totalChats = await chats.countDocuments({ userId });
    const totalFeedback = await feedback.countDocuments({ userId });

    const lastChat = await chats.findOne(
      { userId },
      { sort: { updatedAt: -1 } }
    );

    const lastActivity = lastChat?.updatedAt
      ? typeof lastChat.updatedAt === "object"
        ? lastChat.updatedAt.$date
        : lastChat.updatedAt
      : null;

    return {
      totalChats,
      totalFeedback,
      lastActivity,
    };
  } catch (error) {
    console.error("Error fetching user metrics:", error);
    return {
      totalChats: 0,
      totalFeedback: 0,
      lastActivity: null,
    };
  }
}

// System health check
export async function getSystemHealth(): Promise<{
  status: "healthy" | "degraded" | "unhealthy";
  dbConnected: boolean;
  timestamp: string;
}> {
  try {
    const db = await connectDB();
    await db.admin().ping();

    return {
      status: "healthy",
      dbConnected: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      status: "unhealthy",
      dbConnected: false,
      timestamp: new Date().toISOString(),
    };
  }
}
