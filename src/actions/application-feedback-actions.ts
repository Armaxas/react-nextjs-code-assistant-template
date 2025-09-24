"use server";

import connectDB from "@/lib/db/mongodb-server";
import { ObjectId } from "mongodb";

const db = await connectDB();

const collections = {
  users: "users",
  chats: "chats",
  messages: "messages",
  feedbacks: "feedbacks",
  applicationFeedbacks: "application_feedbacks", // New collection
};

// Interface for application feedback
export interface ApplicationFeedback {
  _id?: ObjectId | string;
  id: string;
  userId: ObjectId | string;
  feedbackType:
    | "bug_report"
    | "feature_request"
    | "improvement_suggestion"
    | "general_feedback"
    | "usability_issue";
  title: string;
  description: string;
  category?: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_review" | "in_progress" | "resolved" | "closed";
  tags?: string[];
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
  }[];
  browserInfo?: {
    userAgent: string;
    url: string;
    viewport: {
      width: number;
      height: number;
    };
  };
  contactInfo?: {
    email: string;
    preferredContact: boolean;
  };
  rating?: number; // 1-5 for satisfaction rating
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  adminNotes?: string;
  upvotes?: number;
  downvotes?: number;
  userVotes?: {
    userId: string;
    vote: "up" | "down";
  }[];
  userInfo?: {
    name: string;
    email: string;
  };
}

interface FilterQuery {
  feedbackType?: ApplicationFeedback["feedbackType"];
  status?: ApplicationFeedback["status"];
  priority?: ApplicationFeedback["priority"];
  userId?: ObjectId;
}

interface SortQuery {
  [key: string]: 1 | -1;
}

interface UpdateData {
  status?: ApplicationFeedback["status"];
  updatedAt: Date;
  adminNotes?: string;
  resolvedAt?: Date;
}

interface UpdateQuery {
  $set?: Record<string, unknown>;
  $inc?: Record<string, number>;
}

interface AggregationResult {
  _id: string;
  count: number;
}

// Helper function to generate unique ID
function generateUniqueId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Create application feedback
export async function createApplicationFeedback(feedback: {
  userId: string;
  feedbackType: ApplicationFeedback["feedbackType"];
  title: string;
  description: string;
  category?: string;
  priority: ApplicationFeedback["priority"];
  tags?: string[];
  browserInfo?: ApplicationFeedback["browserInfo"];
  contactInfo?: ApplicationFeedback["contactInfo"];
  rating?: number;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const collection = db.collection(collections.applicationFeedbacks);

    const feedbackDoc = {
      id: generateUniqueId(),
      userId: new ObjectId(feedback.userId),
      feedbackType: feedback.feedbackType,
      title: feedback.title,
      description: feedback.description,
      category: feedback.category || "General",
      priority: feedback.priority,
      status: "open" as const,
      tags: feedback.tags || [],
      attachments: [],
      browserInfo: feedback.browserInfo,
      contactInfo: feedback.contactInfo,
      rating: feedback.rating,
      createdAt: new Date(),
      updatedAt: new Date(),
      upvotes: 0,
      downvotes: 0,
      userVotes: [],
    };

    const result = await collection.insertOne(feedbackDoc);

    if (!result.acknowledged) {
      return { success: false, error: "Failed to create feedback" };
    }

    return { success: true, id: feedbackDoc.id };
  } catch (error) {
    console.error("Error creating application feedback:", error);
    return { success: false, error: "Database error" };
  }
}

