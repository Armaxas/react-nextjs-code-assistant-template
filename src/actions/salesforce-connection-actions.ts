"use server";

import { MongoClient, Db, ObjectId } from "mongodb";

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DATABASE_NAME = "isc-code-connect";
const COLLECTION_NAME = "salesforce_connections";

// Type definitions
interface MongoDate {
  $date: string;
}

export interface SalesforceConnectionDocument {
  _id?: ObjectId;
  userId: string;
  connectionId: string;
  name: string; // User-friendly name for the connection
  authType: "username_password" | "oauth2" | "jwt" | "session_id";
  instanceUrl?: string;
  orgId?: string;
  orgName?: string;
  userName?: string;
  userEmail?: string;
  version?: string;
  isActive: boolean;
  lastUsed: MongoDate | string;
  createdAt: MongoDate | string;
  updatedAt: MongoDate | string;
  // Encrypted auth data (we don't store sensitive info in plain text)
  authDataHash?: string;
  // Connection metadata
  orgInfo?: Record<string, unknown>;
  userInfo?: Record<string, unknown>;
}

export interface ProcessedSalesforceConnection {
  _id: string;
  userId: string;
  connectionId: string;
  name: string;
  authType: string;
  instanceUrl?: string;
  orgId?: string;
  orgName?: string;
  userName?: string;
  userEmail?: string;
  version?: string;
  isActive: boolean;
  lastUsed: string;
  createdAt: string;
  updatedAt: string;
  orgInfo?: Record<string, unknown>;
  userInfo?: Record<string, unknown>;
}

// Database connection function
async function connectDB(): Promise<Db> {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client.db(DATABASE_NAME);
}

// Helper function to format dates
function formatMongoDate(date: MongoDate | string): string {
  if (typeof date === "string") return date;
  return new Date(date.$date).toISOString();
}

// Save a new Salesforce connection
export async function saveSalesforceConnection(
  connectionData: Omit<SalesforceConnectionDocument, "_id" | "createdAt" | "updatedAt">
): Promise<{ success: boolean; connectionId?: string; error?: string }> {
  try {
    const db = await connectDB();
    const collection = db.collection<SalesforceConnectionDocument>(COLLECTION_NAME);

    const now = new Date().toISOString();
    const document: SalesforceConnectionDocument = {
      ...connectionData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(document);
    
    return {
      success: true,
      connectionId: result.insertedId.toString(),
    };
  } catch (error) {
    console.error("Error saving Salesforce connection:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save connection",
    };
  }
}

// Get all connections for a user
export async function getUserSalesforceConnections(
  userId: string
): Promise<{ success: boolean; connections?: ProcessedSalesforceConnection[]; error?: string }> {
  try {
    const db = await connectDB();
    const collection = db.collection<SalesforceConnectionDocument>(COLLECTION_NAME);

    const connections = await collection
      .find({ userId })
      .sort({ lastUsed: -1, createdAt: -1 })
      .toArray();

    const processedConnections: ProcessedSalesforceConnection[] = connections.map((conn) => ({
      _id: conn._id!.toString(),
      userId: conn.userId,
      connectionId: conn.connectionId,
      name: conn.name,
      authType: conn.authType,
      instanceUrl: conn.instanceUrl,
      orgId: conn.orgId,
      orgName: conn.orgName,
      userName: conn.userName,
      userEmail: conn.userEmail,
      version: conn.version,
      isActive: conn.isActive,
      lastUsed: formatMongoDate(conn.lastUsed),
      createdAt: formatMongoDate(conn.createdAt),
      updatedAt: formatMongoDate(conn.updatedAt),
      orgInfo: conn.orgInfo,
      userInfo: conn.userInfo,
    }));

    return {
      success: true,
      connections: processedConnections,
    };
  } catch (error) {
    console.error("Error getting user Salesforce connections:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get connections",
    };
  }
}

// Get a specific connection by connectionId
export async function getSalesforceConnection(
  connectionId: string,
  userId: string
): Promise<{ success: boolean; connection?: ProcessedSalesforceConnection; error?: string }> {
  try {
    const db = await connectDB();
    const collection = db.collection<SalesforceConnectionDocument>(COLLECTION_NAME);

    const connection = await collection.findOne({ connectionId, userId });

    if (!connection) {
      return {
        success: false,
        error: "Connection not found",
      };
    }

    const processedConnection: ProcessedSalesforceConnection = {
      _id: connection._id!.toString(),
      userId: connection.userId,
      connectionId: connection.connectionId,
      name: connection.name,
      authType: connection.authType,
      instanceUrl: connection.instanceUrl,
      orgId: connection.orgId,
      orgName: connection.orgName,
      userName: connection.userName,
      userEmail: connection.userEmail,
      version: connection.version,
      isActive: connection.isActive,
      lastUsed: formatMongoDate(connection.lastUsed),
      createdAt: formatMongoDate(connection.createdAt),
      updatedAt: formatMongoDate(connection.updatedAt),
      orgInfo: connection.orgInfo,
      userInfo: connection.userInfo,
    };

    return {
      success: true,
      connection: processedConnection,
    };
  } catch (error) {
    console.error("Error getting Salesforce connection:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get connection",
    };
  }
}

// Update connection last used timestamp
export async function updateConnectionLastUsed(
  connectionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await connectDB();
    const collection = db.collection<SalesforceConnectionDocument>(COLLECTION_NAME);

    const result = await collection.updateOne(
      { connectionId, userId },
      {
        $set: {
          lastUsed: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return {
        success: false,
        error: "Connection not found",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating connection last used:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update connection",
    };
  }
}

// Update connection status
export async function updateConnectionStatus(
  connectionId: string,
  userId: string,
  isActive: boolean,
  orgInfo?: Record<string, unknown>,
  userInfo?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await connectDB();
    const collection = db.collection<SalesforceConnectionDocument>(COLLECTION_NAME);

    const updateData: Partial<SalesforceConnectionDocument> = {
      isActive,
      updatedAt: new Date().toISOString(),
    };

    if (orgInfo) updateData.orgInfo = orgInfo;
    if (userInfo) updateData.userInfo = userInfo;

    const result = await collection.updateOne(
      { connectionId, userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return {
        success: false,
        error: "Connection not found",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating connection status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update connection",
    };
  }
}

// Delete a connection
export async function deleteSalesforceConnection(
  connectionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await connectDB();
    const collection = db.collection<SalesforceConnectionDocument>(COLLECTION_NAME);

    const result = await collection.deleteOne({ connectionId, userId });

    if (result.deletedCount === 0) {
      return {
        success: false,
        error: "Connection not found",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting Salesforce connection:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete connection",
    };
  }
}

// Update connection name
export async function updateConnectionName(
  connectionId: string,
  userId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await connectDB();
    const collection = db.collection<SalesforceConnectionDocument>(COLLECTION_NAME);

    const result = await collection.updateOne(
      { connectionId, userId },
      {
        $set: {
          name,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return {
        success: false,
        error: "Connection not found",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating connection name:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update connection name",
    };
  }
}
