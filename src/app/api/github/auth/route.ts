export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { getGitHubAccessToken } from "@/actions/github-actions";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({
        status: "success",
        isAuthenticated: false,
      });
    }

    // Check if GitHub access token is available
    const githubToken = await getGitHubAccessToken();

    return Response.json({
      status: "success",
      isAuthenticated: !!githubToken,
    });
  } catch (error) {
    console.error("GitHub auth check error:", error);
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        isAuthenticated: false,
      },
      { status: 500 }
    );
  }
}
