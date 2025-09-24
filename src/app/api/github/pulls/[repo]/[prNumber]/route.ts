import { NextRequest } from "next/server";
import { auth } from "@/auth";

interface RouteParams {
  params: Promise<{
    repo: string;
    prNumber: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { repo, prNumber } = await params;

    if (!repo || !prNumber) {
      return Response.json(
        { error: "Repository and PR number are required" },
        { status: 400 }
      );
    }

    // Mock PR data for now
    return Response.json({
      repo,
      prNumber,
      title: `Mock PR #${prNumber}`,
      status: "open",
      message:
        "This is a mock PR response. Implement GitHub API integration here.",
    });
  } catch (error) {
    console.error("GitHub PR error:", error);
    return Response.json(
      {
        error: "Failed to fetch PR data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
