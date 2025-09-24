export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { getGitHubAccessToken } from "@/actions/github-actions";

export interface CommitFile {
  sha: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
  previous_filename?: string;
}

export interface CommitStats {
  additions: number;
  deletions: number;
  total: number;
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
    const commitSha = url.searchParams.get("commit_sha");
    const branch = url.searchParams.get("branch");

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

    let apiUrl: string;

    if (commitSha) {
      // Fetch specific commit details including files
      apiUrl = `${apiUrlBase}/repos/${org}/${repo}/commits/${commitSha}`;
    } else {
      // Fetch commits list
      apiUrl = `${apiUrlBase}/repos/${org}/${repo}/commits`;
      if (branch) {
        apiUrl += `?sha=${branch}`;
      }
    }

    console.log("Fetching from:", apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error("GitHub API error:", response.status, response.statusText);
      return Response.json(
        {
          status: "error",
          message: `GitHub API error: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (commitSha) {
      // Single commit with files
      const files = data.files || [];
      const stats = data.stats || { additions: 0, deletions: 0, total: 0 };

      return Response.json({
        status: "success",
        files,
        stats,
        commit: {
          sha: data.sha,
          message: data.commit.message,
          author: data.commit.author,
          committer: data.commit.committer,
          url: data.html_url,
        },
      });
    } else {
      // List of commits
      return Response.json({
        status: "success",
        commits: data,
      });
    }
  } catch (error) {
    console.error("GitHub commits API error:", error);
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
