import { NextRequest } from "next/server";
import { getGitHubAccessToken } from "@/actions/github-actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repository, prNumber } = body;

    if (!repository || !prNumber) {
      return Response.json(
        { error: "Repository and PR number are required" },
        { status: 400 }
      );
    }

    // Get GitHub access token
    const accessToken = await getGitHubAccessToken();
    if (!accessToken) {
      return Response.json(
        { error: "GitHub authentication required" },
        { status: 401 }
      );
    }

    // Parse repository name
    const [org, repo] = repository.includes("/")
      ? repository.split("/")
      : ["IBMSC", repository];

    // Determine API base URL
    const apiBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    // Fetch PR details
    const prResponse = await fetch(
      `${apiBase}/repos/${org}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!prResponse.ok) {
      const errorData = await prResponse.json();
      console.error("GitHub API error:", errorData);
      return Response.json(
        { error: "Failed to fetch PR details" },
        { status: prResponse.status }
      );
    }

    const pr = await prResponse.json();

    // Return formatted PR details
    const prDetails = {
      number: pr.number,
      title: pr.title,
      state: pr.state,
      author: pr.user.login,
      branch: pr.head.ref,
      baseBranch: pr.base.ref,
      description: pr.body || '',
      changedFiles: pr.changed_files || 0,
      additions: pr.additions || 0,
      deletions: pr.deletions || 0,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      mergedAt: pr.merged_at,
    };

    return Response.json(prDetails);

  } catch (error) {
    console.error("PR details error:", error);
    return Response.json(
      { error: "Failed to fetch PR details", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
