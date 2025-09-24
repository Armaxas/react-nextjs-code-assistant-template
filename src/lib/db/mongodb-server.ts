import { MongoClient, Db } from "mongodb";

// Declare the global type at the top level
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Determine if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// This ensures this code only runs on the server side
let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient>;

if (!isBrowser) {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  if (process.env.NODE_ENV === "development") {
    // In development mode we use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
}

/**
 * Connect to MongoDB database
 * This function should only be called on the server side
 */
export default async function connectDB(): Promise<Db> {
  if (isBrowser) {
    throw new Error(
      "MongoDB connection should not be called on the client side"
    );
  }

  try {
    const client = await clientPromise;
    return client.db(process.env.MONGODB_DB as string);
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

// Only export client in server-side context
export { client };
