import { Adapter, AdapterUser } from "@auth/core/adapters";
import { ObjectId } from "mongodb";
import connectDB from "./db/mongodb-server";
import { CustomAdapterUser } from "@/types/auth";

export function MongoDBAdapter(): Adapter {
  return {
    async getUserByAccount(): Promise<AdapterUser | null> {
      // console.log("====getUserByAccount", providerAccount);
      /* if (providerAccount.provider === "ibmw3id") {
        const db = await connectDB();
        const user = await db
          .collection("users")
          .findOne({ email: providerAccount.providerAccountId });

        if (!user) return null;

        return {
          id: user._id.toString(),
          name: user.name || "",
          email: user.email,
          emailVerified: user.emailVerified || null,
          image: user.image || null,
          lastLogin: user.lastLogin,
          role: user.role || "user",
        } as CustomAdapterUser;
      } */
      return null;
    },
    async getUserByEmail(email): Promise<AdapterUser | null> {
      // console.log("====getUserByEmail", email);

      const db = await connectDB();
      const user = await db.collection("users").findOne({ email });
      if (!user) return null;

      // Update lastLogin on successful login
      await db
        .collection("users")
        .updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

      return {
        id: user._id.toString(),
        name: user.name || "",
        email: user.email,
        emailVerified: user.emailVerified || null,
        image: user.image || null,
        lastLogin: user.lastLogin,
        role: user.role || "user",
      } as CustomAdapterUser;
    },

    async getUser(id): Promise<AdapterUser | null> {
      // console.log("====getUser", id);
      const db = await connectDB();
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(id) });

      if (!user) return null;

      return {
        id: user._id.toString(),
        name: user.name || "",
        email: user.email,
        emailVerified: user.emailVerified || null,
        image: user.image || null,
        lastLogin: user.lastLogin,
        role: user.role || "user",
      } as CustomAdapterUser;
    },

    async updateUser(user) {
      // console.log("====updateUser", user);
      const db = await connectDB();
      await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(user.id) },
          { $set: { name: user.name, email: user.email, image: user.image } }
        );
      return user as CustomAdapterUser;
    },

    async createUser(user) {
      // console.log("====createUser", user);
      const db = await connectDB();
      const result = await db.collection("users").insertOne({
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified || null,
        image: user.image || null,
        createdAt: new Date(),
        lastLogin: new Date(), // Initialize lastLogin when user is created
        role: "user",
      });

      return { ...user, id: result.insertedId.toString() } as CustomAdapterUser;
    },

    async linkAccount() {
      // console.log("====linkAccount", account);
      // Implement linking external accounts if needed
    },

    /* async getSessionAndUser(sessionToken) {
      const db = await connectDB();
      const session = await db.collection("sessions").findOne({ sessionToken });

      if (!session) return null;

      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(session.userId) });

      if (!user) return null;

      return {
        session: {
          sessionToken: session.sessionToken,
          userId: session.userId.toString(),
          expires: session.expires,
        },
        user: {
          id: user._id.toString(),
          name: user.name || "",
          email: user.email,
          emailVerified: user.emailVerified || null,
          image: user.image || null,
        },
      };
    },

    async updateSession(session) {
      const db = await connectDB();
      await db
        .collection("sessions")
        .updateOne(
          { sessionToken: session.sessionToken },
          { $set: { expires: session.expires } },
          { upsert: true }
        );
      return session;
    },

    async deleteSession(sessionToken) {
      const db = await connectDB();
      await db.collection("sessions").deleteOne({ sessionToken });
    }, */
  };
}
