export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { getGitHubAccessToken } from "@/actions/github-actions";

export interface PullRequestFile {
  sha: string;
  filename: string;
  status:
    | "added"
    | "removed"
    | "modified"
    | "renamed"
    | "copied"
    | "changed"
    | "unchanged";
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
  previous_filename?: string;
}

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
    const pull_number = url.searchParams.get("pull_number");

    if (!repo) {
      return Response.json(
        {
          status: "error",
          message: "Repository name is required",
        },
        { status: 400 }
      );
    }

    if (!pull_number) {
      return Response.json(
        {
          status: "error",
          message: "Pull request number is required",
        },
        { status: 400 }
      );
    }

    // Use the same API URL pattern as in github-actions.ts
    const apiUrlBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    // Fetch pull request files from GitHub API
    const response = await fetch(
      `${apiUrlBase}/repos/${org}/${repo}/pulls/${pull_number}/files`,
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

    const files = await response.json();

    // Calculate total additions, deletions, and changed files
    const totalAdditions = files.reduce(
      (sum: number, file: PullRequestFile) => sum + file.additions,
      0
    );
    const totalDeletions = files.reduce(
      (sum: number, file: PullRequestFile) => sum + file.deletions,
      0
    );
    const changedFilesCount = files.length;

    return Response.json({
      status: "success",
      files,
      summary: {
        additions: totalAdditions,
        deletions: totalDeletions,
        changed_files: changedFilesCount,
      },
    });
  } catch (error) {
    console.error("GitHub PR Files API error:", error);
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
