import { NextRequest } from "next/server";
import { getGitHubAccessToken } from "@/actions/github-actions";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const sort = searchParams.get("sort") || "created";
    const order = searchParams.get("order") || "desc";
    const per_page = searchParams.get("per_page") || "100";
    const page = searchParams.get("page") || "1";

    if (!q) {
      return Response.json(
        {
          status: "error",
          message: "Search query (q) parameter is required",
        },
        { status: 400 }
      );
    }

    const githubToken = await getGitHubAccessToken();
    if (!githubToken) {
      return Response.json(
        {
          status: "error",
          message: "GitHub access token not found",
        },
        { status: 401 }
      );
    }

    const apiUrlBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    // Use GitHub Search API to find issues/PRs
    const searchUrl = `${apiUrlBase}/search/issues?q=${encodeURIComponent(q)}&sort=${sort}&order=${order}&per_page=${per_page}&page=${page}`;

    console.log("GitHub Search API URL:", searchUrl);

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error(
        `GitHub Search API error: ${response.status} ${response.statusText}`
      );
      return Response.json(
        {
          status: "error",
          message: `GitHub API error: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const searchResults = await response.json();

    return Response.json({
      status: "success",
      ...searchResults,
    });
  } catch (error) {
    console.error("GitHub Search API error:", error);
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
