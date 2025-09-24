export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { getGitHubAccessToken } from "@/actions/github-actions";

interface GitHubFile {
  filename: string;
  patch?: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
}

interface GitHubCommit {
  files?: GitHubFile[];
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export async function GET(req: Request) {
  try {
    console.log("Commit file diff API called");

    const url = new URL(req.url);
    const org = url.searchParams.get("org") || "IBMSC";
    const repo = url.searchParams.get("repo");
    const commitSha = url.searchParams.get("commit_sha");
    const filename = url.searchParams.get("filename");

    console.log("Parameters:", { org, repo, commitSha, filename });

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

    if (!repo || !commitSha || !filename) {
      return Response.json(
        {
          status: "error",
          message: "Repository name, commit SHA, and filename are required",
        },
        { status: 400 }
      );
    }

    // Use the same API URL pattern as in github-actions.ts
    const apiUrlBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    console.log(
      "Fetching commit from:",
      `${apiUrlBase}/repos/${org}/${repo}/commits/${commitSha}`
    );

    // Fetch the commit details to get the file details
    const commitResponse = await fetch(
      `${apiUrlBase}/repos/${org}/${repo}/commits/${commitSha}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!commitResponse.ok) {
      console.error(
        "GitHub API error:",
        commitResponse.status,
        commitResponse.statusText
      );
      return Response.json(
        {
          status: "error",
          message: `GitHub API error fetching commit: ${commitResponse.status}`,
        },
        { status: commitResponse.status }
      );
    }

    const commit = (await commitResponse.json()) as GitHubCommit;
    console.log("Found", commit.files?.length || 0, "files in commit");

    // Decode the filename for comparison
    const decodedFilename = decodeURIComponent(filename);
    console.log("Looking for file:", decodedFilename);
    console.log("Available files:", commit.files?.map((f) => f.filename) || []);

    // Try to find the file with both encoded and decoded versions
    let file = commit.files?.find((f: GitHubFile) => f.filename === filename);
    if (!file) {
      file = commit.files?.find(
        (f: GitHubFile) => f.filename === decodedFilename
      );
    }

    // If still not found, try a case-insensitive search
    if (!file) {
      file = commit.files?.find(
        (f: GitHubFile) =>
          f.filename.toLowerCase() === filename?.toLowerCase() ||
          f.filename.toLowerCase() === decodedFilename.toLowerCase()
      );
    }

    if (!file) {
      console.error(
        "File not found. Available files:",
        commit.files?.map((f) => f.filename) || []
      );
      return Response.json(
        {
          status: "error",
          message: `File '${decodedFilename}' not found in commit`,
          availableFiles: commit.files?.map((f) => f.filename) || [],
          searchedFor: [filename, decodedFilename],
        },
        { status: 404 }
      );
    }

    console.log(
      "Found file:",
      file.filename,
      "with patch length:",
      file.patch?.length || 0
    );

    // Return the patch content (diff)
    const diffContent = file.patch || "No diff available for this file";

    return new Response(diffContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("GitHub commit file diff API error:", error);
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
