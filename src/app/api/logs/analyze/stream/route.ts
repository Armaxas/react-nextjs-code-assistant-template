import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getGitHubAccessToken } from "@/actions/github-actions";

interface LogAnalysisRequest {
  sf_connection_id: string;
  query: string;
  log_message: string;
  attached_documents?: Array<{
    filename: string;
    content: string;
    file_type?: string;
    metadata?: Record<string, unknown>;
  }>;
  selected_model?: string;
  github_org?: string;
  github_repo?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const requestData: LogAnalysisRequest = await req.json();

    // Get session for authentication
    const session = await auth();
    if (!session?.user) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Authentication required",
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

    // Get GitHub access token from session
    const githubToken = await getGitHubAccessToken();

    // Debug logging for token availability
    console.log("=== LOG ANALYSIS AUTH DEBUG ===");
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
    console.log("================================");

    // Prepare user info for FastAPI
    const userInfo = {
      name: session.user.name || session.user.email || "anonymous",
      email: session.user.email || "anonymous@example.com",
      session_id: session.user.id || "anonymous",
    };

    // Prepare the request for FastAPI with GitHub token
    const fastAPIRequest = {
      sf_connection_id: requestData.sf_connection_id,
      query: requestData.query,
      log_message: requestData.log_message,
      attached_documents: requestData.attached_documents || [],
      selected_model: requestData.selected_model,
      github_org: requestData.github_org,
      github_repo: requestData.github_repo,
      github_token: githubToken, // Include GitHub token from session
      user_info: userInfo,
    };

    console.log("FastAPI Log Analysis Request:", {
      ...fastAPIRequest,
      github_token: githubToken ? "[REDACTED]" : undefined,
    });

    // Forward request to FastAPI backend
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:8000";
    const response = await fetch(`${apiBaseUrl}/api/logs/analyze/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fastAPIRequest),
    });

    console.log("FastAPI Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("FastAPI error response:", errorText);

      return new Response(
        JSON.stringify({
          status: "error",
          message: `FastAPI error: ${response.status} ${response.statusText}`,
          detail: errorText,
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Stream the response from FastAPI
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Log Analysis API Route Error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
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

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
