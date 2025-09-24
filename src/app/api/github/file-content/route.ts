import { getGitHubAccessToken } from "@/actions/github-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { repository, filePath } = await request.json();

    if (!repository || !filePath) {
      return NextResponse.json(
        { error: "Repository and filePath are required" },
        { status: 400 }
      );
    }

    // Get GitHub access token
    const token = await getGitHubAccessToken();
    if (!token) {
      return NextResponse.json(
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

    // Fetch file content from GitHub API
    const fileUrl = `${apiBase}/repos/${org}/${repo}/contents/${filePath}`;

    console.log(`Fetching file content from: ${fileUrl}`);

    const response = await fetch(fileUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error(
        `GitHub API error: ${response.status} - ${response.statusText}`
      );
      return NextResponse.json(
        { error: `Failed to fetch file: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Decode base64 content if present
    let content = "";
    if (data.content && data.encoding === "base64") {
      try {
        content = Buffer.from(data.content, "base64").toString("utf8");
      } catch (error) {
        console.error("Error decoding base64 content:", error);
        content = "Error: Could not decode file content";
      }
    } else if (data.content) {
      content = data.content;
    } else {
      content = "No content available";
    }

    return NextResponse.json({
      content,
      size: data.size,
      sha: data.sha,
      path: data.path,
      name: data.name,
    });
  } catch (error) {
    console.error("Error in file-content API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
