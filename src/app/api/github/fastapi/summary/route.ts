export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { getGitHubAccessToken } from "@/actions/github-actions";
import { fastAPIGitHubService } from "@/services/fastapi-github-service";

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        {
          status: "error",
          message: "Unauthorized access",
        },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const org = url.searchParams.get("org") || "IBMSC";
    const repo = url.searchParams.get("repo");

    if (!repo) {
      return Response.json(
        {
          status: "error",
          message: "Repository name is required",
        },
        { status: 400 }
      );
    }

    // Get repository summary from FastAPI
    const githubToken = await getGitHubAccessToken();
    const summary = await fastAPIGitHubService.getRepositorySummary(
      org,
      repo,
      githubToken || undefined
    );

    return Response.json({
      status: "success",
      data: summary,
    });
  } catch (error) {
    console.error("FastAPI repository summary error:", error);

    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
