export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { getGitHubAccessToken } from "@/actions/github-actions";
import {
  fastAPIGitHubService,
  getCurrentUserInfo,
} from "@/services/fastapi-github-service";

interface FastAPIGitHubChatRequest {
  messages: Array<{ role: string; content: string }>;
  repository?: string;
  orgName?: string;
  contextTypes?: string[];
  selectedModel?: string; // Add selectedModel field
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Unauthorized access",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const requestData: FastAPIGitHubChatRequest = await req.json();
    const {
      messages,
      repository = "PRM", // Default to PRM repository
      orgName = "IBMSC",
      contextTypes = ["commits", "prs", "files"],
      selectedModel, // Extract selectedModel from request
    } = requestData;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Messages are required for chat",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get the last user message for the query
    const userMessage = messages
      .filter((message) => message.role === "user")
      .pop();

    if (!userMessage) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "No user message found in chat",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get user info for FastAPI
    const userInfo = await getCurrentUserInfo();
    if (userInfo && session.user) {
      userInfo.name = session.user.name || session.user.email || "anonymous";
      userInfo.email = session.user.email;
      userInfo.session_id = session.user.id;
    }

    // Get GitHub access token from session
    const githubToken = await getGitHubAccessToken();

    // Debug logging for token availability
    console.log("=== DETAILED AUTH DEBUG ===");
    console.log("Session user ID:", session.user.id);
    console.log("Session object keys:", Object.keys(session));
    console.log(
      "Session githubAccessToken exists:",
      !!session.githubAccessToken
    );
    console.log(
      "Session githubAccessToken preview:",
      session.githubAccessToken?.substring(0, 20) + "..."
    );
    console.log("getGitHubAccessToken result:", !!githubToken);
    console.log(
      "getGitHubAccessToken preview:",
      githubToken?.substring(0, 20) + "..."
    );
    console.log("==========================");

    if (!githubToken) {
      console.error("GitHub token not found in session");
      return new Response(
        JSON.stringify({
          status: "error",
          message:
            "GitHub token not available. Please authenticate with GitHub.",
          type: "auth_error",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Prepare the request for FastAPI
    const fastAPIRequest = {
      query: userMessage.content,
      orgName: orgName, // Use orgName instead of repository
      repository: repository, // Send repository separately
      contextTypes: contextTypes, // Use contextTypes instead of context_types
      user_info: userInfo, // Include user info
      github_token: githubToken, // Include GitHub token
      selectedModel: selectedModel, // Include selected model
      messages: messages.map((msg) => ({
        // ✅ Changed from message_history to messages
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      })),
    };

    // Stream response from FastAPI backend with GitHub token
    const stream = await fastAPIGitHubService.streamGitHubChat(
      fastAPIRequest,
      githubToken || undefined
    );

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("FastAPI GitHub chat error:", error);

    return new Response(
      JSON.stringify({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
