"use server";

import connectDB from "@/lib/db/mongodb-server";
import { Message } from "@/types/types";
import { ObjectId } from "mongodb";

const db = await connectDB();

const collections = {
  users: "users",
  chats: "chats",
  messages: "messages",
  feedbacks: "feedbacks",
};

export async function testDatabaseConnection() {
  const isConnected = false;
  try {
    // Send a ping to confirm a successful connection
    await db.command({ ping: 1 });
    return !isConnected;
  } catch (e) {
    console.error(e);
    return isConnected;
  }
}

export async function getUser(email: string | null | undefined) {
  if (!email) return;
  try {
    const collection = db.collection(collections.users);
    const user =
      (await collection.findOne({
        email: email,
      })) ?? (await createUser(email));

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function createUser(email: string | null | undefined) {
  try {
    const collection = db.collection(collections.users);

    // Check if user already exists
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return null;
    }

    const result = await collection.insertOne({
      email,
      createdAt: new Date(),
    });

    if (!result.acknowledged) {
      return null;
    }

    return {
      _id: result.insertedId,
      email,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    const collection = db.collection(collections.chats);
    const chats = await collection
      .find({
        userId: new ObjectId(id),
      })
      .sort({ lastModifiedAt: -1, createdAt: -1 })
      .toArray();

    if (!chats || chats.length === 0) {
      return [];
    }

    return chats;
  } catch (error) {
    console.error("Error fetching chats:", error);
    return [];
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    const collection = db.collection(collections.chats);
    const result = await collection.insertOne({
      id: id,
      title: title,
      userId: new ObjectId(userId),
      createdAt: new Date(),
      lastModifiedAt: new Date(),
    });

    if (!result) {
      return null;
    }

    if (!result.acknowledged) {
      return null;
    }

    return {
      _id: result.insertedId,
    };
  } catch (error) {
    console.error("Error creating chats:", error);
    return [];
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const collection = db.collection(collections.chats);
    const chat = await collection.findOne({
      id: id,
    });

    if (!chat) {
      return null;
    }

    return chat;
  } catch (error) {
    console.error("Error fetching chats:", error);
    return [];
  }
}

export async function getChatByIdWithPermissions({
  id,
  userId,
  userEmail,
}: {
  id: string;
  userId: string;
  userEmail: string;
}) {
  try {
    const collection = db.collection(collections.chats);
    const chat = await collection.findOne({
      id: id,
      $or: [
        { userId: new ObjectId(userId) }, // Fix: Convert userId to ObjectId for proper matching
        { "sharedWith.email": userEmail },
        { visibility: "shared" },
      ],
    });

    if (!chat) {
      return null;
    }

    return {
      title: chat.title,
      visibility: chat.visibility,
      sharedWith: chat.sharedWith || [],
      createdAt: chat.createdAt,
      lastModifiedAt: chat.lastModifiedAt,
    };
  } catch (error) {
    console.error("Error fetching chat with permissions:", error);
    return null;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    const chatsCollection = db.collection(collections.chats);
    const messagesCollection = db.collection(collections.messages);
    const feedbackCollection = db.collection(collections.feedbacks);
    const chat = await chatsCollection.deleteOne({
      id: id,
    });

    const messages = await messagesCollection.deleteMany({
      chatId: id,
    });

    const feedbacks = await feedbackCollection.deleteMany({
      chatId: id,
    });

    if (
      !chat.acknowledged ||
      !messages.acknowledged ||
      !feedbacks.acknowledged
    ) {
      return null;
    }

    return chat;
  } catch (error) {
    console.error("Error fetching chats:", error);
    return [];
  }
}

export async function saveMessages({
  chatId,
  messages,
}: {
  chatId: string;
  messages: Array<Message>;
}) {
  try {
    const chatCollection = db.collection(collections.chats);
    await chatCollection.updateOne(
      { id: chatId },
      { $set: { lastModifiedAt: new Date() } }
    );
    const collection = db.collection(collections.messages);
    const result = await collection.insertMany(messages);

    if (!result.acknowledged) {
      return null;
    }

    return result;
  } catch (error) {
    console.error("Failed to save messages in database", error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    const collection = db.collection(collections.messages);
    const messages = await collection
      .find({
        chatId: id,
      })
      .sort({ createdAt: 1 })
      .toArray();

    if (!messages || messages.length === 0) {
      return [];
    }

    return messages;
  } catch (error) {
    console.error("Failed to get messages by chat id from database", error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  comments,
  rating,
  type,
  userId,
  jiraIssue,
  category,
}: {
  chatId: string;
  messageId: string;
  comments: string;
  rating: number;
  type: "up" | "down";
  userId: string;
  category?: string;
  jiraIssue?: {
    issueKey: string;
    issueId: string;
    issueUrl: string;
    summary: string;
    description: string;
    status: string;
    assignee?: string;
    priority: string;
    labels: string[];
    attachments?: string[];
    createdDate: Date;
  };
}) {
  try {
    console.log("=== VOTEMESSAGE FUNCTION START ===");
    console.log("Input params:", {
      chatId,
      messageId,
      comments,
      rating,
      type,
      userId,
      hasJiraIssue: !!jiraIssue,
    });

    console.log("Looking for existing vote with messageId:", messageId);
    const existingVote = await db
      .collection(collections.feedbacks)
      .findOne({ messageId });

    console.log("Existing vote found:", !!existingVote, existingVote);

    const updateData = {
      userId: new ObjectId(userId),
      isUpvoted: type === "up",
      comments,
      rating,
      lastModifiedAt: new Date(),
      hasJiraIssue: !!jiraIssue,
      category: category || "general",
      ...(jiraIssue && { jiraIssue }),
    };

    console.log("Update data prepared:", updateData);

    if (existingVote) {
      console.log("Updating existing vote...");
      const updateResult = await db.collection(collections.feedbacks).updateOne(
        { messageId, chatId },
        {
          $set: updateData,
        }
      );
      console.log("Update result:", updateResult);
      return updateResult;
    }

    console.log("Creating new vote document...");
    const insertDocument = {
      chatId,
      messageId,
      userId: new ObjectId(userId),
      comments,
      rating,
      createdAt: new Date(),
      lastModifiedAt: new Date(),
      isUpvoted: type === "up",
      hasJiraIssue: !!jiraIssue,
      category: category || "general",
      ...(jiraIssue && { jiraIssue }),
    };

    console.log("Document to insert:", insertDocument);
    const insertResult = await db
      .collection(collections.feedbacks)
      .insertOne(insertDocument);
    console.log("Insert result:", insertResult);

    // Verify the document was actually inserted
    const verifyInsert = await db
      .collection(collections.feedbacks)
      .findOne({ _id: insertResult.insertedId });
    console.log("Verification - inserted document:", verifyInsert);

    console.log("=== VOTEMESSAGE FUNCTION SUCCESS ===");
    return insertResult;
  } catch (error) {
    console.error("=== VOTEMESSAGE FUNCTION ERROR ===", error);
    console.error("Failed to vote message in database", error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    const collection = db.collection(collections.feedbacks);
    const votes = await collection
      .find({
        chatId: id,
      })
      .sort({ createdAt: 1 })
      .toArray();
    return votes;
  } catch (error) {
    console.error("Failed to get votes by chat id from database", error);
    throw error;
  }
}

export async function getAllVotes() {
  try {
    const collection = db.collection(collections.feedbacks);
    const votes = await collection.find({}).sort({ createdAt: 1 }).toArray();
    return votes;
  } catch (error) {
    console.error("Failed to get all votes from database", error);
    throw error;
  }
}

export async function shareChat({
  chatId,
  // userId, // TODO: Use userId for access control validation
  usersToShareWith,
}: {
  chatId: string;
  userId: string;
  usersToShareWith: Array<{
    userId: string;
    name: string;
    email: string;
  }>;
}) {
  try {
    const collection = db.collection(collections.chats);

    // First get the chat to verify the owner
    // const _chat = await collection.findOne({
    //   id: chatId,
    // });

    // Prepare the users to add with timestamps
    const usersWithTimestamp = usersToShareWith.map((user) => ({
      ...user,
      addedAt: new Date(),
    }));

    // Update the chat
    const result = await collection.updateOne(
      { id: chatId },
      {
        $set: {
          visibility: "shared",
          lastModifiedAt: new Date(),
        },
        $addToSet: {
          sharedWith: { $each: usersWithTimestamp },
        },
      }
    );

    if (!result.acknowledged) {
      return {
        success: false,
        error: "Failed to share chat",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sharing chat:", error);
    return {
      success: false,
      error: "An error occurred while sharing the chat",
    };
  }
}

export async function unshareChat({
  chatId,
  // userId, // TODO: Use userId for access control validation
  userIdToRemove,
}: {
  chatId: string;
  userId: string;
  userIdToRemove: string | "all";
}) {
  try {
    const collection = db.collection(collections.chats);

    // First get the chat to verify the owner
    // const _chat = await collection.findOne({
    //   id: chatId,
    // });

    if (userIdToRemove === "all") {
      // Remove all shared users
      const result = await collection.updateOne(
        { id: chatId },
        {
          $set: {
            visibility: "private",
            sharedWith: [],
            lastModifiedAt: new Date(),
          },
        }
      );

      if (!result.acknowledged) {
        return {
          success: false,
          error: "Failed to unshare chat with all users",
        };
      }
    } else {
      // Remove specific user
      const result = await collection.updateOne(
        { id: chatId },
        {
          $pull: {
            sharedWith: { userId: userIdToRemove } as never,
          },
          $set: { lastModifiedAt: new Date() },
        }
      );

      if (!result.acknowledged) {
        return {
          success: false,
          error: "Failed to unshare chat with user",
        };
      }

      // Check if there are any users left in sharedWith
      const updatedChat = await collection.findOne({
        id: chatId,
      });

      // If no more shared users, update visibility back to private
      if (
        updatedChat &&
        (!updatedChat.sharedWith || updatedChat.sharedWith.length === 0)
      ) {
        await collection.updateOne(
          { id: chatId },
          { $set: { visibility: "private" } }
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error unsharing chat:", error);
    return {
      success: false,
      error: "An error occurred while unsharing the chat",
    };
  }
}

export async function getSharedUsers({
  chatId,
  userId,
  userEmail,
}: {
  chatId: string;
  userId: string;
  userEmail: string;
}) {
  try {
    const collection = db.collection(collections.chats);

    // Get the chat
    const chat = await collection.findOne({
      id: chatId,
    });

    // Check if the user is the owner of the chat or if it's shared with them
    if (
      !chat ||
      (chat.userId.toString() !== userId &&
        (!chat.sharedWith ||
          !chat.sharedWith.some(
            (u: { email: string }) => u.email === userEmail
          )))
    ) {
      return {
        success: false,
        error:
          "You don't have permission to access this chat's sharing information",
      };
    }

    return {
      success: true,
      sharedWith: chat.sharedWith || [],
      owner: {
        userId: chat.userId.toString(),
      },
    };
  } catch (error) {
    console.error("Error getting shared users:", error);
    return {
      success: false,
      error: "An error occurred while getting shared users",
    };
  }
}

export async function getAllUserChats({
  id,
  userEmail,
}: {
  id: string;
  userEmail: string;
}) {
  try {
    const collection = db.collection(collections.chats);

    // Use a single query with $or to get all chats where user is either owner or in sharedWith
    // This prevents duplicates that could occur when a user owns a chat and it's also shared with them
    const allChats = await collection
      .find({
        $or: [{ userId: new ObjectId(id) }, { "sharedWith.email": userEmail }],
      })
      .sort({ lastModifiedAt: -1, createdAt: -1 })
      .toArray();

    // Remove any potential duplicates (just in case)
    const uniqueChats = allChats.filter(
      (chat, index, array) => array.findIndex((c) => c.id === chat.id) === index
    );

    const enrichedChats = await Promise.all(
      uniqueChats.map(async (chat) => {
        const isShared = chat.userId.toString() !== id;
        if (isShared) {
          const owner = await db
            .collection("users")
            .findOne({ _id: chat.userId });
          return {
            ...chat,
            ownerName: owner?.name || "Unknown",
          };
        }
        return chat;
      })
    );

    return enrichedChats;
  } catch (error) {
    console.error("Error fetching all user chats:", error);
    return [];
  }
}

export async function getUserFeedbackHistory(
  userId: string,
  page = 1,
  pageSize = 10,
  filterConditions: Record<string, unknown> = {},
  sortOptions: Record<string, 1 | -1> = { createdAt: -1 }
) {
  try {
    const feedbacksCollection = db.collection(collections.feedbacks);

    // Build the query with user ID and additional filters
    // userId is stored as ObjectId in the database
    const query = {
      userId: new ObjectId(userId),
      ...filterConditions,
    };

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Get feedback with pagination and sorting
    const feedbacks = await feedbacksCollection
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .toArray();

    // Get total count for pagination
    const totalCount = await feedbacksCollection.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      feedbacks: feedbacks.map((feedback) => ({
        ...feedback,
        id: feedback._id.toString(),
      })),
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
      hasNextPage,
      hasPreviousPage,
    };
  } catch (error) {
    console.error("Failed to get user feedback history", error);
    throw error;
  }
}

export async function updateJiraIssueInFeedback(
  feedbackId: string,
  jiraUpdate: Record<string, unknown>
) {
  try {
    const collection = db.collection(collections.feedbacks);

    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Update Jira fields
    Object.keys(jiraUpdate).forEach((key) => {
      updateFields[`jiraIssue.${key}`] = jiraUpdate[key];
    });

    const result = await collection.updateOne(
      { _id: new ObjectId(feedbackId), hasJiraIssue: true },
      { $set: updateFields }
    );

    return result.modifiedCount > 0 ? result : null;
  } catch (error) {
    console.error("Failed to update Jira issue in feedback", error);
    throw error;
  }
}

export async function updateChatTitle({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  try {
    const collection = db.collection(collections.chats);
    const result = await collection.updateOne(
      { id: id },
      {
        $set: {
          title: title,
          lastModifiedAt: new Date(),
        },
      }
    );

    if (!result.acknowledged) {
      return null;
    }

    return result;
  } catch (error) {
    console.error("Error updating chat title:", error);
    return null;
  }
}
