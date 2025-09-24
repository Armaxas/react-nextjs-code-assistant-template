"use server";

import connectDB from "@/lib/db/mongodb-server";
import { ObjectId, Document, WithId } from "mongodb";

const collections = {
  users: "users",
  chats: "chats",
  messages: "messages",
  feedbacks: "feedbacks",
};

interface UserDoc extends Document {
  _id: ObjectId;
  name: string;
  email: string;
  lastLogin: Date;
  createdAt: Date;
  role: string;
  emailVerified?: null;
  image?: string;
}

interface ChatDoc extends Document {
  _id: ObjectId;
  id: string;
  userId: ObjectId;
  createdAt?: Date;
}

interface MessageDoc extends Document {
  _id: ObjectId;
  chatId: string;
  userId?: ObjectId;
  type?: string;
  createdAt?: Date;
}

interface FeedbackDoc extends Document {
  _id: ObjectId;
  chatId: string;
  rating?: number;
}

export interface UserAnalytics {
  _id: string;
  name: string;
  email: string;
  lastLogin: Date | null;
  createdAt: Date;
  totalChats: number;
  totalMessages: number;
  totalFeedbacks: number;
  totalApplicationFeedbacks: number;
  averageRating: number;
  role: string;
  isActive: boolean;
  activityScore: number;
}

export interface UserGrowthData {
  date: string;
  newUsers: number;
  totalUsers: number;
}

export interface UserActivityData {
  date: string;
  activeUsers: number;
  totalChats: number;
  totalMessages: number;
}

// Get comprehensive user analytics
export async function getUserAnalytics(): Promise<UserAnalytics[]> {
  try {
    console.log("Starting getUserAnalytics...");
    const db = await connectDB();
    console.log("Database connected successfully");

    const usersCollection = db.collection(collections.users);
    const chatsCollection = db.collection(collections.chats);
    const messagesCollection = db.collection(collections.messages);
    const feedbacksCollection = db.collection(collections.feedbacks);
    const applicationFeedbacksCollection = db.collection(
      "application_feedbacks"
    );

    // Get all users
    const users = (await usersCollection
      .find({})
      .toArray()) as WithId<UserDoc>[];
    console.log(`Found ${users.length} users in database`);

    if (users.length === 0) {
      console.log("No users found in database");
      return [];
    }

    // Log first user to check structure
    console.log("Sample user structure:", JSON.stringify(users[0], null, 2));

    // Calculate analytics for each user
    const userAnalytics = await Promise.all(
      users.map(async (user: WithId<UserDoc>) => {
        const userId = user._id;
        console.log(`Processing user: ${user.email} (${userId})`);

        // Count user's chats - try both ObjectId and string formats
        const totalChats = await chatsCollection.countDocuments({
          $or: [
            { userId: userId },
            { userId: userId.toString() },
            { userId: user.email }, // Some chats might use email as userId
          ],
        });
        console.log(`User ${user.email} has ${totalChats} chats`);

        // Count user's messages - also try different userId formats for chats
        const userChats = (await chatsCollection
          .find({
            $or: [
              { userId: userId },
              { userId: userId.toString() },
              { userId: user.email },
            ],
          })
          .project({ _id: 1, id: 1 })
          .toArray()) as WithId<ChatDoc>[];

        // Try both _id and id fields for chatId matching
        const chatIds = userChats.map((chat) => chat.id).filter(Boolean);
        const chatObjectIds = userChats.map((chat) => chat._id.toString());
        const allChatIds = [...chatIds, ...chatObjectIds];

        let totalMessages = 0;
        if (allChatIds.length > 0) {
          // Remove the type filter to count all messages, not just "query" type
          totalMessages = await messagesCollection.countDocuments({
            chatId: { $in: allChatIds },
          });
        }
        console.log(`User ${user.email} has ${totalMessages} messages`);

        // Count user's feedbacks
        const totalFeedbacks = await feedbacksCollection.countDocuments({
          chatId: { $in: allChatIds },
        });

        // Count user's application feedbacks
        const totalApplicationFeedbacks =
          await applicationFeedbacksCollection.countDocuments({
            userId: user.email || userId.toString(),
          });

        // Calculate average rating from feedbacks
        const feedbacks = (await feedbacksCollection
          .find({ chatId: { $in: allChatIds } })
          .toArray()) as WithId<FeedbackDoc>[];

        let averageRating = 0;
        if (feedbacks.length > 0) {
          const totalRating = feedbacks.reduce((sum: number, feedback) => {
            // Normalize rating to percentage
            let rating = feedback.rating || 0;
            if (rating <= 5) rating = (rating * 100) / 5; // Convert 1-5 scale to percentage
            return sum + rating;
          }, 0);
          averageRating = Math.round(totalRating / feedbacks.length);
        }

        // Check if user is active (logged in within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const isActive =
          user.lastLogin && new Date(user.lastLogin) > thirtyDaysAgo;

        // Calculate activity score based on various factors
        const activityScore = Math.min(
          100,
          totalChats * 10 +
            totalMessages * 2 +
            totalFeedbacks * 5 +
            totalApplicationFeedbacks * 3 +
            (isActive ? 20 : 0)
        );

        const result = {
          _id: userId.toString(),
          name: user.name || "Unknown",
          email: user.email,
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
          createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
          totalChats,
          totalMessages,
          totalFeedbacks,
          totalApplicationFeedbacks,
          averageRating,
          role: user.role || "user",
          isActive: !!isActive,
          activityScore,
        };

        console.log(`User ${user.email} analytics:`, result);
        return result;
      })
    );

    // Sort by activity score (most active first)
    const sortedAnalytics = userAnalytics.sort(
      (a: UserAnalytics, b: UserAnalytics) => b.activityScore - a.activityScore
    );
    console.log(`Completed analytics for ${sortedAnalytics.length} users`);
    return sortedAnalytics;
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return [];
  }
}