// Get application feedbacks with pagination and filtering
export async function getApplicationFeedbacks(
  params: {
    page?: number;
    limit?: number;
    feedbackType?: ApplicationFeedback["feedbackType"];
    status?: ApplicationFeedback["status"];
    priority?: ApplicationFeedback["priority"];
    userId?: string;
    sortBy?: "createdAt" | "updatedAt" | "priority" | "upvotes";
    sortOrder?: "asc" | "desc";
  } = {}
): Promise<{
  feedbacks: ApplicationFeedback[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}> {
  try {
    const {
      page = 1,
      limit = 20,
      feedbackType,
      status,
      priority,
      userId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const collection = db.collection(collections.applicationFeedbacks);
    const usersCollection = db.collection(collections.users);

    // Build filter query
    const filter: FilterQuery = {};
    if (feedbackType) filter.feedbackType = feedbackType;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (userId) filter.userId = new ObjectId(userId);

    // Build sort query
    const sort: SortQuery = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;
    const total = await collection.countDocuments(filter);

    const feedbacks = await collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Enrich with user information
    const enrichedFeedbacks: ApplicationFeedback[] = await Promise.all(
      feedbacks.map(async (feedback) => {
        let userInfo = { name: "Unknown", email: "unknown@example.com" };
        try {
          const user = await usersCollection.findOne({
            _id: new ObjectId(feedback.userId),
          });
          if (user) {
            userInfo = {
              name: user.name || user.email || "Unknown",
              email: user.email || "unknown@example.com",
            };
          }
        } catch (error) {
          console.error("Error fetching user info:", error);
        }

        return {
          ...feedback,
          _id: feedback._id?.toString(),
          userId: feedback.userId.toString(),
          userInfo,
        } as ApplicationFeedback;
      })
    );

    return {
      feedbacks: enrichedFeedbacks,
      total,
      hasMore: skip + limit < total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error fetching application feedbacks:", error);
    return {
      feedbacks: [],
      total: 0,
      hasMore: false,
      page: 1,
      limit: 20,
    };
  }
}

// Get single application feedback by ID
export async function getApplicationFeedbackById(
  id: string
): Promise<ApplicationFeedback | null> {
  try {
    const collection = db.collection(collections.applicationFeedbacks);
    const feedback = await collection.findOne({ id });

    if (!feedback) return null;

    return {
      ...feedback,
      _id: feedback._id?.toString(),
      userId: feedback.userId.toString(),
    } as ApplicationFeedback;
  } catch (error) {
    console.error("Error fetching application feedback:", error);
    return null;
  }
}

// Update application feedback status
export async function updateApplicationFeedbackStatus(
  id: string,
  status: ApplicationFeedback["status"],
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = db.collection(collections.applicationFeedbacks);

    const updateData: UpdateData = {
      status,
      updatedAt: new Date(),
    };

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    if (status === "resolved") {
      updateData.resolvedAt = new Date();
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: "Feedback not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating application feedback status:", error);
    return { success: false, error: "Database error" };
  }
}

// Vote on application feedback
export async function voteOnApplicationFeedback(
  feedbackId: string,
  userId: string,
  vote: "up" | "down"
): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = db.collection(collections.applicationFeedbacks);

    const feedback = await collection.findOne({ id: feedbackId });
    if (!feedback) {
      return { success: false, error: "Feedback not found" };
    }

    const userVotes = feedback.userVotes || [];
    const existingVoteIndex = userVotes.findIndex(
      (v: { userId: string; vote: string }) => v.userId === userId
    );

    let updateQuery: UpdateQuery = {};

    if (existingVoteIndex >= 0) {
      // Update existing vote
      const existingVote = userVotes[existingVoteIndex];
      if (existingVote.vote === vote) {
        // Same vote, remove it
        userVotes.splice(existingVoteIndex, 1);
        updateQuery = {
          $set: { userVotes },
          $inc: vote === "up" ? { upvotes: -1 } : { downvotes: -1 },
        };
      } else {
        // Different vote, change it
        userVotes[existingVoteIndex].vote = vote;
        updateQuery = {
          $set: { userVotes },
          $inc:
            vote === "up"
              ? { upvotes: 1, downvotes: -1 }
              : { upvotes: -1, downvotes: 1 },
        };
      }
    } else {
      // New vote
      userVotes.push({ userId, vote });
      updateQuery = {
        $set: { userVotes },
        $inc: vote === "up" ? { upvotes: 1 } : { downvotes: 1 },
      };
    }

    const result = await collection.updateOne({ id: feedbackId }, updateQuery);

    if (result.matchedCount === 0) {
      return { success: false, error: "Failed to update vote" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error voting on application feedback:", error);
    return { success: false, error: "Database error" };
  }
}

// Get feedback statistics
export async function getApplicationFeedbackStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  recentCount: number;
}> {
  try {
    const collection = db.collection(collections.applicationFeedbacks);

    const [total, byType, byStatus, byPriority, recentCount] =
      await Promise.all([
        collection.countDocuments(),
        collection
          .aggregate([{ $group: { _id: "$feedbackType", count: { $sum: 1 } } }])
          .toArray(),
        collection
          .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
          .toArray(),
        collection
          .aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }])
          .toArray(),
        collection.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
      ]);

    const formatGroupResults = (results: AggregationResult[]) => {
      return results.reduce(
        (acc, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>
      );
    };

    return {
      total,
      byType: formatGroupResults(byType as AggregationResult[]),
      byStatus: formatGroupResults(byStatus as AggregationResult[]),
      byPriority: formatGroupResults(byPriority as AggregationResult[]),
      recentCount,
    };
  } catch (error) {
    console.error("Error fetching application feedback stats:", error);
    return {
      total: 0,
      byType: {},
      byStatus: {},
      byPriority: {},
      recentCount: 0,
    };
  }
}
