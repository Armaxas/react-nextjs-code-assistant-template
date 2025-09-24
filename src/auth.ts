import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { MongoDBAdapter } from "@/lib/auth-adapter";

// import { MongoDBAdapter } from "@auth/mongodb-adapter";
// import { client } from "@/lib/db/mongodb";
// import client from "@/lib/db/db";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // adapter: MongoDBAdapter(client, { databaseName: process.env.MONGODB_DB }),
  adapter: MongoDBAdapter(),
  ...authConfig,
});
