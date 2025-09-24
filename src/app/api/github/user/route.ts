export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { getGitHubAccessToken } from "@/actions/github-actions";

export async function GET() {
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

    // Use the same API URL pattern as in github-actions.ts
    const apiUrl = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    // Fetch user info from GitHub API
    const response = await fetch(`${apiUrl}/user`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GitHub API error:", response.status, errorText);
      return Response.json(
        {
          status: "error",
          message: `GitHub API error: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const userData = await response.json();

    return Response.json({
      status: "success",
      login: userData.login,
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatar_url: userData.avatar_url,
    });
  } catch (error) {
    console.error("User info fetch error:", error);
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