// Get user growth data over time
export async function getUserGrowthData(): Promise<UserGrowthData[]> {
  try {
    const db = await connectDB();
    const usersCollection = db.collection(collections.users);

    // Get user creation data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const users = (await usersCollection
      .find({
        createdAt: { $gte: thirtyDaysAgo },
      })
      .sort({ createdAt: 1 })
      .toArray()) as WithId<UserDoc>[];

    const totalUsers = await usersCollection.countDocuments({});

    // Group by date
    const dateMap = new Map<string, number>();

    // Initialize last 30 days with 0 new users
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      dateMap.set(dateKey, 0);
    }

    // Count new users per day
    users.forEach((user: WithId<UserDoc>) => {
      if (user.createdAt) {
        const dateKey = new Date(user.createdAt).toISOString().split("T")[0];
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      }
    });

    // Convert to array with cumulative total
    let cumulativeTotal = totalUsers - users.length;
    return Array.from(dateMap.entries()).map(([date, newUsers]) => {
      cumulativeTotal += newUsers;
      return {
        date,
        newUsers,
        totalUsers: cumulativeTotal,
      };
    });
  } catch (error) {
    console.error("Error fetching user growth data:", error);
    return [];
  }
}

// Get user activity data over time
export async function getUserActivityData(): Promise<UserActivityData[]> {
  try {
    const db = await connectDB();
    const chatsCollection = db.collection(collections.chats);
    const messagesCollection = db.collection(collections.messages);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get activity data for the last 30 days
    const activityData: UserActivityData[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dateKey = date.toISOString().split("T")[0];

      // Count active users (users who created chats or messages on this day)
      const chatsCreated = (await chatsCollection
        .find({
          createdAt: {
            $gte: date,
            $lt: nextDate,
          },
        })
        .toArray()) as WithId<ChatDoc>[];

      const messagesCreated = (await messagesCollection
        .find({
          createdAt: {
            $gte: date,
            $lt: nextDate,
          },
        })
        .toArray()) as WithId<MessageDoc>[];

      // Get unique user IDs from both chats and messages
      const activeUserIds = new Set();
      chatsCreated.forEach((chat: WithId<ChatDoc>) => {
        if (chat.userId) activeUserIds.add(chat.userId.toString());
      });
      messagesCreated.forEach((message: WithId<MessageDoc>) => {
        if (message.userId) activeUserIds.add(message.userId.toString());
      });

      activityData.push({
        date: dateKey,
        activeUsers: activeUserIds.size,
        totalChats: chatsCreated.length,
        totalMessages: messagesCreated.length,
      });
    }

    return activityData;
  } catch (error) {
    console.error("Error fetching user activity data:", error);
    return [];
  }
}

// Export user data to CSV format
export async function exportUserData(): Promise<string> {
  try {
    const userAnalytics = await getUserAnalytics();

    const csvHeaders = [
      "User ID",
      "Name",
      "Email",
      "Last Login",
      "Created At",
      "Total Chats",
      "Total Messages",
      "Total Feedbacks",
      "Total App Feedbacks",
      "Average Rating",
      "Role",
      "Is Active",
      "Activity Score",
    ].join(",");

    const csvRows = userAnalytics.map((user) =>
      [
        user._id,
        `"${user.name}"`,
        user.email,
        user.lastLogin ? user.lastLogin.toISOString() : "Never",
        user.createdAt.toISOString(),
        user.totalChats,
        user.totalMessages,
        user.totalFeedbacks,
        user.totalApplicationFeedbacks,
        user.averageRating,
        user.role,
        user.isActive ? "Yes" : "No",
        user.activityScore,
      ].join(",")
    );

    return [csvHeaders, ...csvRows].join("\n");
  } catch (error) {
    console.error("Error exporting user data:", error);
    throw new Error("Failed to export user data");
  }
}

// Get most active users
export async function getMostActiveUsers(
  limit: number = 10
): Promise<UserAnalytics[]> {
  try {
    const userAnalytics = await getUserAnalytics();
    return userAnalytics.slice(0, limit);
  } catch (error) {
    console.error("Error fetching most active users:", error);
    return [];
  }
}
