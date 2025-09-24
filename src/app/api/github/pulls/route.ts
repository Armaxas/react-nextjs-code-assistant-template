export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { getGitHubAccessToken } from "@/actions/github-actions";

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

    // Get GitHub access token
    const githubToken = await getGitHubAccessToken();

    if (!githubToken) {
      return Response.json(
        {
          status: "error",
          message: "GitHub authentication required",
        },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const org = url.searchParams.get("org") || "IBMSC";
    const repo = url.searchParams.get("repo");
    const state = url.searchParams.get("state") || "all";
    const direction = url.searchParams.get("direction") || "desc";
    const sort = url.searchParams.get("sort") || "updated";
    const per_page = parseInt(url.searchParams.get("per_page") || "100", 10);

    if (!repo) {
      return Response.json(
        {
          status: "error",
          message: "Repository name is required",
        },
        { status: 400 }
      );
    }

    // Use the same API URL pattern as in github-actions.ts
    const apiUrlBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    // Fetch pull requests from GitHub API
    const response = await fetch(
      `${apiUrlBase}/repos/${org}/${repo}/pulls?state=${state}&direction=${direction}&per_page=${per_page}&sort=${sort}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      return Response.json(
        {
          status: "error",
          message: `GitHub API error: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const pullRequests = await response.json();

    return Response.json({
      status: "success",
      pullRequests,
    });
  } catch (error) {
    console.error("GitHub PRs API error:", error);
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
