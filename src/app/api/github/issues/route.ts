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
    const labels = url.searchParams.get("labels");
    const assignee = url.searchParams.get("assignee");
    const creator = url.searchParams.get("creator");
    const mentioned = url.searchParams.get("mentioned");

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

    // Build query parameters
    const params = new URLSearchParams({
      state,
      direction,
      per_page: per_page.toString(),
      sort,
    });

    if (labels) params.append("labels", labels);
    if (assignee) params.append("assignee", assignee);
    if (creator) params.append("creator", creator);
    if (mentioned) params.append("mentioned", mentioned);

    // Fetch issues from GitHub API
    const response = await fetch(
      `${apiUrlBase}/repos/${org}/${repo}/issues?${params.toString()}`,
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

    const issues = await response.json();

    // Filter out pull requests (GitHub API includes PRs in issues endpoint)
    const filteredIssues = issues.filter(
      (issue: { pull_request?: unknown }) => !issue.pull_request
    );

    return Response.json({
      status: "success",
      issues: filteredIssues,
    });
  } catch (error) {
    console.error("GitHub Issues API error:", error);
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
