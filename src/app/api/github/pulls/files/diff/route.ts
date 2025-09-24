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

export async function GET(req: Request) {
  try {
    console.log("PR file diff API called");

    const url = new URL(req.url);
    const org = url.searchParams.get("org") || "IBMSC";
    const repo = url.searchParams.get("repo");
    const pullNumber = url.searchParams.get("pull_number");
    const filename = url.searchParams.get("filename");

    console.log("Parameters:", { org, repo, pullNumber, filename });

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

    if (!repo || !pullNumber || !filename) {
      return Response.json(
        {
          status: "error",
          message: "Repository name, pull number, and filename are required",
        },
        { status: 400 }
      );
    }

    // Use the same API URL pattern as in github-actions.ts
    const apiUrlBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    console.log(
      "Fetching PR files from:",
      `${apiUrlBase}/repos/${org}/${repo}/pulls/${pullNumber}/files`
    );

    // First fetch the PR files to get the file details
    const filesResponse = await fetch(
      `${apiUrlBase}/repos/${org}/${repo}/pulls/${pullNumber}/files`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!filesResponse.ok) {
      console.error(
        "GitHub API error:",
        filesResponse.status,
        filesResponse.statusText
      );
      return Response.json(
        {
          status: "error",
          message: `GitHub API error fetching PR files: ${filesResponse.status}`,
        },
        { status: filesResponse.status }
      );
    }

    const files = (await filesResponse.json()) as GitHubFile[];
    console.log("Found", files.length, "files in PR");

    // Decode the filename for comparison
    const decodedFilename = decodeURIComponent(filename);
    console.log("Looking for file:", decodedFilename);
    console.log(
      "Available files:",
      files.map((f) => f.filename)
    );

    // Try to find the file with both encoded and decoded versions
    let file = files.find((f: GitHubFile) => f.filename === filename);
    if (!file) {
      file = files.find((f: GitHubFile) => f.filename === decodedFilename);
    }

    // If still not found, try a case-insensitive search
    if (!file) {
      file = files.find(
        (f: GitHubFile) =>
          f.filename.toLowerCase() === filename?.toLowerCase() ||
          f.filename.toLowerCase() === decodedFilename.toLowerCase()
      );
    }

    if (!file) {
      console.error(
        "File not found. Available files:",
        files.map((f) => f.filename)
      );
      return Response.json(
        {
          status: "error",
          message: `File '${decodedFilename}' not found in pull request`,
          availableFiles: files.map((f) => f.filename),
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
    console.error("GitHub PR file diff API error:", error);
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
