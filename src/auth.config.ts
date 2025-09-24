import { AdapterUser } from "next-auth/adapters";
import { urls } from "@/constants/constants";
import { JWT } from "@auth/core/jwt";
import { DefaultSession, NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";
import { CustomAdapterUser } from "./types/auth";
import { User, Account } from "@auth/core/types";

declare module "@auth/core/jwt" {
  interface JWT {
    githubAccessToken?: string;
    githubLogin?: string;
    w3idAccessToken?: string;
    role?: string;
  }
}

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      lastLogin?: Date;
      role?: string;
      githubLogin?: string;
      /** The user's access level. */
      /**
       * By default, TypeScript merges new interface properties and overwrites existing ones.
       * In this case, the default session user properties will be overwritten,
       * with the new ones defined above. To keep the default session user properties,
       * you need to add them back into the newly declared interface.
       */
    } & DefaultSession["user"];
    githubAccessToken?: string;
    // w3idAccessToken: string;
  }
}

/* declare module "@auth/core/adapters" {
  interface AdapterUser {
    id: string;
    name: string;
    email: string;
    emailVerified: Date | null;
    image: string;
    lastLogin: Date | null;
    role: string;
  }
} */

const providers: Provider[] = [
  {
    id: "ibmw3id",
    name: "w3id",
    type: "oauth",
    authorization: process.env.AUTHORIZATION_BASE_URL,
    token: process.env.TOKEN_URL,
    userinfo: process.env.USERINFO_URL,
    clientId: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    issuer: process.env.ISSUER_URL,
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.uid,
      };
    },
    allowDangerousEmailAccountLinking: true,
  },
  GitHub({
    clientId: process.env.GITHUB_ID ?? "",
    clientSecret: process.env.GITHUB_SECRET ?? "",
    enterprise: {
      baseUrl: process.env.GITHUB_URL,
    },
    authorization: { params: { scope: "read:user,user:email,read:org,repo" } },
    allowDangerousEmailAccountLinking: true,
  }),
];

const authConfig = {
  //   debug: true,
  basePath: urls.authBasePath,
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  providers: providers,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: parseInt(process.env.TOKEN_EXPIRY ?? "7200"),
  },
  cookies: {
    sessionToken: {
      name: `authjsicc.session-token`,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    },
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const isOnChat = pathname.startsWith("/chat");
      const isOnGithubAssistant = pathname.startsWith("/github-assistant");
      const isOnGithubChat = pathname === "/github-chat";
      const isOnLogin = pathname === "/";

      // Redirect from login page if already logged in
      if (isLoggedIn && isOnLogin) {
        return Response.redirect(new URL("/chat", nextUrl as unknown as URL));
      }

      // Always allow access to login page
      if (isOnLogin) {
        return true;
      }

      // Handle protected routes
      if (isOnChat || isOnGithubAssistant || isOnGithubChat) {
        return isLoggedIn;
      }

      return true;
    },
    async jwt({
      token,
      account,
      user,
      profile,
    }: {
      token: JWT;
      account: Account | null;
      user: CustomAdapterUser | AdapterUser | User;
      profile?: { login?: string; [key: string]: unknown };
    }): Promise<JWT | null> {
      // console.log("====jwt", user);
      if (account) {
        if (account.provider === "github") {
          token.githubAccessToken = account.access_token;
          // Store GitHub username in token for session
          if (profile?.login) {
            token.githubLogin = profile.login;
          }
        }
        if (account.provider === "ibmw3id") {
          token.w3idAccessToken = account.access_token;
        }
      }
      if (user) {
        if ("role" in user) {
          token.role = user.role;
        }
        // token.lastLogin = user.lastLogin; // Uncomment if needed
      }
      return token;
    },
    async session({ session, token }) {
      // console.log("====session", session);
      // console.log("====token", token);
      session.user.id = token.sub ?? "";
      session.githubAccessToken = token.githubAccessToken as string;
      session.user.githubLogin = token.githubLogin as string;
      //   session.w3idAccessToken = token.w3idAccessToken as string;
      session.user.role = token.role as string;
      // session.user.lastLogin = token.lastLogin as Date;
      return session;
    },
    async signIn({ account, profile }) {
      // console.log("====signIn", profile);
      if (account?.provider === "ibmw3id") {
        if (
          Array.isArray(profile?.blueGroups) &&
          profile?.blueGroups.includes(process.env.BLUE_GROUP)
        ) {
          return true;
        } else {
          return false;
        }
      }
      if (account?.provider === "github") {
        if (!account?.access_token) return false;
        // console.log("====account", account);
        /* try {
          const org = "IBMSC"; // Replace with your GitHub organization
          const res = await fetch("https://api.github.ibm.com/user/orgs", {
            headers: { Authorization: `Bearer ${account.access_token}` },
          });

          if (!res.ok) return false;
          const orgs = await res.json();
          console.log("orgs:", orgs);
          const isMember = orgs.some((o: any) => o.login === org);

          return isMember;
        } catch (error) {
          console.error("GitHub Org Check Failed:", error);
          return false;
        } */
        try {
          const org = process.env.GITHUB_ISC_ORG; // Replace with your GitHub organization

          const res = await fetch(
            `https://api.github.ibm.com/orgs/${org}/members/${profile?.login}`,
            {
              headers: { Authorization: `Bearer ${account.access_token}` },
            }
          );
          /* if (res.status === 204) {
            return true; // User is in the org, allow login
          } else {
            console.error(`GitHub Org Check Failed: ${res.status} ${res.statusText}`);
            return false; // User is not in the org, deny login
          } */
          return res.ok; // If 204, user is in org; if 404, user is not in org
        } catch (error) {
          console.error("GitHub Org Check Failed:", error);
          return false;
        }

        // return false;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;

export const providerMap = providers.map((provider) => {
  if (typeof provider === "function") {
    const providerData = provider();
    return { id: providerData.id, name: providerData.name };
  } else {
    return { id: provider.id, name: provider.name };
  }
});
