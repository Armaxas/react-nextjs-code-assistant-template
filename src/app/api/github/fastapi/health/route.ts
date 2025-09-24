export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { getGitHubAccessToken } from "@/actions/github-actions";
import { fastAPIGitHubService } from "@/services/fastapi-github-service";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        {
          status: "unauthorized",
          message: "Authentication required",
          fastapi_integration: "unavailable",
        },
        { status: 401 }
      );
    }

    // Get GitHub access token from session
    const githubToken = await getGitHubAccessToken();

    // Check FastAPI GitHub health with token
    const healthStatus = await fastAPIGitHubService.checkHealth(
      githubToken || undefined
    );

    return Response.json({
      status: "success",
      message: "FastAPI GitHub integration status checked",
      fastapi_health: healthStatus,
      user_authenticated: true,
    });
  } catch (error) {
    console.error("FastAPI GitHub health check failed:", error);

    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        fastapi_integration: "error",
      },
      { status: 500 }
    );
  }
}
